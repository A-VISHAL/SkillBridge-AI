# SkillBridge AI

> An Agentic Career Operating System that continuously analyzes, plans, trains, evaluates, and places students.

**Not just a chatbot — a complete AI career mentor that adapts until you get placed.**

---

## 🎯 What is SkillBridge AI?

SkillBridge AI is a full-stack AI-powered career platform that reads your resume, finds gaps, teaches you, tests you, interviews you, and connects you to jobs — all in one continuous AI loop.

### The Agentic Pipeline

```
Resume Upload → Skill Extraction → JD Matching → Gap Detection → 
Roadmap Generation → Quiz & Interview → Progress Tracking → 
Adaptive AI Decisions → Job Matching → Continuous Loop
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn
- Anthropic Claude API key (optional, for AI-powered parsing)

### One-Command Start (Windows)
```bash
# Simply run the start script
start.bat
```

This will automatically:
1. Start the backend server on http://localhost:8000
2. Start the frontend server on http://localhost:5173

### Manual Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Anthropic API key
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs on: **http://localhost:8000**

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: **http://localhost:5173**

---

## ✨ Core Features

### 1. 🔍 Resume Analyzer (HIGH IMPACT)

**What it does:** AI-powered resume analysis with ATS scoring and improvements

**Features:**
- **Dual Parsing System**: AI-powered (Anthropic Claude) + Regex fallback
- Intelligent extraction of Experience, Education, Skills, Projects
- ATS Score (0-100)
- Missing keywords detection
- Weak bullet points identification
- Grammar and formatting issues
- Action verb suggestions
- Before/After bullet point improvements

**How it works:**
1. Upload resume (PDF/DOCX/TXT)
2. AI extracts structured data using Claude API
3. Parses Experience (title, company, duration, descriptions)
4. Parses Education (degree, institution, year, CGPA)
5. Extracts Skills and Projects with technologies
6. Generates ATS score and detailed feedback
7. Provides rewritten bullet points with metrics

**Example Output:**
```json
{
  "ats_score": 72,
  "issues": [
    "No measurable impact in experience bullets",
    "Weak action verbs used",
    "Missing relevant keywords"
  ],
  "missing_keywords": ["Docker", "Kubernetes", "CI/CD"],
  "improvements": [
    "Add quantifiable achievements",
    "Use strong action verbs",
    "Include technical keywords"
  ],
  "rewritten_bullets": [
    {
      "before": "Worked on web development projects",
      "after": "Architected and deployed 5+ web applications serving 10K+ users, reducing load time by 40%",
      "impact_score": 9
    }
  ]
}
```

---

### 2. 🎯 JD Matcher + Focus Engine (UNIQUE FEATURE)

**What it does:** Analyzes job descriptions and tells you exactly what to focus on

**Features:**
- Match percentage calculation
- Hire probability assessment
- Matched vs Missing skills
- **Focus Engine**: Prioritizes what to study FIRST
- Interview preparation topics
- Skill weight analysis

**The Focus Engine Advantage:**
Unlike other tools that just list skills, our Focus Engine tells you:
- What to study FIRST (HIGH priority)
- What to IGNORE (LOW priority)
- What has HIGH IMPACT (% of JD weight)
- Estimated study time for each skill

**Example Output:**
```json
{
  "match_percentage": 68,
  "hire_probability": "Medium",
  "matched_skills": ["Python", "React", "MongoDB"],
  "missing_skills": ["Docker", "Kubernetes", "AWS"],
  "focus_areas": [
    {
      "skill": "Docker",
      "priority": "HIGH",
      "weight": 25,
      "reason": "Critical for deployment pipeline - mentioned 8 times in JD",
      "study_time": "2-3 weeks"
    },
    {
      "skill": "Kubernetes",
      "priority": "MEDIUM",
      "weight": 15,
      "reason": "Required for scaling - nice to have",
      "study_time": "3-4 weeks"
    }
  ]
}
```

---

### 3. 🗺️ Smart Roadmap Generator

**What it does:** Creates personalized learning paths based on skill gaps

**Features:**
- Week-by-week learning plan
- Task breakdown with resources
- Difficulty-based progression
- Time-based planning (customizable hours/day)
- Milestone tracking

**Example Roadmap:**
```
Week 1: Docker Fundamentals (14 hours)
  - Learn containerization basics
  - Build first Docker image
  - Resources: Docker docs, YouTube tutorials
  [MILESTONE]

Week 2: Docker Compose (14 hours)
  - Multi-container applications
  - Networking and volumes
  
Week 3-4: Kubernetes Basics (28 hours)
  - Pods, Services, Deployments
  - First K8s cluster
  [MILESTONE]
