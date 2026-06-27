"""
AutoBiz AI — Orchestrator
Simple LangGraph-inspired agent orchestration (no heavy dependencies).
Flow: user_input → intent_detection → route_to_agent → security_gate → format_response
"""

import importlib
import logging
from llm_router import call_llm, LLMResponse
from mcp_bridge import request_tool_execution, classify_action, RISK_LOW
from sarvam_bridge import detect_hindi, translate_text
from fallback import get_agent_fallback, get_error_fallback, get_next_step_suggestion

logger = logging.getLogger("autobiz.orchestrator")


# ── Intent Categories ──
INTENTS = {
    "business_insight": {
        "agent": "data_001",
        "description": "Business analytics, metrics, insights, trends",
        "keywords": ["revenue", "profit", "growth", "metric", "trend", "insight", "report", "analytics", "data", "dashboard"],
    },
    "sales_marketing": {
        "agent": "sales_001",
        "description": "Sales pipeline, leads, CRM, marketing campaigns",
        "keywords": ["sale", "lead", "pipeline", "customer", "crm", "deal", "prospect", "campaign", "marketing", "advertis"],
    },
    "communication": {
        "agent": "msg_001",
        "description": "Emails, messages, notifications, communication",
        "keywords": ["email", "mail", "inbox", "message", "send", "reply", "draft", "notify", "chat", "call"],
    },
    "marketing": {
        "agent": "mkt_001",
        "description": "Marketing strategy, campaigns, social media, content",
        "keywords": ["brand", "social", "content", "seo", "audience", "engagement", "promotion", "strategy"],
    },
    "action_tool": {
        "agent": "default_agent",
        "description": "Execute actions, tools, or external operations",
        "keywords": ["update", "delete", "create", "publish", "execute", "run", "schedule", "automate"],
    },
    "general_chat": {
        "agent": "default_agent",
        "description": "General conversation, help, greetings",
        "keywords": [],
    },
}

# ── System prompt for LLM-based intent detection ──
INTENT_SYSTEM_PROMPT = """You are an intent classifier for a business AI assistant called AutoBiz AI.
Classify the user's message into exactly ONE of these categories:
- business_insight: Questions about revenue, analytics, data, metrics, trends, reports
- sales_marketing: Sales pipeline, leads, CRM, deals, prospects
- communication: Emails, messages, inbox, sending communications
- marketing: Brand strategy, campaigns, social media, content creation
- action_tool: Executing actions, updating data, running tools
- general_chat: Greetings, general help, unclear intent

Also extract any tool that should be called. Available tools:
read_business_data, generate_report, summarise_emails, update_inventory,
update_customer_record, send_email, delete_records, publish_campaign, run_prediction, web_search

Respond in this EXACT format (no extra text):
INTENT: <category>
TOOL: <tool_name or none>
SUMMARY: <one-line summary of what the user wants>"""


# ══════════════════════════════════════════════════════════════
# ORCHESTRATION PIPELINE
# ══════════════════════════════════════════════════════════════

class OrchestratorState:
    """State object passed through the orchestration pipeline."""
    def __init__(self, user_message: str, agent_id: str):
        self.user_message = user_message
        self.original_message = user_message
        self.agent_id = agent_id
        self.detected_intent = "general_chat"
        self.detected_tool = None
        self.intent_summary = ""
        self.is_hindi = False
        self.translated_message = None
        self.agent_response: str = ""
        self.tool_executions: list[dict] = []
        self.model_used: str = ""
        self.provider: str = ""
        self.fallback_used: bool = False
        self.security_gate_result: dict | None = None
        self.error: str | None = None


async def node_intent_detection(state: OrchestratorState) -> OrchestratorState:
    """
    Node 1: Detect intent from user message.
    Uses keyword matching first (fast), falls back to LLM classification.
    Also detects Hindi and handles translation.
    """
    try:
        message = state.user_message.lower()

        # Detect Hindi
        state.is_hindi = detect_hindi(state.user_message)
        if state.is_hindi:
            translation = await translate_text(state.user_message)
            state.translated_message = translation.text
            message = translation.text.lower()

        # Fast keyword-based intent detection
        best_intent = "general_chat"
        best_score = 0
        for intent_name, intent_info in INTENTS.items():
            score = sum(1 for kw in intent_info["keywords"] if kw in message)
            if score > best_score:
                best_score = score
                best_intent = intent_name

        state.detected_intent = best_intent
        state.intent_summary = f"Classified as: {best_intent}"

        # Detect tool from message
        tool_keywords = {
            "send_email": ["send email", "send mail", "email to"],
            "generate_report": ["generate report", "create report", "daily report", "make report"],
            "summarise_emails": ["email summary", "inbox", "summarise email", "check email"],
            "update_inventory": ["update inventory", "restock", "inventory"],
            "publish_campaign": ["publish campaign", "launch campaign", "start campaign"],
            "delete_records": ["delete", "remove record"],
            "run_prediction": ["predict", "forecast", "prediction"],
            "web_search": ["search", "look up", "find online"],
        }
        for tool_name, keywords in tool_keywords.items():
            if any(kw in message for kw in keywords):
                state.detected_tool = tool_name
                break

        logger.info(f"Intent: {state.detected_intent}, Tool: {state.detected_tool}, Hindi: {state.is_hindi}")

    except Exception as e:
        logger.error(f"Intent detection failed: {e}")
        state.detected_intent = "general_chat"

    return state


