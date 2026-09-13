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

# ─── LLM Clients (one per provider, OpenAI-compatible) ───────────────
groq_llm_client = AsyncOpenAI(
    api_key=settings.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
    timeout=30.0,
)

gemini_llm_client = AsyncOpenAI(
    api_key=settings.GEMINI_API_KEY,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    timeout=30.0,
)

# ─── Fallback Chains (tried in order, top to bottom) ─────────────────
# Main agent responses: try Groq's big model, then Groq's small model,
# then Gemini as last resort.
MAIN_PROVIDER_CHAIN = [
    {"name": "groq-main", "client": groq_llm_client, "model": settings.GROQ_MODEL},
    {"name": "gemini-flash", "client": gemini_llm_client, "model": settings.GEMINI_MODEL},
]

# Triage (intent detection): same idea, lighter models first.
TRIAGE_PROVIDER_CHAIN = [
    {"name": "groq-triage", "client": groq_llm_client, "model": settings.GROQ_TRIAGE_MODEL},
    {"name": "gemini-triage", "client": gemini_llm_client, "model": settings.GEMINI_TRIAGE_MODEL},
]


async def call_llm(messages, tools=None, tool_choice=None, stream=False,
                    temperature=0.6, max_tokens=2048, triage=False):
    """
    Try each provider in the fallback chain until one responds successfully.
    Silently skips a provider on error (rate limit, invalid model, etc.)
    and moves to the next one. Only raises if ALL providers fail.
    """
    chain = TRIAGE_PROVIDER_CHAIN if triage else MAIN_PROVIDER_CHAIN
    last_error = None

    for provider in chain:
        try:
            kwargs = {
                "model": provider["model"],
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            if tools is not None:
                kwargs["tools"] = tools
            if tool_choice is not None:
                kwargs["tool_choice"] = tool_choice
            if stream:
                kwargs["stream"] = True

            response = await provider["client"].chat.completions.create(**kwargs)
            return response
        except Exception as e:
            logger.warning(
                f"Provider '{provider['name']}' (model={provider['model']}) failed: "
                f"{type(e).__name__}: {e}"
            )
            last_error = e
            continue

    # Every provider in the chain failed
    provider_names = [p["name"] for p in chain]
    logger.error(f"ALL providers failed: {provider_names}. Last error: {type(last_error).__name__}: {last_error}")
    if last_error is not None:
        raise last_error
    raise RuntimeError("No LLM providers available in the chain.")

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

        response = await call_llm(
            messages=messages,
            max_tokens=10,
            temperature=0,
            triage=True,
        )
        raw = response.choices[0].message.content
        if not raw:
            return "general"
        intent = raw.strip().lower()

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
    language: str = "EN",
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

        # Inject language directive based on user's toggle selection
        if language == "UR":
            system_content += "\n\n## CRITICAL Language Override:\nThe user has set their language preference to Urdu (UR). You MUST respond ENTIRELY in Urdu script (\u0627\u0631\u062f\u0648 \u0646\u0633\u062a\u0639\u0644\u06cc\u0642).\n- ALL text MUST be in proper Urdu script \u2014 NOT Roman Urdu, NOT English.\n- Use right-to-left Urdu script for everything: headings, bullet points, explanations, recommendations, questions, and options.\n- Bank names (e.g. HBL, Meezan Bank), technical abbreviations (PKR, SBP, KIBOR), and proper nouns can remain in English.\n- Markdown formatting (###, **, -, |) should still be used, but all text content must be in Urdu script.\n- This is NON-NEGOTIABLE. Even if the user writes in English or Roman Urdu, you respond in Urdu script.\n"
        else:
            # EN mode: match the user's language/script naturally
            system_content += "\n\n## Language Matching:\nMatch the user's language exactly:\n- If the user writes in English, respond entirely in English.\n- If the user writes in Roman Urdu (e.g. 'mujhe account khulwana hai'), respond in Roman Urdu.\n- If the user writes in Urdu script, respond in Urdu script.\n- Do NOT mix languages unless the user does so first.\n"

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

        # Step 3 & 4: LLM call with tool-calling loop (max 3 rounds)
        # Each round: call LLM → if it wants tools, execute them and loop.
        # If it returns text content, yield it and stop.
        MAX_TOOL_ROUNDS = 3

        for round_num in range(MAX_TOOL_ROUNDS + 1):
            try:
                response = await call_llm(
                    messages=messages,
                    tools=TOOL_DEFINITIONS,
                    tool_choice="auto",
                    temperature=0.6,
                    max_tokens=2048,
                )
                assistant_message = response.choices[0].message
            except Exception as e:
                if round_num == 0:
                    # First round failed — try plain chat without tools
                    logger.warning(f"Tool-calling failed, falling back to plain chat: {e}")
                    stream = await call_llm(
                        messages=messages,
                        stream=True,
                        temperature=0.6,
                        max_tokens=2048,
                    )
                    async for chunk in stream:
                        if chunk.choices and chunk.choices[0].delta.content:
                            yield {
                                "type": "content",
                                "content": chunk.choices[0].delta.content,
                            }
                    return
                else:
                    # Later rounds — let outer except handle it
                    raise

            # Check if the model wants to call tools
            if assistant_message.tool_calls:
                logger.info(
                    f"Model requested {len(assistant_message.tool_calls)} tool call(s) "
                    f"(round {round_num + 1})"
                )
                messages.append(assistant_message)

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
                # Loop back — next round will see tool results
                continue

            # No tools — yield the text response and we're done
            content = assistant_message.content or ""
            if content:
                yield {
                    "type": "content",
                    "content": content,
                }
            else:
                yield {
                    "type": "content",
                    "content": "I apologize, but I wasn't able to generate a response. Please try asking your question in a different way.",
                }
            return  # Successfully done

        # Exhausted all tool-calling rounds (model kept calling tools)
        logger.warning(f"Exhausted {MAX_TOOL_ROUNDS} tool-calling rounds without a text response")
        yield {
            "type": "content",
            "content": "I apologize, but I wasn't able to generate a response. Please try asking your question in a different way.",
        }

    except Exception as e:
        logger.error(f"Agent error (all providers failed): {type(e).__name__}: {str(e)}")
        yield {
            "type": "content",
            "content": (
                "I'm having trouble reaching the AI service right now. "
                "Please try again in a moment."
            ),
        }
        yield {
            "type": "agent_name",
            "name": "System",
        }