```

---

### 4. 📝 Adaptive Quiz Engine

**What it does:** Generates quizzes and detects weak areas

**Features:**
- Multiple choice questions
- Coding challenges (DSA/Frontend/Backend)
- Difficulty levels (Easy/Medium/Hard)
- Topic-wise performance tracking
- Adaptive difficulty adjustment
- Detailed explanations

**Quiz Flow:**
1. Select topic (e.g., "JavaScript", "React", "DSA")
2. AI generates 5-10 questions
3. User answers
4. AI evaluates and identifies weak areas
5. Suggests revision topics

---

### 5. 🎤 AI Mock Interview (STAR FEATURE)

**What it does:** Simulates real technical and HR interviews with live evaluation

**Features:**
- Role-based questions (Frontend/Backend/Full-stack)
- HR and Technical interview modes
- Real-time answer evaluation
- Score per answer (0-10)
- Strengths and weaknesses analysis
- Model answer provided
- Confidence level assessment
- Improvement tips

**Interview Flow:**
```
1. Select mode: Technical or HR
2. AI asks first question
3. User types answer
4. AI evaluates immediately:
   - Score: 7/10
   - Strengths: Good structure, relevant examples
   - Weaknesses: Missing key technical details
   - Model Answer: [Better version]
   - Confidence: Medium
5. Next question (adaptive based on performance)
```

**Example Evaluation:**
```json
{
  "score": 7,
  "strengths": [
    "Clear communication",
    "Good use of STAR method",
    "Relevant project example"
  ],
  "weaknesses": [
    "Could add more technical depth",
    "Missing specific metrics"
  ],
  "model_answer": "A strong answer would include...",
  "confidence_level": "Medium",
  "improvement_tips": [
    "Practice STAR method more",
    "Add quantifiable results"
  ]
}
```

---

### 6. 📊 Progress Intelligence Engine (AGENTIC CORE)

**What it does:** Tracks all activities and makes AI-driven decisions

**Features:**
- Quiz score tracking
- Interview performance monitoring
- Task completion tracking
- Weak area identification
- **AI Decision Making**: Tells you what to do next

**AI Decisions:**
1. **"Revise this topic"** - When quiz scores < 60%
2. **"Move ahead"** - When making good progress
3. **"Ready for interviews"** - When quiz > 80% and interview > 7/10

**Example:**
```json
{
  "decision": "revise",
  "topic": "JavaScript Closures",
  "reason": "Quiz score 45% - below threshold",
  "next_action": "Review closures tutorial and retake quiz",
  "confidence": 0.85
}
```

---

### 7. 💼 AI Job Finder

**What it does:** Finds matching jobs from multiple sources

**Features:**
- Resume-based job search
- Multiple sources (Adzuna, RapidAPI, Google Jobs)
- Match percentage for each job
- Skill-based filtering
- Direct apply links
- Salary information
- Location filtering

**Job Search Flow:**
1. AI extracts skills from resume
2. Generates optimized search queries
3. Fetches jobs from APIs
4. Calculates match percentage
5. Ranks by relevance
6. Displays with apply links

---

### 8. 🧑‍🏫 Daily AI Coach

**What it does:** Provides daily motivation and guidance

**Features:**
- Daily reminders
- Motivational messages
- Personalized suggestions
- Focus topic recommendations
- Progress updates

---

### 9. 🗂️ Portfolio Project Generator

**What it does:** Suggests projects based on target role

**Features:**
- Role-based project suggestions
- Difficulty levels
- Technology stack recommendations
- Estimated completion time
- Learning outcomes
- Resource links

**Example for Frontend Developer:**
```json
{
  "projects": [
    {
      "name": "Real-time Chat Application",
      "difficulty": "Medium",
      "technologies": ["React", "Node.js", "Socket.io", "MongoDB"],
      "estimated_days": 14,
      "learning_outcomes": [
        "WebSocket communication",
        "Real-time state management",
        "Authentication & authorization"
      ]
    },
    {
      "name": "Netflix Clone",
      "difficulty": "Hard",
      "technologies": ["React", "TypeScript", "Tailwind", "Firebase"],
      "estimated_days": 21
    }
  ]
}
```

---

## 🏗️ System Architecture

### Backend (Python/FastAPI)
```
backend/
├── app/
│   ├── api/
│   │   └── routes.py          # 20+ REST endpoints
│   ├── core/
│   │   └── config.py          # Configuration management
│   ├── models/
│   │   └── schemas.py         # 30+ Pydantic models
│   ├── services/
│   │   ├── parser.py          # Regex-based resume parsing
│   │   ├── ai_parser.py       # AI-powered parsing (Anthropic Claude)
│   │   ├── ai_service.py      # AI/LLM integration
│   │   └── job_service.py     # Job search APIs
│   └── utils/
├── main.py                     # FastAPI application
├── requirements.txt
├── .env                        # Environment variables (not in git)
└── .env.example                # Example configuration
```

### Frontend (React/Vite)
```
frontend/
├── src/
│   ├── components/
│   │   ├── ResumeUpload.jsx
│   │   ├── ResumeAnalysis.jsx
│   │   ├── JDMatcher.jsx
│   │   ├── Roadmap.jsx
│   │   ├── Quiz.jsx
│   │   ├── Interview.jsx
│   │   ├── JobSearch.jsx
│   │   └── ProgressTracker.jsx
│   ├── utils/
│   │   └── api.js             # API client
│   ├── App.jsx
│   └── index.css
└── package.json
```

---

## 🎨 Design System (Apple-Inspired Light Theme)

### Visual Features
- **Subtle Animated Particles**: Floating background animations throughout the app
- **Horizontal Timeline**: "From zero to hired in 4 steps" process visualization
- **Card-Based Layout**: Separate cards for Personal Info, Skills, Experience, Education, Projects
- **Smooth Transitions**: All interactions have smooth animations
- **Responsive Design**: Works on desktop, tablet, and mobile

### Color Palette (Monochromatic)
```css
/* Primary Colors */
--primary: #007AFF;        /* Apple Blue */
--primary-light: #5AC8FA;
--primary-dark: #0051D5;

