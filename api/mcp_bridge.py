"""
AutoBiz AI — MCP Tool Bridge & Guardrails
Secure tool execution layer with permission gates, risk classification, and audit logging.
Risky actions require explicit user approval before execution.
"""

import uuid
import logging
from datetime import datetime, timezone
from action_store import action_store, ActionRecord

logger = logging.getLogger("autobiz.mcp")


# ── Risk Levels ──
RISK_LOW = "low"          # Read-only operations
RISK_MEDIUM = "medium"    # Modify local data
RISK_HIGH = "high"        # Send email, delete, external API calls


# ── Tool Registry ──
# Each tool has: description, risk_level, category, handler
TOOL_REGISTRY: dict[str, dict] = {
    "read_business_data": {
        "description": "Read business metrics and analytics data",
        "risk_level": RISK_LOW,
        "category": "data",
        "data_touched": "Business metrics (read-only)",
    },
    "generate_report": {
        "description": "Generate a business report PDF",
        "risk_level": RISK_LOW,
        "category": "data",
        "data_touched": "Report templates, business data (read-only)",
    },
    "summarise_emails": {
        "description": "Read and summarise inbox emails",
        "risk_level": RISK_LOW,
        "category": "communication",
        "data_touched": "Email inbox (read-only)",
    },
    "update_inventory": {
        "description": "Update product inventory quantities",
        "risk_level": RISK_MEDIUM,
        "category": "operations",
        "data_touched": "Product inventory database",
    },
    "update_customer_record": {
        "description": "Modify a customer profile or record",
        "risk_level": RISK_MEDIUM,
        "category": "crm",
        "data_touched": "Customer database",
    },
    "send_email": {
        "description": "Send an email to a customer or team member",
        "risk_level": RISK_HIGH,
        "category": "communication",
        "data_touched": "Email system — outbound message",
    },
    "delete_records": {
        "description": "Delete data records from the system",
        "risk_level": RISK_HIGH,
        "category": "data",
        "data_touched": "Business database — destructive operation",
    },
    "publish_campaign": {
        "description": "Publish a marketing campaign to external channels",
        "risk_level": RISK_HIGH,
        "category": "marketing",
        "data_touched": "Marketing platform — public-facing action",
    },
    "run_prediction": {
        "description": "Run ML prediction model on business data",
        "risk_level": RISK_LOW,
        "category": "analytics",
        "data_touched": "Prediction model (read-only)",
    },
    "web_search": {
        "description": "Search the web for business information",
        "risk_level": RISK_LOW,
        "category": "research",
        "data_touched": "Public web data (read-only)",
    },
}


# ── Pending Approvals (in-memory for demo) ──
_pending_approvals: dict[str, dict] = {}


# ── Audit Log (in-memory) ──
_audit_log: list[dict] = []


def _log_audit(event_type: str, tool_name: str, details: str, token: str | None = None):
    """Record an audit event."""
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": event_type,  # attempted | approved | denied | executed | failed
        "tool_name": tool_name,
        "details": details,
        "token": token,
    }
    _audit_log.append(entry)
    logger.info(f"AUDIT: {event_type} — {tool_name} — {details}")


def classify_action(tool_name: str) -> dict:
    """
    Classify an action's risk level and return metadata.
    Returns tool info or a default medium-risk classification for unknown tools.
    """
    if tool_name in TOOL_REGISTRY:
        return TOOL_REGISTRY[tool_name]
    return {
        "description": f"Unknown tool: {tool_name}",
        "risk_level": RISK_MEDIUM,
        "category": "unknown",
        "data_touched": "Unknown — requires review",
    }


