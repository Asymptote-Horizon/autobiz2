"""
AutoBiz AI — FastAPI Backend
Main application with all routes for the multi-agent business OS.

Routes:
  POST /api/chat              — Chat with an agent (orchestrated)
  POST /api/chat-with-file    — Chat with file attachment
  POST /api/sarvam/translate  — Sarvam Hindi translation demo
  POST /api/predict           — ML prediction for Business tab
  POST /api/action/approve/{token}  — Approve a risky action
  POST /api/action/deny/{token}     — Deny a risky action
  POST /api/action/undo/{action_id} — Undo an action
  GET  /api/actions           — List recent actions
  GET  /api/audit-log         — View audit trail
  GET  /api/health            — System health check
"""

import logging
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import settings
from orchestrator import run_orchestrator
from mcp_bridge import approve_action, deny_action, get_audit_log, get_pending_approvals
from action_store import action_store
from sarvam_bridge import translate_text
from prediction import run_prediction
from fallback import get_error_fallback

# ── Logging Setup ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("autobiz.main")

# ── FastAPI App ──
app = FastAPI(
    title="AutoBiz AI Backend",
    description="Multi-agent business operating system with LLM orchestration",
    version="1.0.0",
)

# Allow your Vite frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "*"],  # Update this to your Vite port if different
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ══════════════════════════════════════════════════════════════
# PYDANTIC MODELS
# ══════════════════════════════════════════════════════════════

class ChatRequest(BaseModel):
    agent_id: str
    message: str

class ToolExecution(BaseModel):
    tool: str
    content: str

class ChatResponse(BaseModel):
    reply: str
    toolExecutions: list[ToolExecution] = []
    metadata: dict = {}

class TranslateRequest(BaseModel):
    text: str
    source_lang: str = "hi-IN"
    target_lang: str = "en-IN"

class PredictRequest(BaseModel):
    type: str = "revenue"  # revenue | demand | churn
    horizon: int = 7


# ══════════════════════════════════════════════════════════════
# CHAT ENDPOINTS
# ══════════════════════════════════════════════════════════════

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest):
    """
    Main chat endpoint. Routes through the full orchestrator pipeline:
    intent detection → agent routing → security gate → formatted response.
    """
    try:
        result = await run_orchestrator(
            user_message=request.message,
            agent_id=request.agent_id,
        )

        tool_executions = [
            ToolExecution(tool=te["tool"], content=te["content"])
            for te in result.get("tool_executions", [])
        ]

        return ChatResponse(
            reply=result["reply"],
            toolExecutions=tool_executions,
            metadata=result.get("metadata", {}),
        )

    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        # Never crash — return a fallback
        return ChatResponse(
            reply=get_error_fallback("general"),
            toolExecutions=[],
            metadata={"error": str(e), "fallback_used": True},
        )


@app.post("/api/chat-with-file", response_model=ChatResponse)
async def chat_with_agent_file(
    agent_id: str = Form(...),
    message: str = Form(...),
    file: UploadFile = File(...),
):
    """Chat endpoint with file attachment support."""
    try:
        # Include file info in the message context
        content_to_process = f"{message}\n\n[File attached: {file.filename}, Size: {file.size} bytes]"

        result = await run_orchestrator(
            user_message=content_to_process,
            agent_id=agent_id,
        )

        tool_executions = [
            ToolExecution(tool=te["tool"], content=te["content"])
            for te in result.get("tool_executions", [])
        ]

        return ChatResponse(
            reply=result["reply"],
            toolExecutions=tool_executions,
            metadata=result.get("metadata", {}),
        )

    except Exception as e:
        logger.error(f"Chat-with-file endpoint error: {e}")
        return ChatResponse(
            reply=get_error_fallback("general"),
            toolExecutions=[],
            metadata={"error": str(e), "fallback_used": True},
        )


# ══════════════════════════════════════════════════════════════
# SARVAM TRANSLATION
# ══════════════════════════════════════════════════════════════

@app.post("/api/sarvam/translate")
async def sarvam_translate(request: TranslateRequest):
    """Translate text using Sarvam API (Hindi ↔ English)."""
    try:
        result = await translate_text(
            text=request.text,
            source_lang=request.source_lang,
            target_lang=request.target_lang,
        )
        return result.to_dict()
    except Exception as e:
        logger.error(f"Sarvam translate error: {e}")
        return {
            "text": request.text,
            "source_lang": request.source_lang,
            "target_lang": request.target_lang,
            "simulated": True,
            "error": str(e),
        }


# ══════════════════════════════════════════════════════════════
# PREDICTION ENDPOINT
# ══════════════════════════════════════════════════════════════

@app.post("/api/predict")
async def predict(request: PredictRequest):
    """
    Run ML prediction for the Business tab.
    Tries to load a real model; falls back to demo predictions.
    """
    try:
        result = run_prediction(
            prediction_type=request.type,
            horizon=request.horizon,
        )
        return result
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return {
            "prediction_type": request.type,
            "title": "Prediction",
            "description": "Unable to generate prediction at this time.",
            "data_points": [],
            "confidence": 0.0,
            "model_info": "Error — using fallback",
            "insights": ["Prediction service temporarily unavailable. Please try again."],
            "error": str(e),
        }


# ══════════════════════════════════════════════════════════════
# ACTION MANAGEMENT (Approve / Deny / Undo)
# ══════════════════════════════════════════════════════════════

@app.post("/api/action/approve/{token}")
async def approve_action_endpoint(token: str):
    """Approve a pending risky action."""
    result = approve_action(token)
    if result.get("status") == "error":
        raise HTTPException(status_code=404, detail=result["message"])
    return result


@app.post("/api/action/deny/{token}")
async def deny_action_endpoint(token: str):
    """Deny a pending risky action."""
    result = deny_action(token)
    if result.get("status") == "error":
        raise HTTPException(status_code=404, detail=result["message"])
    return result


@app.post("/api/action/undo/{action_id}")
async def undo_action_endpoint(action_id: str):
    """Undo a previously executed action."""
    result = action_store.undo(action_id)
    if result.get("status") == "error":
        raise HTTPException(status_code=404, detail=result["message"])
    return result


@app.get("/api/actions")
async def list_actions(limit: int = 50):
    """List recent executed actions (for audit/demo visibility)."""
    return {
        "actions": action_store.get_all(limit=limit),
        "pending_approvals": get_pending_approvals(),
    }


@app.get("/api/audit-log")
async def audit_log(limit: int = 50):
    """View the MCP audit trail."""
    return {"audit_log": get_audit_log(limit=limit)}


# ══════════════════════════════════════════════════════════════
# HEALTH CHECK
# ══════════════════════════════════════════════════════════════

@app.get("/api/health")
async def health_check():
    """System health check with component status."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
        "components": {
            "orchestrator": "online",
            "llm_router": "online",
            "mcp_bridge": "online",
            "action_store": "online",
            "sarvam_bridge": "available" if settings.SARVAM_API_KEY else "simulated",
            "prediction_engine": "online",
        },
        "config": {
            "real_llm_enabled": settings.ENABLE_REAL_LLM,
            "openrouter_models": settings.OPENROUTER_MODELS,
            "groq_models": settings.GROQ_MODELS,
        },
    }
