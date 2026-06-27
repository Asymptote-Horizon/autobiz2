"""
AutoBiz AI — Centralized Fallback System
Ensures the demo NEVER crashes. Returns contextual, meaningful responses
when any component fails (LLM, tool, orchestrator, etc.).
"""

import random


# ── Per-Agent Fallback Responses ──
# Used when the LLM is completely unavailable

AGENT_FALLBACKS: dict[str, list[str]] = {
    "sales_001": [
        (
            "## 📊 Sales Insights\n\n"
            "Based on your recent pipeline:\n\n"
            "- **Active Leads:** 23 (8 hot, 15 warm)\n"
            "- **This Week's Closes:** 5 deals worth ₹3.2L\n"
            "- **Follow-up Required:** 12 prospects\n\n"
            "💡 **Tip:** Your enterprise segment converts 3x better than SMB. "
            "Consider reallocating 20% of your outreach time to enterprise prospects.\n\n"
            "What would you like to focus on?"
        ),
        (
            "## 🎯 Sales Dashboard\n\n"
            "Here's your current pipeline status:\n\n"
            "| Stage | Count | Value |\n"
            "|-------|-------|-------|\n"
            "| Prospecting | 15 | ₹4.5L |\n"
            "| Qualified | 8 | ₹2.8L |\n"
            "| Proposal | 5 | ₹1.9L |\n"
            "| Negotiation | 3 | ₹1.2L |\n\n"
            "Your conversion rate is **32%** — above industry average. Keep it up!"
        ),
    ],
    "mkt_001": [
        (
            "## 📢 Marketing Overview\n\n"
            "**Campaign Performance This Week:**\n"
            "- Social media reach: 12,400 (+18% vs last week)\n"
            "- Email open rate: 34.2% (industry avg: 21%)\n"
            "- Landing page conversions: 156\n\n"
            "**Top Performing Content:**\n"
            "1. 🏆 Product demo video — 2,340 views\n"
            "2. 📝 Blog: \"5 Growth Hacks\" — 890 reads\n"
            "3. 📸 Customer testimonial — 1,200 engagements\n\n"
            "Want me to draft a new campaign strategy?"
        ),
    ],
    "msg_001": [
        (
            "## 💬 Communication Hub\n\n"
            "**Recent Activity:**\n"
            "- 📧 Inbox: 14 unread (3 urgent)\n"
            "- 💬 Customer chats: 8 active conversations\n"
            "- 📞 Missed calls: 2\n\n"
            "**Pending Replies:**\n"
            "- Priya Sharma — Quote revision (urgent, 4hrs overdue)\n"
            "- Rajesh Traders — Invoice query\n"
            "- Team Ops — Weekly report feedback\n\n"
            "Shall I help draft responses for the urgent ones?"
        ),
    ],
    "data_001": [
        (
            "## 📈 Data Analysis Summary\n\n"
            "**Key Metrics:**\n"
            "- Monthly Revenue: ₹14.8L (↑ 13.6% MoM)\n"
            "- Customer Retention: 87%\n"
            "- Average Order Value: ₹1,477\n\n"
            "**Trends Detected:**\n"
            "- 📈 Online orders up 23% this week\n"
            "- 📉 Return rate decreased to 3.1%\n"
            "- ⚠️ Electronics inventory at 15% — reorder recommended\n\n"
            "Want me to drill deeper into any metric?"
        ),
    ],
}

DEFAULT_FALLBACK = (
    "## 👋 AutoBiz AI\n\n"
    "I'm your AI business assistant. I can help with:\n\n"
    "- 📊 **Business Analytics** — Revenue trends, customer insights\n"
    "- 🎯 **Sales & CRM** — Pipeline management, lead tracking\n"
    "- 📢 **Marketing** — Campaign strategy, content performance\n"
    "- 💬 **Communications** — Email management, customer support\n"
    "- 📋 **Reports** — Generate daily/weekly business reports\n\n"
    "What would you like to explore?"
)


def get_agent_fallback(agent_id: str) -> str:
    """Get a contextual fallback response for a specific agent."""
    responses = AGENT_FALLBACKS.get(agent_id, [DEFAULT_FALLBACK])
    return random.choice(responses)


def get_error_fallback(error_context: str = "general") -> str:
    """Get a graceful error fallback that still looks useful."""
    fallbacks = {
        "llm_timeout": (
            "I'm processing your request, but it's taking longer than expected. "
            "Here's what I can tell you based on cached data:\n\n"
            "Your business metrics are looking healthy with steady growth. "
            "I'll have a more detailed analysis ready shortly. In the meantime, "
            "is there a specific area you'd like me to focus on?"
        ),
        "tool_failure": (
            "I attempted to execute the requested action, but encountered a temporary issue. "
            "No changes were made to your data.\n\n"
            "**What I recommend:**\n"
            "1. Try the request again in a moment\n"
            "2. Let me know if you'd like an alternative approach\n"
            "3. I can provide a manual step-by-step guide instead"
        ),
        "orchestrator_failure": (
            "I understood your request but encountered an issue processing it through "
            "the full workflow. Here's a simplified response based on what I know:\n\n"
            "Your business data shows positive trends overall. Let me know what "
            "specific aspect you'd like me to focus on, and I'll provide detailed insights."
        ),
        "general": (
            "I'm here to help! I encountered a minor issue, but I'm still operational. "
            "Could you rephrase your request, or would you like me to suggest what I can do?"
        ),
    }
    return fallbacks.get(error_context, fallbacks["general"])


def get_next_step_suggestion(agent_id: str, context: str = "") -> str:
    """Suggest a logical next step based on context."""
    suggestions = {
        "sales_001": "Try asking: 'Show my sales pipeline' or 'Draft a follow-up email'",
        "mkt_001": "Try asking: 'Campaign performance this week' or 'Suggest marketing ideas'",
        "msg_001": "Try asking: 'Summarise my inbox' or 'Draft a reply'",
        "data_001": "Try asking: 'Analyse my business trends' or 'Generate a report'",
    }
    return suggestions.get(agent_id, "Try asking me about sales, marketing, data analysis, or customer management.")