def request_tool_execution(tool_name: str, parameters: dict, agent_id: str, reason: str = "") -> dict:
    """
    Request execution of a tool. Low-risk tools execute immediately.
    Medium/high-risk tools return a pending_approval response.

    Returns a structured response dict.
    """
    tool_info = classify_action(tool_name)
    risk = tool_info["risk_level"]

    _log_audit("attempted", tool_name, f"Risk: {risk}, Agent: {agent_id}")

    # Low-risk: execute immediately
    if risk == RISK_LOW:
        result = _execute_tool(tool_name, parameters, agent_id, reason)
        return result

    # Medium/High risk: require approval
    token = str(uuid.uuid4())[:8]
    _pending_approvals[token] = {
        "tool_name": tool_name,
        "parameters": parameters,
        "agent_id": agent_id,
        "reason": reason,
        "tool_info": tool_info,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    _log_audit("pending_approval", tool_name, f"Token: {token}", token)

    return {
        "status": "pending_approval",
        "approval_token": token,
        "action_description": tool_info["description"],
        "reason": reason or f"Agent {agent_id} wants to execute {tool_name}",
        "data_touched": tool_info["data_touched"],
        "risk_level": risk,
        "message": (
            f"⚠️ **Permission Required**\n\n"
            f"**Action:** {tool_info['description']}\n"
            f"**Risk Level:** {risk.upper()}\n"
            f"**Data Affected:** {tool_info['data_touched']}\n"
            f"**Reason:** {reason or 'Requested by agent'}\n\n"
            f"Reply **\"approve {token}\"** to allow, or **\"deny {token}\"** to cancel."
        ),
    }


def approve_action(token: str) -> dict:
    """Approve a pending action and execute it."""
    if token not in _pending_approvals:
        return {"status": "error", "message": "Invalid or expired approval token."}

    pending = _pending_approvals.pop(token)
    _log_audit("approved", pending["tool_name"], f"Token: {token}", token)

    result = _execute_tool(
        pending["tool_name"],
        pending["parameters"],
        pending["agent_id"],
        pending["reason"],
    )
    return result


def deny_action(token: str) -> dict:
    """Deny a pending action."""
    if token not in _pending_approvals:
        return {"status": "error", "message": "Invalid or expired approval token."}

    pending = _pending_approvals.pop(token)
    _log_audit("denied", pending["tool_name"], f"Token: {token} — User denied", token)

    return {
        "status": "denied",
        "message": f"Action **{pending['tool_name']}** was cancelled. No changes were made.",
        "tool_name": pending["tool_name"],
    }


def _execute_tool(tool_name: str, parameters: dict, agent_id: str, reason: str) -> dict:
    """
    Execute a tool (simulated for demo). Records the action for undo support.
    """
    tool_info = classify_action(tool_name)

    # Simulate tool execution with realistic responses
    result_text = _simulate_tool_result(tool_name, parameters)

    # Record in action store for undo
    is_reversible = tool_info["risk_level"] != RISK_HIGH
    action_record = ActionRecord(
        action_type=tool_name,
        agent_id=agent_id,
        description=f"{tool_info['description']} — {reason}",
        is_reversible=is_reversible,
        undo_metadata={"tool_name": tool_name, "parameters": parameters, "original_state": "snapshot_before"},
    )
    action_store.record(action_record)

    _log_audit("executed", tool_name, f"Action ID: {action_record.action_id}", None)

    return {
        "status": "executed",
        "tool_name": tool_name,
        "result": result_text,
        "action_id": action_record.action_id,
        "is_reversible": is_reversible,
        "message": result_text,
    }


def _simulate_tool_result(tool_name: str, parameters: dict) -> str:
    """Generate realistic simulated results for demo tools."""
    simulations = {
        "read_business_data": "Retrieved business metrics: Revenue ₹14.8L (+13.6% MoM), 1,247 orders processed, 87% customer retention.",
        "generate_report": "Report generated successfully: `report_2026-06-27.pdf` — Contains executive summary, revenue analysis, and recommendations.",
        "summarise_emails": "Inbox summary: 28 emails in last 7 days. 3 high priority (supplier invoice, client follow-up, team update). 8 sales inquiries pending.",
        "update_inventory": "Inventory updated: Product quantities adjusted. 3 items restocked, 1 item marked low-stock alert.",
        "update_customer_record": "Customer record updated successfully. Changes saved to CRM database.",
        "send_email": "Email sent successfully to the specified recipient. Delivery confirmation pending.",
        "delete_records": "Records deleted as specified. Backup snapshot created before deletion.",
        "publish_campaign": "Marketing campaign published to selected channels. Performance tracking enabled.",
        "run_prediction": "Prediction model executed. Results available in dashboard.",
        "web_search": "Found 12 relevant results. Top sources: industry reports, competitor analysis, market trends.",
    }
    return simulations.get(tool_name, f"Tool '{tool_name}' executed successfully with parameters: {parameters}")


def get_pending_approvals() -> list[dict]:
    """Get all pending approval requests."""
    return [
        {**v, "token": k}
        for k, v in _pending_approvals.items()
    ]


def get_audit_log(limit: int = 50) -> list[dict]:
    """Get recent audit log entries."""
    return _audit_log[-limit:]
