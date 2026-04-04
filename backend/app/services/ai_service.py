import httpx
import json
import re
from collections import Counter
from typing import List, Dict, Any, Optional
from app.core.config import settings


STOPWORDS = {
    "and", "the", "for", "with", "that", "this", "from", "you", "your", "are", "our", "will", "have",
    "has", "had", "but", "not", "all", "any", "can", "may", "into", "onto", "using", "use", "used",
    "about", "role", "job", "description", "requirement", "requirements", "preferred", "must", "should",
    "years", "year", "experience", "responsibilities", "ability", "skills", "skill", "strong", "good",
    "work", "working", "team", "teams", "candidate", "position", "plus", "including", "knowledge",
}

SKILL_ALIASES: Dict[str, List[str]] = {
    "Python": ["python"],
    "Java": ["java"],
    "JavaScript": ["javascript", "js"],
    "TypeScript": ["typescript", "ts"],
    "React": ["react", "reactjs", "react.js"],
    "Node.js": ["node", "node.js", "nodejs", "express"],
    "HTML": ["html", "html5"],
    "CSS": ["css", "css3"],
    "SQL": ["sql"],
    "PostgreSQL": ["postgres", "postgresql"],
    "MySQL": ["mysql"],
    "MongoDB": ["mongodb", "mongo"],
    "Docker": ["docker"],
    "Kubernetes": ["kubernetes", "k8s"],
    "AWS": ["aws", "amazon web services"],
    "GCP": ["gcp", "google cloud"],
    "Azure": ["azure"],
    "Git": ["git", "github", "gitlab"],
    "REST API": ["rest", "restful", "api", "apis"],
    "GraphQL": ["graphql"],
    "Machine Learning": ["machine learning", "ml"],
    "NLP": ["nlp", "natural language processing"],
    "Data Structures": ["data structures", "dsa"],
    "Algorithms": ["algorithms", "algorithmic"],
    "System Design": ["system design", "scalability", "distributed systems"],
    "Testing": ["testing", "unit test", "integration test", "pytest", "jest"],
    "CI/CD": ["ci/cd", "ci", "cd", "pipeline"],
}

ROLE_DEFAULT_SKILLS: Dict[str, List[str]] = {
    "software engineer": ["Python", "JavaScript", "SQL", "Git", "REST API", "Testing"],
    "frontend": ["HTML", "CSS", "JavaScript", "React", "TypeScript", "Testing"],
    "backend": ["Python", "Node.js", "SQL", "PostgreSQL", "REST API", "Docker"],
    "full stack": ["React", "Node.js", "JavaScript", "SQL", "REST API", "Git"],
    "data": ["Python", "SQL", "Machine Learning", "NLP"],
    "ai": ["Python", "Machine Learning", "NLP", "SQL"],
}


def _normalize_space(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "")).strip()


def _contains_alias(text_lower: str, alias: str) -> bool:
    escaped = re.escape(alias.lower())
    return re.search(rf"(?<!\w){escaped}(?!\w)", text_lower) is not None


def _extract_skills(text: str) -> List[str]:
    text_lower = (text or "").lower()
    found: List[str] = []
    for canonical, aliases in SKILL_ALIASES.items():
        if any(_contains_alias(text_lower, alias) for alias in aliases):
            found.append(canonical)
    return found


def _extract_required_years(jd_text: str, target_role: str) -> float:
    jd = (jd_text or "").lower()
    range_match = re.search(r"(\d+(?:\.\d+)?)\s*[-to]{1,3}\s*(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?)", jd)
    if range_match:
        return float(range_match.group(1))

    direct_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?)", jd)
    if direct_match:
        return float(direct_match.group(1))

    role_lower = (target_role or "software engineer").lower()
    if "intern" in role_lower or "fresher" in role_lower or "junior" in role_lower:
        return 0.0
    if "senior" in role_lower or "lead" in role_lower:
        return 5.0
    return 2.0


def _years_from_duration(duration: str) -> float:
    if not duration:
        return 0.0

    text = duration.lower()
    years = 0.0
    y_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:years?|yrs?)", text)
    if y_match:
        years += float(y_match.group(1))

    m_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:months?|mos?)", text)
    if m_match:
        years += float(m_match.group(1)) / 12.0

    if years > 0:
        return years

    date_match = re.findall(r"(20\d{2})", text)
    if len(date_match) >= 2:
        start_year = int(date_match[0])
        end_year = int(date_match[-1])
        if end_year >= start_year:
            return float(end_year - start_year)

    return 0.0


def _extract_candidate_years(resume_text: str, resume_data: Optional[Dict[str, Any]]) -> float:
    text_lower = (resume_text or "").lower()

    explicit = re.search(r"(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?)\s+(?:of\s+)?experience", text_lower)
    if explicit:
        return float(explicit.group(1))

    total = 0.0
    experiences = (resume_data or {}).get("experiences", []) if isinstance(resume_data, dict) else []
    for exp in experiences:
        if isinstance(exp, dict):
            total += _years_from_duration(str(exp.get("duration", "")))

    if total > 0:
        return min(total, 25.0)

    if experiences:
        return float(min(len(experiences), 10))

    return 0.0


def _extract_education_requirements(jd_text: str) -> Dict[str, str]:
    jd_lower = (jd_text or "").lower()
    level = "any"
    if "phd" in jd_lower or "doctorate" in jd_lower:
        level = "phd"
    elif "master" in jd_lower or "m.tech" in jd_lower or "ms" in jd_lower:
        level = "master"
    elif "bachelor" in jd_lower or "b.tech" in jd_lower or "bs" in jd_lower or "b.e" in jd_lower:
        level = "bachelor"

    field = ""
    for candidate in ["computer science", "software engineering", "information technology", "data science", "electronics"]:
        if candidate in jd_lower:
            field = candidate
            break

    return {"level": level, "field": field}


def _education_score(resume_data: Optional[Dict[str, Any]], jd_text: str) -> float:
    requirements = _extract_education_requirements(jd_text)
    level_required = requirements["level"]
    field_required = requirements["field"]

    education = (resume_data or {}).get("education", []) if isinstance(resume_data, dict) else []
    edu_text = " ".join([_normalize_space(str(e.get("degree", ""))) for e in education if isinstance(e, dict)]).lower()

    if not edu_text:
        return 3.0

    has_tech_field = any(keyword in edu_text for keyword in ["computer", "software", "information", "it", "electronics", "data"])
    level_match = (
        level_required == "any"
        or (level_required == "bachelor" and any(k in edu_text for k in ["bachelor", "b.tech", "be", "b.e", "bs"]))
        or (level_required == "master" and any(k in edu_text for k in ["master", "m.tech", "ms", "m.s"]))
        or (level_required == "phd" and ("phd" in edu_text or "doctorate" in edu_text))
    )
    field_match = (not field_required) or (field_required in edu_text)

    if level_match and field_match:
        return 10.0
    if has_tech_field:
        return 7.0
    return 3.0


def _extract_keywords(jd_text: str, required_skills: List[str]) -> List[str]:
    tokens = re.findall(r"[a-zA-Z][a-zA-Z0-9+#.-]{2,}", (jd_text or "").lower())
    filtered = [token for token in tokens if token not in STOPWORDS and len(token) >= 3]
    freq = Counter(filtered)

    ranked = [word for word, _ in freq.most_common(25)]
    skill_terms: List[str] = []
    for skill in required_skills:
        skill_terms.extend([part.lower() for part in re.split(r"\s+", skill) if part])

    ordered = []
    for token in skill_terms + ranked:
        if token and token not in ordered and token not in STOPWORDS:
            ordered.append(token)
    return ordered[:30]


def _project_relevance_score(required_skills: List[str], resume_text: str, resume_data: Optional[Dict[str, Any]]) -> float:
    projects = (resume_data or {}).get("projects", []) if isinstance(resume_data, dict) else []
    project_text = ""
    if projects:
        parts = []
        for project in projects:
            if isinstance(project, dict):
                parts.append(str(project.get("name", "")))
                parts.append(str(project.get("description", "")))
                parts.extend([str(t) for t in project.get("technologies", [])])
        project_text = _normalize_space(" ".join(parts)).lower()
    else:
        project_text = (resume_text or "").lower()

    if not required_skills:
        return 8.0

    hits = sum(1 for skill in required_skills if skill.lower() in project_text)
    ratio = hits / max(1, len(required_skills))
    if ratio >= 0.6:
        return 15.0
    if ratio >= 0.45:
        return 12.0
    if ratio >= 0.3:
        return 9.0
    if ratio > 0:
        return 5.0
    return 3.0


def _resume_quality_score(resume_text: str) -> float:
    text = (resume_text or "").lower()
    sections = ["summary", "skills", "experience", "education", "project"]
    section_hits = sum(1 for section in sections if section in text)

    quantified = len(re.findall(r"\b\d+\s*%\b|\b\d+(?:\.\d+)?\s*(?:x|k|m|million|users|hours|days|weeks|months)\b", text))
    bullet_like = len(re.findall(r"(^\s*[-*•])|(;\s)|(:\s)", resume_text or "", flags=re.MULTILINE))

    if section_hits >= 4 and quantified >= 3 and bullet_like >= 3:
        return 10.0
    if section_hits >= 3 and quantified >= 1:
        return 8.0
    if section_hits >= 2:
        return 6.0
    return 4.0


