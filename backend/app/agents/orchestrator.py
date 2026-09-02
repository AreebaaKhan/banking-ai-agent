"""
Agent orchestrator — calls Groq directly via the OpenAI-compatible SDK.

Architecture:
1. A triage classifier detects the user's intent (fast, non-streaming call).
2. The specialist agent is selected based on intent.
3. The specialist prompt + tools are sent to Groq.
4. If the LLM calls tools, we execute them and send results back.
5. The final response is streamed to the user via SSE.

Tool-calling flow:
    User message
        → Streaming call with tools
        → If LLM returns tool_calls → execute tools → second streaming call
        → If LLM returns content → stream directly to user
"""

import json
from typing import AsyncGenerator
from openai import AsyncOpenAI

from app.agents.prompts import (
    TRIAGE_SYSTEM_PROMPT,
    ACCOUNT_ADVISOR_PROMPT,
    LOAN_ADVISOR_PROMPT,
    CARD_ADVISOR_PROMPT,
    INVESTMENT_ADVISOR_PROMPT,
    DIGITAL_BANKING_PROMPT,
    GENERAL_BANKING_PROMPT,
)
from app.agents.tools import TOOL_DEFINITIONS, execute_tool
from app.config import get_settings
from app.utils.logger import logger

settings = get_settings()

# ─── Groq Client (OpenAI-compatible) ─────────────────────────────────

groq_client = AsyncOpenAI(
    api_key=settings.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
)

# ─── Intent → Agent Mapping ──────────────────────────────────────────

INTENT_PROMPTS = {
    "account": ACCOUNT_ADVISOR_PROMPT,
    "loan": LOAN_ADVISOR_PROMPT,
    "card": CARD_ADVISOR_PROMPT,
    "investment": INVESTMENT_ADVISOR_PROMPT,
    "digital": DIGITAL_BANKING_PROMPT,
    "general": GENERAL_BANKING_PROMPT,
}

INTENT_NAMES = {
    "account": "Account Advisor",
    "loan": "Loan Advisor",
    "card": "Card Advisor",
    "investment": "Investment Advisor",
    "digital": "Digital Banking Expert",
    "general": "Banking Advisor",
}

# ─── Triage: Detect Intent ───────────────────────────────────────────

QUICK_TRIAGE_PROMPT = """You are a banking query classifier. Classify the user message into ONE of these categories and respond with ONLY the category word:
- account (savings, current, student, business accounts, opening an account)
- loan (home loan, car loan, personal loan, mortgage, financing)
- card (credit card, debit card, cashback, rewards, travel card)
- investment (mutual funds, fixed deposit, certificates, savings returns)
- digital (mobile app, internet banking, SadaPay, NayaPay, JazzCash, Easypaisa, digital wallet)
- general (bank comparison, branch, customer service, rates, general banking, greetings)

Respond with ONLY one word from the list above."""


async def detect_intent(message: str, history: list[dict]) -> str:
    """Quick intent detection using a fast, small model."""
    try:
        # Use last 3 messages for context
        context = history[-3:] if len(history) > 3 else history
        messages = [
            {"role": "system", "content": QUICK_TRIAGE_PROMPT},
        ]
        for m in context:
            if m.get("role") in ("user", "assistant"):
                messages.append({"role": m["role"], "content": m["content"][:200]})
        messages.append({"role": "user", "content": message})

        response = await groq_client.chat.completions.create(
            model=settings.GROQ_TRIAGE_MODEL,
            messages=messages,
            max_tokens=10,
            temperature=0,
        )
        intent = response.choices[0].message.content.strip().lower()

        # Validate it's one of our intents
        if intent in INTENT_PROMPTS:
            return intent
        # Fuzzy match
        for key in INTENT_PROMPTS:
            if key in intent:
                return key
        return "general"
    except Exception as e:
        logger.warning(f"Intent detection failed: {e}, defaulting to general")
        return "general"


# ─── Tool-Calling Helpers ────────────────────────────────────────────

async def _collect_stream_with_tools(stream) -> tuple[str, dict]:
    """
    Read a streaming response and collect both content and tool calls.

    Returns:
        (content_text, tool_calls_dict)
        - content_text: any content the model streamed
        - tool_calls_dict: {index: {id, function: {name, arguments}}} if tools were called
    """
    content = ""
    tool_calls = {}

    async for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta

        # Collect content
        if delta.content:
            content += delta.content

        # Collect tool calls (streamed as deltas)
        if delta.tool_calls:
            for tc_delta in delta.tool_calls:
                idx = tc_delta.index
                if idx not in tool_calls:
                    tool_calls[idx] = {
                        "id": "",
                        "type": "function",
                        "function": {"name": "", "arguments": ""},
                    }
                if tc_delta.id:
                    tool_calls[idx]["id"] = tc_delta.id
                if tc_delta.function:
                    if tc_delta.function.name:
                        tool_calls[idx]["function"]["name"] = tc_delta.function.name
                    if tc_delta.function.arguments:
                        tool_calls[idx]["function"]["arguments"] += tc_delta.function.arguments

    return content, tool_calls


