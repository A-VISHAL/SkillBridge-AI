from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import List, Optional
import json
import os
import uuid
from datetime import datetime

from app.core.config import settings
from app.models.schemas import *
from app.services import parser, ai_service, job_service
from app.services.supabase_service import supabase_service

router = APIRouter()

# In-memory storage for demo
resume_store = {}
progress_store = {}
interview_sessions = {}

# ============ Health & Status ============

@router.get("/api/test-ai")
async def test_ai_connection():
    """Test AI API connection"""
    from app.core.config import settings
    import httpx
    
    if not settings.OXLO_API_KEY:
        return {"error": "No API key configured"}
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                settings.OXLO_CHAT_ENDPOINT,
                headers={
                    "Authorization": f"Bearer {settings.OXLO_API_KEY}",
                    "x-api-key": settings.OXLO_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "claude-3-5-sonnet-20241022",
                    "messages": [{"role": "user", "content": "Say 'API is working!'"}],
                    "max_tokens": 50
                }
            )
            
            return {
                "status": response.status_code,
                "response": response.json() if response.status_code == 200 else response.text
            }
    except Exception as e:
        return {"error": str(e)}

@router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@router.get("/")
async def root():
    return {
        "name": "SkillBridge AI API",
        "version": "1.0.0",
        "description": "Agentic Career Operating System",
        "docs": "/docs"
    }

# ============ Resume Operations ============

@router.post("/api/resume/upload")
async def upload_resume(file: UploadFile = File(...)):
    """Upload and parse resume"""
    try:
        if not file or not file.filename:
            raise HTTPException(400, "No file was uploaded")

        # Validate file type
        _, ext = os.path.splitext(file.filename.lower())
        if ext not in ('.pdf', '.docx', '.txt'):
            raise HTTPException(400, "Only PDF, DOCX, and TXT files are supported")
        
        # Save file
        file_id = str(uuid.uuid4())
        file_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}_{file.filename}")
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Parse resume
        parsed_resume = parser.parse_resume(file_path)
        
        # Store in memory
        resume_store[file_id] = parsed_resume

        # Persist to Supabase (best-effort, non-blocking for user flow)
        if supabase_service.enabled:
            ok, err = supabase_service.save_resume(
                resume_id=file_id,
                filename=file.filename,
                file_type=file.content_type or "application/octet-stream",
                raw_text=parsed_resume.raw_text,
                parsed_data=parsed_resume.dict(),
                user_id=None,
            )
            if not ok:
                print(f"Warning: failed to persist resume in Supabase: {err}")
        
        # Clean up file
        os.remove(file_path)
        
        return {
            "resume_id": file_id,
            "resume": parsed_resume.dict(),
            "message": "Resume uploaded and parsed successfully"
        }

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Error processing resume: {str(e)}")

@router.get("/api/resume/sample")
async def get_sample_resume():
    """Get sample resume for demo"""
    sample = parser.get_sample_resume()
    resume_id = "sample_demo"
    resume_store[resume_id] = sample
    
    return {
        "resume_id": resume_id,
        "resume": sample.dict()
    }


