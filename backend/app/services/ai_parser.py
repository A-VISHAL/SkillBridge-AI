import httpx
import json
from typing import List, Dict, Any
from app.core.config import settings
from app.models.schemas import ParsedResume, Skill, Experience, Education, Project

async def parse_resume_with_ai(resume_text: str) -> ParsedResume:
    """Use AI to parse resume and extract structured data"""
    
    prompt = f"""Extract structured information from this resume. Return ONLY valid JSON with this exact structure:

{{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "+1234567890",
  "skills": ["Python", "React", "AWS"],
  "experiences": [
    {{
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Jan 2022 - Present",
      "description": ["Achievement 1", "Achievement 2"]
    }}
  ],
  "education": [
    {{
      "degree": "B.Tech in Computer Science",
      "institution": "University Name",
      "year": "2021",
      "gpa": "8.5/10"
    }}
  ],
  "projects": [
    {{
      "name": "Project Name",
      "description": "Brief description",
      "technologies": ["Tech1", "Tech2"]
    }}
  ]
}}

Resume text:
{resume_text[:3000]}

Return ONLY the JSON, no other text."""

    try:
        print(f"Calling AI API at: {settings.OXLO_CHAT_ENDPOINT}")
        print(f"API Key present: {bool(settings.OXLO_API_KEY)}")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                settings.OXLO_CHAT_ENDPOINT,
                headers={
                    "Authorization": f"Bearer {settings.OXLO_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "claude-3-5-sonnet-20241022",
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "max_tokens": 2000,
                    "temperature": 0.1
                }
            )
            
            print(f"AI API Response Status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"AI API Error Response: {response.text}")
                return None
            
            result = response.json()
            print(f"AI API Response: {json.dumps(result, indent=2)[:500]}")
            
            # Extract the JSON from AI response
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            if not content:
                # Try alternative response structure
                content = result.get("content", "")
            
            print(f"Extracted content: {content[:200]}")
            
            # Try to parse JSON from response
            # Remove markdown code blocks if present
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            data = json.loads(content)
            print(f"Parsed JSON successfully: {list(data.keys())}")
            
            # Convert to ParsedResume object
            parsed = ParsedResume(
                name=data.get("name"),
                email=data.get("email"),
                phone=data.get("phone"),
                skills=[Skill(name=s) for s in data.get("skills", [])],
                experiences=[
                    Experience(
                        title=exp.get("title", ""),
                        company=exp.get("company", ""),
                        duration=exp.get("duration", ""),
                        description=exp.get("description", [])
                    )
                    for exp in data.get("experiences", [])
                ],
                education=[
                    Education(
                        degree=edu.get("degree", ""),
                        institution=edu.get("institution", ""),
                        year=edu.get("year", ""),
                        gpa=edu.get("gpa", "")
                    )
                    for edu in data.get("education", [])
                ],
                projects=[
                    Project(
                        name=proj.get("name", ""),
                        description=proj.get("description", ""),
                        technologies=proj.get("technologies", [])
                    )
                    for proj in data.get("projects", [])
                ],
                raw_text=resume_text
            )
            
            print(f"Created ParsedResume with {len(parsed.experiences)} experiences, {len(parsed.education)} education")
            return parsed
            
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Content that failed to parse: {content[:500]}")
        return None
    except Exception as e:
        print(f"Error parsing resume with AI: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return None