/* Neutrals (Monochromatic) */
--gray-50: #FAFAFA;
--gray-100: #F5F5F7;
--gray-200: #E8E8ED;
--gray-300: #D2D2D7;
--gray-400: #AEAEB2;
--gray-500: #8E8E93;
--gray-600: #636366;
--gray-700: #48484A;
--gray-800: #3A3A3C;
--gray-900: #1C1C1E;

/* Semantic Colors */
--success: #34C759;
--warning: #FF9500;
--error: #FF3B30;
--info: #5AC8FA;

/* Background */
--bg-primary: #FFFFFF;
--bg-secondary: #F5F5F7;
--bg-tertiary: #FAFAFA;

/* Text */
--text-primary: #1C1C1E;
--text-secondary: #3A3A3C;
--text-tertiary: #8E8E93;
```

### Typography
```css
/* Font Family */
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 
             'Segoe UI', 'Helvetica Neue', Arial, sans-serif;

/* Font Sizes */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 30px;
--text-4xl: 36px;
--text-5xl: 48px;

/* Font Weights */
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing System
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
```

### Border Radius
```css
--radius-sm: 6px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-full: 9999px;
```

### Shadows (Subtle, Apple-style)
```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
--shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.16);
```

### UI Components Style Guide

**Buttons:**
```css
.btn-primary {
  background: var(--primary);
  color: white;
  padding: 12px 24px;
  border-radius: var(--radius-full);
  font-weight: var(--font-semibold);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

**Cards:**
```css
.card {
  background: var(--bg-primary);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

**Input Fields:**
```css
.input {
  background: var(--bg-secondary);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-size: var(--text-base);
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
}
```

---

## 📡 API Endpoints

### Resume Operations
- `POST /api/resume/upload` - Upload and parse resume (AI-powered)
- `GET /api/resume/sample` - Get sample resume
- `POST /api/resume/analyze` - Analyze resume (ATS score, problems)
- `GET /api/test-ai` - Test AI API connection (Anthropic Claude)

### JD Matching
- `POST /api/jd/match` - Match resume to job description

### Skill Gap & Roadmap
- `POST /api/skill-gap` - Analyze skill gaps
- `POST /api/roadmap` - Generate personalized roadmap

### Quiz System
- `POST /api/quiz/generate` - Generate adaptive quiz
- `POST /api/quiz/evaluate` - Evaluate quiz answers

### Interview System
- `POST /api/interview/start` - Start mock interview
- `POST /api/interview/evaluate` - Evaluate interview answer
- `GET /api/interview/session/{id}` - Get session details

### Progress Tracking
- `POST /api/progress/track` - Track learning progress
- `GET /api/progress/{resume_id}` - Get progress metrics

### Job Search
- `POST /api/jobs/search` - Find matching jobs

### Coaching & Portfolio
- `GET /api/coach/daily` - Get daily coaching
- `POST /api/portfolio/suggest` - Suggest portfolio projects

---

## 🔐 Environment Configuration

Create a `.env` file in the backend directory:

```bash
# AI Service (Anthropic Claude API)
OXLO_API_KEY=your_anthropic_api_key_here
OXLO_CHAT_ENDPOINT=https://api.anthropic.com/v1/messages
OXLO_EMBEDDINGS_ENDPOINT=https://api.oxlo.ai/v1/embeddings

# Job Search APIs
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
RAPIDAPI_KEY=your_rapidapi_key

# Server Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=5

# Redis (optional)
REDIS_URL=redis://localhost:6379
CACHE_TTL_MINUTES=15

# Job Search Config
MAX_JOBS_PER_QUERY=50
MIN_SKILL_MATCH_RATIO=0.6
API_TIMEOUT_SECONDS=10
```

**Note:** 
- The application uses **Anthropic Claude API** for AI-powered resume parsing and analysis
- Get your API key from: https://console.anthropic.com/
- The application works with fallback regex parsing if no API key is provided

---

## 🎤 Demo Presentation Script

### Opening (30 seconds)
"SkillBridge AI is an Agentic Career Operating System that continuously analyzes, plans, trains, evaluates, and places students. This is not just a chatbot — it's a complete AI career mentor."

### Feature Demo (4 minutes)

**1. Resume Analysis (1 minute)**
- Upload sample resume
- Show ATS score: 72/100
- Highlight problems: "No measurable impact", "Weak action verbs"
- Show before/after bullet improvements

**2. JD Matching + Focus Engine (1 minute)**
- Paste job description
- Show 68% match, Medium hire probability
- **Highlight Focus Engine**: "Docker is HIGH priority - 25% of JD weight, study for 2-3 weeks"
- Show matched vs missing skills

**3. Learning & Testing (1 minute)**
- Display 12-week personalized roadmap
- Generate quiz on weak topic
- Start mock interview
- Show real-time evaluation: 7/10 score with feedback

**4. Jobs & Progress (1 minute)**
- Show matching jobs with percentages
- Display progress metrics
- **Show AI decision**: "You're ready for interviews!"

### Closing (30 seconds)
"SkillBridge AI creates a continuous agentic loop - it doesn't just give advice once, it adapts with you until you get placed. Thank you!"

---

## 🏆 Why SkillBridge AI Wins

1. **Complete Solution** - 9 integrated features, not just one tool
2. **Agentic Loop** - Continuous adaptation based on user performance
3. **Focus Engine** - Unique prioritization system (what to study FIRST)
4. **Real Problem** - Addresses critical placement challenges
5. **Technical Depth** - Full-stack with AI integration
6. **Beautiful UI** - Apple-inspired professional design
7. **Live Demo Ready** - Everything works out of the box

---

## 🚀 Deployment

### Backend (Railway/Render)
```bash
# Create Procfile
echo "web: uvicorn main:app --host 0.0.0.0 --port \$PORT" > Procfile

# Deploy to Railway
railway up
```

### Frontend (Vercel/Netlify)
```bash
# Build
npm run build

# Deploy to Vercel
vercel --prod
```

---

## 📊 Tech Stack

**Backend:**
- FastAPI (Python)
- Pydantic (Data validation)
- PyMuPDF (PDF parsing)
- python-docx (DOCX parsing)
- httpx (Async HTTP client)
- Anthropic Claude API (AI-powered resume parsing)
- Adzuna API (Job search)

**Frontend:**
- React 18
- Vite
- Axios
- React Dropzone

**Design:**
- Apple-inspired light theme
- Monochromatic color scheme
- SF Pro Display font family
- Subtle shadows and animations

---

## 🎓 Key Differentiators

### 1. Focus Engine (Unique!)
Other tools just list skills. We tell you:
- What to study FIRST
- What to IGNORE
- What has HIGH IMPACT
- Estimated study time

### 2. Agentic Loop (Unique!)
Not a one-time output system:
- Tracks quiz scores
- Monitors interview performance
- Adapts roadmap automatically
- Makes AI decisions: "Revise" / "Move ahead" / "Ready"

### 3. Complete Platform
- Resume analysis
- JD matching
- Learning roadmap
- Adaptive quizzes
- Mock interviews
- Job search
- Progress tracking
- All in one place!

---

## 📞 Support & Documentation

- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Frontend**: http://localhost:5173

---

## 🎉 Getting Started

1. Clone the repository
2. Set up backend (see Backend Setup)
3. Set up frontend (see Frontend Setup)
4. Open http://localhost:5173
5. Click "Use Sample Resume"
6. Explore all features!

---

## 📝 License

Built for educational purposes.

---

## 🌟 Final Positioning

**SkillBridge AI is an Agentic Career Operating System that continuously analyzes, plans, trains, evaluates, and places students.**

Not just a chatbot — a complete AI career mentor that adapts until you get placed.

---

**Built with ❤️ for HackHazards '26**
