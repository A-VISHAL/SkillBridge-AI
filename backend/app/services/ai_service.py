import httpx
import json
from typing import List, Dict, Any, Optional
from app.core.config import settings

async def call_oxlo_chat(
    messages: List[Dict[str, str]],
    temperature: float = 0.7,
    max_tokens: int = 2000
) -> str:
    """Call Oxlo Chat API"""
    
    if not settings.OXLO_API_KEY:
        raise ValueError("OXLO_API_KEY is not configured")
    
    endpoint = settings.OXLO_CHAT_ENDPOINT.lower()
    api_key = settings.OXLO_API_KEY.strip()
    if api_key.lower().startswith("bearer "):
        api_key = api_key[7:].strip()

    # Auto-correct common misconfiguration: Oxlo key with Anthropic endpoint.
    # Anthropic keys usually start with "sk-ant-"; if not, fallback to Oxlo chat endpoint.
    actual_endpoint = settings.OXLO_CHAT_ENDPOINT
    if "anthropic.com" in endpoint and not api_key.startswith("sk-ant-"):
        actual_endpoint = "https://api.oxlo.ai/v1/chat"
        endpoint = actual_endpoint.lower()

    def _extract_text(data: Dict[str, Any]) -> Optional[str]:
        # Anthropic style: {"content": [{"type": "text", "text": "..."}]}
        if "content" in data and isinstance(data["content"], list):
            for block in data["content"]:
                if isinstance(block, dict) and block.get("type") == "text":
                    text = block.get("text", "").strip()
                    if text:
                        return text

        # OpenAI/Oxlo style: {"choices": [{"message": {"content": "..."}}]}
        choices = data.get("choices")
        if isinstance(choices, list) and choices:
            message = choices[0].get("message", {}) if isinstance(choices[0], dict) else {}
            content = message.get("content", "") if isinstance(message, dict) else ""
            if isinstance(content, str) and content.strip():
                return content.strip()

        # Some providers return direct "text"
        if isinstance(data.get("text"), str) and data.get("text").strip():
            return data.get("text").strip()

        return None

    # Build both payload styles and try endpoint-compatible flow first, then fallback.
    anthropic_system = "\n".join([m.get("content", "") for m in messages if m.get("role") == "system"]).strip()
    anthropic_messages = [m for m in messages if m.get("role") in ("user", "assistant")]
    if not anthropic_messages:
        anthropic_messages = [{"role": "user", "content": "Hello"}]

    anthropic_headers = {
        "Authorization": f"Bearer {api_key}",
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }
    anthropic_payload: Dict[str, Any] = {
        "model": "claude-3-5-sonnet-20241022",
        "messages": anthropic_messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if anthropic_system:
        anthropic_payload["system"] = anthropic_system

    openai_headers = {
        "Authorization": f"Bearer {api_key}",
        "x-api-key": api_key,
        "Content-Type": "application/json",
    }
    openai_payload = {
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    attempts = []
    if "anthropic" in endpoint:
        attempts = [(anthropic_headers, anthropic_payload), (openai_headers, openai_payload)]
    else:
        attempts = [(openai_headers, openai_payload), (anthropic_headers, anthropic_payload)]

    last_error = ""
    async with httpx.AsyncClient(timeout=30.0) as client:
        for headers, payload in attempts:
            try:
                response = await client.post(actual_endpoint, headers=headers, json=payload)
                if response.status_code != 200:
                    last_error = f"status={response.status_code}, body={response.text[:220]}"
                    continue

                data = response.json()
                text = _extract_text(data)
                if text:
                    return text

                last_error = f"No textual content in response payload keys={list(data.keys())}"
            except Exception as e:
                last_error = str(e)

    raise ValueError(f"AI API request failed: {last_error}")

def _get_fallback_response(messages: List[Dict[str, str]]) -> str:
    """Fallback response when API is not available"""
    last_message = messages[-1]["content"] if messages else ""
    
    if "resume" in last_message.lower() and "analyze" in last_message.lower():
        return json.dumps({
            "ats_score": 72,
            "problems": [
                "Missing quantifiable metrics in experience bullets",
                "Weak action verbs used",
                "No keywords matching job description"
            ],
            "suggestions": [
                "Add specific numbers and percentages to achievements",
                "Use strong action verbs like 'Architected', 'Optimized', 'Led'",
                "Include relevant technical keywords"
            ]
        })
    
    return "I'm currently in demo mode. Please configure OXLO_API_KEY for full functionality."

async def analyze_resume_with_ai(resume_text: str) -> Dict[str, Any]:
    """Analyze resume and return ATS score + problems"""
    
    prompt = f"""Analyze this resume and provide:
1. ATS score (0-100)
2. List of problems (formatting, content, keywords, grammar)
3. Missing keywords
4. Strong points
5. Suggestions for improvement

Resume:
{resume_text}

Return response in JSON format with keys: ats_score, problems, missing_keywords, strong_points, suggestions"""
    
    messages = [
        {"role": "system", "content": "You are an expert resume analyzer and ATS specialist."},
        {"role": "user", "content": prompt}
    ]
    
    response = await call_oxlo_chat(messages, temperature=0.3)
    
    try:
        return json.loads(response)
    except:
        return {
            "ats_score": 70,
            "problems": ["Generic content", "Missing metrics"],
            "missing_keywords": ["Docker", "CI/CD"],
            "strong_points": ["Good experience", "Relevant projects"],
            "suggestions": ["Add quantifiable achievements"]
        }


async def improve_resume_bullets(experiences: List[Dict], job_context: str = "") -> List[Dict]:
    """Improve resume bullet points with AI"""
    
    bullets = []
    for exp in experiences:
        for desc in exp.get("description", []):
            bullets.append(desc)
    
    prompt = f"""Improve these resume bullet points to be more impactful:

Bullets:
{chr(10).join(f"- {b}" for b in bullets)}

Job Context: {job_context}

For each bullet, provide:
1. Improved version with metrics and strong action verbs
2. Reason for improvement
3. Impact score (1-10)

Return as JSON array with keys: original, improved, reason, impact_score"""
    
    messages = [
        {"role": "system", "content": "You are an expert resume writer who creates compelling, metric-driven bullet points."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        response = await call_oxlo_chat(messages, temperature=0.5)
    except Exception:
        return [
            {
                "original": bullets[0] if bullets else "Worked on projects",
                "improved": "Built and shipped production features with measurable impact on users and performance.",
                "reason": "Fallback suggestion generated because AI service authentication failed.",
                "impact_score": 7,
            }
        ]
    
    try:
        return json.loads(response)
    except:
        return [
            {
                "original": bullets[0] if bullets else "Worked on projects",
                "improved": "Architected and deployed 5+ microservices handling 100K+ daily requests, reducing latency by 40%",
                "reason": "Added specific metrics and impact",
                "impact_score": 9
            }
        ]

async def match_resume_to_jd(resume_text: str, jd_text: str) -> Dict[str, Any]:
    """Match resume to job description with focus areas"""
    
    prompt = f"""Analyze this resume against the job description and provide:

1. Match percentage (0-100)
2. Hire probability (High/Medium/Low)
3. Matched skills
4. Missing skills
5. Top 5 focus areas with:
   - Skill name
   - Priority (HIGH/MEDIUM/LOW)
   - Weight (% of JD importance)
   - Reason
   - Estimated study time
6. Interview topics
7. Strengths
8. Weaknesses

Resume:
{resume_text[:1000]}

Job Description:
{jd_text[:1000]}

Return as JSON with keys: match_percentage, hire_probability, matched_skills, missing_skills, focus_areas, interview_topics, strengths, weaknesses"""
    
    messages = [
        {"role": "system", "content": "You are an expert technical recruiter and career coach."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        response = await call_oxlo_chat(messages, temperature=0.3, max_tokens=3000)
    except Exception:
        # Graceful fallback so UI can continue even when external AI auth fails.
        return {
            "match_percentage": 62,
            "hire_probability": "Medium",
            "matched_skills": ["Communication", "Problem Solving"],
            "missing_skills": ["Role-specific keywords from JD"],
            "focus_areas": [
                {
                    "skill": "JD keyword alignment",
                    "priority": "HIGH",
                    "weight": 35,
                    "reason": "AI service unavailable, unable to score exact technical overlap.",
                    "study_time": "2-3 days",
                }
            ],
            "interview_topics": ["Core fundamentals", "Project deep-dive"],
            "strengths": ["Resume data parsed successfully"],
            "weaknesses": ["Live AI matching unavailable due to API authentication"],
        }
    
    try:
        cleaned = response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        return json.loads(cleaned)
    except Exception as e:
        raise ValueError(f"Failed to parse AI JD match response: {str(e)}")


async def generate_roadmap(resume_text: str, jd_text: str, skill_gaps: List[str]) -> Dict[str, Any]:
    """Generate personalized learning roadmap based on resume and JD gaps."""

    def _unique_items(items: List[str]) -> List[str]:
        unique: List[str] = []
        for item in items:
            cleaned = item.strip()
            if cleaned and cleaned not in unique:
                unique.append(cleaned)
        return unique

    def _detect_skills() -> List[str]:
        jd_lower = jd_text.lower()
        resume_lower = resume_text.lower()
        skill_keywords = {
            "React": ["react", "frontend", "component", "jsx"],
            "System Design": ["system design", "scalability", "architecture", "design"],
            "Python": ["python", "backend", "django", "flask"],
            "AWS": ["aws", "cloud", "ec2", "lambda"],
            "Docker": ["docker", "container", "kubernetes"],
            "SQL": ["sql", "database", "postgres", "mysql"],
            "APIs": ["api", "rest", "graphql", "endpoint"],
            "DevOps": ["devops", "ci/cd", "deployment", "terraform"],
            "Testing": ["test", "testing", "jest", "pytest", "automation"],
            "Leadership": ["leadership", "mentor", "mentorship", "owner", "lead"],
        }

        detected: List[str] = []
        for skill, keywords in skill_keywords.items():
            in_jd = any(keyword in jd_lower for keyword in keywords)
            in_resume = any(keyword in resume_lower for keyword in keywords)
            if in_jd and not in_resume:
                detected.append(skill)

        prioritized = _unique_items(detected + skill_gaps)
        if not prioritized:
            prioritized = ["System Design", "APIs", "Production Deployment"]
        return prioritized[:6]

    def _build_week_task(week: int, primary: str, secondary: str, tertiary: str) -> Dict[str, Any]:
        if week == 1:
            return {
                "week": 1,
                "task": f"Audit the JD, map your current experience to the role requirements, and build a week-by-week React foundation plan. Finish with a small UI exercise that mirrors one JD keyword or component pattern.",
                "skill": primary,
                "difficulty": "Easy",
                "estimated_hours": 12,
                "resources": [f"{primary} official documentation", "Role-based UI examples", "Short guided project"],
                "priority": "CRITICAL",
                "milestone": False,
            }
        if week == 2:
            return {
                "week": 2,
                "task": f"Build reusable components and state flows around {primary}, then refactor one resume project bullet to describe the implementation clearly for the target job.",
                "skill": primary,
                "difficulty": "Medium",
                "estimated_hours": 14,
                "resources": [f"{primary} component patterns", "State management examples", "Resume bullet rewrite practice"],
                "priority": "CRITICAL",
                "milestone": False,
            }
        if week == 3:
            return {
                "week": 3,
                "task": f"Ship a portfolio mini-project that combines {primary} with the JD's most important workflow. Document tradeoffs, architecture choices, and how this work matches the target role.",
                "skill": primary,
                "difficulty": "Medium",
                "estimated_hours": 16,
                "resources": [f"{primary} project tutorial", "Portfolio writeup template", "Architecture notes"],
                "priority": "CRITICAL",
                "milestone": True,
            }
        if week == 4:
            return {
                "week": 4,
                "task": f"Learn {secondary} fundamentals and connect them to your first project. Focus on the exact JD keywords that are missing from the resume, then implement one integration example.",
                "skill": secondary,
                "difficulty": "Easy",
                "estimated_hours": 12,
                "resources": [f"{secondary} beginner guide", "Integration patterns", "Real code example"],
                "priority": "HIGH",
                "milestone": False,
            }
        if week == 5:
            return {
                "week": 5,
                "task": f"Combine {primary} and {secondary} in a feature that would make sense in the target company's product. Add tests or validation and note it in your resume bullets.",
                "skill": secondary,
                "difficulty": "Medium",
                "estimated_hours": 14,
                "resources": [f"{secondary} integration examples", "Testing checklist", "Feature planning notes"],
                "priority": "HIGH",
                "milestone": False,
            }
        if week == 6:
            return {
                "week": 6,
                "task": f"Complete a job-ready project that proves you can use {secondary} with production-quality habits. Prepare a short demo script and a resume bullet for it.",
                "skill": secondary,
                "difficulty": "Medium",
                "estimated_hours": 16,
                "resources": [f"{secondary} advanced tutorial", "Demo script template", "Resume impact metrics guide"],
                "priority": "HIGH",
                "milestone": True,
            }
        if week == 7:
            return {
                "week": 7,
                "task": f"Study {tertiary} concepts in the context of the JD and explain how they improve scalability, reliability, or maintainability in your own words.",
                "skill": tertiary,
                "difficulty": "Medium",
                "estimated_hours": 12,
                "resources": [f"{tertiary} overview", "Architecture notes", "Interview explanation prompts"],
                "priority": "HIGH",
                "milestone": False,
            }
        if week == 8:
            return {
                "week": 8,
                "task": f"Apply {tertiary} in a realistic scenario from the JD. Build a solution summary, diagram the flow, and prepare to defend your choices in an interview.",
                "skill": tertiary,
                "difficulty": "Hard",
                "estimated_hours": 16,
                "resources": [f"{tertiary} deep dive", "System design practice", "Interview question bank"],
                "priority": "HIGH",
                "milestone": False,
            }
        if week == 9:
            return {
                "week": 9,
                "task": f"Build a full-stack project that combines {primary}, {secondary}, and {tertiary}. Focus on deployment, observability, and a clean README that matches the JD language.",
                "skill": tertiary,
                "difficulty": "Hard",
                "estimated_hours": 18,
                "resources": ["Full-stack project checklist", "Deployment guide", "README template"],
                "priority": "CRITICAL",
                "milestone": True,
            }
        if week == 10:
            return {
                "week": 10,
                "task": f"Prepare system design and behavioral stories based on your resume projects. Create two interview stories that directly reference measurable outcomes and the JD's priorities.",
                "skill": "Interview Prep",
                "difficulty": "Medium",
                "estimated_hours": 12,
                "resources": ["STAR story template", "System design drills", "Impact metrics worksheet"],
                "priority": "HIGH",
                "milestone": False,
            }
        if week == 11:
            return {
                "week": 11,
                "task": f"Run mock interviews and revise weak areas. Use the JD as a checklist and close any remaining resume gaps with focused practice, concise explanations, and crisp project summaries.",
                "skill": "Interview Prep",
                "difficulty": "Hard",
                "estimated_hours": 14,
                "resources": ["Mock interview platform", "Feedback tracker", "Answer improvement checklist"],
                "priority": "HIGH",
                "milestone": False,
            }
        return {
            "week": 12,
            "task": f"Deliver your final capstone: deploy the project, polish the portfolio, and rehearse a complete walkthrough that ties your resume, the JD, and the roadmap together.",
            "skill": "Capstone Project",
            "difficulty": "Hard",
            "estimated_hours": 20,
            "resources": ["Deployment checklist", "Portfolio review", "Mock interview recap"],
            "priority": "CRITICAL",
            "milestone": True,
        }

    def _normalize_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
        skills = _detect_skills()
        primary = skills[0]
        secondary = skills[1] if len(skills) > 1 else f"{primary} Integration"
        tertiary = skills[2] if len(skills) > 2 else "System Design"

        incoming_tasks = payload.get("tasks", []) if isinstance(payload, dict) else []
        tasks_by_week: Dict[int, Dict[str, Any]] = {}

        for item in incoming_tasks:
            try:
                week = int(item.get("week"))
            except Exception:
                continue
            if 1 <= week <= 12 and week not in tasks_by_week:
                tasks_by_week[week] = {
                    "week": week,
                    "task": str(item.get("task", "")).strip(),
                    "skill": str(item.get("skill", primary)).strip() or primary,
                    "difficulty": str(item.get("difficulty", "Medium")).strip() or "Medium",
                    "estimated_hours": int(item.get("estimated_hours", 12) or 12),
                    "resources": item.get("resources", []) if isinstance(item.get("resources", []), list) else [],
                    "priority": str(item.get("priority", "MEDIUM")).strip() or "MEDIUM",
                    "milestone": bool(item.get("milestone", False)),
                }

        normalized_tasks: List[Dict[str, Any]] = []
        for week in range(1, 13):
            if week in tasks_by_week and tasks_by_week[week].get("task"):
                normalized_tasks.append(tasks_by_week[week])
            else:
                fallback_task = _build_week_task(week, primary, secondary, tertiary)
                normalized_tasks.append(fallback_task)
                print(f"Using fallback task for week {week}")

        print(f"Generated {len(normalized_tasks)} tasks, weeks: {[t['week'] for t in normalized_tasks]}")

        # Ensure task text is unique even if the upstream response repeated content.
        seen_texts = set()
        for task in normalized_tasks:
            text = task["task"].strip()
            if text in seen_texts:
                task["task"] = f"Week {task['week']} focused implementation sprint: {text}"
            seen_texts.add(task["task"].strip())

        milestones = payload.get("milestones", []) if isinstance(payload, dict) else []
        if not isinstance(milestones, list):
            milestones = []
        if len(milestones) < 4:
            milestones = [
                f"Week 3: {primary} foundation complete",
                f"Week 6: {secondary} integration complete",
                f"Week 9: Portfolio project milestone",
                "Week 12: Interview-ready capstone complete",
            ]

        completion_criteria = payload.get("completion_criteria") if isinstance(payload, dict) else None
        if not isinstance(completion_criteria, str) or not completion_criteria.strip():
            completion_criteria = f"Complete all 12 weeks and build a portfolio project using {primary}, {secondary}, and {tertiary}."

        duration_weeks = payload.get("duration_weeks", 12) if isinstance(payload, dict) else 12
        try:
            duration_weeks = int(duration_weeks)
        except Exception:
            duration_weeks = 12
        duration_weeks = max(4, min(12, duration_weeks))

        daily_hours = payload.get("daily_hours", 2) if isinstance(payload, dict) else 2
        try:
            daily_hours = int(daily_hours)
        except Exception:
            daily_hours = 2

        return {
            "duration_weeks": duration_weeks,
            "daily_hours": daily_hours,
            "tasks": normalized_tasks,
            "milestones": milestones,
            "completion_criteria": completion_criteria,
        }

    prompt = f"""Create a highly personalized 12-week learning roadmap for this candidate.

Resume Skills & Experience:
{resume_text[:600]}

Target Job Description:
{jd_text[:600]}

Missing Skills to Master:
{', '.join(skill_gaps[:8])}

Return valid JSON with keys: duration_weeks, daily_hours, tasks (array), milestones (array), completion_criteria.
Each task must be unique, specific, and tied to the JD."""

    messages = [
        {"role": "system", "content": "You are an expert career development coach. Create specific, personalized learning roadmaps that directly map resume gaps to job requirements."},
        {"role": "user", "content": prompt},
    ]

    try:
        response = await call_oxlo_chat(messages, temperature=0.7, max_tokens=4000)
        parsed = json.loads(response)
        return _normalize_payload(parsed)
    except Exception as e:
        print(f"Error generating roadmap from AI: {str(e)}")
        fallback_payload = {
            "duration_weeks": 12,
            "daily_hours": 2,
            "tasks": [],
            "milestones": [],
            "completion_criteria": "",
        }
        return _normalize_payload(fallback_payload)

async def generate_quiz_questions(topic: str, difficulty: str, count: int = 5) -> List[Dict]:
    """Generate quiz questions for a topic"""
    
    prompt = f"""Generate {count} {difficulty} level quiz questions on {topic}.

For each question provide:
- Unique ID
- Question type (MCQ/Coding/Theory)
- Question text
- Options (for MCQ, 4 options)
- Correct answer
- Detailed explanation
- Code template (if coding question)

Return as JSON array."""
    
    messages = [
        {"role": "system", "content": "You are an expert technical interviewer creating assessment questions."},
        {"role": "user", "content": prompt}
    ]
    
    response = await call_oxlo_chat(messages, temperature=0.7, max_tokens=2500)
    
    try:
        return json.loads(response)
    except:
        return [
            {
                "id": "q1",
                "topic": topic,
                "difficulty": difficulty,
                "question_type": "MCQ",
                "question": f"What is {topic}?",
                "options": [
                    {"text": "Option A", "is_correct": True},
                    {"text": "Option B", "is_correct": False},
                    {"text": "Option C", "is_correct": False},
                    {"text": "Option D", "is_correct": False}
                ],
                "correct_answer": "Option A",
                "explanation": "Detailed explanation here."
            }
        ]


async def evaluate_quiz_answer(question: str, correct_answer: str, user_answer: str) -> Dict:
    """Evaluate quiz answer and provide feedback"""
    
    is_correct = user_answer.strip().lower() == correct_answer.strip().lower()
    
    prompt = f"""Evaluate this quiz answer:

Question: {question}
Correct Answer: {correct_answer}
User Answer: {user_answer}

Provide:
1. Whether answer is correct
2. Score (0-10)
3. Explanation
4. Weak area identified (if incorrect)

Return as JSON with keys: is_correct, score, explanation, weak_area"""
    
    messages = [
        {"role": "system", "content": "You are an expert educator providing constructive feedback."},
        {"role": "user", "content": prompt}
    ]
    
    response = await call_oxlo_chat(messages, temperature=0.3)
    
    try:
        return json.loads(response)
    except:
        return {
            "is_correct": is_correct,
            "score": 10 if is_correct else 0,
            "explanation": "Correct!" if is_correct else "Incorrect. Review the concept.",
            "weak_area": None if is_correct else "Concept understanding"
        }

async def generate_interview_questions(jd_text: str, mode: str, count: int = 5) -> List[Dict]:
    """Generate interview questions based on JD"""
    
    prompt = f"""Generate {count} {mode} interview questions for this job:

Job Description:
{jd_text[:800]}

For each question provide:
- Unique ID
- Type ({mode})
- Difficulty level
- Question text
- Expected keywords in answer
- Evaluation criteria

Return as JSON array."""
    
    messages = [
        {"role": "system", "content": f"You are an expert {mode} interviewer."},
        {"role": "user", "content": prompt}
    ]
    
    response = await call_oxlo_chat(messages, temperature=0.7, max_tokens=2500)
    
    try:
        return json.loads(response)
    except:
        return [
            {
                "id": "int1",
                "type": mode,
                "difficulty": "Medium",
                "question": "Tell me about yourself and your experience.",
                "expected_keywords": ["experience", "skills", "projects"],
                "evaluation_criteria": ["Clarity", "Relevance", "Confidence"]
            }
        ]

async def evaluate_interview_answer(question: str, answer: str, expected_keywords: List[str]) -> Dict:
    """Evaluate interview answer"""
    
    prompt = f"""Evaluate this interview answer:

Question: {question}
Answer: {answer}
Expected Keywords: {', '.join(expected_keywords)}

Provide:
1. Score (0-10)
2. Strengths (list)
3. Weaknesses (list)
4. Model answer
5. Confidence level (High/Medium/Low)
6. Improvement tips

Return as JSON with keys: score, strengths, weaknesses, model_answer, confidence_level, improvement_tips"""
    
    messages = [
        {"role": "system", "content": "You are an expert interview coach providing detailed feedback."},
        {"role": "user", "content": prompt}
    ]
    
    response = await call_oxlo_chat(messages, temperature=0.5, max_tokens=2000)
    
    try:
        return json.loads(response)
    except:
        return {
            "score": 7,
            "strengths": ["Good structure", "Relevant examples"],
            "weaknesses": ["Could add more details", "Missing key points"],
            "model_answer": "A strong answer would include...",
            "confidence_level": "Medium",
            "improvement_tips": ["Practice STAR method", "Add specific metrics"]
        }


async def calculate_ats_score(resume_text: str, target_role: str = "", job_description: str = "") -> Dict[str, Any]:
    """
    Calculate comprehensive ATS score based on multiple criteria.
    Returns detailed breakdown and actionable insights.
    """
    
    prompt = f"""You are an advanced ATS (Applicant Tracking System) Resume Evaluator.
Your task is to analyze a resume against a target job role and calculate a realistic ATS score based on multiple evaluation criteria.

📥 INPUT:
Resume Text: {resume_text}
Target Job Role: {target_role if target_role else "General Software Engineer"}
Job Description: {job_description if job_description else "Not provided - infer from target role"}

🎯 OBJECTIVE:
1. Analyze the resume content deeply
2. Compare it with the target role and job description
3. Calculate a realistic ATS score (0–100)
4. Provide detailed breakdown and actionable insights
5. Ensure ALL results are dynamic and based ONLY on input

📊 SCORING CRITERIA (STRICT):
Calculate ATS score based on:
1. Keyword Match (30%) - Match resume skills with job role/JD keywords
2. Skills Relevance (20%) - Are the skills relevant to the role?
3. Experience Alignment (15%) - Projects / internships aligned with role?
4. Education Fit (10%) - Relevant degree or coursework?
5. Resume Structure & Clarity (10%) - Sections, readability, formatting
6. Projects Quality (10%) - Real-world, tech stack usage, impact
7. ATS Compatibility (5%) - Proper formatting, no tables/images-heavy text

📊 OUTPUT FORMAT (STRICT JSON):
{{
    "ats_score": 0,
    "score_breakdown": {{
        "keyword_match": 0,
        "skills_relevance": 0,
        "experience_alignment": 0,
        "education_fit": 0,
        "resume_structure": 0,
        "projects_quality": 0,
        "ats_compatibility": 0
    }},
    "matched_keywords": [],
    "missing_keywords": [],
    "analysis": {{
        "strengths": [],
        "weaknesses": [],
        "red_flags": []
    }},
    "suggestions": {{
        "improve_keywords": [],
        "add_projects": [],
        "enhance_experience": [],
        "formatting_fixes": []
    }},
    "final_verdict": "",
    "improvement_roadmap": {{
        "duration_weeks": 4,
        "target_score_increase": 20,
        "weekly_tasks": []
    }}
}}

⚠️ IMPORTANT RULES:
- DO NOT generate random scores
- Every score MUST be justified by resume content
- Scores must vary based on different resumes
- DO NOT use fixed or example data
- Extract keywords from BOTH resume and job description
- If JD is missing → infer from target role intelligently
- Keep output structured and clean

📈 SCORING LOGIC:
- If strong keyword match → increase score
- If missing core skills → reduce score
- If irrelevant experience → reduce score
- If strong projects → boost score
- If resume poorly formatted → reduce ATS compatibility

🚀 BONUS:
Generate a 2–4 week improvement roadmap to increase ATS score by at least +20 points.

Return ONLY valid JSON, no additional text."""
    
    messages = [
        {"role": "system", "content": "You are an expert ATS system analyzer with deep knowledge of recruitment processes and resume optimization."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        response = await call_oxlo_chat(messages, temperature=0.3, max_tokens=4000)
    except Exception:
        return {
            "ats_score": 55,
            "score_breakdown": {
                "keyword_match": 50,
                "skills_relevance": 60,
                "experience_alignment": 55,
                "education_fit": 60,
                "resume_structure": 65,
                "projects_quality": 55,
                "ats_compatibility": 60
            },
            "matched_keywords": [],
            "missing_keywords": ["Job-specific keywords"],
            "analysis": {
                "strengths": ["Resume was parsed and structured successfully"],
                "weaknesses": ["Live AI ATS scoring unavailable due to API authentication"],
                "red_flags": []
            },
            "suggestions": {
                "improve_keywords": ["Add exact keywords from target job description"],
                "add_projects": ["Add measurable project outcomes"],
                "enhance_experience": ["Quantify impact with numbers"],
                "formatting_fixes": ["Use ATS-friendly section headings"]
            },
            "final_verdict": "Fallback analysis used because AI provider authentication failed",
            "improvement_roadmap": {
                "duration_weeks": 4,
                "target_score_increase": 20,
                "weekly_tasks": []
            }
        }
    
    try:
        result = json.loads(response)
        # Ensure all required fields exist
        if "ats_score" not in result:
            result["ats_score"] = 0
        if "score_breakdown" not in result:
            result["score_breakdown"] = {
                "keyword_match": 0,
                "skills_relevance": 0,
                "experience_alignment": 0,
                "education_fit": 0,
                "resume_structure": 0,
                "projects_quality": 0,
                "ats_compatibility": 0
            }
        return result
    except Exception as e:
        print(f"Error parsing ATS score response: {e}")
        # Fallback response
        return {
            "ats_score": 0,
            "score_breakdown": {
                "keyword_match": 0,
                "skills_relevance": 0,
                "experience_alignment": 0,
                "education_fit": 0,
                "resume_structure": 0,
                "projects_quality": 0,
                "ats_compatibility": 0
            },
            "matched_keywords": [],
            "missing_keywords": [],
            "analysis": {
                "strengths": [],
                "weaknesses": ["Unable to analyze resume - please try again"],
                "red_flags": []
            },
            "suggestions": {
                "improve_keywords": [],
                "add_projects": [],
                "enhance_experience": [],
                "formatting_fixes": []
            },
            "final_verdict": "Analysis failed - please ensure resume is properly formatted",
            "improvement_roadmap": {
                "duration_weeks": 4,
                "target_score_increase": 20,
                "weekly_tasks": []
            }
        }