def _keyword_stuffing_detected(resume_text: str, keywords: List[str]) -> bool:
    text = (resume_text or "").lower()
    repeated = 0
    for keyword in keywords[:20]:
        if len(keyword) < 3:
            continue
        count = len(re.findall(rf"(?<!\w){re.escape(keyword)}(?!\w)", text))
        if count >= 12:
            repeated += 1
    return repeated >= 2


def _infer_required_skills(jd_text: str, target_role: str) -> List[str]:
    from_jd = _extract_skills(jd_text)
    if from_jd:
        return from_jd

    role_lower = (target_role or "software engineer").lower()
    for role_key, defaults in ROLE_DEFAULT_SKILLS.items():
        if role_key in role_lower:
            return defaults
    return ROLE_DEFAULT_SKILLS["software engineer"]


class AIServiceError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code

def _extract_text_from_response_payload(data: Dict[str, Any]) -> Optional[str]:
    # OpenAI/Oxlo style: {"choices": [{"message": {"content": "..."}}]}
    choices = data.get("choices")
    if isinstance(choices, list) and choices:
        message = choices[0].get("message", {}) if isinstance(choices[0], dict) else {}
        content = message.get("content", "") if isinstance(message, dict) else ""
        if isinstance(content, str) and content.strip():
            return content.strip()

    # Anthropic style: {"content": [{"type": "text", "text": "..."}]}
    if "content" in data and isinstance(data["content"], list):
        for block in data["content"]:
            if isinstance(block, dict) and block.get("type") == "text":
                text = block.get("text", "").strip()
                if text:
                    return text

    if isinstance(data.get("text"), str) and data.get("text").strip():
        return data.get("text").strip()

    return None


