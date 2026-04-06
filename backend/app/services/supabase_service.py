from importlib import import_module
from typing import Any, Dict, List, Optional, Tuple

from app.core.config import settings


class SupabaseService:
    def __init__(self) -> None:
        self._client: Optional[Any] = None

        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            return

        try:
            supabase_module = import_module("supabase")
            create_client = getattr(supabase_module, "create_client", None)
            if create_client is None:
                return
            self._client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_ROLE_KEY
            )
        except Exception:
            self._client = None

    @property
    def enabled(self) -> bool:
        return self._client is not None

    def _insert(
        self,
        table: str,
        payload: Dict[str, Any]
    ) -> Tuple[bool, Optional[List[Dict[str, Any]]], str]:
        if not self._client:
            return False, None, "Supabase is not configured"

        try:
            response = self._client.table(table).insert(payload).execute()
            data = getattr(response, "data", None)
            return True, data, ""
        except Exception as exc:
            return False, None, str(exc)

    def _insert_many(
        self,
        table: str,
        payload: List[Dict[str, Any]]
    ) -> Tuple[bool, str]:
        if not payload:
            return True, ""
        if not self._client:
            return False, "Supabase is not configured"

        try:
            self._client.table(table).insert(payload).execute()
            return True, ""
        except Exception as exc:
            return False, str(exc)

    def get_resume(
        self,
        resume_id: str
    ) -> Tuple[bool, Optional[Dict[str, Any]], str]:
        if not self._client:
            return False, None, "Supabase is not configured"

        try:
            response = (
                self._client
                .table("resumes")
                .select("id, parsed_data, raw_text")
                .eq("id", resume_id)
                .limit(1)
                .execute()
            )
            rows = getattr(response, "data", None) or []
            if not rows:
                return False, None, "Resume not found"
            return True, rows[0], ""
        except Exception as exc:
            return False, None, str(exc)

    def save_resume(
        self,
        resume_id: str,
        filename: str,
        file_type: str,
        raw_text: str,
        parsed_data: Dict[str, Any],
        user_id: Optional[str] = None,
    ) -> Tuple[bool, str]:
        payload = {
            "id": resume_id,
            "user_id": user_id,
            "filename": filename,
            "file_type": file_type,
            "raw_text": raw_text,
            "parsed_data": parsed_data,
        }
        ok, _, err = self._insert("resumes", payload)
        return ok, err

    def save_job_description(
        self,
        job_description_id: str,
        raw_text: str,
        user_id: Optional[str] = None,
        title: str = "",
        company: str = "",
        location: str = "",
        parsed_data: Optional[Dict[str, Any]] = None,
    ) -> Tuple[bool, str]:
        payload = {
            "id": job_description_id,
            "user_id": user_id,
            "title": title or "Target Role",
            "company": company or "",
            "location": location or "",
            "raw_text": raw_text,
            "parsed_data": parsed_data or {},
        }
        ok, _, err = self._insert("job_descriptions", payload)
        return ok, err

    def save_jd_match(
        self,
        resume_id: str,
        job_description_id: str,
        match_data: Dict[str, Any],
    ) -> Tuple[bool, str]:
        payload = {
            "resume_id": resume_id,
            "job_description_id": job_description_id,
            "match_percentage": match_data.get("match_percentage", 0),
            "hire_probability": match_data.get("hire_probability", "Medium"),
            "matched_skills": match_data.get("matched_skills", []),
            "missing_skills": match_data.get("missing_skills", []),
            "focus_areas": match_data.get("focus_areas", []),
            "interview_topics": match_data.get("interview_topics", []),
            "strengths": match_data.get("strengths", []),
            "weaknesses": match_data.get("weaknesses", []),
        }
        ok, _, err = self._insert("jd_matches", payload)
        return ok, err

    def save_roadmap(
        self,
        roadmap_id: str,
        resume_id: str,
        job_description_id: str,
        roadmap_data: Dict[str, Any],
    ) -> Tuple[bool, str]:
        roadmap_payload = {
            "id": roadmap_id,
            "resume_id": resume_id,
            "job_description_id": job_description_id,
            "duration_weeks": roadmap_data.get("duration_weeks", 12),
            "daily_hours": roadmap_data.get("daily_hours", 2),
            "milestones": roadmap_data.get("milestones", []),
            "completion_criteria": roadmap_data.get(
                "completion_criteria", "Complete all tasks"
            ),
        }

        ok, _, err = self._insert("roadmaps", roadmap_payload)
        if not ok:
            return False, err

        task_rows = [
            {
                "roadmap_id": roadmap_id,
                "week": task.get("week", 1),
                "task": task.get("task", ""),
                "skill": task.get("skill", "General"),
                "difficulty": task.get("difficulty", "Medium"),
                "estimated_hours": task.get("estimated_hours", 2),
                "resources": task.get("resources", []),
                "priority": task.get("priority", "HIGH"),
                "milestone": task.get("milestone", False),
            }
            for task in roadmap_data.get("tasks", [])
        ]

        return self._insert_many("roadmap_tasks", task_rows)

    def save_interview_session(
        self,
        session_id: str,
        resume_id: Optional[str],
        job_description_id: Optional[str],
        mode: str,
        quiz_context: Dict[str, Any],
        roadmap_context: List[Dict[str, Any]],
        questions: List[Dict[str, Any]],
    ) -> Tuple[bool, str]:
        payload = {
            "id": session_id,
            "resume_id": resume_id,
            "job_description_id": job_description_id,
            "mode": mode,
            "score": 0,
            "quiz_context": quiz_context,
            "roadmap_context": roadmap_context,
        }

        ok, _, err = self._insert("interview_sessions", payload)
        if not ok:
            return False, err

        question_rows = [
            {
                "interview_session_id": session_id,
                "question_order": i + 1,
                "type": q.get("type", "Technical"),
                "difficulty": q.get("difficulty", "Medium"),
                "question": q.get("question", ""),
                "expected_keywords": q.get("expected_keywords", []),
                "evaluation_criteria": q.get("evaluation_criteria", []),
            }
            for i, q in enumerate(questions)
        ]

        return self._insert_many("interview_questions", question_rows)


supabase_service = SupabaseService()


def __getattr__(name: str) -> Any:
    """Proxy module attribute access to the singleton for backward compatibility."""
    if hasattr(supabase_service, name):
        return getattr(supabase_service, name)
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")