@router.post("/api/resume/analyze")
async def analyze_resume(
    resume_id: str = Form(...),
    target_role: str = Form("Software Engineer"),
    job_description: str = Form("")
):
    """Analyze resume for comprehensive ATS score and insights"""
    try:
        if resume_id not in resume_store:
            raise HTTPException(404, "Resume not found")
        
        resume = resume_store[resume_id]
        
        # Get comprehensive ATS analysis
        ats_result = await ai_service.calculate_ats_score(
            resume.raw_text,
            target_role,
            job_description,
            resume.dict(),
        )
        
        # Convert to structured format
        problems = [
            ResumeProblem(
                category="content",
                severity="high" if "critical" in weakness.lower() else "medium",
                issue=weakness,
                suggestion=ats_result.get("suggestions", {}).get("improve_keywords", ["Review and improve"])[0] if ats_result.get("suggestions", {}).get("improve_keywords") else "Review and improve"
            )
            for weakness in ats_result.get("analysis", {}).get("weaknesses", [])
        ]
        
        # Add missing keywords as problems
        for keyword in ats_result.get("missing_keywords", [])[:5]:
            problems.append(ResumeProblem(
                category="keywords",
                severity="medium",
                issue=f"Missing keyword: {keyword}",
                suggestion=f"Consider adding '{keyword}' if relevant to your experience"
            ))
        
        score_breakdown = ats_result.get("score_breakdown", {})
        
        ats_analysis = ATSAnalysis(
            score=ats_result.get("ats_score", 0),
            keyword_match=score_breakdown.get("keyword_match", 0) / 100,
            formatting_score=score_breakdown.get("resume_structure", 0),
            readability_score=score_breakdown.get("ats_compatibility", 0),
            problems=problems,
            missing_keywords=ats_result.get("missing_keywords", []),
            strong_points=ats_result.get("analysis", {}).get("strengths", [])
        )
        
        # Get bullet improvements
        improvements_data = await ai_service.improve_resume_bullets(
            [exp.dict() for exp in resume.experiences],
            job_description or target_role
        )
        
        bullet_improvements = [
            BulletImprovement(**imp) for imp in improvements_data[:5]
        ]
        
        result = ResumeAnalysisResult(
            ats_analysis=ats_analysis,
            problems=problems,
            bullet_improvements=bullet_improvements,
            recruiter_view=ats_result.get("final_verdict", "Resume analysis complete"),
            overall_rating="Excellent" if ats_result.get("ats_score", 0) >= 80 else "Good" if ats_result.get("ats_score", 0) >= 60 else "Needs Improvement"
        )
        
        # Add the detailed ATS result to response
        response = result.dict()
        response["detailed_ats_analysis"] = ats_result
        
        return response
        
    except Exception as e:
        raise HTTPException(500, f"Error analyzing resume: {str(e)}")

# ============ JD Matching ============

@router.post("/api/jd/match")
async def match_jd(
    resume_id: str = Form(...),
    job_description: str = Form(...)
):
    """Match resume to job description with focus areas"""
    try:
        if resume_id not in resume_store:
            raise HTTPException(404, "Resume not found")
        
        resume = resume_store[resume_id]
        
        # Match with AI
        match_data = await ai_service.match_resume_to_jd(resume.raw_text, job_description)
        
        # Convert to structured format
        focus_areas = [
            FocusArea(**area) for area in match_data.get("focus_areas", [])
        ]
        
        result = JDMatchResult(
            match_percentage=match_data.get("match_percentage", 68),
            hire_probability=match_data.get("hire_probability", "Medium"),
            matched_skills=match_data.get("matched_skills", []),
            missing_skills=match_data.get("missing_skills", []),
            focus_areas=focus_areas,
            interview_topics=match_data.get("interview_topics", []),
            strengths=match_data.get("strengths", []),
            weaknesses=match_data.get("weaknesses", [])
        )

        # Persist JD + match details to Supabase (best-effort)
        if supabase_service.enabled:
            job_description_id = str(uuid.uuid4())
            jd_ok, jd_err = supabase_service.save_job_description(
                job_description_id=job_description_id,
                raw_text=job_description,
            )
            if not jd_ok:
                print(f"Warning: failed to persist job description: {jd_err}")
            else:
                match_ok, match_err = supabase_service.save_jd_match(
                    resume_id=resume_id,
                    job_description_id=job_description_id,
                    match_data=match_data,
                )
                if not match_ok:
                    print(f"Warning: failed to persist jd match: {match_err}")
        
        return result.dict()
        
    except Exception as e:
        raise HTTPException(500, f"Error matching JD: {str(e)}")


# ============ Skill Gap & Roadmap ============

