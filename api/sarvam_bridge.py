"""
AutoBiz AI — Sarvam Bridge
Demo-ready integration with Sarvam AI for Hindi / Indian language support.
If Sarvam API is unavailable or no key is set, returns simulated results.
"""

import httpx
import logging
from config import settings

logger = logging.getLogger("autobiz.sarvam")


class SarvamResponse:
    """Structured Sarvam API response."""
    def __init__(self, text: str, source_lang: str = "hi", target_lang: str = "en", simulated: bool = False):
        self.text = text
        self.source_lang = source_lang
        self.target_lang = target_lang
        self.simulated = simulated

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "source_lang": self.source_lang,
            "target_lang": self.target_lang,
            "simulated": self.simulated,
        }


async def translate_text(text: str, source_lang: str = "hi-IN", target_lang: str = "en-IN") -> SarvamResponse:
    """
    Translate text using Sarvam API.
    Falls back to returning original text if API is unavailable.
    """
    if not settings.SARVAM_API_KEY:
        logger.info("Sarvam API key not set — returning original text (simulated)")
        return SarvamResponse(
            text=text,
            source_lang=source_lang,
            target_lang=target_lang,
            simulated=True,
        )

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{settings.SARVAM_BASE_URL}/translate",
                headers={
                    "api-subscription-key": settings.SARVAM_API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "input": text,
                    "source_language_code": source_lang,
                    "target_language_code": target_lang,
                    "speaker_gender": "Male",
                    "mode": "formal",
                    "model": "mayura:v1",
                    "enable_preprocessing": True,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                translated = data.get("translated_text", text)
                logger.info(f"Sarvam translation success: {source_lang} → {target_lang}")
                return SarvamResponse(
                    text=translated,
                    source_lang=source_lang,
                    target_lang=target_lang,
                    simulated=False,
                )
            else:
                logger.warning(f"Sarvam API returned {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        logger.warning(f"Sarvam API failed: {e}")

    # Fallback — return original text
    return SarvamResponse(text=text, source_lang=source_lang, target_lang=target_lang, simulated=True)


def detect_hindi(text: str) -> bool:
    """
    Simple heuristic to detect if text contains Hindi / Devanagari characters.
    Used to decide whether to route through Sarvam translation.
    """
    for char in text:
        if '\u0900' <= char <= '\u097F':
            return True
    return False
