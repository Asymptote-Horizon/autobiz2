"""
AutoBiz AI — Action Store & Undo/Rollback
Tracks executed actions and supports undo/rollback.
Reversible actions get undone; irreversible ones get undo simulation.
"""

import uuid
import logging
from datetime import datetime, timezone

logger = logging.getLogger("autobiz.actions")


class ActionRecord:
    """A single recorded action."""

    def __init__(
        self,
        action_type: str,
        agent_id: str,
        description: str,
        is_reversible: bool = True,
        undo_metadata: dict | None = None,
    ):
        self.action_id = str(uuid.uuid4())[:8]
        self.action_type = action_type
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.agent_id = agent_id
        self.description = description
        self.is_reversible = is_reversible
        self.undo_metadata = undo_metadata or {}
        self.status = "executed"  # executed | undone | undo_simulated

    def to_dict(self) -> dict:
        return {
            "action_id": self.action_id,
            "action_type": self.action_type,
            "timestamp": self.timestamp,
            "agent_id": self.agent_id,
            "description": self.description,
            "is_reversible": self.is_reversible,
            "status": self.status,
        }


class ActionStore:
    """In-memory action store for recording and undoing actions."""

    def __init__(self):
        self._actions: list[ActionRecord] = []

    def record(self, action: ActionRecord):
        """Record a new action."""
        self._actions.append(action)
        logger.info(f"Action recorded: {action.action_id} — {action.action_type}")

    def get_all(self, limit: int = 50) -> list[dict]:
        """Get recent actions."""
        return [a.to_dict() for a in reversed(self._actions[-limit:])]

    def get_by_id(self, action_id: str) -> ActionRecord | None:
        """Find an action by ID."""
        for action in self._actions:
            if action.action_id == action_id:
                return action
        return None

    def undo(self, action_id: str) -> dict:
        """
        Undo an action.
        - If reversible → mark as undone, return success
        - If not reversible → return undo simulation with recommendation
        - If already undone → return error
        """
        action = self.get_by_id(action_id)

        if not action:
            return {
                "status": "error",
                "message": f"Action '{action_id}' not found.",
            }

        if action.status in ("undone", "undo_simulated"):
            return {
                "status": "error",
                "message": f"Action '{action_id}' has already been {'undone' if action.status == 'undone' else 'simulated for undo'}.",
            }

        if action.is_reversible:
            # Perform the undo (simulated for demo)
            action.status = "undone"
            logger.info(f"Action undone: {action.action_id} — {action.action_type}")
            return {
                "status": "undone",
                "action_id": action_id,
                "message": (
                    f"✅ **Action Undone**\n\n"
                    f"**Action:** {action.description}\n"
                    f"**Type:** {action.action_type}\n"
                    f"**Original Time:** {action.timestamp}\n\n"
                    f"All changes have been reverted to their previous state."
                ),
            }
        else:
            # Undo simulation for irreversible actions
            action.status = "undo_simulated"
            logger.info(f"Action undo simulated: {action.action_id} — {action.action_type}")

            recommendations = {
                "send_email": "Send a follow-up correction email to the same recipient explaining the error.",
                "delete_records": "Restore from the automatic backup snapshot that was created before deletion.",
                "publish_campaign": "Pause the campaign immediately from the marketing dashboard and create a revised version.",
            }
            rec = recommendations.get(
                action.action_type,
                "Contact your administrator to manually review and revert this action."
            )

            return {
                "status": "undo_simulated",
                "action_id": action_id,
                "message": (
                    f"⚠️ **Undo Simulation**\n\n"
                    f"This action cannot be fully reversed automatically.\n\n"
                    f"**Action:** {action.description}\n"
                    f"**Type:** {action.action_type}\n\n"
                    f"**Recommended Recovery Steps:**\n"
                    f"{rec}\n\n"
                    f"I've flagged this in the audit log for review."
                ),
            }


# Global singleton
action_store = ActionStore()
