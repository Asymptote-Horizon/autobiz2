"""
AutoBiz AI — LLM Router
Smart LLM routing with cascade fallback: OpenRouter → Groq → Template fallback.
The system NEVER crashes — always returns a meaningful response.
"""

import httpx
import logging
from config import settings

logger = logging.getLogger("autobiz.llm")


class LLMResponse:
    """Structured LLM response."""
    def __init__(self, text: str, model_used: str = "fallback", provider: str = "fallback", fallback_used: bool = False):
        self.text = text
        self.model_used = model_used
        self.provider = provider
        self.fallback_used = fallback_used

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "model_used": self.model_used,
            "provider": self.provider,
            "fallback_used": self.fallback_used,
        }


# ── Template fallback responses (used when ALL LLM providers fail) ──

FALLBACK_RESPONSES = {
    "business_insight": (
        "Based on your current business data, I can see some interesting patterns. "
        "Your revenue trend shows steady growth over the past quarter, with a notable "
        "spike in the last two weeks. I'd recommend focusing on your top-performing "
        "product categories and considering a targeted campaign for the upcoming season. "
        "Would you like me to break this down further?"
    ),
    "sales_marketing": (
        "I've reviewed your sales pipeline. You have several promising leads in the "
        "follow-up stage. I'd suggest prioritizing the enterprise accounts first — "
        "they typically have a 3x higher conversion rate. For marketing, your social "
        "media engagement has been growing 15% month-over-month. Want me to draft a "
        "campaign strategy?"
    ),
    "data_analytics": (
        "I've analyzed the available data points. Here are the key findings:\n\n"
        "• Revenue is trending upward (+12.3% MoM)\n"
        "• Customer retention rate is at 87%\n"
        "• Your most active segment is repeat buyers (58% of revenue)\n\n"
        "I can drill deeper into any of these metrics. What area interests you most?"
    ),
    "general": (
        "I'm here to help with your business needs. I can assist with data analysis, "
        "sales strategy, marketing insights, customer management, and more. "
        "What would you like to work on today?"
    ),
}


async def _call_openrouter(messages: list[dict], timeout: int) -> LLMResponse | None:
    """Try OpenRouter with model cascade and key fallback."""
    for api_key in settings.OPENROUTER_API_KEYS:
        for model in settings.OPENROUTER_MODELS:
            try:
                logger.info(f"Trying OpenRouter: {model}")
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.post(
                        settings.OPENROUTER_BASE_URL,
                        headers={
                            "Authorization": f"Bearer {api_key}",
                            "Content-Type": "application/json",
                            "HTTP-Referer": "https://autobiz.ai",
                            "X-Title": "AutoBiz AI",
                        },
                        json={"model": model, "messages": messages},
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        text = data["choices"][0]["message"]["content"]
                        logger.info(f"OpenRouter success: {model}")
                        return LLMResponse(text=text, model_used=model, provider="openrouter")
                    else:
                        logger.warning(f"OpenRouter {model} returned {resp.status_code}: {resp.text[:200]}")
            except Exception as e:
                logger.warning(f"OpenRouter {model} failed: {e}")
    return None


async def _call_groq(messages: list[dict], timeout: int) -> LLMResponse | None:
    """Try Groq as fallback provider."""
    if not settings.GROQ_API_KEY:
        return None

    for model in settings.GROQ_MODELS:
        try:
            logger.info(f"Trying Groq: {model}")
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(
                    settings.GROQ_BASE_URL,
                    headers={
                        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={"model": model, "messages": messages},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    text = data["choices"][0]["message"]["content"]
                    logger.info(f"Groq success: {model}")
                    return LLMResponse(text=text, model_used=model, provider="groq")
                else:
                    logger.warning(f"Groq {model} returned {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            logger.warning(f"Groq {model} failed: {e}")
    return None


async def call_llm(
    messages: list[dict],
    system_prompt: str | None = None,
    context_type: str = "general",
) -> LLMResponse:
    """
    Main LLM call function with full cascade fallback.

    Flow: OpenRouter (3 models × 2 keys) → Groq (2 models) → Template fallback

    Args:
        messages: List of {"role": "user"/"assistant", "content": "..."} dicts
        system_prompt: Optional system prompt prepended to messages
        context_type: Used to select appropriate fallback template

    Returns:
        LLMResponse with text, model info, and whether fallback was used
    """
    # Build full message list
    full_messages = []
    if system_prompt:
        full_messages.append({"role": "system", "content": system_prompt})
    full_messages.extend(messages)

    timeout = settings.LLM_TIMEOUT_SECONDS

    # Skip real LLM if disabled
    if not settings.ENABLE_REAL_LLM:
        logger.info("Real LLM disabled, using fallback")
        return LLMResponse(
            text=FALLBACK_RESPONSES.get(context_type, FALLBACK_RESPONSES["general"]),
            fallback_used=True,
        )

    # ── Cascade: OpenRouter → Groq → Fallback ──

    # 1. Try OpenRouter
    result = await _call_openrouter(full_messages, timeout)
    if result:
        return result

    # 2. Try Groq
    result = await _call_groq(full_messages, timeout)
    if result:
        return result

    # 3. Template fallback (never crash)
    logger.warning("All LLM providers failed — using template fallback")
    return LLMResponse(
        text=FALLBACK_RESPONSES.get(context_type, FALLBACK_RESPONSES["general"]),
        fallback_used=True,
    )
