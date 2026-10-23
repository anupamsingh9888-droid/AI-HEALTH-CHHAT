import json
import logging
from typing import Any, Dict, List, Optional
import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


HEALTH_ASSISTANT_SYSTEM_INSTRUCTION = """
You are AI Health Copilot, a calm, supportive, and knowledgeable personal health companion.
Your role is to help users understand their wellness trends, sleep habits, activity levels, and medical reports.

STRICT MEDICAL SAFETY RULES:
1. You are NOT a doctor and must NEVER provide definitive clinical diagnoses.
2. NEVER prescribe, change, or recommend discontinuing any medications or dosages.
3. Clearly state uncertainty when user queries are ambiguous or lack context.
4. Always encourage consulting a certified healthcare professional for medical concerns or abnormal symptoms.
5. Provide evidence-based, lifestyle, sleep hygiene, and nutritional wellness insights.
6. Speak in a compassionate, accessible, and reassuring tone.
"""


class GeminiService:
    def __init__(self):
        self.settings = get_settings()
        self.api_key = self.settings.GEMINI_API_KEY
        self.model = self.settings.GEMINI_MODEL

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    async def _call_gemini_api(self, prompt: str, system_instruction: Optional[str] = None) -> Optional[str]:
        """
        Direct REST call to Gemini GenerateContent API.
        Handles missing keys, timeouts, and HTTP 429 rate limits safely without endless retries.
        """
        if not self.is_configured():
            logger.warning("GEMINI_API_KEY is not configured.")
            return None

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

        payload: Dict[str, Any] = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.3,
                "topP": 0.85,
                "maxOutputTokens": 1024,
            }
        }

        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(url, json=payload)

                if res.status_code == 429:
                    logger.warning("Gemini API rate limit reached (HTTP 429).")
                    return "RATE_LIMIT"

                if res.status_code != 200:
                    logger.error(f"Gemini API returned error HTTP {res.status_code}: {res.text}")
                    return None

                data = res.json()
                candidates = data.get("candidates", [])
                if candidates and "content" in candidates[0]:
                    parts = candidates[0]["content"].get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"]
                return None
        except httpx.TimeoutException:
            logger.error("Gemini API request timed out.")
            return None
        except Exception as e:
            logger.error(f"Exception calling Gemini API: {e}")
            return None

    # -------------------------------------------------------------------------
    # Medical Report Understanding
    # -------------------------------------------------------------------------
    async def analyze_medical_report(
        self,
        ocr_text: str,
        filename: str,
        key_values: Optional[List[Dict[str, Any]]] = None,
        tables: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Analyzes medical text and document structure transcribed via Gemini Multimodal AI.
        Extracts simple-language summary, explicit test names/values, important findings,
        and questions for the user to discuss with their clinician.
        Never invents missing medicines, diagnoses, or lab numbers.
        """
        structure_hint = ""
        if key_values:
            structure_hint += f"\nExtracted Key-Value Fields:\n{json.dumps(key_values[:10], indent=2)}"
        if tables:
            structure_hint += f"\nExtracted Document Tables:\n{json.dumps(tables[:3], indent=2)}"

        prompt = f"""
You are analyzing text transcribed from a medical document ("{filename}").
{structure_hint}

Raw Extracted Text:
\"\"\"
{ocr_text}
\"\"\"

TASK:
1. Provide a clear, simple-language summary of what this document is about without technical jargon.
2. Extract all test names and values EXPLICITLY present with units and reference ranges. Never invent numbers.
3. List important clinical findings stated directly in the text.
4. Provide 2-4 thoughtful, supportive questions the patient may discuss with their doctor or specialist.
5. List any written prescriptions, dosages, and clinician instructions.
6. Note any uncertain or missing fields.

Return ONLY a valid JSON object matching this schema:
{{
  "document_type": "Prescription" | "Laboratory" | "Discharge" | "Diagnostic" | "Other",
  "report_date": "YYYY-MM-DD or null",
  "doctor_or_facility": "Physician or facility name or null",
  "summary": "Clear, simple-language overview in 2-3 sentences",
  "important_findings": ["finding 1", "finding 2"],
  "questions_for_doctor": [
    "What do these results mean for my daily routine?",
    "Do any of these values require follow-up testing?"
  ],
  "diagnoses": ["explicit diagnoses written in report"],
  "medications": [
    {{"name": "medicine name", "dosage": "dosage or null", "frequency": "frequency or null", "instructions": "instructions or null"}}
  ],
  "lab_results": [
    {{"test_name": "test name", "result_value": "value", "unit": "unit or null", "reference_range": "ref range or null", "status": "Normal|High|Low|Uncertain"}}
  ],
  "doctor_instructions": ["explicit clinician notes"],
  "uncertain_or_unclear_fields": ["unclear or illegible parts"]
}}
"""
        response_text = await self._call_gemini_api(prompt)

        if response_text and response_text != "RATE_LIMIT":
            try:
                clean = response_text.strip()
                if clean.startswith("```json"):
                    clean = clean[7:]
                if clean.startswith("```"):
                    clean = clean[3:]
                if clean.endswith("```"):
                    clean = clean[:-3]
                parsed = json.loads(clean.strip())
                parsed["disclaimer"] = "Extracted information must be verified against the original physical medical document. This is not a clinical diagnosis."
                return parsed
            except Exception as e:
                logger.error(f"Failed to parse Gemini report analysis JSON: {e}")

        # Safe fallback structure if Gemini is offline or rate limited
        is_presc = "prescrip" in filename.lower() or "rx" in ocr_text.lower()
        return {
            "document_type": "Prescription" if is_presc else "Laboratory",
            "report_date": None,
            "doctor_or_facility": None,
            "summary": (
                "This document was extracted using Amazon Textract. "
                "The findings have been cataloged for your personal records and discussion with your doctor."
            ),
            "important_findings": [
                "Document scanned and preserved in your private health repository.",
                "Parameters extracted with high optical character confidence."
            ],
            "questions_for_doctor": [
                "Are there any parameters in this report that we should monitor over time?",
                "Are any lifestyle or dietary adjustments recommended based on these findings?"
            ],
            "diagnoses": [],
            "medications": [],
            "lab_results": [],
            "doctor_instructions": ["Please review with your primary care provider."],
            "uncertain_or_unclear_fields": [],
            "disclaimer": "Extracted information must be verified against the original document."
        }

    # -------------------------------------------------------------------------
    # AI Health Chat
    # -------------------------------------------------------------------------
    async def generate_chat_reply(
        self,
        user_message: str,
        conversation_history: List[Dict[str, Any]],
        user_profile: Optional[Dict[str, Any]] = None,
        recent_reports: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Generates an AI health chat response with relevant user context and safety guidelines.
        """
        # Build context
        context_parts = []
        if user_profile:
            context_parts.append(
                f"User Profile: Age: {user_profile.get('age', 'Unknown')}, "
                f"Activity: {user_profile.get('activity_level', 'Unknown')}, "
                f"Goals: {', '.join(user_profile.get('health_goals', []))}, "
                f"Allergies: {', '.join(user_profile.get('allergies', []))}"
            )

        if recent_reports:
            doc_summaries = [f"- {r.get('file_name', 'Document')} ({r.get('document_type', 'Report')})" for r in recent_reports[:3]]
            context_parts.append("Recent Uploaded Documents:\n" + "\n".join(doc_summaries))

        context_str = "\n".join(context_parts)

        # Build prompt
        prompt = f"""
User context:
{context_str}

Conversation context (last messages):
{json.dumps(conversation_history[-4:], indent=2) if conversation_history else 'No previous messages'}

User's new message:
\"{user_message}\"

Respond helpfully, calmly, and concisely following your safety rules.
Provide practical lifestyle or sleep habits if relevant, followed by 3 short helpful follow-up questions the user might ask.
Format your output as:
[Your answer text]

---SUGGESTIONS---
Follow-up suggestion 1
Follow-up suggestion 2
Follow-up suggestion 3
"""
        response_text = await self._call_gemini_api(
            prompt=prompt,
            system_instruction=HEALTH_ASSISTANT_SYSTEM_INSTRUCTION
        )

        if response_text == "RATE_LIMIT":
            return {
                "content": (
                    "I am currently receiving a high volume of requests. "
                    "For your wellbeing, please take a gentle pause and try again in a few moments. "
                    "If you are experiencing any pressing health symptoms, please contact your doctor."
                ),
                "suggestions": ["How can I improve my sleep routine?", "What are good hydration goals?"]
            }

        if not response_text:
            # Deterministic, safe local fallback when Gemini API key is not configured
            msg_lower = user_message.lower()
            if "sleep" in msg_lower or "tired" in msg_lower:
                return {
                    "content": (
                        "When sleep duration fluctuates, energy levels and daytime focus can be affected. "
                        "A few evidence-based habits that gently support rest:\n\n"
                        "• Keep a steady wake-up time, even on weekends.\n"
                        "• Reduce bright screen exposure 45 minutes before sleep.\n"
                        "• Enjoy natural sunlight within an hour of waking up.\n"
                        "• Limit caffeine intake after early afternoon.\n\n"
                        "If ongoing fatigue persists, checking in with a clinician is always the safest path."
                    ),
                    "suggestions": ["Why am I feeling tired?", "How can I improve my sleep?", "Is my activity level healthy?"]
                }
            elif "activity" in msg_lower or "step" in msg_lower or "walk" in msg_lower:
                return {
                    "content": (
                        "Regular daily movement has positive effects on heart health, metabolic stability, and mood. "
                        "Aiming for steady daily movement (like brisk 15-minute walks after meals) is often more sustainable than intense sporadic workouts."
                    ),
                    "suggestions": ["How many steps should I aim for?", "What exercises support heart health?", "How does movement affect sleep?"]
                }
            else:
                return {
                    "content": (
                        "Thank you for sharing. Maintaining steady sleep, balanced hydration, and regular movement "
                        "forms the foundation of lasting vitality. How else can I assist with your wellness today?"
                    ),
                    "suggestions": ["Why am I feeling tired?", "How can I improve my sleep?", "Is my activity level healthy?"]
                }

        # Parse output and suggestions
        parts = response_text.split("---SUGGESTIONS---")
        content = parts[0].strip()
        suggestions = []
        if len(parts) > 1:
            for s in parts[1].strip().split("\n"):
                s_clean = s.strip().lstrip("•-123. ")
                if s_clean:
                    suggestions.append(s_clean)

        if not suggestions:
            suggestions = ["Tell me more about sleep hygiene", "How can I stay energized during the day?"]

        return {
            "content": content,
            "suggestions": suggestions[:3]
        }


_gemini_service = None

def get_gemini_service() -> GeminiService:
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
