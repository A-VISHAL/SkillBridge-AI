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
        return _get_fallback_response(messages)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                settings.OXLO_CHAT_ENDPOINT,
                headers={
                    "Authorization": f"Bearer {settings.OXLO_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("choices", [{}])[0].get("message", {}).get("content", "")
            else:
                print(f"Oxlo API error: {response.status_code}")
                return _get_fallback_response(messages)
                
    except Exception as e:
        print(f"Error calling Oxlo API: {e}")
        return _get_fallback_response(messages)

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
    
    response = await call_oxlo_chat(messages, temperature=0.5)
    
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
    
    response = await call_oxlo_chat(messages, temperature=0.3, max_tokens=3000)
    
    try:
        return json.loads(response)
    except:
        return {
            "match_percentage": 68,
            "hire_probability": "Medium",
            "matched_skills": ["Python", "React", "MongoDB"],
            "missing_skills": ["Docker", "Kubernetes", "AWS Lambda"],
            "focus_areas": [
                {
                    "skill": "Docker",
                    "priority": "HIGH",
                    "weight": 25,
                    "reason": "Critical for deployment pipeline",
                    "study_time": "2-3 weeks"
                }
            ],
            "interview_topics": ["System Design", "Docker", "Microservices"],
            "strengths": ["Strong Python skills", "Good project experience"],
            "weaknesses": ["Limited cloud experience", "No containerization"]
        }


async def generate_roadmap(resume_text: str, jd_text: str, skill_gaps: List[str]) -> Dict[str, Any]:
    """Generate personalized learning roadmap"""
    
    prompt = f"""Create a personalized 12-week learning roadmap for this candidate:

Resume Summary:
{resume_text[:500]}

Target Job:
{jd_text[:500]}

Skill Gaps:
{', '.join(skill_gaps)}

Create a week-by-week plan with:
- Week number
- Task description
- Skill being learned
- Difficulty (Easy/Medium/Hard)
- Estimated hours
- Learning resources
- Milestones (mark important weeks)

Assume 2 hours/day study time.

Return as JSON with keys: duration_weeks, daily_hours, tasks (array), milestones (array), completion_criteria"""
    
    messages = [
        {"role": "system", "content": "You are an expert career coach creating personalized learning paths."},
        {"role": "user", "content": prompt}
    ]
    
    response = await call_oxlo_chat(messages, temperature=0.6, max_tokens=3000)
    
    try:
        return json.loads(response)
    except:
        return {
            "duration_weeks": 12,
            "daily_hours": 2,
            "tasks": [
                {
                    "week": 1,
                    "task": "Learn Docker basics and containerization",
                    "skill": "Docker",
                    "difficulty": "Medium",
                    "estimated_hours": 14,
                    "resources": ["Docker official docs", "Docker tutorial on YouTube"],
                    "milestone": True
                }
            ],
            "milestones": ["Week 1: Docker basics", "Week 4: First project", "Week 12: Job ready"],
            "completion_criteria": "Complete all tasks and build 2 projects"
        }

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
    
    response = await call_oxlo_chat(messages, temperature=0.3, max_tokens=4000)
    
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