async def call_model_chat(
    messages: List[Dict[str, str]],
    endpoint: str,
    api_key: str,
    model: str,
    temperature: float = 0.7,
    max_tokens: int = 2000,
) -> str:
    """Call a chat model endpoint with explicit credentials and model routing."""

    if not api_key:
        raise AIServiceError("config", "API key is not configured")

    if not endpoint:
        raise AIServiceError("config", "Chat endpoint is not configured")

    if not model:
        raise AIServiceError("config", "Model name is not configured")

    api_key = api_key.strip()
    if api_key.lower().startswith("bearer "):
        api_key = api_key[7:].strip()

    # Oxlo-style gateways can reject Authorization header format.
    # Use API-key style headers first and avoid raw Authorization formats.
    header_variants = [
        {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        {
            "x-api-key": api_key,
            "Content-Type": "application/json",
        },
        {
            "api-key": api_key,
            "Content-Type": "application/json",
        },
        {
            "X-API-Key": api_key,
            "Content-Type": "application/json",
        },
    ]
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    last_response = None
    async with httpx.AsyncClient(timeout=30.0) as client:
        for headers in header_variants:
            try:
                response = await client.post(endpoint, headers=headers, json=payload)
            except Exception as e:
                raise AIServiceError("network", f"AI API request failed: {str(e)}") from e

            if response.status_code == 200:
                last_response = response
                break

            # Retry auth format on auth failures only.
            if response.status_code in (401, 403):
                last_response = response
                continue

            if response.status_code == 429:
                raise AIServiceError("rate_limit", f"AI API rate limit exceeded: {response.text[:220]}")

            code = "http_error"
            raise AIServiceError(code, f"AI API request failed: status={response.status_code}, body={response.text[:220]}")

    if not last_response or last_response.status_code != 200:
        body = last_response.text[:220] if last_response is not None else "No response body"
        raise AIServiceError("auth", f"AI API request failed: status=401, body={body}")

    try:
        data = last_response.json()
    except Exception as e:
        raise AIServiceError("parse", f"Invalid JSON response from AI API: {str(e)}") from e

    text = _extract_text_from_response_payload(data)
    if text:
        return text

    raise AIServiceError("parse", f"No textual content in response payload keys={list(data.keys())}")


async def call_ats_chat(
    messages: List[Dict[str, str]],
    temperature: float = 0.7,
    max_tokens: int = 2000,
) -> str:
    return await call_model_chat(
        messages=messages,
        endpoint=settings.ATS_CHAT_ENDPOINT,
        api_key=settings.ATS_API_KEY,
        model=settings.ATS_MODEL,
        temperature=temperature,
        max_tokens=max_tokens,
    )


async def call_jd_chat(
    messages: List[Dict[str, str]],
    temperature: float = 0.7,
    max_tokens: int = 2000,
) -> str:
    return await call_model_chat(
        messages=messages,
        endpoint=settings.JD_CHAT_ENDPOINT,
        api_key=settings.JD_API_KEY,
        model=settings.JD_MODEL,
        temperature=temperature,
        max_tokens=max_tokens,
    )


def _allow_rate_limit_fallback(error: Exception) -> bool:
    return (
        settings.ENABLE_RATE_LIMIT_FALLBACK
        and isinstance(error, AIServiceError)
        and error.code == "rate_limit"
    )


async def call_oxlo_chat(
    messages: List[Dict[str, str]],
    temperature: float = 0.7,
    max_tokens: int = 2000,
) -> str:
    """Backward-compatible alias; defaults to ATS model routing."""
    return await call_ats_chat(messages=messages, temperature=temperature, max_tokens=max_tokens)

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
    
    response = await call_ats_chat(messages, temperature=0.3)
    
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
        response = await call_ats_chat(messages, temperature=0.5)
    except Exception as e:
        if not _allow_rate_limit_fallback(e):
            raise
        return [
            {
                "original": bullets[0] if bullets else "Worked on projects",
                "improved": "Built and shipped production features with measurable impact on users and performance.",
                "reason": "Fallback suggestion generated because ATS model rate limit was reached.",
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

def _build_resume_context_for_jd(resume_text: str, resume_data: Optional[Dict[str, Any]], max_chars: int = 2600) -> str:
    parts: List[str] = []

    if isinstance(resume_data, dict):
        skills = [
            str(skill.get("name", "")).strip()
            for skill in resume_data.get("skills", [])
            if isinstance(skill, dict) and str(skill.get("name", "")).strip()
        ]
        experiences = [
            {
                "title": str(exp.get("title", "")).strip(),
                "company": str(exp.get("company", "")).strip(),
                "duration": str(exp.get("duration", "")).strip(),
            }
            for exp in resume_data.get("experiences", [])
            if isinstance(exp, dict)
        ]
        projects = [
            str(project.get("name", "")).strip()
            for project in resume_data.get("projects", [])
            if isinstance(project, dict) and str(project.get("name", "")).strip()
        ]
        education = [
            str(edu.get("degree", "")).strip()
            for edu in resume_data.get("education", [])
            if isinstance(edu, dict) and str(edu.get("degree", "")).strip()
        ]

        if skills:
            parts.append(f"Skills: {', '.join(skills[:20])}")
        if experiences:
            exp_summary = "; ".join(
                f"{item['title']} at {item['company']} ({item['duration']})".strip()
                for item in experiences[:8]
                if item.get("title") or item.get("company")
            )
            if exp_summary:
                parts.append(f"Experience: {exp_summary}")
        if projects:
            parts.append(f"Projects: {', '.join(projects[:10])}")
        if education:
            parts.append(f"Education: {', '.join(education[:5])}")

    raw = (resume_text or "").strip()
    if raw:
        parts.append(f"Raw resume excerpt: {raw[:max_chars]}")

    combined = "\n".join(part for part in parts if part).strip()
    return combined[:max_chars] if combined else raw[:max_chars]


def _normalize_model_jd_payload(raw: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(raw, dict):
        raise ValueError("JD model response must be a JSON object")

    return {
        "match_percentage": max(0, min(100, float(raw.get("match_percentage", 0)))),
        "hire_probability": str(raw.get("hire_probability", "Medium")),
        "matched_skills": raw.get("matched_skills", []) or [],
        "missing_skills": raw.get("missing_skills", []) or [],
        "focus_areas": raw.get("focus_areas", []) or [],
        "interview_topics": raw.get("interview_topics", []) or [],
        "strengths": raw.get("strengths", []) or [],
        "weaknesses": raw.get("weaknesses", []) or [],
        "suggestions": raw.get("suggestions", []) or [],
    }


async def match_resume_to_jd(resume_text: str, jd_text: str, resume_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Match resume to job description with focus areas"""

    resume_context = _build_resume_context_for_jd(resume_text, resume_data, max_chars=2600)

    prompt = f"""Analyze this resume against the job description and provide STRICT JSON:

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
9. Suggestions (top actionable recommendations to improve fit)

Resume:
{resume_context}

Job Description:
{jd_text[:1800]}

Return JSON with keys: match_percentage, hire_probability, matched_skills, missing_skills, focus_areas, interview_topics, strengths, weaknesses, suggestions"""
    
    messages = [
        {"role": "system", "content": "You are an expert technical recruiter and career coach."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        response = await call_jd_chat(messages, temperature=0.2, max_tokens=2600)
    except Exception as e:
        should_fallback = _allow_rate_limit_fallback(e)
        if isinstance(e, AIServiceError) and e.code in {"auth", "config", "network", "http_error", "parse"}:
            should_fallback = True
        if not should_fallback:
            raise
        # Fallback for provider-unavailable cases (rate limit/auth/network/etc.).
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
                    "reason": "JD model rate limit reached, showing temporary fallback analysis.",
                    "study_time": "2-3 days",
                }
            ],
            "interview_topics": ["Core fundamentals", "Project deep-dive"],
            "strengths": ["Resume data parsed successfully"],
            "weaknesses": ["Live JD model temporarily unavailable"],
            "suggestions": [
                "Prioritize high-weight JD keywords in resume summary and skills section",
                "Add one project that directly demonstrates missing core requirements",
            ],
            "source": "jd_model_unavailable_fallback",
            "warning": str(e),
        }

    try:
        parsed = json.loads(_extract_json_block(response))
        return _normalize_model_jd_payload(parsed)
    except Exception as e:
        raise ValueError(f"Failed to parse AI JD match response: {str(e)}")


async def generate_roadmap(resume_text: str, jd_text: str, skill_gaps: List[str]) -> Dict[str, Any]:
    """Generate a detailed weekly roadmap from resume and JD, with complete week coverage."""

    def _unique_items(items: List[str]) -> List[str]:
        output: List[str] = []
        for item in items:
            cleaned = str(item).strip()
            if cleaned and cleaned not in output:
                output.append(cleaned)
        return output

    def _infer_focus_skills() -> List[str]:
        jd_lower = jd_text.lower()
        resume_lower = resume_text.lower()
        skill_keywords = {
            "HTML/CSS": ["html", "css", "responsive", "semantic"],
            "JavaScript": ["javascript", "js", "dom", "es6", "typescript"],
            "React": ["react", "hooks", "component", "redux", "context"],
            "APIs": ["api", "rest", "graphql", "integration", "endpoint"],
            "Backend": ["node", "express", "python", "django", "flask", "backend"],
            "Databases": ["sql", "postgres", "mysql", "mongodb", "database"],
            "DevOps": ["docker", "kubernetes", "ci/cd", "deployment", "aws", "cloud"],
            "Testing": ["test", "testing", "jest", "pytest", "unit"],
            "System Design": ["system design", "architecture", "scalability", "design"],
            "Interview Prep": ["interview", "communication", "behavioral", "dsa"],
        }

        detected: List[str] = []
        for skill, keywords in skill_keywords.items():
            in_jd = any(keyword in jd_lower for keyword in keywords)
            in_resume = any(keyword in resume_lower for keyword in keywords)
            if in_jd and not in_resume:
                detected.append(skill)

        merged = _unique_items(detected + skill_gaps)
        if not merged:
            merged = ["JavaScript", "React", "APIs", "Backend", "System Design"]
        return merged[:6]

    def _week_phase(week: int) -> str:
        if week <= 4:
            return "foundation"
        if week <= 8:
            return "build"
        return "industry"

    def _difficulty_for_week(week: int) -> str:
        if week <= 3:
            return "Easy"
        if week <= 8:
            return "Medium"
        return "Hard"

    def _hours_for_week(week: int) -> int:
        if week <= 4:
            return 12
        if week <= 8:
            return 14
        return 16

    def _build_week_tasks(week: int, primary: str, secondary: str, tertiary: str) -> List[Dict[str, Any]]:
        phase = _week_phase(week)
        difficulty = _difficulty_for_week(week)
        hours = _hours_for_week(week)
        focus = primary if week <= 4 else secondary if week <= 8 else tertiary
        jd_hint = ", ".join(_unique_items(skill_gaps)[:3]) or "JD core requirements"

        learn_task = {
            "week": week,
            "task": f"Week {week} learning track: master {focus} concepts mapped to {jd_hint}. Create concise notes explaining how this skill appears in your target role and where your resume currently lacks evidence.",
            "skill": focus,
            "difficulty": difficulty,
            "estimated_hours": hours,
            "resources": [f"{focus} official docs", "Role-aligned tutorial", "JD keyword checklist"],
            "priority": "HIGH" if phase != "industry" else "CRITICAL",
            "milestone": week in [4, 8, 12],
        }

        build_task = {
            "week": week,
            "task": f"Week {week} build task: implement a practical feature using {focus} and connect it to one real requirement from the job description. Capture measurable output for a resume bullet (performance, reliability, or user impact).",
            "skill": focus,
            "difficulty": "Medium" if difficulty == "Easy" else difficulty,
            "estimated_hours": hours + 2,
            "resources": ["Feature implementation checklist", "Project structure template", "Code review notes"],
            "priority": "CRITICAL" if week in [4, 8, 12] else "HIGH",
            "milestone": week in [4, 8, 12],
        }

        prep_task = {
            "week": week,
            "task": f"Week {week} interview alignment: convert this week's work into interview-ready explanations. Prepare one technical story and one resume bullet that clearly links your implementation to the JD expectations.",
            "skill": "Interview Prep" if week >= 9 else focus,
            "difficulty": difficulty,
            "estimated_hours": max(8, hours - 2),
            "resources": ["STAR method template", "Mock Q&A prompts", "Resume bullet optimizer"],
            "priority": "HIGH",
            "milestone": week in [6, 10, 12],
        }

        return [learn_task, build_task, prep_task]

    def _normalize_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
        skills = _infer_focus_skills()
        primary = skills[0]
        secondary = skills[1] if len(skills) > 1 else f"{primary} Integration"
        tertiary = skills[2] if len(skills) > 2 else "System Design"

        incoming_tasks = payload.get("tasks", []) if isinstance(payload, dict) else []
        tasks_by_week: Dict[int, List[Dict[str, Any]]] = {week: [] for week in range(1, 13)}

        for item in incoming_tasks:
            try:
                week = int(item.get("week"))
            except Exception:
                continue
            if not (1 <= week <= 12):
                continue

            task_text = str(item.get("task", "")).strip()
            if not task_text:
                continue

            cleaned = {
                "week": week,
                "task": task_text,
                "skill": str(item.get("skill", primary)).strip() or primary,
                "difficulty": str(item.get("difficulty", _difficulty_for_week(week))).strip() or _difficulty_for_week(week),
                "estimated_hours": int(item.get("estimated_hours", _hours_for_week(week)) or _hours_for_week(week)),
                "resources": item.get("resources", []) if isinstance(item.get("resources", []), list) else [],
                "priority": str(item.get("priority", "HIGH")).strip() or "HIGH",
                "milestone": bool(item.get("milestone", week in [4, 8, 12])),
            }

            lower_texts = {existing["task"].lower() for existing in tasks_by_week[week]}
            if cleaned["task"].lower() not in lower_texts:
                tasks_by_week[week].append(cleaned)

        for week in range(1, 13):
            if len(tasks_by_week[week]) < 3:
                fallback_tasks = _build_week_tasks(week, primary, secondary, tertiary)
                existing_lower = {task["task"].lower() for task in tasks_by_week[week]}
                for fallback in fallback_tasks:
                    if fallback["task"].lower() not in existing_lower:
                        tasks_by_week[week].append(fallback)
                        existing_lower.add(fallback["task"].lower())
                    if len(tasks_by_week[week]) >= 3:
                        break

        normalized_tasks: List[Dict[str, Any]] = []
        global_seen = set()
        for week in range(1, 13):
            for task in tasks_by_week[week]:
                task_text = task["task"].strip()
                if task_text.lower() in global_seen:
                    task_text = f"Week {week}: {task_text}"
                    task["task"] = task_text
                global_seen.add(task_text.lower())
                normalized_tasks.append(task)

        milestones = payload.get("milestones", []) if isinstance(payload, dict) else []
        if not isinstance(milestones, list) or len(milestones) < 4:
            milestones = [
                f"Week 4: {primary} foundation milestone",
                f"Week 8: {secondary} build milestone",
                f"Week 10: interview readiness checkpoint",
                "Week 12: capstone and portfolio completion",
            ]

        completion_criteria = payload.get("completion_criteria") if isinstance(payload, dict) else ""
        if not isinstance(completion_criteria, str) or not completion_criteria.strip():
            completion_criteria = (
                "Complete all weekly learning, build, and interview-alignment tasks; "
                "publish portfolio artifacts and keep evidence for JD keyword coverage."
            )

        return {
            "duration_weeks": 12,
            "daily_hours": 2,
            "tasks": normalized_tasks,
            "milestones": milestones,
            "completion_criteria": completion_criteria,
        }

    prompt = f"""Create a personalized 12-week roadmap from the resume and JD.

Resume:
{resume_text[:700]}

Job Description:
{jd_text[:700]}

Missing skills:
{', '.join(skill_gaps[:8])}

Return valid JSON with keys:
- duration_weeks
- daily_hours
- tasks (array of objects with week, task, skill, difficulty, estimated_hours, resources, priority, milestone)
- milestones
- completion_criteria

Rules:
1) Include ALL weeks 1..12.
2) At least 3 unique tasks per week.
3) No repeated task text.
4) Task content must be specific and tied to resume/JD gaps."""

    messages = [
        {
            "role": "system",
            "content": "You are an expert career coach creating practical, non-generic weekly plans tied to candidate gaps and JD requirements.",
        },
        {"role": "user", "content": prompt},
    ]

    try:
        response = await call_oxlo_chat(messages, temperature=0.6, max_tokens=4000)
        parsed = json.loads(response)
        return _normalize_payload(parsed)
    except Exception as e:
        print(f"Error generating roadmap from AI: {str(e)}")
        return _normalize_payload({})

async def generate_quiz_questions(
    topic: str,
    difficulty: str,
    count: int = 10,
    domain: str = "Coding DSA",
    resume_text: str = "",
    jd_text: str = "",
    roadmap_context: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict]:
    """Generate quiz questions based on resume, JD, and followed roadmap context."""

    roadmap_context = roadmap_context or []
    roadmap_snippets = []
    for task in roadmap_context[:12]:
        week = task.get("week", "?")
        task_text = str(task.get("task", "")).strip()
        skill = str(task.get("skill", "")).strip()
        if task_text:
            roadmap_snippets.append(f"Week {week}: {task_text} ({skill})")

    domain_key = "coding_dsa" if domain.lower().startswith("coding") else "development"
    difficulty_key = difficulty.strip().lower()
    difficulty_key = {"medium": "hard"}.get(difficulty_key, difficulty_key)
    domain_prompt = "Data Structures, Algorithms, problem-solving, complexity" if domain_key == "coding_dsa" else "Web/app development, APIs, architecture, tooling"
    normalized_count = max(10, int(count or 10))

    def _normalize_stem(text: str) -> str:
        return " ".join(text.lower().strip().split())

    def _question_item(question_id: str, item_topic: str, question_text: str, options: List[str], correct_index: int, explanation: str, item_difficulty: str) -> Dict[str, Any]:
        option_items = [{"text": option, "is_correct": index == correct_index} for index, option in enumerate(options)]
        return {
            "id": question_id,
            "topic": item_topic,
            "difficulty": item_difficulty,
            "question_type": "MCQ",
            "question": question_text,
            "options": option_items,
            "correct_answer": options[correct_index],
            "explanation": explanation,
        }

    fallback_banks: Dict[str, Dict[str, List[Dict[str, Any]]]] = {
        "coding_dsa": {
            "easy": [
                _question_item("coding-easy-1", "Arrays", "What is an array?", ["A collection of same-type elements", "A type of loop", "A sorting method", "A database index"], 0, "An array stores elements contiguously and usually of the same type.", "Easy"),
                _question_item("coding-easy-2", "Complexity", "What is the time complexity of accessing an element in an array by index?", ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 0, "Direct index access in an array is constant time.", "Easy"),
                _question_item("coding-easy-3", "Stacks", "What is a stack?", ["FIFO structure", "LIFO structure", "Tree traversal method", "Hashing technique"], 1, "Stacks follow Last In, First Out (LIFO).", "Easy"),
                _question_item("coding-easy-4", "Queues", "What is FIFO?", ["First In, First Out", "Fast Input Fast Output", "First In, Fast Out", "Function Input Function Output"], 0, "FIFO means the earliest element added is removed first.", "Easy"),
                _question_item("coding-easy-5", "Programming", "What is a variable?", ["A stored value that can change", "A fixed function", "A compiler error", "A package manager"], 0, "Variables store values that can be updated during execution.", "Easy"),
                _question_item("coding-easy-6", "Operators", "What is the difference between == and = in most programming languages?", ["No difference", "== compares, = assigns", "= compares, == assigns", "Both mean addition"], 1, "Assignment uses = while equality comparison uses ==.", "Easy"),
                _question_item("coding-easy-7", "Loops", "What is a loop?", ["A conditional statement", "A repetition structure", "A database query", "A memory allocator"], 1, "Loops repeat code while a condition remains true or for a fixed range.", "Easy"),
                _question_item("coding-easy-8", "Functions", "What is a function?", ["A reusable block of code", "A variable type", "A network request", "A CSS rule"], 0, "Functions package logic into reusable units.", "Easy"),
                _question_item("coding-easy-9", "Stacks", "What is the difference between stack and queue?", ["Stack is FIFO, queue is LIFO", "Stack is LIFO, queue is FIFO", "Both are the same", "Neither stores data"], 1, "Stacks remove the most recent item first, queues remove the oldest.", "Easy"),
                _question_item("coding-easy-10", "Searching", "What is the output of: print(2 + 3 * 4)?", ["20", "14", "24", "9"], 1, "Multiplication happens before addition, so 3 * 4 = 12 and 2 + 12 = 14.", "Easy"),
            ],
            "hard": [
                _question_item("coding-hard-1", "Binary Search", "What is the time complexity of binary search on a sorted array?", ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 1, "Binary search halves the search space each step.", "Hard"),
                _question_item("coding-hard-2", "Recursion", "What is recursion?", ["Calling a function from another file", "A function calling itself", "A database join", "A styling method"], 1, "Recursion solves a problem by reducing it to smaller versions of itself.", "Hard"),
                _question_item("coding-hard-3", "Linked Lists", "What is a linked list?", ["A contiguous memory array", "Nodes connected by pointers", "A balanced tree", "A hash table"], 1, "A linked list stores nodes connected by references.", "Hard"),
                _question_item("coding-hard-4", "Hash Tables", "What is a hash table mainly used for?", ["Sorting data", "Fast key-value lookup", "Rendering UI", "Encrypting files"], 1, "Hash tables provide fast average-case lookups by key.", "Hard"),
                _question_item("coding-hard-5", "Algorithms", "What is the time complexity of a nested loop over n items?", ["O(n)", "O(log n)", "O(n^2)", "O(n^3)"], 2, "Two nested loops over the same range usually produce quadratic time.", "Hard"),
                _question_item("coding-hard-6", "Trees", "Difference between BFS and DFS?", ["BFS uses a stack; DFS uses a queue", "BFS explores level by level; DFS explores deeply first", "They are identical", "DFS is only for graphs"], 1, "BFS explores all nodes at a depth before going deeper.", "Hard"),
                _question_item("coding-hard-7", "Strings", "Reverse a string without using built-in functions tests which concept most directly?", ["Recursion or two-pointer logic", "Database normalization", "Network routing", "CSS specificity"], 0, "This is usually solved with iteration or recursion and index control.", "Hard"),
                _question_item("coding-hard-8", "Linked Lists", "What is the time complexity of detecting a cycle in a linked list with Floyd's algorithm?", ["O(1)", "O(log n)", "O(n)", "O(n^2)"], 2, "The slow and fast pointers traverse at most linear time.", "Hard"),
                _question_item("coding-hard-9", "Dynamic Programming", "What is memoization?", ["Sorting inputs before recursion", "Caching repeated subproblem results", "Encrypting recursive calls", "Using a queue for recursion"], 1, "Memoization stores computed results to avoid recomputation.", "Hard"),
                _question_item("coding-hard-10", "Sorting", "Which algorithm is typically O(n log n) in average case?", ["Bubble sort", "Insertion sort", "Merge sort", "Linear search"], 2, "Merge sort is a classic O(n log n) divide-and-conquer algorithm.", "Hard"),
            ],
            "advanced": [
                _question_item("coding-advanced-1", "LRU Cache", "How is an LRU cache commonly implemented for O(1) operations?", ["Stack + queue", "Hash map + doubly linked list", "Binary tree + array", "Set + recursion"], 1, "A hash map gives direct access and a doubly linked list tracks recency.", "Advanced"),
                _question_item("coding-advanced-2", "Graphs", "Which algorithm finds the shortest path from a single source with non-negative weights?", ["DFS", "Dijkstra's algorithm", "Kruskal's algorithm", "Topological sort"], 1, "Dijkstra's algorithm is used for weighted shortest paths without negative weights.", "Advanced"),
                _question_item("coding-advanced-3", "Tries", "What is a trie primarily useful for?", ["Range sums", "Prefix matching", "Cycle detection", "Load balancing"], 1, "Tries are optimized for prefix-based search and autocomplete.", "Advanced"),
                _question_item("coding-advanced-4", "Graphs", "What does topological sorting apply to?", ["Undirected cyclic graphs only", "Directed acyclic graphs", "Binary heaps", "Hash tables"], 1, "Topological ordering exists for DAGs.", "Advanced"),
                _question_item("coding-advanced-5", "Data Structures", "What is a segment tree used for?", ["String formatting", "Range queries and updates", "User authentication", "Network routing"], 1, "Segment trees support efficient range query/update operations.", "Advanced"),
                _question_item("coding-advanced-6", "Data Structures", "What is a Fenwick tree mainly used for?", ["Prefix sums with updates", "Image rendering", "CSS layout", "Linked list traversal"], 0, "Fenwick trees support prefix sum queries and updates efficiently.", "Advanced"),
                _question_item("coding-advanced-7", "Concurrency", "How do you describe a deadlock in concurrent systems?", ["Memory leak", "Two or more tasks waiting on each other indefinitely", "A faster thread", "A cache miss"], 1, "Deadlock occurs when waiting dependencies form a cycle.", "Advanced"),
                _question_item("coding-advanced-8", "Optimization", "What is the key idea behind dynamic programming?", ["Randomization", "Overlapping subproblems and optimal substructure", "Using only recursion", "Ignoring state"], 1, "DP solves and reuses overlapping subproblems.", "Advanced"),
                _question_item("coding-advanced-9", "Graphs", "Which traversal is best associated with finding the shortest unweighted path?", ["BFS", "DFS", "Postorder traversal", "Heap sort"], 0, "BFS discovers shortest paths in unweighted graphs.", "Advanced"),
                _question_item("coding-advanced-10", "Linked Lists", "What is the main challenge in implementing a linked list compared to an array?", ["Random access", "Pointer management", "Sorting speed", "Constant-time length"], 1, "Linked lists require explicit pointer/reference management.", "Advanced"),
            ],
        },
        "development": {
            "easy": [
                _question_item("dev-easy-1", "Frontend vs Backend", "What is the difference between frontend and backend development?", ["Frontend is server code; backend is styling", "Frontend is user-facing; backend handles server-side logic", "They are identical", "Backend only means HTML"], 1, "Frontend focuses on what users see, while backend powers data, logic, and APIs.", "Easy"),
                _question_item("dev-easy-2", "HTML", "What does HTML stand for?", ["Hyper Text Markup Language", "High Transfer Machine Language", "Home Tool Markup Language", "Hyperlink and Text Management Language"], 0, "HTML is the standard markup language for web pages.", "Easy"),
                _question_item("dev-easy-3", "CSS", "What is the purpose of CSS?", ["To store data", "To style and layout web pages", "To create databases", "To run server scripts"], 1, "CSS controls visual presentation and layout.", "Easy"),
                _question_item("dev-easy-4", "APIs", "What is a REST API?", ["A database engine", "An HTTP-based API style", "A CSS framework", "A programming language"], 1, "REST APIs expose resources over HTTP using standard methods.", "Easy"),
                _question_item("dev-easy-5", "Version Control", "What is version control? Name one tool.", ["Tracking code changes; Git", "Designing web pages; Figma", "Compiling code; Node", "Styling pages; Tailwind"], 0, "Version control tracks changes over time and Git is a common tool.", "Easy"),
                _question_item("dev-easy-6", "Browser", "What does the DOM represent?", ["Database Object Model", "Document Object Model", "Data Output Module", "Dynamic Order Map"], 1, "The DOM is the browser's tree representation of HTML.", "Easy"),
                _question_item("dev-easy-7", "Networking", "What is the purpose of HTTP status code 404?", ["Success", "Resource created", "Resource not found", "Server error"], 2, "404 means the requested resource could not be found.", "Easy"),
                _question_item("dev-easy-8", "JavaScript", "What is JavaScript mainly used for in web development?", ["Database backups", "Interactivity and behavior", "Image compression", "Hardware drivers"], 1, "JavaScript adds interactivity and dynamic behavior to pages.", "Easy"),
                _question_item("dev-easy-9", "Deployment", "Why is environment configuration important?", ["It changes fonts", "It separates local, staging, and production settings", "It replaces Git", "It removes the need for APIs"], 1, "Different environments need different secrets and settings.", "Easy"),
                _question_item("dev-easy-10", "Authentication", "What is authentication?", ["Checking who a user is", "Checking what a user can do", "Styling a login page", "Compressing a file"], 0, "Authentication verifies identity.", "Easy"),
            ],
            "hard": [
                _question_item("dev-hard-1", "HTTP", "What is the difference between GET and POST requests?", ["GET sends data in body; POST sends in URL", "GET retrieves data; POST submits data", "They are identical", "POST is only for CSS"], 1, "GET is used to fetch data and POST is used to submit data.", "Hard"),
                _question_item("dev-hard-2", "Middleware", "What is middleware?", ["A database index", "Software that processes requests between layers", "A UI component", "A CSS selector"], 1, "Middleware runs between request and response handling.", "Hard"),
                _question_item("dev-hard-3", "Security", "What is authentication vs authorization?", ["Authentication is permissions; authorization is identity", "Authentication verifies identity; authorization checks access", "They are the same", "Authorization replaces login"], 1, "Authentication confirms who you are; authorization determines what you can do.", "Hard"),
                _question_item("dev-hard-4", "Data", "What is JSON?", ["A styling language", "A lightweight data format", "A database engine", "A browser API"], 1, "JSON is commonly used for structured data exchange.", "Hard"),
                _question_item("dev-hard-5", "Architecture", "What is MVC architecture?", ["Model-View-Controller", "Module-View-Cache", "Main-Value-Control", "Markup-Variable-Component"], 0, "MVC separates data, presentation, and control logic.", "Hard"),
                _question_item("dev-hard-6", "Databases", "Explain database indexing in one line.", ["It duplicates all data", "It speeds up lookups at storage and write-cost tradeoffs", "It removes tables", "It encrypts requests"], 1, "Indexes improve read performance by avoiding full table scans.", "Hard"),
                _question_item("dev-hard-7", "Scalability", "What is load balancing?", ["Storing passwords", "Distributing traffic across multiple servers", "Compressing responses", "Caching DNS only"], 1, "Load balancers spread requests across healthy instances.", "Hard"),
                _question_item("dev-hard-8", "DevOps", "Why is CORS important?", ["It compresses assets", "It controls cross-origin browser requests", "It encrypts databases", "It manages Docker images"], 1, "CORS protects browsers by controlling cross-origin access.", "Hard"),
                _question_item("dev-hard-9", "Backend", "What is the purpose of caching in web applications?", ["Make every request slower", "Reduce repeated computation and latency", "Replace authentication", "Remove database tables"], 1, "Caching stores reusable results to improve speed.", "Hard"),
                _question_item("dev-hard-10", "API Design", "What does idempotency mean for an API operation?", ["Each call creates a different result", "Repeated calls produce the same effect", "The API is offline", "It only supports GET"], 1, "Idempotent operations can be repeated without changing the final state.", "Hard"),
            ],
            "advanced": [
                _question_item("dev-advanced-1", "System Design", "Design a URL shortener like bit.ly. What is the main scaling concern?", ["UI animation", "Unique code generation and redirect throughput", "Color themes", "Local storage only"], 1, "Shorteners need compact IDs, fast lookup, and high redirect availability.", "Advanced"),
                _question_item("dev-advanced-2", "System Design", "How would you design a scalable chat system?", ["Use a single file server", "Use real-time messaging, fanout, and message persistence", "Avoid databases", "Send only emails"], 1, "Chat systems need low-latency delivery, storage, and presence handling.", "Advanced"),
                _question_item("dev-advanced-3", "Distributed Systems", "Explain the CAP theorem.", ["Cache, API, Performance", "Consistency, Availability, Partition tolerance", "Control, Auth, Proxy", "Code, Analyze, Push"], 1, "A distributed system can only fully guarantee two of the three under partition.", "Advanced"),
                _question_item("dev-advanced-4", "Concurrency", "How do you handle race conditions?", ["Ignore them", "Use synchronization or atomic operations", "Remove HTTP", "Use more CSS"], 1, "Concurrency controls prevent conflicting updates.", "Advanced"),
                _question_item("dev-advanced-5", "Reliability", "What is a rate limiter used for?", ["Increase image size", "Control request volume and protect services", "Create database tables", "Generate HTML"], 1, "Rate limiters prevent abuse and stabilize traffic.", "Advanced"),
                _question_item("dev-advanced-6", "Architecture", "What is the role of an API gateway?", ["Render CSS", "Route, secure, and observe backend services", "Store logs only", "Replace DNS"], 1, "API gateways centralize routing, auth, and policies.", "Advanced"),
                _question_item("dev-advanced-7", "Messaging", "When would you choose WebSockets over normal HTTP polling?", ["For one-time static pages", "For persistent bi-directional communication", "Only for file uploads", "Only for database queries"], 1, "WebSockets are suited for real-time bidirectional updates.", "Advanced"),
                _question_item("dev-advanced-8", "Data", "What is sharding in databases?", ["Merging tables", "Horizontal partitioning of data", "Encrypting columns", "Index compression"], 1, "Sharding splits data across multiple machines.", "Advanced"),
                _question_item("dev-advanced-9", "Performance", "What is the tradeoff when using denormalization?", ["Less redundancy but slower reads", "More redundancy but faster reads", "No database needed", "No schema changes"], 1, "Denormalization often improves read speed at the cost of duplication.", "Advanced"),
                _question_item("dev-advanced-10", "Reliability", "How do retries relate to idempotency?", ["Retries are safe only when operations are idempotent", "Retries always fail", "Idempotency removes the need for retries", "They are unrelated"], 0, "Safe retries depend on the operation not changing state unexpectedly.", "Advanced"),
            ],
        },
    }

    def _normalize_ai_question(item: Dict[str, Any], index: int) -> Optional[Dict[str, Any]]:
        if not isinstance(item, dict):
            return None

        question_text = str(item.get("question", "")).strip()
        options = item.get("options", [])
        if not question_text or not isinstance(options, list) or len(options) < 4:
            return None

        cleaned_options: List[str] = []
        correct_answer = ""
        for option in options:
            if isinstance(option, dict):
                option_text = str(option.get("text", "")).strip()
                if option_text:
                    cleaned_options.append(option_text)
                    if option.get("is_correct") and not correct_answer:
                        correct_answer = option_text

        if len(cleaned_options) < 4:
            return None

        if not correct_answer:
            correct_answer = str(item.get("correct_answer", cleaned_options[0])).strip() or cleaned_options[0]

        if correct_answer not in cleaned_options:
            correct_answer = cleaned_options[0]

        correct_index = cleaned_options.index(correct_answer)
        return _question_item(
            str(item.get("id", f"ai-{index + 1}")),
            str(item.get("topic", topic or domain)).strip() or (topic or domain),
            question_text,
            cleaned_options[:4],
            correct_index,
            str(item.get("explanation", "Review the underlying concept and compare each option." )).strip(),
            str(item.get("difficulty", difficulty)).strip() or difficulty,
        )

    def _build_fallback_questions() -> List[Dict[str, Any]]:
        pool = fallback_banks.get(domain_key, fallback_banks["development"])
        selected = pool.get(difficulty_key, pool["hard"])
        questions_out: List[Dict[str, Any]] = []
        for index, item in enumerate(selected[:normalized_count]):
            question = dict(item)
            question["id"] = f"{domain_key}-{difficulty_key}-{index + 1}"
            question["topic"] = topic or question.get("topic", domain)
            question["difficulty"] = difficulty.title() if difficulty else question.get("difficulty", "Hard")
            questions_out.append(question)
        return questions_out

    def _dedupe_questions(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        unique_items: List[Dict[str, Any]] = []
        seen = set()
        for item in items:
            stem = _normalize_stem(str(item.get("question", "")))
            if not stem or stem in seen:
                continue
            seen.add(stem)
            unique_items.append(item)
        return unique_items

    # Deterministic question bank is the primary source so section + difficulty
    # selections always produce distinct quiz sets.
    fallback_questions = _build_fallback_questions()

    # Keep the AI prompt as an optional enrichment path only if the bank is too small.
    if len(fallback_questions) >= normalized_count:
        return fallback_questions[:normalized_count]

    prompt = f"""Generate exactly {normalized_count} {difficulty} quiz questions for domain: {domain}.

Focus area:
{domain_prompt}

Candidate resume context:
{resume_text[:900]}

Target JD context:
{jd_text[:900]}

Roadmap context (followed/planned):
{chr(10).join(roadmap_snippets[:10]) if roadmap_snippets else 'No roadmap context provided'}

Rules:
1) Questions must be practical and aligned to resume gaps + JD requirements.
2) Return MCQ only, 4 options each, one correct answer.
3) Difficulty must match: {difficulty}.
4) Avoid repetition.
5) Keep question text crisp and interview-relevant.

