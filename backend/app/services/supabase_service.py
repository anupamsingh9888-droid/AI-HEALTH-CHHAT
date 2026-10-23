import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
import uuid

from app.config import get_settings

logger = logging.getLogger(__name__)

# Fallback in-memory store for local testing when Supabase keys are not yet provided
_in_memory_db = {
    "profiles": {
        "default-user": {
            "id": "default-user",
            "email": "maya@example.com",
            "full_name": "Maya Rao",
            "age": 29,
            "gender": "Female",
            "height_cm": 167.0,
            "weight_kg": 62.4,
            "activity_level": "Moderately active",
            "health_goals": ["Better sleep", "Walk 10k steps"],
            "medical_history": "Mild seasonal allergies",
            "allergies": ["Pollen"],
            "current_medications": ["Vitamin D3 1000 IU"],
            "dietary_preferences": "Flexitarian",
            "sleep_goal_hours": 8.0,
            "updated_at": datetime.utcnow().isoformat(),
        }
    },
    "reports": [
        {
            "id": "rep-1",
            "user_id": "default-user",
            "file_name": "Prescription — Vitamin D.pdf",
            "file_type": "application/pdf",
            "file_size_bytes": 142000,
            "document_type": "Prescription",
            "report_date": "2026-10-14",
            "status": "Processed",
            "ocr_raw_text": "Rx: Vitamin D3 (Cholecalciferol) 1000 IU. Take 1 capsule daily after breakfast. Duration: 90 days. Dr. S. Mehta.",
            "ocr_confidence": 0.96,
            "structured_data": {
                "document_type": "Prescription",
                "report_date": "2026-10-14",
                "doctor_or_facility": "Dr. S. Mehta",
                "medications": [
                    {"name": "Vitamin D3", "dosage": "1000 IU", "frequency": "Daily after breakfast", "instructions": "Take for 90 days"}
                ],
                "diagnoses": ["Vitamin D insufficiency"],
                "doctor_instructions": ["Take 1 capsule daily with food", "Follow up after 3 months"]
            },
            "created_at": "2026-10-14T10:00:00Z"
        },
        {
            "id": "rep-2",
            "user_id": "default-user",
            "file_name": "Complete Blood Count.pdf",
            "file_type": "application/pdf",
            "file_size_bytes": 284000,
            "document_type": "Laboratory",
            "report_date": "2026-10-02",
            "status": "Processed",
            "ocr_raw_text": "Complete Blood Count (CBC). Hemoglobin: 13.4 g/dL (Ref: 12.0 - 15.5). Platelets: 245,000 /mcL (Ref: 150k - 450k). WBC: 6,200 /mcL (Ref: 4,000 - 11,000).",
            "ocr_confidence": 0.98,
            "structured_data": {
                "document_type": "Laboratory",
                "report_date": "2026-10-02",
                "lab_results": [
                    {"test_name": "Hemoglobin", "result_value": "13.4", "unit": "g/dL", "reference_range": "12.0 - 15.5", "status": "Normal"},
                    {"test_name": "Platelets", "result_value": "245,000", "unit": "/mcL", "reference_range": "150,000 - 450,000", "status": "Normal"},
                    {"test_name": "White Blood Cells (WBC)", "result_value": "6,200", "unit": "/mcL", "reference_range": "4,000 - 11,000", "status": "Normal"}
                ],
                "doctor_instructions": ["Values within normal limits. Maintain balanced diet."]
            },
            "created_at": "2026-10-02T14:30:00Z"
        }
    ],
    "chats": [
        {
            "id": "chat-init-1",
            "user_id": "default-user",
            "role": "assistant",
            "content": "Hi Maya, I'm your health companion. I can help you understand your sleep, activity and habits. What's on your mind?",
            "suggestions": ["Why am I feeling tired?", "How can I improve my sleep?", "Is my activity level healthy?"],
            "created_at": "2026-10-22T08:00:00Z"
        }
    ]
}


