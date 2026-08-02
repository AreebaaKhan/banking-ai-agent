"""
Agent orchestrator — calls Groq directly via the OpenAI-compatible SDK.

We use Groq's API directly (it's 100% OpenAI-compatible) rather than the
openai-agents SDK runner, which has compatibility issues with non-OpenAI providers.

Architecture:
- A simple triage prompt detects intent and responds directly.
- No complex SDK runner needed — pure async streaming from Groq.
- This is more reliable and gives us full control over the streaming.
"""

import json
from typing import AsyncIterator, AsyncGenerator
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
- general (bank comparison, branch, customer service, rates, general banking)

Respond with ONLY one word from the list above."""


async def detect_intent(message: str, history: list[dict]) -> str:
    """Quick intent detection using a separate fast call."""
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
            model=settings.GROQ_MODEL,
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


# ─── Main Agent Runner (Streaming) ───────────────────────────────────

async def run_agent(
    message: str,
    conversation_history: list[dict],
    user_info: dict,
    db=None,
) -> AsyncGenerator[dict, None]:
    """
    Run the AI agent and yield streaming response chunks.

    1. Detect intent (quick non-streaming call).
    2. Stream the specialist agent's response.
    3. Yield chunks as they arrive for SSE.
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
        # Add user context to system prompt
        context_parts = []
        if user_info.get("name"):
            context_parts.append(f"The user's name is {user_info['name']}.")
        if user_info.get("city"):
            context_parts.append(f"They are located in {user_info['city']}, Pakistan.")

        system_content = specialist_prompt
        if context_parts:
            system_content += "\n\n" + " ".join(context_parts)

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

        # Step 3: Stream response from Groq
        stream = await groq_client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=messages,
            stream=True,
            temperature=0.7,
            max_tokens=2048,
        )

        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield {
                    "type": "content",
                    "content": chunk.choices[0].delta.content,
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
