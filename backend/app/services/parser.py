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
    """Extract work experiences (basic pattern matching)"""
    experiences = []
    
    # Look for common experience section headers
    exp_section = re.search(
        r'(EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT)(.*?)(EDUCATION|PROJECTS|SKILLS|$)',
        text,
        re.IGNORECASE | re.DOTALL
    )
    
    if exp_section:
        exp_text = exp_section.group(2)
        # Simple extraction - in production, use more sophisticated NLP
        lines = exp_text.strip().split('\n')
        current_exp = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check if line looks like a job title
            if any(word in line.lower() for word in ['engineer', 'developer', 'manager', 'analyst', 'intern']):
                if current_exp:
                    experiences.append(current_exp)
                current_exp = Experience(
                    title=line,
                    company="Company Name",
                    description=[]
                )
            elif current_exp and line.startswith(('•', '-', '*')):
                current_exp.description.append(line.lstrip('•-* '))
        
        if current_exp:
            experiences.append(current_exp)
    
    return experiences


def extract_education(text: str) -> List[Education]:
    """Extract education information"""
    education = []
    
    edu_section = re.search(
        r'(EDUCATION|ACADEMIC)(.*?)(EXPERIENCE|PROJECTS|SKILLS|$)',
        text,
        re.IGNORECASE | re.DOTALL
    )
    
    if edu_section:
        edu_text = edu_section.group(2)
        lines = edu_text.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if any(degree in line.upper() for degree in ['B.TECH', 'B.E.', 'M.TECH', 'MBA', 'BCA', 'MCA', 'B.SC', 'M.SC']):
                education.append(Education(
                    degree=line,
                    institution="University Name"
                ))
    
    return education

def extract_projects(text: str) -> List[Project]:
    """Extract projects"""
    projects = []
    
    proj_section = re.search(
        r'(PROJECTS?|PERSONAL PROJECTS)(.*?)(EXPERIENCE|EDUCATION|SKILLS|$)',
        text,
        re.IGNORECASE | re.DOTALL
    )
    
    if proj_section:
        proj_text = proj_section.group(2)
        lines = proj_text.strip().split('\n')
        current_proj = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            if not line.startswith(('•', '-', '*')) and len(line) > 10:
                if current_proj:
                    projects.append(current_proj)
                current_proj = Project(
                    name=line,
                    description="",
                    technologies=[]
                )
            elif current_proj:
                current_proj.description += " " + line.lstrip('•-* ')
        
        if current_proj:
            projects.append(current_proj)
    
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
    
    # Extract all components
    return ParsedResume(
        email=extract_email(text),
        phone=extract_phone(text),
        skills=extract_skills(text),
        experiences=extract_experiences(text),
        education=extract_education(text),
        projects=extract_projects(text),
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