class SupabaseService:
    def __init__(self):
        self.settings = get_settings()
        self.client = None
        self._init_client()

    def _init_client(self):
        if self.settings.SUPABASE_URL and self.settings.SUPABASE_ANON_KEY:
            try:
                from supabase import create_client
                url = self.settings.SUPABASE_URL.strip().replace("/rest/v1", "").rstrip("/")
                self.client = create_client(url, self.settings.SUPABASE_ANON_KEY.strip())
                logger.info(f"Supabase client initialized successfully with {url}.")
            except Exception as e:
                logger.warning(f"Failed to initialize Supabase client: {e}. Falling back to in-memory store.")
                self.client = None
        else:
            logger.info("Supabase credentials not configured. Running with in-memory store.")

    def is_configured(self) -> bool:
        return self.client is not None

    # -------------------------------------------------------------------------
    # Profile operations
    # -------------------------------------------------------------------------
    def get_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        if self.client:
            try:
                res = self.client.table("profiles").select("*").eq("id", user_id).single().execute()
                return res.data
            except Exception as e:
                logger.error(f"Error fetching profile from Supabase: {e}")
        return _in_memory_db["profiles"].get(user_id) or _in_memory_db["profiles"].get("default-user")

    def upsert_profile(self, user_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        data = {**profile_data, "id": user_id, "updated_at": datetime.utcnow().isoformat()}
        if self.client:
            try:
                res = self.client.table("profiles").upsert(data).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Error upserting profile in Supabase: {e}")

        # In-memory update
        existing = _in_memory_db["profiles"].get(user_id, {})
        merged = {**existing, **data}
        _in_memory_db["profiles"][user_id] = merged
        return merged

    # -------------------------------------------------------------------------
    # Medical Reports operations
    # -------------------------------------------------------------------------
    def create_report(self, user_id: str, report_data: Dict[str, Any]) -> Dict[str, Any]:
        report_id = str(uuid.uuid4())
        record = {
            "id": report_id,
            "user_id": user_id,
            "created_at": datetime.utcnow().isoformat(),
            **report_data
        }
        if self.client:
            try:
                res = self.client.table("medical_reports").insert(record).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Error saving report to Supabase: {e}")

        _in_memory_db["reports"].insert(0, record)
        return record

    def get_reports(self, user_id: str) -> List[Dict[str, Any]]:
        if self.client:
            try:
                res = self.client.table("medical_reports").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
                return res.data or []
            except Exception as e:
                logger.error(f"Error fetching reports from Supabase: {e}")

        return [r for r in _in_memory_db["reports"] if r.get("user_id") in (user_id, "default-user")]

    def get_report(self, user_id: str, report_id: str) -> Optional[Dict[str, Any]]:
        if self.client:
            try:
                res = self.client.table("medical_reports").select("*").eq("id", report_id).eq("user_id", user_id).single().execute()
                return res.data
            except Exception as e:
                logger.error(f"Error fetching report {report_id}: {e}")

        for r in _in_memory_db["reports"]:
            if r["id"] == report_id and r.get("user_id") in (user_id, "default-user"):
                return r
        return None

    def delete_report(self, user_id: str, report_id: str) -> bool:
        if self.client:
            try:
                self.client.table("medical_reports").delete().eq("id", report_id).eq("user_id", user_id).execute()
                return True
            except Exception as e:
                logger.error(f"Error deleting report {report_id}: {e}")

        _in_memory_db["reports"] = [
            r for r in _in_memory_db["reports"]
            if not (r["id"] == report_id and r.get("user_id") in (user_id, "default-user"))
        ]
        return True

    # -------------------------------------------------------------------------
    # Chat operations
    # -------------------------------------------------------------------------
    def save_chat_message(self, user_id: str, role: str, content: str, suggestions: Optional[List[str]] = None) -> Dict[str, Any]:
        msg = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "role": role,
            "content": content,
            "suggestions": suggestions or [],
            "created_at": datetime.utcnow().isoformat(),
        }
        if self.client:
            try:
                res = self.client.table("chat_messages").insert(msg).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Error saving chat message to Supabase: {e}")

        _in_memory_db["chats"].append(msg)
        return msg

    def get_chat_history(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        if self.client:
            try:
                res = self.client.table("chat_messages").select("*").eq("user_id", user_id).order("created_at", desc=False).limit(limit).execute()
                return res.data or []
            except Exception as e:
                logger.error(f"Error fetching chat history from Supabase: {e}")

        user_chats = [c for c in _in_memory_db["chats"] if c.get("user_id") in (user_id, "default-user")]
        return user_chats[-limit:]

    def clear_chat_history(self, user_id: str) -> bool:
        if self.client:
            try:
                self.client.table("chat_messages").delete().eq("user_id", user_id).execute()
                return True
            except Exception as e:
                logger.error(f"Error clearing chat history: {e}")

        _in_memory_db["chats"] = [c for c in _in_memory_db["chats"] if c.get("user_id") not in (user_id, "default-user")]
        return True


_supabase_service = None

def get_supabase_service() -> SupabaseService:
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service