@router.post("/api/skill-gap")
async def analyze_skill_gap(
    resume_id: str = Form(...),
    job_description: str = Form(...)
):
    """Analyze skill gaps"""
    try:
        if resume_id not in resume_store:
            raise HTTPException(404, "Resume not found")
        
        resume = resume_store[resume_id]
        match_data = await ai_service.match_resume_to_jd(resume.raw_text, job_description)
        
        missing_skills = match_data.get("missing_skills", [])
        
        skill_gaps = [
            SkillGap(
                skill=skill,
                current_level="None",
                required_level="Intermediate",
                gap_severity="Important",
                learning_resources=[f"Learn {skill} tutorial", f"{skill} documentation"]
            )
            for skill in missing_skills
        ]
        
        return {"skill_gaps": [gap.dict() for gap in skill_gaps]}
        
    except Exception as e:
        raise HTTPException(500, f"Error analyzing skill gap: {str(e)}")

@router.post("/api/roadmap")
async def generate_roadmap(
    resume_id: str = Form(...),
    job_description: str = Form(...),
    daily_hours: int = Form(2)
):
    """Generate personalized learning roadmap"""
    try:
        if resume_id not in resume_store:
            raise HTTPException(404, "Resume not found. Please upload your resume first.")
        
        resume = resume_store[resume_id]
        
        # Get missing skills from JD match
        try:
            match_data = await ai_service.match_resume_to_jd(resume.raw_text, job_description)
            missing_skills = match_data.get("missing_skills", [])
        except Exception as match_error:
            # Fallback: use generic skill gaps if match fails
            missing_skills = ["System Design", "Advanced Architecture", "Leadership"]
            print(f"Warning: JD match failed, using default skills: {str(match_error)}")
        
        # Generate roadmap (with built-in fallback)
        roadmap_data = await ai_service.generate_roadmap(
            resume.raw_text,
            job_description,
            missing_skills
        )
        
        tasks = [RoadmapTask(**task) for task in roadmap_data.get("tasks", [])]
        
        roadmap = CareerRoadmap(
            duration_weeks=roadmap_data.get("duration_weeks", 12),
            daily_hours=daily_hours,
            tasks=tasks,
            milestones=roadmap_data.get("milestones", []),
            completion_criteria=roadmap_data.get("completion_criteria", "Complete all tasks")
        )

        # Persist roadmap + tasks to Supabase (best-effort)
        if supabase_service.enabled:
            job_description_id = str(uuid.uuid4())
            jd_ok, jd_err = supabase_service.save_job_description(
                job_description_id=job_description_id,
                raw_text=job_description,
            )
            if not jd_ok:
                print(f"Warning: failed to persist roadmap job description: {jd_err}")
            else:
                roadmap_id = str(uuid.uuid4())
                roadmap_ok, roadmap_err = supabase_service.save_roadmap(
                    roadmap_id=roadmap_id,
                    resume_id=resume_id,
                    job_description_id=job_description_id,
                    roadmap_data=roadmap.dict(),
                )
                if not roadmap_ok:
                    print(f"Warning: failed to persist roadmap: {roadmap_err}")
        
        return roadmap.dict()
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating roadmap: {str(e)}")
        raise HTTPException(500, "Error generating roadmap. Please try again.")

# ============ Quiz System ============