async def _execute_tools(tool_calls: dict) -> list[dict]:
    """
    Execute all tool calls and return tool result messages.
    """
    tool_messages = []
    for _idx, tc in sorted(tool_calls.items()):
        func_name = tc["function"]["name"]
        try:
            func_args = json.loads(tc["function"]["arguments"]) if tc["function"]["arguments"] else {}
        except json.JSONDecodeError:
            func_args = {}

        logger.info(f"Executing tool: {func_name}({func_args})")
        result = await execute_tool(func_name, func_args)

        tool_messages.append({
            "role": "tool",
            "tool_call_id": tc["id"],
            "content": result,
        })
    return tool_messages


# ─── Main Agent Runner (Streaming) ───────────────────────────────────

async def run_agent(
    message: str,
    conversation_history: list[dict],
    user_info: dict,
    db=None,
) -> AsyncGenerator[dict, None]:
    """
    Run the AI agent and yield streaming response chunks.

    Flow:
    1. Detect intent (fast classifier call).
    2. Build messages with specialist prompt + tools.
    3. Call Groq with tool definitions.
    4. If model calls tools → execute → send results → stream final response.
    5. If model responds directly → stream content to user.
    """
    try:
        # Step 1: Detect intent
        intent = await detect_intent(message, conversation_history)
        agent_name = INTENT_NAMES.get(intent, "Banking Advisor")
        specialist_prompt = INTENT_PROMPTS.get(intent, GENERAL_BANKING_PROMPT)

        logger.info(f"Intent: {intent} → Agent: {agent_name}")

        # Yield agent name immediately so frontend can show it
        yield {
            "type": "agent_name",
            "name": agent_name,
        }

        # Step 2: Build messages for specialist agent
        context_parts = []
        if user_info.get("name"):
            context_parts.append(f"The user's name is {user_info['name']}.")
        if user_info.get("city"):
            context_parts.append(f"They are located in {user_info['city']}, Pakistan.")

        system_content = specialist_prompt
        if context_parts:
            system_content += "\n\n## User Context:\n" + " ".join(context_parts)

        messages = [{"role": "system", "content": system_content}]

        # Add conversation history (last 16 messages)
        history = conversation_history[-16:] if len(conversation_history) > 16 else conversation_history
        for msg in history:
            role = msg.get("role")
            content = msg.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

        # Make sure the current user message is the last one
        if not messages or messages[-1].get("content") != message or messages[-1].get("role") != "user":
            messages.append({"role": "user", "content": message})

        # Step 3: First call — with tools (non-streaming to detect tool calls)
        try:
            first_response = await groq_client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=messages,
                tools=TOOL_DEFINITIONS,
                tool_choice="auto",
                temperature=0.6,
                max_tokens=2048,
                extra_body={"reasoning_effort": "none"}
            )

            assistant_message = first_response.choices[0].message

        except Exception as e:
            # If tool-calling fails (model incompatibility), fall back to no-tools
            logger.warning(f"Tool-calling failed, falling back to plain chat: {e}")
            stream = await groq_client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=messages,
                stream=True,
                temperature=0.6,
                max_tokens=2048,
                extra_body={"reasoning_effort": "none"},
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield {
                        "type": "content",
                        "content": chunk.choices[0].delta.content,
                    }
            return

        # Step 4: Check if the model wants to call tools
        if assistant_message.tool_calls:
            logger.info(f"Model requested {len(assistant_message.tool_calls)} tool call(s)")

            # Add assistant message with tool calls to conversation
            messages.append(assistant_message)

            # Execute each tool
            for tc in assistant_message.tool_calls:
                func_name = tc.function.name
                try:
                    func_args = json.loads(tc.function.arguments) if tc.function.arguments else {}
                except json.JSONDecodeError:
                    func_args = {}

                logger.info(f"Executing tool: {func_name}({func_args})")
                result = await execute_tool(func_name, func_args)

                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": result,
                })

            # Step 5: Stream the final response with tool results
            final_stream = await groq_client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=messages,
                stream=True,
                temperature=0.6,
                max_tokens=2048,
                extra_body={"reasoning_effort": "none"},
            )

            async for chunk in final_stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield {
                        "type": "content",
                        "content": chunk.choices[0].delta.content,
                    }
        else:
            # No tools needed — yield the response directly
            content = assistant_message.content or ""
            if content:
                yield {
                    "type": "content",
                    "content": content,
                }

    except Exception as e:
        logger.error(f"Agent error: {type(e).__name__}: {str(e)}")
        yield {
            "type": "content",
            "content": (
                "I apologize, I'm having trouble connecting to the AI service right now. "
                "Please check that your GROQ_API_KEY is correctly set in the `.env` file and try again.\n\n"
                f"*Error: {type(e).__name__}: {str(e)}*"
            ),
        }
        yield {
            "type": "agent_name",
            "name": "System",
        }