async def node_route_to_agent(state: OrchestratorState) -> OrchestratorState:
    """
    Node 2: Route to the appropriate specialist agent and get LLM response.
    """
    try:
        # Determine which agent module to use
        if state.agent_id and state.agent_id != "auto":
            target_agent = state.agent_id.replace("-", "_")
        else:
            intent_info = INTENTS.get(state.detected_intent, INTENTS["general_chat"])
            target_agent = intent_info["agent"]

        # Load the agent module and get its system prompt
        try:
            module = importlib.import_module(f"agents.{target_agent}")
            system_prompt = getattr(module, "SYSTEM_PROMPT", None)
            has_process = hasattr(module, "process_message_async")
        except ModuleNotFoundError:
            module = importlib.import_module("agents.default_agent")
            system_prompt = getattr(module, "SYSTEM_PROMPT", None)
            has_process = hasattr(module, "process_message_async")

        # Use the agent's async processor if available
        if has_process:
            result = await module.process_message_async(state.user_message)
            state.agent_response = result.get("response", result.get("reply", ""))
            state.tool_executions = result.get("tool_executions", [])
            state.model_used = result.get("model_used", "")
            state.provider = result.get("provider", "")
            state.fallback_used = result.get("fallback_used", False)
        else:
            # Call LLM directly with agent's system prompt
            llm_result: LLMResponse = await call_llm(
                messages=[{"role": "user", "content": state.user_message}],
                system_prompt=system_prompt or "You are a helpful business assistant for AutoBiz AI.",
                context_type=state.detected_intent,
            )
            state.agent_response = llm_result.text
            state.model_used = llm_result.model_used
            state.provider = llm_result.provider
            state.fallback_used = llm_result.fallback_used

    except Exception as e:
        logger.error(f"Agent routing failed: {e}")
        state.agent_response = get_agent_fallback(state.agent_id)
        state.fallback_used = True
        state.error = str(e)

    return state


async def node_security_gate(state: OrchestratorState) -> OrchestratorState:
    """
    Node 3: Security gate — check if any detected tool needs permission.
    """
    try:
        if state.detected_tool:
            tool_info = classify_action(state.detected_tool)

            if tool_info["risk_level"] != RISK_LOW:
                # Request permission for risky tool
                result = request_tool_execution(
                    tool_name=state.detected_tool,
                    parameters={},
                    agent_id=state.agent_id,
                    reason=state.intent_summary,
                )
                state.security_gate_result = result

                if result["status"] == "pending_approval":
                    # Append permission request to response
                    state.agent_response += "\n\n---\n\n" + result["message"]
                    state.tool_executions.append({
                        "tool": "security_gate",
                        "content": f"⚠️ Permission required for: {state.detected_tool} (Risk: {tool_info['risk_level']})",
                    })
            else:
                # Low-risk tool — execute immediately
                result = request_tool_execution(
                    tool_name=state.detected_tool,
                    parameters={},
                    agent_id=state.agent_id,
                    reason=state.intent_summary,
                )
                state.tool_executions.append({
                    "tool": state.detected_tool,
                    "content": result.get("result", result.get("message", "Tool executed")),
                })

    except Exception as e:
        logger.error(f"Security gate failed: {e}")
        # Don't block the response — just log the error

    return state


async def node_format_response(state: OrchestratorState) -> dict:
    """
    Node 4: Format the final response for the frontend.
    """
    # If no response was generated, use fallback
    if not state.agent_response:
        state.agent_response = get_error_fallback("general")
        state.fallback_used = True

    # Add next step suggestion if fallback was used
    if state.fallback_used:
        suggestion = get_next_step_suggestion(state.agent_id)
        state.agent_response += f"\n\n---\n💡 {suggestion}"

    return {
        "reply": state.agent_response,
        "tool_executions": state.tool_executions,
        "metadata": {
            "intent": state.detected_intent,
            "model_used": state.model_used,
            "provider": state.provider,
            "fallback_used": state.fallback_used,
            "hindi_detected": state.is_hindi,
            "tool_detected": state.detected_tool,
        },
    }


async def run_orchestrator(user_message: str, agent_id: str = "auto") -> dict:
    """
    Main orchestration entry point.
    Runs the full pipeline: intent → route → security → format

    Always returns a valid response dict — never throws.
    """
    try:
        state = OrchestratorState(user_message=user_message, agent_id=agent_id)

        # Run pipeline nodes sequentially
        state = await node_intent_detection(state)
        state = await node_route_to_agent(state)
        state = await node_security_gate(state)
        result = await node_format_response(state)

        return result

    except Exception as e:
        # Ultimate safety net — should never reach here, but if it does, don't crash
        logger.critical(f"Orchestrator crashed (this should not happen): {e}")
        return {
            "reply": get_error_fallback("orchestrator_failure"),
            "tool_executions": [],
            "metadata": {
                "intent": "unknown",
                "model_used": "none",
                "provider": "fallback",
                "fallback_used": True,
                "error": str(e),
            },
        }