@router.post("/api/quiz/generate")
async def generate_quiz(
    topic: str = Form("Adaptive Quiz"),
    difficulty: str = Form("Easy"),
    count: int = Form(10),
    domain: str = Form("Coding DSA"),
    resume_id: Optional[str] = Form(None),
    job_description: str = Form(""),
):
    """Generate adaptive quiz questions with study material from resume/JD/roadmap context."""
    try:
        normalized_count = max(10, count)

        resume_text = ""
        if resume_id and resume_id in resume_store:
            resume_text = resume_store[resume_id].raw_text

        roadmap_context = []
        try:
            if resume_text and job_description:
                match_data = await ai_service.match_resume_to_jd(resume_text, job_description)
                roadmap_data = await ai_service.generate_roadmap(
                    resume_text,
                    job_description,
                    match_data.get("missing_skills", []),
                )
                roadmap_context = roadmap_data.get("tasks", [])
        except Exception:
            roadmap_context = []

        questions_data = await ai_service.generate_quiz_questions(
            topic=topic,
            difficulty=difficulty,
            count=normalized_count,
            domain=domain,
            resume_text=resume_text,
            jd_text=job_description,
            roadmap_context=roadmap_context,
        )
        
        questions = [QuizQuestion(**q) for q in questions_data]

        study_materials = []
        if roadmap_context:
            by_week = {}
            for task in roadmap_context:
                week = int(task.get("week", 0) or 0)
                if week <= 0:
                    continue
                if week not in by_week:
                    by_week[week] = []
                by_week[week].append(task)

            for week in sorted(by_week.keys())[:12]:
                task = by_week[week][0]
                study_materials.append({
                    "week": week,
                    "title": task.get("skill", f"Week {week} Focus"),
                    "what_to_study": task.get("task", "Review roadmap task"),
                    "resources": task.get("resources", [])[:3],
                })

        rules = [
            "Read every question carefully before selecting an answer.",
            "No tab switching or external assistance during the quiz.",
            "Each section contains 10 questions.",
            "Passing criteria is 80% or higher.",
            "Review explanations after submission to improve weak areas.",
        ]
        
        return {
            "domain": domain,
            "difficulty": difficulty,
            "passing_percentage": 80,
            "rules": rules,
            "study_materials": study_materials,
            "questions": [q.dict() for q in questions[:normalized_count]],
        }
        
    except Exception as e:
        raise HTTPException(500, f"Error generating quiz: {str(e)}")

@router.post("/api/quiz/evaluate")
async def evaluate_quiz(answers: List[QuizAnswer]):
    """Evaluate quiz answers and detect weak areas"""
    try:
        results = []
        weak_topics = []
        
        for answer in answers:
            # In real implementation, fetch question from storage
            result_data = await ai_service.evaluate_quiz_answer(
                "Sample question",
                "Correct answer",
                answer.user_answer
            )
            
            result = QuizResult(
                question_id=answer.question_id,
                is_correct=result_data.get("is_correct", False),
                score=result_data.get("score", 0),
                explanation=result_data.get("explanation", ""),
                weak_area=result_data.get("weak_area")
            )
            
            results.append(result)
            
            if result.weak_area:
                weak_topics.append(result.weak_area)
        
        correct = sum(1 for r in results if r.is_correct)
        
        performance = QuizPerformance(
            total_questions=len(answers),
            correct_answers=correct,
            score_percentage=(correct / len(answers)) * 100 if answers else 0,
            weak_topics=list(set(weak_topics)),
            strong_topics=[],
            topic_scores={},
            recommendation="Focus on weak areas identified"
        )
        
        return {
            "results": [r.dict() for r in results],
            "performance": performance.dict()
        }
        
    except Exception as e:
        raise HTTPException(500, f"Error evaluating quiz: {str(e)}")


# ============ Interview System ============

@router.post("/api/interview/start")
async def start_interview(
    job_description: str = Form(""),
    mode: str = Form("Technical"),
    count: int = Form(5),
    resume_id: Optional[str] = Form(None),
    quiz_context: str = Form(""),
):
    """Start mock interview session"""
    try:
        resume_text = ""
        if resume_id and resume_id in resume_store:
            resume_text = resume_store[resume_id].raw_text

        parsed_quiz_context = {}
        if quiz_context:
            try:
                parsed_quiz_context = json.loads(quiz_context)
            except Exception:
                parsed_quiz_context = {}

        roadmap_context = []
        try:
            if resume_text and job_description:
                match_data = await ai_service.match_resume_to_jd(resume_text, job_description)
                roadmap_data = await ai_service.generate_roadmap(
                    resume_text,
                    job_description,
                    match_data.get("missing_skills", []),
                )
                roadmap_context = roadmap_data.get("tasks", [])
        except Exception:
            roadmap_context = []

        questions_data = await ai_service.generate_interview_questions(
            job_description,
            mode,
            count,
            resume_text=resume_text,
            quiz_context=parsed_quiz_context,
            roadmap_context=roadmap_context,
        )
        
        questions = [InterviewQuestion(**q) for q in questions_data]
        
        session_id = str(uuid.uuid4())
        session = InterviewSession(
            session_id=session_id,
            mode=mode,
            questions=questions
        )
        
        interview_sessions[session_id] = session

        # Persist interview session + generated questions to Supabase (best-effort)
        if supabase_service.enabled:
            job_description_id = None
            if job_description:
                generated_id = str(uuid.uuid4())
                jd_ok, jd_err = supabase_service.save_job_description(
                    job_description_id=generated_id,
                    raw_text=job_description,
                )
                if jd_ok:
                    job_description_id = generated_id
                else:
                    print(f"Warning: failed to persist interview job description: {jd_err}")

            interview_ok, interview_err = supabase_service.save_interview_session(
                session_id=session_id,
                resume_id=resume_id,
                job_description_id=job_description_id,
                mode=mode,
                quiz_context=parsed_quiz_context,
                roadmap_context=roadmap_context,
                questions=[question.dict() for question in questions],
            )
            if not interview_ok:
                print(f"Warning: failed to persist interview session: {interview_err}")
        
        return session.dict()
        
    except Exception as e:
        raise HTTPException(500, f"Error starting interview: {str(e)}")