Return ONLY JSON array. For each object use keys:
- id
- topic
- difficulty
- question_type (MCQ)
- question
- options: [{{text, is_correct}} x4]
- correct_answer
- explanation
"""

    messages = [
        {"role": "system", "content": "You are an expert technical interviewer creating highly relevant adaptive quizzes."},
        {"role": "user", "content": prompt},
    ]

    try:
        response = await call_oxlo_chat(messages, temperature=0.6, max_tokens=3500)
        parsed = json.loads(response)
        if isinstance(parsed, list):
            normalized_questions: List[Dict[str, Any]] = []
            for index, item in enumerate(parsed):
                normalized = _normalize_ai_question(item, index)
                if normalized:
                    normalized_questions.append(normalized)

            normalized_questions = _dedupe_questions(normalized_questions)
            if len(normalized_questions) >= normalized_count:
                return normalized_questions[:normalized_count]
    except Exception:
        pass

    return fallback_questions[:normalized_count]


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

async def generate_interview_questions(
    jd_text: str,
    mode: str,
    count: int = 5,
    resume_text: str = "",
    quiz_context: Optional[Dict[str, Any]] = None,
    roadmap_context: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict]:
    """Generate interview questions based on resume, quiz, roadmap, and JD context."""

    quiz_context = quiz_context or {}
    roadmap_context = roadmap_context or []

    def _normalize_text(value: str) -> str:
        return " ".join(str(value or "").strip().lower().split())

    def _extract_resume_signals(text: str) -> List[str]:
        signals = []
        lower = text.lower()
        keyword_map = [
            ("React", ["react", "hooks", "jsx", "component"]),
            ("JavaScript", ["javascript", "typescript", "es6", "dom"]),
            ("Python", ["python", "django", "flask", "fastapi"]),
            ("Backend", ["node", "express", "backend", "api"]),
            ("Databases", ["sql", "postgres", "mysql", "mongodb", "database"]),
            ("DSA", ["algorithm", "data structure", "binary search", "tree", "graph"]),
        ]
        for label, keywords in keyword_map:
            if any(keyword in lower for keyword in keywords):
                signals.append(label)
        return signals[:5]

    def _extract_roadmap_focus() -> List[str]:
        focus = []
        for task in roadmap_context[:5]:
            skill = str(task.get("skill", "")).strip()
            task_text = str(task.get("task", "")).strip()
            if skill:
                focus.append(skill)
            elif task_text:
                focus.append(task_text[:80])
        return focus

    def _extract_quiz_focus() -> List[str]:
        focus = []
        weak_topics = quiz_context.get("weakTopics") or quiz_context.get("weak_topics") or []
        if isinstance(weak_topics, list):
            focus.extend([str(topic).strip() for topic in weak_topics if str(topic).strip()])
        domain = str(quiz_context.get("domain", "")).strip()
        difficulty = str(quiz_context.get("difficulty", "")).strip()
        if domain:
            focus.append(domain)
        if difficulty:
            focus.append(difficulty)
        return focus[:5]

    resume_signals = _extract_resume_signals(resume_text)
    roadmap_focus = _extract_roadmap_focus()
    quiz_focus = _extract_quiz_focus()
    primary_focus = resume_signals[0] if resume_signals else (quiz_context.get("domain", "core stack") or "core stack")
    secondary_focus = roadmap_focus[0] if roadmap_focus else (quiz_focus[0] if quiz_focus else "roadmap work")
    quiz_topic = str(quiz_context.get("domain", "quiz topic")).strip() or "quiz topic"

    def _fallback_questions() -> List[Dict[str, Any]]:
        if mode.lower().startswith("hr"):
            return [
                {
                    "id": "hr-1",
                    "type": "HR",
                    "difficulty": "Easy",
                    "question": f"Tell me about yourself and how your background fits this role, especially around {primary_focus}.",
                    "expected_keywords": ["background", "role", "experience", primary_focus.lower()],
                    "evaluation_criteria": ["Clarity", "Relevance", "Confidence"],
                },
                {
                    "id": "hr-2",
                    "type": "HR",
                    "difficulty": "Medium",
                    "question": f"Which project from your resume are you most proud of and how does it connect to your roadmap learning around {secondary_focus}?",
                    "expected_keywords": ["project", "impact", "challenge", secondary_focus.lower()],
                    "evaluation_criteria": ["Ownership", "Impact", "Communication"],
                },
                {
                    "id": "hr-3",
                    "type": "Behavioral",
                    "difficulty": "Medium",
                    "question": f"Describe a time you had to learn something quickly while following your roadmap and preparing for {quiz_topic}.",
                    "expected_keywords": ["learn", "roadmap", "adapt", quiz_topic.lower()],
                    "evaluation_criteria": ["Learning agility", "Structure", "Outcome"],
                },
                {
                    "id": "hr-4",
                    "type": "Behavioral",
                    "difficulty": "Hard",
                    "question": f"Tell me about a conflict or challenge on a team project and how you resolved it while working on {secondary_focus}.",
                    "expected_keywords": ["conflict", "team", "resolution", secondary_focus.lower()],
                    "evaluation_criteria": ["Collaboration", "Problem solving", "Maturity"],
                },
                {
                    "id": "hr-5",
                    "type": "HR",
                    "difficulty": "Medium",
                    "question": f"Why should we hire you for a role focused on {quiz_topic}, and what have you already done on your roadmap to close the gap?",
                    "expected_keywords": ["skills", "fit", "value", "growth"],
                    "evaluation_criteria": ["Fit", "Confidence", "Specificity"],
                },
            ]

        return [
            {
                "id": "tech-1",
                "type": "Technical",
                "difficulty": "Easy",
                "question": f"Walk me through the most relevant project from your resume and the problem it solved using {primary_focus}.",
                "expected_keywords": resume_signals[:2] + ["project", "problem", "solution"],
                "evaluation_criteria": ["Clarity", "Technical depth", "Business impact"],
            },
            {
                "id": "tech-2",
                "type": "Technical",
                "difficulty": "Medium",
                "question": f"Which topic from your recent {quiz_topic} quiz was the hardest, and how would you improve it before the next interview?",
                "expected_keywords": ["hardest", "improve", "quiz", quiz_topic.lower()],
                "evaluation_criteria": ["Self-awareness", "Learning plan", "Technical accuracy"],
            },
            {
                "id": "tech-3",
                "type": "Technical",
                "difficulty": "Medium",
                "question": f"Explain one roadmap task you completed and what you built or learned from it, especially around {secondary_focus}.",
                "expected_keywords": ["roadmap", "built", "learned", secondary_focus.lower()],
                "evaluation_criteria": ["Ownership", "Execution", "Reflection"],
            },
            {
                "id": "tech-4",
                "type": "Technical",
                "difficulty": "Hard",
                "question": f"How would you design a scalable solution for one skill area from your roadmap such as {primary_focus}?",
                "expected_keywords": ["scalable", "architecture", "trade-off", "design"],
                "evaluation_criteria": ["System thinking", "Trade-offs", "Depth"],
            },
            {
                "id": "tech-5",
                "type": "Technical",
                "difficulty": "Hard",
                "question": f"If you scored lower on the {quiz_topic} quiz, what exact steps will you take before the next interview and which roadmap tasks will you revisit?",
                "expected_keywords": ["practice", "revision", "weak", "plan"],
                "evaluation_criteria": ["Honesty", "Actionability", "Growth mindset"],
            },
        ]

    return _fallback_questions()[:count]

async def evaluate_interview_answer(question: str, answer: str, expected_keywords: List[str]) -> Dict:
    """Evaluate interview answer"""

    cleaned_answer = answer.strip().lower()
    cleaned_keywords = [str(keyword).strip().lower() for keyword in expected_keywords if str(keyword).strip()]
    keyword_hits = sum(1 for keyword in cleaned_keywords if keyword in cleaned_answer)
    coverage = (keyword_hits / len(cleaned_keywords)) if cleaned_keywords else 0
    deterministic_score = 0 if not cleaned_answer else max(0, min(10, round(coverage * 10)))

    if not cleaned_answer:
        return {
            "score": 0,
            "strengths": [],
            "weaknesses": ["No answer provided"],
            "model_answer": "Answer the question directly and include the expected keywords.",
            "confidence_level": "Low",
            "improvement_tips": ["Answer each part of the question", "Use one example", "Mention the expected keywords"],
        }

    return {
        "score": deterministic_score,
        "strengths": ["Answered the question directly"] if deterministic_score >= 5 else [],
        "weaknesses": ["Missing expected keywords or details"] if deterministic_score < 7 else [],
        "model_answer": "A stronger answer should directly cover the expected keywords and include a concrete example.",
        "confidence_level": "High" if deterministic_score >= 7 else "Medium" if deterministic_score >= 4 else "Low",
        "improvement_tips": ["Use the STAR method", "Mention concrete examples", "Tie your answer back to the role"],
    }


def _calculate_ats_score_rule_based(
    resume_text: str,
    target_role: str = "",
    job_description: str = "",
    resume_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Calculate comprehensive ATS score based on multiple criteria.
    Returns detailed breakdown and actionable insights.
    """
    
    jd_text = job_description or ""
    required_skills = _infer_required_skills(jd_text, target_role)

    resume_structured_skills: List[str] = []
    if isinstance(resume_data, dict):
        resume_structured_skills.extend([
            str(skill.get("name", "")).strip()
            for skill in resume_data.get("skills", [])
            if isinstance(skill, dict) and str(skill.get("name", "")).strip()
        ])

    extracted_resume_skills = _extract_skills(resume_text)
    for skill in resume_structured_skills:
        if skill in SKILL_ALIASES:
            extracted_resume_skills.append(skill)

    resume_skill_set = sorted({skill for skill in extracted_resume_skills if skill})
    matched_skills = sorted([skill for skill in required_skills if skill in resume_skill_set])
    missing_skills = sorted([skill for skill in required_skills if skill not in resume_skill_set])

    total_required_skills = max(1, len(required_skills))
    skills_score = round((len(matched_skills) / total_required_skills) * 30, 2)

    required_years = _extract_required_years(jd_text, target_role)
    candidate_years = _extract_candidate_years(resume_text, resume_data)
    if required_years <= 0:
        experience_score = 20.0
    elif candidate_years >= required_years:
        experience_score = 20.0
    else:
        experience_score = round((candidate_years / required_years) * 20, 2)

    education_score = round(_education_score(resume_data, jd_text), 2)

    keywords = _extract_keywords(jd_text if jd_text else target_role, required_skills)
    resume_text_lower = (resume_text or "").lower()
    matched_keywords = [kw for kw in keywords if _contains_alias(resume_text_lower, kw)]
    missing_keywords = [kw for kw in keywords if kw not in matched_keywords]
    total_keywords = max(1, len(keywords))
    keyword_score = round((len(matched_keywords) / total_keywords) * 15, 2)

    project_score = round(_project_relevance_score(required_skills, resume_text, resume_data), 2)
    quality_score = round(_resume_quality_score(resume_text), 2)

    project_text = " ".join(
        [
            str(project.get("description", ""))
            for project in (resume_data or {}).get("projects", [])
            if isinstance(project, dict)
        ]
    ).lower() if isinstance(resume_data, dict) else ""
    real_world_aligned = project_score >= 13 and any(
        token in project_text
        for token in ["production", "deployed", "real-time", "realtime", "users", "scalable", "cloud", "api"]
    )
    bonus = 5.0 if real_world_aligned else 0.0

    stuffing = _keyword_stuffing_detected(resume_text, keywords)
    penalty = 5.0 if stuffing else 0.0

    total_score = round(skills_score + experience_score + education_score + keyword_score + project_score + quality_score + bonus - penalty, 2)
    total_score = max(0.0, min(100.0, total_score))

    strengths: List[str] = []
    weaknesses: List[str] = []
    recommendations: List[str] = []

    if skills_score >= 20:
        strengths.append("Strong overlap with required technical skills")
    else:
        weaknesses.append("Skills coverage is below the role requirements")
        recommendations.append("Add and demonstrate missing role-specific skills in projects and experience bullets")

    if experience_score >= 15:
        strengths.append("Experience level aligns well with expected years")
    else:
        weaknesses.append("Experience depth appears lower than role expectations")
        recommendations.append("Highlight relevant internship or project ownership to bridge experience gap")

    if education_score >= 9:
        strengths.append("Education is a close match for the role")
    elif education_score <= 5:
        weaknesses.append("Education alignment is limited for this role")
        recommendations.append("Add relevant coursework/certifications tied to the target job")

    if keyword_score >= 10:
        strengths.append("Good keyword alignment with target job language")
    else:
        weaknesses.append("Important JD keywords are missing or underrepresented")
        recommendations.append("Mirror key JD terms naturally in summary, skills, and experience sections")

    if project_score >= 12:
        strengths.append("Projects are relevant to the target role")
    else:
        weaknesses.append("Projects need stronger role alignment")
        recommendations.append("Build one project that directly maps to top missing skills")

    if quality_score >= 8:
        strengths.append("Resume structure and quantification quality are solid")
    else:
        weaknesses.append("Resume quality can improve with clearer structure and measurable impact")
        recommendations.append("Use action verbs and quantified achievements in each experience bullet")

    if stuffing:
        weaknesses.append("Keyword stuffing pattern detected")
        recommendations.append("Reduce repeated keyword usage and prioritize natural context")

    if real_world_aligned:
        strengths.append("Projects show practical real-world application")

    if not recommendations:
        recommendations.append("Continue tailoring resume per job and keep impact metrics updated")

    final_verdict = (
        "Excellent ATS alignment"
        if total_score >= 85
        else "Good ATS alignment with improvement opportunities"
        if total_score >= 65
        else "ATS alignment needs improvement"
    )

    return {
        "match_percentage": total_score,
        "skills_score": skills_score,
        "experience_score": round(experience_score, 2),
        "education_score": education_score,
        "keyword_score": keyword_score,
        "project_score": project_score,
        "quality_score": quality_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendations": recommendations,
        "ats_score": int(round(total_score)),
        "score_breakdown": {
            "keyword_match": round((len(matched_keywords) / total_keywords) * 100, 2),
            "skills_relevance": round((skills_score / 30.0) * 100, 2),
            "experience_alignment": round((experience_score / 20.0) * 100, 2),
            "education_fit": round((education_score / 10.0) * 100, 2),
            "resume_structure": round((quality_score / 10.0) * 100, 2),
            "projects_quality": round((project_score / 15.0) * 100, 2),
            "ats_compatibility": round((quality_score / 10.0) * 100, 2),
        },
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords,
        "analysis": {
            "strengths": strengths,
            "weaknesses": weaknesses,
            "red_flags": ["Potential keyword stuffing"] if stuffing else [],
        },
        "suggestions": {
            "improve_keywords": recommendations[:3],
            "add_projects": ["Create at least one role-specific end-to-end project with measurable impact"],
            "enhance_experience": ["Add impact metrics like % improvements, latency reduction, or user growth"],
            "formatting_fixes": ["Use ATS-friendly headers: Summary, Skills, Experience, Projects, Education"],
        },
        "final_verdict": final_verdict,
        "improvement_roadmap": {
            "duration_weeks": 4,
            "target_score_increase": 20,
            "weekly_tasks": [
                "Week 1: Add top missing skills to learning plan and update resume summary",
                "Week 2: Rewrite experience bullets with quantified outcomes",
                "Week 3: Build or refine one project aligned with target JD",
                "Week 4: Tailor keywords for specific job postings and re-evaluate",
            ],
        },
    }


