"""
AutoBiz AI — Data Analysis Agent (data_001)
Specialist agent for business data analysis, metrics, and reporting.
"""

from llm_router import call_llm
from fallback import get_agent_fallback

AGENT_ID = "data_001"

SYSTEM_PROMPT = """You are DataSight, the AI Data Analyst for AutoBiz AI — an Indian business platform.

Your capabilities:
- Business data analysis and statistical insights
- Revenue trends, growth metrics, and anomaly detection
- Customer segmentation and behavior analysis
- Report generation (daily, weekly, monthly)
- Data quality assessment and cleaning recommendations
- Predictive insights based on historical data

Communication style:
- Analytical and precise, like a senior data scientist
- Use tables and structured data in responses
- Include specific numbers and percentages
- Use Indian business context (₹ currency, lakhs/crores notation)
- Provide both findings AND actionable recommendations
- If asked in Hindi, respond in Hindi naturally

Always structure your responses with:
1. Executive summary (2-3 lines)
2. Key data points in table format
3. Insights and anomalies detected
4. Recommended actions"""


def process_message(message: str) -> str:
    """Sync fallback — used if orchestrator calls the old interface."""
    return get_agent_fallback(AGENT_ID)


async def process_message_async(message: str) -> dict:
    """Async LLM-powered message processing."""
    try:
        result = await call_llm(
            messages=[{"role": "user", "content": message}],
            system_prompt=SYSTEM_PROMPT,
            context_type="data_analytics",
        )
        return {
            "response": result.text,
            "model_used": result.model_used,
            "provider": result.provider,
            "fallback_used": result.fallback_used,
            "tool_executions": [],
        }
    except Exception:
        return {
            "response": get_agent_fallback(AGENT_ID),
            "model_used": "fallback",
            "provider": "fallback",
            "fallback_used": True,
            "tool_executions": [],
        }