@router.post("/api/interview/evaluate")
async def evaluate_interview_answer(
    session_id: str = Form(...),
    question_id: str = Form(...),
    answer: str = Form(...),
    time_taken: int = Form(...)
):
    """Evaluate interview answer"""
    try:
        if session_id not in interview_sessions:
            raise HTTPException(404, "Interview session not found")
        
        session = interview_sessions[session_id]
        
        # Find question
        question = next((q for q in session.questions if q.id == question_id), None)
        if not question:
            raise HTTPException(404, "Question not found")
        
        # Evaluate with AI
        feedback_data = await ai_service.evaluate_interview_answer(
            question.question,
            answer,
            question.expected_keywords
        )
        
        feedback = InterviewFeedback(
            question_id=question_id,
            score=feedback_data.get("score", 7),
            strengths=feedback_data.get("strengths", []),
            weaknesses=feedback_data.get("weaknesses", []),
            model_answer=feedback_data.get("model_answer", ""),
            confidence_level=feedback_data.get("confidence_level", "Medium"),
            improvement_tips=feedback_data.get("improvement_tips", [])
        )
        
        # Store answer and feedback
        session.answers.append(InterviewAnswer(
            question_id=question_id,
            answer=answer,
            time_taken_seconds=time_taken
        ))
        session.feedbacks.append(feedback)
        
        # Calculate overall score
        if len(session.feedbacks) == len(session.questions):
            avg_score = sum(f.score for f in session.feedbacks) / len(session.feedbacks)
            session.overall_score = avg_score
            session.readiness = "Ready" if avg_score >= 7 else "Needs Practice"
        
        return feedback.dict()
        
    except Exception as e:
        raise HTTPException(500, f"Error evaluating answer: {str(e)}")

@router.get("/api/interview/session/{session_id}")
async def get_interview_session(session_id: str):
    """Get interview session details"""
    if session_id not in interview_sessions:
        raise HTTPException(404, "Interview session not found")
    
    return interview_sessions[session_id].dict()


# ============ Progress Tracking ============

@router.post("/api/progress/track")
async def track_progress(
    resume_id: str = Form(...),
    quiz_score: Optional[float] = Form(None),
    interview_score: Optional[float] = Form(None),
    completed_task: Optional[str] = Form(None)
):
    """Track learning progress"""
    try:
        if resume_id not in progress_store:
            progress_store[resume_id] = ProgressMetrics()
        
        progress = progress_store[resume_id]
        
        if quiz_score is not None:
            progress.quiz_scores.append(quiz_score)
        
        if interview_score is not None:
            progress.interview_scores.append(interview_score)
        
        if completed_task:
            progress.completed_tasks += 1
        
        progress.last_updated = datetime.now()
        
        # AI decision on next steps
        avg_quiz = sum(progress.quiz_scores) / len(progress.quiz_scores) if progress.quiz_scores else 0
        avg_interview = sum(progress.interview_scores) / len(progress.interview_scores) if progress.interview_scores else 0
        
        if avg_quiz >= 80 and avg_interview >= 7:
            decision = AIDecision(
                decision="ready_for_interviews",
                reason="Strong performance in quizzes and mock interviews",
                next_action="Start applying to jobs",
                confidence=0.9
            )
        elif avg_quiz < 60:
            decision = AIDecision(
                decision="revise",
                topic="Core concepts",
                reason="Quiz scores indicate knowledge gaps",
                next_action="Review weak topics and retake quizzes",
                confidence=0.85
            )
        else:
            decision = AIDecision(
                decision="move_ahead",
                reason="Good progress, continue learning",
                next_action="Complete next roadmap tasks",
                confidence=0.75
            )
        
        return {
            "progress": progress.dict(),
            "ai_decision": decision.dict()
        }
        
    except Exception as e:
        raise HTTPException(500, f"Error tracking progress: {str(e)}")

