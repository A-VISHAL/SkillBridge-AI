# SkillBridge AI

> An agentic AI career platform that analyzes resumes, identifies skill gaps, generates personalized roadmaps, and conducts mock interviews to accelerate job placement.

![Python](https://img.shields.io/badge/Python-FastAPI-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E)
![AI](https://img.shields.io/badge/AI-Multi--Model-black)

---

## 🎯 Project Overview

SkillBridge AI is a full-stack agentic career operating system that provides end-to-end career preparation through AI-powered analysis, personalized learning paths, and adaptive assessments.

**Key Capabilities:**
- Smart resume parsing with ATS optimization
- AI-driven job description matching
- Personalized learning roadmaps
- Adaptive quiz generation
- Mock interview simulations
- Real-time progress tracking
- Admin analytics dashboard

---

## ✨ Features

### 🎓 For Students
- **Resume Analyzer** - Upload resume, extract data, get ATS score and improvement suggestions
- **JD Matcher** - Match resume against job descriptions with skill gap analysis
- **Learning Roadmap** - AI-generated personalized learning paths (4/8/12 weeks)
- **Adaptive Quiz** - Domain-specific quizzes with difficulty progression
- **Mock Interviews** - Technical and HR interview simulations with AI feedback
- **Progress Tracker** - Visual progress tracking with completion metrics
- **Job Search** - AI-matched job recommendations from multiple sources

### 👨‍💼 For Admins
- **Student Management** - View and manage student profiles
- **Eligibility Control** - Set CGPA, ATS score, and skill requirements
- **Analytics Dashboard** - Comprehensive metrics and visualizations
- **Executive Summary** - High-level insights and recommendations

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library with hooks
- **Vite** - Fast build tool and dev server
- **Framer Motion** - Animation library
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **Supabase JS** - Database client

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **PyMuPDF** - PDF parsing
- **python-docx** - Word document parsing
- **scikit-learn** - ML algorithms
- **Redis** - Caching layer

### Database
- **Supabase (PostgreSQL)** - Primary database
- **JSONB** - Flexible data storage
- **Row Level Security** - Data protection

### AI Models
| Model | Purpose |
|-------|---------|
| DeepSeek R1 8B | Resume analysis & ATS scoring |
| DeepSeek V3.2 | Job description analysis |
| GPT-OSS 20B | Roadmap generation |
| DeepSeek Coder 33B | Quiz generation |
| Gemma 3 27B | Mock interviews |

---

## 🏗️ Architecture

```
┌─────────────────┐
│  React + Vite   │
│   (Frontend)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│  FastAPI Server │─────▶│  AI Models   │
│    (Backend)    │      │  (Oxlo API)  │
└────────┬────────┘      └──────────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│    Supabase     │      │  Job APIs    │
│  (PostgreSQL)   │      │ (Adzuna etc) │
└─────────────────┘      └──────────────┘
```

**Data Flow:**
1. User uploads resume → FastAPI processes → Supabase stores
2. AI analysis request → Model router → Specific AI model → Response
3. Real-time updates → Supabase subscriptions → React UI

---

## 🚀 Installation

### Prerequisites
- Python 3.9+
- Node.js 18+
- Supabase account
- AI API keys (Oxlo/OpenAI/Anthropic)

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run server
python main.py
```

Backend runs on `http://localhost:8001`

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Run dev server
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## 🔐 Environment Variables

### Backend (.env)

```env
# AI Model Configuration
OXLO_API_KEY=your_api_key_here
ATS_MODEL=deepseek-r1-8b
JD_MODEL=deepseek-v3.2
ROADMAP_MODEL=gpt-oss-20b
QUIZ_MODEL=deepseek-coder-33b
INTERVIEW_MODEL=gemma-3-27b

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Job APIs (Optional)
ADZUNA_APP_ID=your_adzuna_id
ADZUNA_APP_KEY=your_adzuna_key
RAPIDAPI_KEY=your_rapidapi_key

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# Server Config
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=5
```

### Frontend (.env)

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resume/upload` | Upload and parse resume |
| POST | `/api/resume/analyze` | Get ATS score and suggestions |
| POST | `/api/jd/match` | Match resume with JD |
| POST | `/api/roadmap` | Generate learning roadmap |
| POST | `/api/quiz/generate` | Create adaptive quiz |
| POST | `/api/quiz/evaluate` | Evaluate quiz answers |
| POST | `/api/interview/start` | Start mock interview |
| POST | `/api/interview/evaluate` | Score interview responses |
| GET | `/api/progress/{id}` | Get student progress |
| POST | `/api/jobs/search` | Search matched jobs |
| GET | `/api/admin/students` | List all students |

**API Documentation:** `http://localhost:8001/docs`

---

## 📁 Project Structure

```
SkillBridge-AI/
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── lib/           # Supabase client
│   │   ├── utils/         # API utilities
│   │   └── App.jsx        # Main app component
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── core/          # Configuration
│   │   ├── models/        # Pydantic schemas
│   │   └── services/      # Business logic
│   ├── supabase/
│   │   └── schema.sql     # Database schema
│   ├── requirements.txt
│   └── main.py
└── README.md
```

---

## 🎨 Features in Detail

### Resume Analysis
- Extracts name, email, phone, education, experience, skills
- Calculates ATS compatibility score
- Identifies missing keywords
- Suggests improvements

### JD Matching
- Compares resume against job requirements
- Calculates match percentage
- Identifies skill gaps
- Prioritizes focus areas

### Learning Roadmap
- Generates week-by-week learning plan
- Adapts to student's current skills
- Includes resources and milestones
- Tracks task completion

### Adaptive Quiz
- Domain-specific questions (DSA, Web Dev, etc.)
- Difficulty progression based on performance
- Instant feedback and explanations
- Weak area identification

### Mock Interviews
- Technical and HR interview modes
- Context-aware questions
- Real-time AI evaluation
- Detailed feedback and scoring

---

## 🔮 Future Improvements

- [ ] Voice-based interview practice
- [ ] Real-time collaborative coding challenges
- [ ] Integration with LinkedIn and GitHub
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Advanced analytics with ML predictions
- [ ] Peer-to-peer mock interviews
- [ ] Company-specific interview prep
- [ ] Resume template generator
- [ ] Salary negotiation simulator

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Team

Built with ❤️ by the SkillBridge AI Team

---

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Email: support@skillbridge.ai
- Documentation: [docs.skillbridge.ai](https://docs.skillbridge.ai)

---

**⭐ Star this repo if you find it helpful!**
