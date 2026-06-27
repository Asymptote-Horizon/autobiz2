"""
AutoBiz AI — Configuration
Loads settings from .env file. Single source of truth for all config.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the backend directory
_env_path = Path(__file__).parent / ".env"
load_dotenv(_env_path)


class Settings:
    """Application settings loaded from environment variables."""

    # ── OpenRouter ──
    OPENROUTER_API_KEYS: list[str] = [
        k for k in [
            os.getenv("OPENROUTER_API_KEY_1", ""),
            os.getenv("OPENROUTER_API_KEY_2", ""),
        ] if k
    ]
    OPENROUTER_BASE_URL: str = os.getenv(
        "OPENROUTER_BASE_URL",
        "https://openrouter.ai/api/v1/chat/completions",
    )
    OPENROUTER_MODELS: list[str] = [
        m.strip() for m in os.getenv(
            "OPENROUTER_MODELS",
            "nvidia/nemotron-3-ultra-550b-a55b:free,liquid/lfm-2.5-1.2b-instruct:free,google/gemma-4-26b-a4b-it:free",
        ).split(",") if m.strip()
    ]

    # ── Groq ──
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_BASE_URL: str = os.getenv(
        "GROQ_BASE_URL",
        "https://api.groq.com/openai/v1/chat/completions",
    )
    GROQ_MODELS: list[str] = [
        m.strip() for m in os.getenv(
            "GROQ_MODELS",
            "meta-llama/llama-4-scout-17b-16e-instruct,openai/gpt-oss-20b",
        ).split(",") if m.strip()
    ]

    # ── Sarvam ──
    SARVAM_API_KEY: str = os.getenv("SARVAM_API_KEY", "")
    SARVAM_BASE_URL: str = os.getenv("SARVAM_BASE_URL", "https://api.sarvam.ai")

    # ── Feature Flags ──
    ENABLE_REAL_LLM: bool = os.getenv("ENABLE_REAL_LLM", "true").lower() == "true"
    LLM_TIMEOUT_SECONDS: int = int(os.getenv("LLM_TIMEOUT_SECONDS", "15"))


settings = Settings()