@router.get("/api/progress/{resume_id}")
async def get_progress(resume_id: str):
    """Get progress metrics"""
    if resume_id not in progress_store:
        raise HTTPException(404, "Progress not found")
    
    return progress_store[resume_id].dict()

# ============ Job Search ============

@router.post("/api/jobs/search")
async def search_jobs(
    resume_id: str = Form(...),
    role: str = Form(...),
    location: str = Form("India"),
    remote: bool = Form(False)
):
    """Search for matching jobs"""
    try:
        if resume_id not in resume_store:
            raise HTTPException(404, "Resume not found")
        
        resume = resume_store[resume_id]
        
        preferences = {
            "role": role,
            "location": location,
            "remote": remote
        }
        
        jobs = await job_service.find_matching_jobs(resume, preferences)
        
        return {"jobs": [job.dict() for job in jobs]}
        
    except Exception as e:
        raise HTTPException(500, f"Error searching jobs: {str(e)}")

# ============ Daily Coaching ============

@router.get("/api/coach/daily")
async def get_daily_coaching(resume_id: str):
    """Get daily coaching message"""
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        
        coaching = DailyCoaching(
            date=today,
            reminder="Complete today's roadmap task",
            motivation="You're making great progress! Keep going!",
            suggestion="Practice coding for 30 minutes today",
            focus_topic="Docker containerization"
        )
        
        return coaching.dict()
        
    except Exception as e:
        raise HTTPException(500, f"Error getting coaching: {str(e)}")

# ============ Portfolio Projects ============

@router.post("/api/portfolio/suggest")
async def suggest_portfolio_projects(
    resume_id: str = Form(...),
    target_role: str = Form(...)
):
    """Suggest portfolio projects"""
    try:
        # Sample suggestions based on role
        if "frontend" in target_role.lower():
            projects = [
                ProjectSuggestion(
                    name="Real-time Chat Application",
                    description="Build a chat app with WebSocket, user authentication, and message history",
                    difficulty="Medium",
                    technologies=["React", "Node.js", "Socket.io", "MongoDB"],
                    estimated_days=14,
                    learning_outcomes=["Real-time communication", "WebSocket", "State management"],
                    resources=["Socket.io docs", "React tutorial"]
                ),
                ProjectSuggestion(
                    name="Netflix Clone",
                    description="Streaming platform UI with movie browsing and video playback",
                    difficulty="Hard",
                    technologies=["React", "TypeScript", "Tailwind", "Firebase"],
                    estimated_days=21,
                    learning_outcomes=["Complex UI", "API integration", "Authentication"],
                    resources=["React docs", "Firebase tutorial"]
                )
            ]
        else:
            projects = [
                ProjectSuggestion(
                    name="REST API with Authentication",
                    description="Build a secure API with JWT authentication and CRUD operations",
                    difficulty="Medium",
                    technologies=["Python", "FastAPI", "PostgreSQL", "JWT"],
                    estimated_days=10,
                    learning_outcomes=["API design", "Security", "Database"],
                    resources=["FastAPI docs", "JWT tutorial"]
                )
            ]
        
        return {"projects": [p.dict() for p in projects]}
        
    except Exception as e:
        raise HTTPException(500, f"Error suggesting projects: {str(e)}")