def _extract_json_block(text: str) -> str:
    cleaned = (text or "").strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        return cleaned[start:end + 1]
    return cleaned


def _normalize_model_ats_payload(raw: Dict[str, Any], fallback: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(raw, dict):
        raise ValueError("ATS model response must be a JSON object")

    merged = dict(fallback)
    merged.update(raw)

    ats_score = merged.get("ats_score", fallback.get("ats_score", 0))
    try:
        ats_score = int(round(float(ats_score)))
    except Exception:
        ats_score = int(fallback.get("ats_score", 0))
    ats_score = max(0, min(100, ats_score))

    score_breakdown = merged.get("score_breakdown", {})
    if not isinstance(score_breakdown, dict):
        score_breakdown = {}

    merged_score_breakdown = dict(fallback.get("score_breakdown", {}))
    merged_score_breakdown.update(score_breakdown)

    suggestions = merged.get("suggestions", {})
    if not isinstance(suggestions, dict):
        suggestions = {}

    merged_suggestions = dict(fallback.get("suggestions", {}))
    merged_suggestions.update(suggestions)

    analysis = merged.get("analysis", {})
    if not isinstance(analysis, dict):
        analysis = {}

    merged_analysis = dict(fallback.get("analysis", {}))
    merged_analysis.update(analysis)

    return {
        "match_percentage": float(merged.get("match_percentage", ats_score)),
        "skills_score": float(merged.get("skills_score", fallback.get("skills_score", 0))),
        "experience_score": float(merged.get("experience_score", fallback.get("experience_score", 0))),
        "education_score": float(merged.get("education_score", fallback.get("education_score", 0))),
        "keyword_score": float(merged.get("keyword_score", fallback.get("keyword_score", 0))),
        "project_score": float(merged.get("project_score", fallback.get("project_score", 0))),
        "quality_score": float(merged.get("quality_score", fallback.get("quality_score", 0))),
        "matched_skills": merged.get("matched_skills", fallback.get("matched_skills", [])) or [],
        "missing_skills": merged.get("missing_skills", fallback.get("missing_skills", [])) or [],
        "strengths": merged.get("strengths", fallback.get("strengths", [])) or [],
        "weaknesses": merged.get("weaknesses", fallback.get("weaknesses", [])) or [],
        "recommendations": merged.get("recommendations", fallback.get("recommendations", [])) or [],
        "ats_score": ats_score,
        "score_breakdown": merged_score_breakdown,
        "matched_keywords": merged.get("matched_keywords", fallback.get("matched_keywords", [])) or [],
        "missing_keywords": merged.get("missing_keywords", fallback.get("missing_keywords", [])) or [],
        "analysis": merged_analysis,
        "suggestions": merged_suggestions,
        "final_verdict": str(merged.get("final_verdict", fallback.get("final_verdict", "Resume analysis complete"))),
        "improvement_roadmap": merged.get("improvement_roadmap", fallback.get("improvement_roadmap", {})) or {},
        "source": "model",
    }


def _build_resume_context_for_ats(
    resume_text: str,
    resume_data: Optional[Dict[str, Any]],
    max_chars: int,
) -> str:
    parts: List[str] = []

    if isinstance(resume_data, dict):
        skills = [
            str(skill.get("name", "")).strip()
            for skill in resume_data.get("skills", [])
            if isinstance(skill, dict) and str(skill.get("name", "")).strip()
        ]
        experiences = [
            str(exp.get("title", "")).strip()
            for exp in resume_data.get("experiences", [])
            if isinstance(exp, dict) and str(exp.get("title", "")).strip()
        ]
        projects = [
            str(project.get("name", "")).strip()
            for project in resume_data.get("projects", [])
            if isinstance(project, dict) and str(project.get("name", "")).strip()
        ]
        education = [
            str(edu.get("degree", "")).strip()
            for edu in resume_data.get("education", [])
            if isinstance(edu, dict) and str(edu.get("degree", "")).strip()
        ]

        if skills:
            parts.append(f"Skills: {', '.join(skills[:20])}")
        if experiences:
            parts.append(f"Experience titles: {', '.join(experiences[:10])}")
        if projects:
            parts.append(f"Projects: {', '.join(projects[:10])}")
        if education:
            parts.append(f"Education: {', '.join(education[:5])}")

    raw = (resume_text or "").strip()
    if raw:
        parts.append(f"Resume raw excerpt: {raw[:max_chars]}")

    combined = "\n".join(part for part in parts if part).strip()
    if not combined:
        combined = raw[:max_chars]

    return combined[:max_chars]


async def calculate_ats_score(
    resume_text: str,
    target_role: str = "",
    job_description: str = "",
    resume_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Model-first ATS scoring. Falls back to rule engine only on provider rate limits."""

    fallback = _calculate_ats_score_rule_based(
        resume_text=resume_text,
        target_role=target_role,
        job_description=job_description,
        resume_data=resume_data,
    )

    resume_context = _build_resume_context_for_ats(
        resume_text=resume_text,
        resume_data=resume_data,
        max_chars=3200,
    )

    prompt = (
        "Analyze this resume for ATS compatibility and return STRICT JSON only.\\n"
        "The JSON must include these keys:\\n"
        "ats_score, score_breakdown, analysis, missing_keywords, matched_keywords, matched_skills, missing_skills, suggestions, final_verdict\\n"
        "where score_breakdown includes: keyword_match, skills_relevance, experience_alignment, education_fit, resume_structure, projects_quality, ats_compatibility.\\n"
        "analysis includes: strengths (array), weaknesses (array), red_flags (array).\\n"
        "suggestions includes: improve_keywords (array), add_projects (array), enhance_experience (array), formatting_fixes (array).\\n"
        f"Target role: {target_role or 'Software Engineer'}\\n"
        f"Job description: {(job_description or '')[:1500]}\\n"
        f"Resume text: {resume_context}"
    )

    messages = [
        {
            "role": "system",
            "content": "You are an expert ATS evaluator. Return only valid JSON with no markdown.",
        },
        {"role": "user", "content": prompt},
    ]

    try:
        response_text = await call_ats_chat(messages, temperature=0.2, max_tokens=2200)
        payload = json.loads(_extract_json_block(response_text))
        return _normalize_model_ats_payload(payload, fallback)
    except Exception as first_error:
        # Retry once with an even shorter context for model gateways that reject large/noisy payloads.
        try:
            short_context = _build_resume_context_for_ats(
                resume_text=resume_text,
                resume_data=resume_data,
                max_chars=1400,
            )
            retry_prompt = (
                "Return STRICT JSON only with keys: ats_score, score_breakdown, analysis, missing_keywords, matched_keywords, matched_skills, missing_skills, suggestions, final_verdict.\n"
                f"Target role: {target_role or 'Software Engineer'}\n"
                f"Job description: {(job_description or '')[:900]}\n"
                f"Resume text: {short_context}"
            )
            retry_messages = [
                {
                    "role": "system",
                    "content": "You are an ATS evaluator. Return only valid JSON and no markdown.",
                },
                {"role": "user", "content": retry_prompt},
            ]
            retry_text = await call_ats_chat(retry_messages, temperature=0.1, max_tokens=1600)
            retry_payload = json.loads(_extract_json_block(retry_text))
            return _normalize_model_ats_payload(retry_payload, fallback)
        except Exception:
            e = first_error

        should_fallback = _allow_rate_limit_fallback(e)
        if isinstance(e, AIServiceError) and e.code in {"auth", "config", "network", "http_error", "parse"}:
            should_fallback = True

        if should_fallback:
            fallback_with_reason = dict(fallback)
            fallback_with_reason["source"] = "rule_engine_model_unavailable"
            fallback_with_reason["fallback_reason"] = str(e)
            return fallback_with_reason
        raise
