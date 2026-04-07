<div align="center">

<br/>

```
███████╗██╗  ██╗██╗██╗     ██╗     ██████╗ ██████╗ ██╗██████╗  ██████╗ ███████╗
██╔════╝██║ ██╔╝██║██║     ██║     ██╔══██╗██╔══██╗██║██╔══██╗██╔════╝ ██╔════╝
███████╗█████╔╝ ██║██║     ██║     ██████╔╝██████╔╝██║██║  ██║██║  ███╗█████╗  
╚════██║██╔═██╗ ██║██║     ██║     ██╔══██╗██╔══██╗██║██║  ██║██║   ██║██╔══╝  
███████║██║  ██╗██║███████╗███████╗██████╔╝██║  ██║██║██████╔╝╚██████╔╝███████╗
╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚═════╝ ╚═╝  ╚═╝╚═╝╚═════╝  ╚═════╝ ╚══════╝

                        A  I   C A R E E R   P L A T F O R M
```

<br/>

**An agentic AI career platform that analyzes resumes, identifies skill gaps,  
generates personalized roadmaps, and conducts mock interviews  
to accelerate job placement.**

<br/>

![Python](https://img.shields.io/badge/Python-FastAPI-blue?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![AI](https://img.shields.io/badge/AI-Multi--Model-black?style=for-the-badge&logo=openai&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)

<br/>

[View Demo](#demo-video) · [Report Bug](https://github.com) · [Request Feature](https://github.com)

</div>

---

<br/>

## Table of Contents

- [Project Overview](#project-overview)
- [Screenshots](#screenshots)
- [Demo Video](#demo-video)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)

<br/>

---

## Project Overview

SkillBridge AI is a full-stack agentic career operating system that provides end-to-end career preparation through AI-powered analysis, personalized learning paths, and adaptive assessments.

| Capability | Description |
|---|---|
| Resume Intelligence | Smart resume parsing with ATS optimization |
| JD Matching | AI-driven job description matching & gap analysis |
| Learning Roadmaps | Personalized learning paths for 4 / 8 / 12 weeks |
| Adaptive Assessment | Quizzes with dynamic difficulty progression |
| Mock Interviews | Technical and HR simulations with live AI feedback |
| Progress Tracking | Visual dashboards with real-time completion metrics |
| Admin Analytics | Comprehensive insights and executive-level reporting |

<br/>

---

## Screenshots

> _Replace placeholders below with actual screenshots of the platform._

<br/>

<div align="center">

| Resume Analyzer | Learning Roadmap | Mock Interview |
|:---:|:---:|:---:|
| ![Resume Analyzer]<img width="1898" height="899" alt="image" src="https://github.com/user-attachments/assets/31b03b14-7adc-4f5f-94f4-3d577f649346" />
| ![Learning Roadmap]<img width="1894" height="901" alt="image" src="https://github.com/user-attachments/assets/405bd9c7-8829-4803-ac24-667dae8f33af" />
| ![Mock Interview]<img width="1888" height="883" alt="image" src="https://github.com/user-attachments/assets/8b3f718a-3b18-4519-b3f8-b33afb6f50d8" />
|
| _ATS scoring & keyword suggestions_ | _Week-by-week personalized plan_ | _AI-evaluated interview simulation_ |

| JD Matcher | Adaptive Quiz | Admin Dashboard |
|:---:|:---:|:---:|
| ![JD Matcher](https://via.placeholder.com/320x200?text=JD+Matcher) | ![Adaptive Quiz](https://via.placeholder.com/320x200?text=Adaptive+Quiz) | ![Admin Dashboard](https://via.placeholder.com/320x200?text=Admin+Dashboard) |
| _Skill gap identification_ | _Domain-specific assessments_ | _Analytics & student management_ |

</div>

<br/>

---

## Demo Video

<div align="center">

[![Watch the Demo](https://img.shields.io/badge/Watch%20Demo-YouTube-red?style=for-the-badge&logo=youtube&logoColor=white)](https://youtube.com)

> _Replace the link above with your actual demo video URL._

</div>

<br/>

---

## Features

### For Students

**Resume Analyzer**
Upload your resume, extract structured data, receive an ATS compatibility score, and get targeted improvement suggestions tailored to your target role.

**JD Matcher**
Paste any job description and instantly see how well your resume matches — including a match percentage, skill gap breakdown, and prioritized action items.

**Learning Roadmap**
Receive an AI-generated, week-by-week learning plan customized to your current skills and target role. Timelines available in 4, 8, and 12-week formats.

**Adaptive Quiz**
Domain-specific quizzes (DSA, Web Dev, and more) that increase in difficulty as you improve. Each question includes instant feedback and a detailed explanation.

**Mock Interviews**
Choose between Technical and HR interview modes. The AI generates context-aware questions, evaluates your responses in real time, and delivers structured feedback with scores.

**Progress Tracker**
Visualize your learning journey with completion metrics, skill milestones, and performance trends — all in one dashboard.

**Job Search**
AI-matched job recommendations pulled from multiple sources, ranked by compatibility with your resume.

---

### For Admins

**Student Management** — View and manage all student profiles from a centralized interface.

**Eligibility Control** — Define placement eligibility thresholds by CGPA, ATS score, and skill criteria.

**Analytics Dashboard** — Comprehensive metrics with interactive visualizations across the entire student cohort.

**Executive Summary** — High-level insights and AI-generated recommendations for placement strategy.

<br/>

---

## Architecture

```
+--------------------------------------------------+
|                    CLIENT LAYER                  |
|                                                  |
|          React 18 + Vite  (localhost:5173)       |
|    Framer Motion  |  Recharts  |  Axios          |
+------------------------+-------------------------+
                         |
                    HTTPS / REST
                         |
+------------------------v-------------------------+
|                   SERVER LAYER                   |
|                                                  |
|         FastAPI + Uvicorn  (localhost:8001)      |
|   Pydantic Schemas  |  Business Logic Services   |
|                                                  |
|   +--------------------------------------------+ |
|   |              AI MODEL ROUTER               | |
|   |                                            | |
|   |  DeepSeek R1 8B   -->  Resume / ATS        | |
|   |  DeepSeek V3.2    -->  JD Analysis         | |
|   |  GPT-OSS 20B      -->  Roadmap Generation  | |
|   |  DeepSeek Coder   -->  Quiz Generation     | |
|   |  Gemma 3 27B      -->  Mock Interviews     | |
|   +--------------------------------------------+ |
+----------+------------------+--------------------+
           |                  |
    +------v------+    +------v------+
    |  Supabase   |    |  Job APIs   |
    | PostgreSQL  |    | Adzuna etc. |
    |  JSONB RLS  |    |             |
    +-------------+    +-------------+
```

**Data Flow**

```
1. Resume Upload     ->  FastAPI processes  ->  Supabase stores structured data
2. AI Request        ->  Model Router       ->  Targeted AI model  ->  Response
3. Real-time Update  ->  Supabase listener  ->  React UI re-renders
```

<br/>

---

## Tech Stack

### Frontend

| Technology | Role |
|---|---|
| React 18 | UI library with hooks-based state management |
| Vite | Fast build tooling and local dev server |
| Framer Motion | Smooth animations and transitions |
| Recharts | Data visualization and chart rendering |
| Axios | HTTP client for API communication |
| Supabase JS | Real-time database subscriptions and auth |

### Backend

| Technology | Role |
|---|---|
| FastAPI | Modern, high-performance Python web framework |
| Uvicorn | ASGI server for async request handling |
| Pydantic | Data validation and schema enforcement |
| PyMuPDF | PDF resume parsing |
| python-docx | Word document parsing |
| scikit-learn | ML algorithms for scoring and matching |
| Redis | Caching layer for performance optimization |

### Database

| Technology | Role |
|---|---|
| Supabase (PostgreSQL) | Primary relational database |
| JSONB | Flexible semi-structured data storage |
| Row Level Security | Per-user data isolation and protection |

### AI Models

| Model | Purpose |
|---|---|
| DeepSeek R1 8B | Resume analysis & ATS scoring |
| DeepSeek V3.2 | Job description analysis |
| GPT-OSS 20B | Roadmap generation |
| DeepSeek Coder 33B | Quiz generation |
| Gemma 3 27B | Mock interviews |

<br/>

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/resume/upload` | Upload and parse a resume |
| `POST` | `/api/resume/analyze` | Get ATS score and improvement suggestions |
| `POST` | `/api/jd/match` | Match resume against a job description |
| `POST` | `/api/roadmap` | Generate a personalized learning roadmap |
| `POST` | `/api/quiz/generate` | Create an adaptive domain quiz |
| `POST` | `/api/quiz/evaluate` | Evaluate submitted quiz answers |
| `POST` | `/api/interview/start` | Begin a mock interview session |
| `POST` | `/api/interview/evaluate` | Score and analyze interview responses |
| `GET` | `/api/progress/{id}` | Retrieve student progress data |
| `POST` | `/api/jobs/search` | Search AI-matched job recommendations |
| `GET` | `/api/admin/students` | List all student profiles (admin) |

> Interactive API documentation available at `http://localhost:8001/docs`

<br/>

---

## Project Structure

```
SkillBridge-AI/
|
+-- frontend/
|   +-- src/
|   |   +-- components/        # Reusable React UI components
|   |   +-- lib/               # Supabase client configuration
|   |   +-- utils/             # API utility functions
|   |   +-- App.jsx            # Root application component
|   +-- package.json
|   +-- vite.config.js
|
+-- backend/
|   +-- app/
|   |   +-- api/               # FastAPI route handlers
|   |   +-- core/              # App configuration and settings
|   |   +-- models/            # Pydantic request/response schemas
|   |   +-- services/          # Core business logic
|   +-- supabase/
|   |   +-- schema.sql         # Full database schema definition
|   +-- requirements.txt
|   +-- main.py
|
+-- README.md
```

<br/>

---

## Installation & Setup

### Prerequisites

- Python 3.9 or higher
- Node.js 18 or higher
- A Supabase project (free tier works)
- AI API keys (Oxlo / OpenAI / Anthropic)

---

### Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install all dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Open .env and fill in your credentials

# Start the FastAPI server
python main.py
```

> Backend runs at `http://localhost:8001`

---

### Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Open .env and add your Supabase credentials

# Start the development server
npm run dev
```

> Frontend runs at `http://localhost:5173`

<br/>

---

## Environment Variables

### Backend — `backend/.env`

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

# Server Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=5
```

### Frontend — `frontend/.env`

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

<br/>

---

## Features in Detail

### Resume Analysis
- Extracts name, email, phone, education, experience, and skills
- Calculates an ATS compatibility score
- Identifies missing keywords for target roles
- Provides structured improvement suggestions

### JD Matching
- Compares resume content against job requirements
- Outputs a match percentage with confidence scoring
- Identifies specific skill gaps
- Prioritizes areas for focused improvement

### Learning Roadmap
- Generates a week-by-week structured learning plan
- Adapts content to the student's existing skill baseline
- Includes curated resources and milestone checkpoints
- Tracks individual task completion in real time

### Adaptive Quiz
- Domain-specific question banks (DSA, Web Dev, and more)
- Automatic difficulty progression based on live performance
- Instant answer feedback with detailed explanations
- Highlights weak areas for targeted review

### Mock Interviews
- Supports both Technical and HR interview modes
- Generates context-aware, role-specific questions
- Evaluates responses in real time using AI scoring
- Delivers structured feedback with numerical scoring

<br/>

---

## Future Improvements

- [ ] Voice-based interview practice
- [ ] Real-time collaborative coding challenges
- [ ] LinkedIn and GitHub profile integration
- [ ] Mobile application (React Native)
- [ ] Multi-language platform support
- [ ] Advanced analytics with ML-powered predictions
- [ ] Peer-to-peer mock interview scheduling
- [ ] Company-specific interview preparation tracks
- [ ] Resume template generator
- [ ] Salary negotiation simulator

<br/>





---

## License

This project is licensed under the **MIT License**.  
See the `LICENSE` file for full details.

<br/>

---

<div align="center">

**Built with purpose. Powered by AI. Designed for impact.**

If you found this project useful, please consider giving it a star.

[![Star on GitHub](https://img.shields.io/github/stars/yourusername/skillbridge-ai?style=social)](https://github.com)

</div>
