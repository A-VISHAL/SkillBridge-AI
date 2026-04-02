import httpx
from typing import List, Dict, Any
from app.core.config import settings
from app.models.schemas import JobListing, ParsedResume

async def search_jobs_adzuna(query: str, location: str = "india", max_results: int = 20) -> List[Dict]:
    """Search jobs using Adzuna API"""
    
    if not settings.ADZUNA_APP_ID or not settings.ADZUNA_APP_KEY:
        return []
    
    try:
        url = f"https://api.adzuna.com/v1/api/jobs/{location}/search/1"
        params = {
            "app_id": settings.ADZUNA_APP_ID,
            "app_key": settings.ADZUNA_APP_KEY,
            "results_per_page": max_results,
            "what": query,
            "content-type": "application/json"
        }
        
        async with httpx.AsyncClient(timeout=settings.API_TIMEOUT_SECONDS) as client:
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                return data.get("results", [])
            else:
                print(f"Adzuna API error: {response.status_code}")
                return []
                
    except Exception as e:
        print(f"Error calling Adzuna API: {e}")
        return []

async def search_jobs_rapidapi(query: str, location: str = "India") -> List[Dict]:
    """Search jobs using RapidAPI JSearch"""
    
    if not settings.RAPIDAPI_KEY:
        return []
    
    try:
        url = "https://jsearch.p.rapidapi.com/search"
        headers = {
            "X-RapidAPI-Key": settings.RAPIDAPI_KEY,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
        }
        params = {
            "query": query,
            "page": "1",
            "num_pages": "1"
        }
        
        async with httpx.AsyncClient(timeout=settings.API_TIMEOUT_SECONDS) as client:
            response = await client.get(url, headers=headers, params=params)
            
            if response.status_code == 200:
                data = response.json()
                return data.get("data", [])
            else:
                return []
                
    except Exception as e:
        print(f"Error calling RapidAPI: {e}")
        return []

def _job_title(job: Dict) -> str:
    return (job.get("title") or job.get("job_title") or "").strip()


def _job_description(job: Dict) -> str:
    return (job.get("description") or job.get("job_description") or "").strip()


def _job_company(job: Dict) -> str:
    company = job.get("company")
    if isinstance(company, dict):
        return company.get("display_name", "Company")
    return (job.get("job_employer_name") or company or "Company").strip()


def _job_location(job: Dict) -> str:
    location = job.get("location")
    if isinstance(location, dict) and location.get("display_name"):
        return location.get("display_name")

    city = job.get("job_city")
    state = job.get("job_state")
    country = job.get("job_country")
    parts = [part for part in [city, state, country] if part]
    return ", ".join(parts) if parts else "India"


def _job_apply_link(job: Dict) -> str:
    return job.get("redirect_url") or job.get("job_apply_link") or "#"


def _job_posted_date(job: Dict) -> str:
    return job.get("created") or job.get("job_posted_at_datetime_utc") or ""


def _job_id(job: Dict) -> str:
    return str(job.get("id") or job.get("job_id") or "")


def calculate_job_match(resume: ParsedResume, job: Dict) -> float:
    """Calculate match percentage between resume and job"""
    
    resume_skills = {skill.name.lower() for skill in resume.skills if skill.name}
    job_text = f"{_job_description(job)} {_job_title(job)}".lower()
    
    # Count matching skills
    matches = sum(1 for skill in resume_skills if skill.lower() in job_text)
    total_skills = len(resume_skills) if resume_skills else 1
    
    match_percentage = (matches / total_skills) * 100
    
    # Boost if title matches experience
    title_words = set(_job_title(job).lower().split())
    for exp in resume.experiences:
        if any(word in title_words for word in exp.title.lower().split()):
            match_percentage = min(100, match_percentage + 15)
    
    return round(match_percentage, 1)

async def find_matching_jobs(resume: ParsedResume, preferences: Dict) -> List[JobListing]:
    """Find jobs matching resume and preferences"""
    
    # Generate search query from resume
    top_skills = [skill.name for skill in resume.skills[:5]]
    query = f"{preferences.get('role', 'developer')} {' '.join(top_skills)}"
    
    # Search using available APIs
    jobs_adzuna = await search_jobs_adzuna(query, preferences.get('location', 'india'))
    jobs_rapidapi = await search_jobs_rapidapi(query, preferences.get('location', 'India'))
    
    # Combine and deduplicate
    all_jobs = jobs_rapidapi + jobs_adzuna
    seen_job_keys = set()
    
    # Convert to JobListing format with match scores
    job_listings = []
    for job in all_jobs:
        dedupe_key = (_job_title(job).lower(), _job_company(job).lower(), _job_location(job).lower())
        if dedupe_key in seen_job_keys:
            continue
        seen_job_keys.add(dedupe_key)

        if len(job_listings) >= settings.MAX_JOBS_PER_QUERY:
            break

        match_percentage = calculate_job_match(resume, job)
        
        # Filter by minimum match ratio
        if match_percentage >= settings.MIN_SKILL_MATCH_RATIO * 100:
            job_listings.append(JobListing(
                id=_job_id(job),
                title=_job_title(job),
                company=_job_company(job),
                location=_job_location(job),
                match_percentage=match_percentage,
                salary=_format_salary(job),
                description=_job_description(job)[:500],
                required_skills=_extract_skills_from_job(job),
                apply_link=_job_apply_link(job),
                posted_date=_job_posted_date(job),
                source="Adzuna" if job in jobs_adzuna else "RapidAPI"
            ))
    
    # Sort by match percentage
    job_listings.sort(key=lambda x: x.match_percentage, reverse=True)
    
    return job_listings

def _format_salary(job: Dict) -> str:
    """Format salary information"""
    salary_min = job.get("salary_min") or job.get("job_min_salary")
    salary_max = job.get("salary_max") or job.get("job_max_salary")
    
    if salary_min and salary_max:
        return f"₹{salary_min/100000:.1f}L - ₹{salary_max/100000:.1f}L"
    elif salary_min:
        return f"₹{salary_min/100000:.1f}L+"
    else:
        return "Not disclosed"

def _extract_skills_from_job(job: Dict) -> List[str]:
    """Extract skills mentioned in job description"""
    from app.services.parser import TECH_SKILLS
    
    job_text = f"{_job_description(job)} {_job_title(job)}".upper()
    skills = []
    
    for skill in TECH_SKILLS:
        if skill.upper() in job_text:
            skills.append(skill)
    
    return skills[:10]  # Return top 10 skills
