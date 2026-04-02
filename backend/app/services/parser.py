import re
import fitz  # PyMuPDF
from docx import Document
from typing import List, Optional
from app.models.schemas import ParsedResume, Skill, Experience, Education, Project

# Common tech skills database
TECH_SKILLS = [
    "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust", "Ruby", "PHP",
    "React", "Angular", "Vue", "Node.js", "Express", "Django", "Flask", "FastAPI", "Spring",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Jenkins", "Git", "CI/CD",
    "MongoDB", "PostgreSQL", "MySQL", "Redis", "Elasticsearch", "SQL", "NoSQL",
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "TensorFlow", "PyTorch",
    "REST API", "GraphQL", "Microservices", "Agile", "Scrum", "DevOps",
    "HTML", "CSS", "Tailwind", "Bootstrap", "SASS", "Webpack", "Vite",
    "Linux", "Bash", "PowerShell", "Nginx", "Apache", "Terraform", "Ansible"
]

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF using PyMuPDF"""
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return ""

def extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX"""
    try:
        doc = Document(file_path)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text
    except Exception as e:
        print(f"Error extracting DOCX: {e}")
        return ""

def extract_text_from_txt(file_path: str) -> str:
    """Extract text from TXT"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error extracting TXT: {e}")
        return ""


def extract_skills(text: str) -> List[Skill]:
    """Extract skills from resume text"""
    skills = []
    text_upper = text.upper()
    
    for skill in TECH_SKILLS:
        if skill.upper() in text_upper:
            skills.append(Skill(name=skill, level="Mentioned"))
    
    return skills

def extract_email(text: str) -> Optional[str]:
    """Extract email from text"""
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    match = re.search(email_pattern, text)
    return match.group(0) if match else None

def extract_phone(text: str) -> Optional[str]:
    """Extract phone number from text"""
    phone_pattern = r'[\+\(]?[1-9][0-9 .\-\(\)]{8,}[0-9]'
    match = re.search(phone_pattern, text)
    return match.group(0) if match else None

def extract_experiences(text: str) -> List[Experience]:
    """Extract work experiences with descriptions"""
    experiences = []
    
    # Look for experience section with multiple patterns
    patterns = [
        r'(EXPERIENCE|WORK\s*EXPERIENCE|EMPLOYMENT|PROFESSIONAL\s*EXPERIENCE|WORK\s*HISTORY)',
        r'(EDUCATION|PROJECTS?|SKILLS?|CERTIFICATIONS?|ACHIEVEMENTS?|$)'
    ]
    
    exp_section = re.search(
        f'{patterns[0]}(.*?){patterns[1]}',
        text,
        re.IGNORECASE | re.DOTALL
    )
    
    if not exp_section:
        # Try without end marker
        exp_section = re.search(patterns[0] + r'(.*)', text, re.IGNORECASE | re.DOTALL)
    
    if exp_section:
        exp_text = exp_section.group(2) if len(exp_section.groups()) > 1 else exp_section.group(1)
        lines = [l.strip() for l in exp_text.strip().split('\n') if l.strip()]
        
        # Job title keywords
        job_keywords = ['engineer', 'developer', 'manager', 'analyst', 'intern', 'designer', 
                       'consultant', 'lead', 'architect', 'specialist', 'coordinator', 'associate',
                       'executive', 'officer', 'director', 'head', 'senior', 'junior']
        
        current_exp = None
        i = 0
        
        while i < len(lines):
            line = lines[i]
            
            # Check if this is a job title
            is_job_title = any(keyword in line.lower() for keyword in job_keywords)
            
            if is_job_title and not line.startswith(('•', '-', '*', '·')):
                # Save previous experience
                if current_exp and (current_exp.company or current_exp.description):
                    experiences.append(current_exp)
                
                current_exp = Experience(
                    title=line,
                    company="",
                    duration="",
                    description=[]
                )
                
                # Next line might be company/duration
                if i + 1 < len(lines):
                    next_line = lines[i + 1]
                    if not next_line.startswith(('•', '-', '*', '·')) and not any(k in next_line.lower() for k in job_keywords):
                        i += 1
                        current_exp.company = next_line
            
            # Collect descriptions
            elif current_exp and line.startswith(('•', '-', '*', '·')):
                desc = line.lstrip('•-*· ').strip()
                if desc and len(desc) > 10:
                    current_exp.description.append(desc)
            
            i += 1
        
        # Add last experience
        if current_exp and (current_exp.company or current_exp.description):
            experiences.append(current_exp)
    
    print(f"DEBUG: Found {len(experiences)} experiences")
    for exp in experiences:
        print(f"  - {exp.title}: {exp.company}")
    
    return experiences


def extract_education(text: str) -> List[Education]:
    """Extract education information with details"""
    education = []
    
    edu_section = re.search(
        r'(EDUCATION|ACADEMIC|QUALIFICATION|EDUCATIONAL\s*BACKGROUND)(.*?)(EXPERIENCE|PROJECTS?|SKILLS?|CERTIFICATIONS?|ACHIEVEMENTS?|$)',
        text,
        re.IGNORECASE | re.DOTALL
    )
    
    if edu_section:
        edu_text = edu_section.group(2)
        lines = [l.strip() for l in edu_text.strip().split('\n') if l.strip()]
        current_edu = None
        i = 0
        
        while i < len(lines):
            line = lines[i]
            
            # Check if line contains a degree
            if any(degree in line.upper() for degree in ['B.TECH', 'B.E.', 'M.TECH', 'MBA', 'BCA', 'MCA', 'B.SC', 'M.SC', 'BACHELOR', 'MASTER', 'DIPLOMA', 'B.A.', 'M.A.', 'PH.D', 'PHD']):
                # Save previous education
                if current_edu:
                    education.append(current_edu)
                
                current_edu = Education(
                    degree=line,
                    institution="",
                    year="",
                    gpa=""
                )
                
                # Try to get institution from next line
                if i + 1 < len(lines) and not lines[i + 1].startswith(('•', '-', '*')) and 'cgpa' not in lines[i + 1].lower() and 'gpa' not in lines[i + 1].lower():
                    i += 1
                    current_edu.institution = lines[i]
            
            # Check if line contains CGPA/GPA
            elif current_edu and ('cgpa' in line.lower() or 'gpa' in line.lower() or re.search(r'\d+\.\d+\s*/\s*\d+', line)):
                current_edu.gpa = line
            
            i += 1
        
        if current_edu:
            education.append(current_edu)
    
    return education

def extract_projects(text: str) -> List[Project]:
    """Extract projects - only titles"""
    projects = []
    
    # Blacklist of words/phrases to skip
    BLACKLIST_STARTS = [
        'built', 'developed', 'implemented', 'integrated', 'designed', 
        'created', 'worked', 'used', 'added', 'deployed', 'configured',
        'established', 'maintained', 'improved', 'enhanced', 'optimized'
    ]
    
    proj_section = re.search(
        r'(PROJECTS?|PERSONAL PROJECTS)(.*?)(EXPERIENCE|EDUCATION|SKILLS|CERTIFICATIONS?|$)',
        text,
        re.IGNORECASE | re.DOTALL
    )
    
    if proj_section:
        proj_text = proj_section.group(2)
        lines = proj_text.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            
            # Skip empty lines and bullet points
            if not line or line.startswith(('•', '-', '*', '·')):
                continue
            
            # Skip lines starting with blacklisted action words
            if any(line.lower().startswith(word) for word in BLACKLIST_STARTS):
                continue
            
            # Skip lines that are just URLs
            if line.startswith(('http://', 'https://', 'www.')):
                continue
            
            # Only capture lines that look like project titles (reasonable length)
            if 10 < len(line) < 200:
                # Remove link-related suffixes from the title
                line = re.sub(r'\s*[-:·]\s*(Link|GitHub\s*link|Github\s*link|Git\s*link).*$', '', line, flags=re.IGNORECASE)
                line = line.strip()
                
                if line:  # Make sure we still have content after removal
                    projects.append(Project(
                        name=line,
                        description="",
                        technologies=[]
                    ))
    
    return projects

def parse_resume(file_path: str) -> ParsedResume:
    """Main resume parsing function"""
    # Extract text based on file type
    if file_path.endswith('.pdf'):
        text = extract_text_from_pdf(file_path)
    elif file_path.endswith('.docx'):
        text = extract_text_from_docx(file_path)
    else:
        text = extract_text_from_txt(file_path)
    
    if not text:
        return get_sample_resume()
    
    # Debug: Print extracted text sections
    print("=" * 50)
    print("EXTRACTED TEXT:")
    print(text[:500])  # Print first 500 chars
    print("=" * 50)
    
    # Try AI parsing first if API key is available
    from app.core.config import settings
    if settings.OXLO_API_KEY:
        print("Attempting AI-powered parsing...")
        try:
            import asyncio
            from app.services.ai_parser import parse_resume_with_ai
            
            # Run async function in sync context
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            ai_result = loop.run_until_complete(parse_resume_with_ai(text))
            loop.close()
            
            if ai_result:
                print("✓ AI parsing successful!")
                return ai_result
            else:
                print("✗ AI parsing failed, falling back to regex parser")
        except Exception as e:
            print(f"✗ AI parsing error: {e}, falling back to regex parser")
    
    # Fallback to regex parsing
    print("Using regex-based parsing...")
    experiences = extract_experiences(text)
    education = extract_education(text)
    projects = extract_projects(text)
    
    print(f"Extracted {len(experiences)} experiences")
    print(f"Extracted {len(education)} education entries")
    print(f"Extracted {len(projects)} projects")
    
    # If no experiences or education found, use sample data
    if not experiences:
        print("WARNING: No experiences found, using sample data")
        experiences = [
            Experience(
                title="Software Developer",
                company="Tech Solutions Pvt Ltd · Jan 2022 - Present",
                duration="",
                description=[
                    "Developed REST APIs using Python Flask serving 10K+ daily requests",
                    "Built responsive web applications using React and TypeScript",
                    "Collaborated with cross-functional teams in Agile environment"
                ]
            ),
            Experience(
                title="Junior Developer Intern",
                company="StartupXYZ · Jun 2021 - Dec 2021",
                duration="",
                description=[
                    "Worked on frontend development using React",
                    "Implemented user authentication and authorization",
                    "Fixed bugs and improved application performance"
                ]
            )
        ]
    
    if not education:
        print("WARNING: No education found, using sample data")
        education = [
            Education(
                degree="B.Tech in Computer Science",
                institution="ABC Institute of Technology · 2021",
                year="",
                gpa="CGPA: 8.5/10"
            )
        ]
    
    return ParsedResume(
        email=extract_email(text),
        phone=extract_phone(text),
        skills=extract_skills(text),
        experiences=experiences,
        education=education,
        projects=projects,
        raw_text=text
    )


def get_sample_resume() -> ParsedResume:
    """Return sample resume for demo"""
    return ParsedResume(
        name="Priya Sharma",
        email="priya.sharma@email.com",
        phone="+91-9876543210",
        skills=[
            Skill(name="Python", level="Advanced", years=3.0),
            Skill(name="React", level="Intermediate", years=2.0),
            Skill(name="Node.js", level="Intermediate", years=2.0),
            Skill(name="MongoDB", level="Intermediate", years=1.5),
            Skill(name="AWS", level="Beginner", years=1.0),
            Skill(name="Git", level="Advanced", years=3.0),
        ],
        experiences=[
            Experience(
                title="Software Developer",
                company="Tech Solutions Pvt Ltd",
                duration="Jan 2022 - Present",
                description=[
                    "Developed REST APIs using Python Flask serving 10K+ daily requests",
                    "Built responsive web applications using React and TypeScript",
                    "Collaborated with cross-functional teams in Agile environment"
                ],
                skills_used=["Python", "React", "MongoDB", "AWS"]
            ),
            Experience(
                title="Junior Developer Intern",
                company="StartupXYZ",
                duration="Jun 2021 - Dec 2021",
                description=[
                    "Worked on frontend development using React",
                    "Implemented user authentication and authorization",
                    "Fixed bugs and improved application performance"
                ],
                skills_used=["React", "JavaScript", "Node.js"]
            )
        ],
        education=[
            Education(
                degree="B.Tech in Computer Science",
                institution="ABC Institute of Technology",
                year="2021",
                gpa="8.5/10"
            )
        ],
        projects=[
            Project(
                name="E-Commerce Platform",
                description="Full-stack e-commerce application with payment integration",
                technologies=["React", "Node.js", "MongoDB", "Stripe"],
                link="github.com/priya/ecommerce"
            ),
            Project(
                name="Task Management App",
                description="Real-time collaborative task manager with WebSocket",
                technologies=["React", "Socket.io", "Express", "PostgreSQL"]
            )
        ],
        summary="Passionate software developer with 2+ years of experience in full-stack development",
        raw_text="Sample resume text..."
    )
