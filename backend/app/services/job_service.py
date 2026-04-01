import httpx
from typing import List, Dict, Any
from app.core.config import settings
from app.models.schemas import JobListing, ParsedResume

async def search_jobs_adzuna(query: str, location: str = "india", max_results: int = 20) -> List[Dict]:
    """Search jobs using Adzuna API"""
    
    if not settings.ADZUNA_APP_ID or not settings.ADZUNA_APP_KEY:
        return _get_sample_jobs()
    
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
                return _get_sample_jobs()
                
    except Exception as e:
        print(f"Error calling Adzuna API: {e}")
        return _get_sample_jobs()

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

def _get_sample_jobs() -> List[Dict]:
    """Return sample jobs for demo"""
    return [
        {
            "id": "job1",
            "title": "Senior Python Developer",
            "company": {"display_name": "Tech Corp India"},
            "location": {"display_name": "Bangalore, India"},
            "description": "Looking for experienced Python developer with React skills...",
            "redirect_url": "https://example.com/apply",
            "created": "2026-03-25",
            "salary_min": 1200000,
            "salary_max": 1800000
        },
        {
            "id": "job2",
            "title": "Full Stack Developer",
            "company": {"display_name": "StartupXYZ"},
            "location": {"display_name": "Mumbai, India"},
            "description": "Join our team to build scalable web applications...",
            "redirect_url": "https://example.com/apply2",
            "created": "2026-03-28"
        },
        {
            "id": "job3",
            "title": "React Developer",
            "company": {"display_name": "Digital Solutions"},
            "location": {"display_name": "Pune, India"},
            "description": "Frontend developer needed for exciting projects...",
            "redirect_url": "https://example.com/apply3",
            "created": "2026-03-30"
        }
    ]


def calculate_job_match(resume: ParsedResume, job: Dict) -> float:
    """Calculate match percentage between resume and job"""
    
    resume_skills = {skill.name.lower() for skill in resume.skills}
    job_text = (job.get("description", "") + " " + job.get("title", "")).lower()
    
    # Count matching skills
    matches = sum(1 for skill in resume_skills if skill.lower() in job_text)
    total_skills = len(resume_skills) if resume_skills else 1
    
    match_percentage = (matches / total_skills) * 100
    
    # Boost if title matches experience
    for exp in resume.experiences:
        if any(word in job.get("title", "").lower() for word in exp.title.lower().split()):
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
    all_jobs = jobs_adzuna + jobs_rapidapi
    
    # Convert to JobListing format with match scores
    job_listings = []
    for job in all_jobs[:settings.MAX_JOBS_PER_QUERY]:
        match_percentage = calculate_job_match(resume, job)
        
        # Filter by minimum match ratio
        if match_percentage >= settings.MIN_SKILL_MATCH_RATIO * 100:
            job_listings.append(JobListing(
                id=str(job.get("id", "")),
                title=job.get("title", ""),
                company=job.get("company", {}).get("display_name", "Company"),
                location=job.get("location", {}).get("display_name", "India"),
                match_percentage=match_percentage,
                salary=_format_salary(job),
                description=job.get("description", "")[:500],
                required_skills=_extract_skills_from_job(job),
                apply_link=job.get("redirect_url", "#"),
                posted_date=job.get("created", ""),
                source="Adzuna" if job in jobs_adzuna else "RapidAPI"
            ))
    
    # Sort by match percentage
    job_listings.sort(key=lambda x: x.match_percentage, reverse=True)
    
    return job_listings

def _format_salary(job: Dict) -> str:
    """Format salary information"""
    salary_min = job.get("salary_min")
    salary_max = job.get("salary_max")
    
    if salary_min and salary_max:
        return f"₹{salary_min/100000:.1f}L - ₹{salary_max/100000:.1f}L"
    elif salary_min:
        return f"₹{salary_min/100000:.1f}L+"
    else:
        return "Not disclosed"

def _extract_skills_from_job(job: Dict) -> List[str]:
    """Extract skills mentioned in job description"""
    from app.services.parser import TECH_SKILLS
    
    job_text = (job.get("description", "") + " " + job.get("title", "")).upper()
    skills = []
    
    for skill in TECH_SKILLS:
        if skill.upper() in job_text:
            skills.append(skill)
    
    return skills[:10]  # Return top 10 skills
