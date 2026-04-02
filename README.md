<div align="center">

```
███████╗██╗  ██╗██╗██╗     ██╗     ██████╗ ██████╗ ██╗██████╗  ██████╗ ███████╗
██╔════╝██║ ██╔╝██║██║     ██║     ██╔══██╗██╔══██╗██║██╔══██╗██╔════╝ ██╔════╝
███████╗█████╔╝ ██║██║     ██║     ██████╔╝██████╔╝██║██║  ██║██║  ███╗█████╗  
╚════██║██╔═██╗ ██║██║     ██║     ██╔══██╗██╔══██╗██║██║  ██║██║   ██║██╔══╝  
███████║██║  ██╗██║███████╗███████╗██████╔╝██║  ██║██║██████╔╝╚██████╔╝███████╗
╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚═════╝ ╚═╝  ╚═╝╚═╝╚═════╝  ╚═════╝ ╚══════╝
```

# SkillBridge AI
### 🤖 An Agentic Career Operating System

**Not just a chatbot — a complete AI career mentor that continuously analyzes, plans, trains, evaluates, and places you.**

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Claude API](https://img.shields.io/badge/Anthropic-Claude_API-CC785C?style=flat-square)](https://anthropic.com)
[![License](https://img.shields.io/badge/License-Educational-lightgrey?style=flat-square)](LICENSE)

[Live Demo](#-quick-start) · [Features](#-core-features) · [Architecture](#-system-architecture) · [API Docs](#-api-reference) · [Deploy](#-deployment)

---

</div>

## 📖 Table of Contents

- [What is SkillBridge AI?](#-what-is-skillbridge-ai)
- [The Agentic Pipeline](#-the-agentic-pipeline)
- [System Architecture](#-system-architecture)
- [Workflow Diagrams](#-workflow-diagrams)
- [Core Features](#-core-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [Key Differentiators](#-key-differentiators)
- [Deployment](#-deployment)
- [Demo Script](#-demo-presentation-script)

---

## 🎯 What is SkillBridge AI?

SkillBridge AI is a **full-stack, AI-powered career platform** that reads your resume, identifies gaps, teaches you, tests you, interviews you, and connects you to jobs — all in one **continuous agentic loop**.

It goes beyond static tools. The system **adapts to your performance**, re-routes your learning path, and makes intelligent decisions like `"Revise this topic"`, `"Move ahead"`, or `"You're ready for interviews!"` — automatically.

### Core Philosophy

| Traditional Career Tools | SkillBridge AI |
|--------------------------|---------------|
| One-time resume review | Continuous loop with adaptive feedback |
| Generic skill lists | Prioritised Focus Engine (what to study FIRST) |
| Static roadmaps | AI-generated, performance-driven learning paths |
| No evaluation | Real-time quiz + mock interview scoring |
| Manual job search | Resume-based automated job matching |

---

## 🔄 The Agentic Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SKILLBRIDGE AI AGENTIC LOOP                         │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌───────────┐
    │  RESUME  │────▶│    SKILL     │────▶│     JD      │────▶│    GAP    │
    │  UPLOAD  │     │  EXTRACTION  │     │  MATCHING   │     │ DETECTION │
    └──────────┘     └──────────────┘     └─────────────┘     └─────┬─────┘
                                                                      │
         ┌────────────────────────────────────────────────────────────┘
         ▼
    ┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌───────────┐
    │ ROADMAP  │────▶│     QUIZ     │────▶│    MOCK     │────▶│ PROGRESS  │
    │ GENERATE │     │   ENGINE     │     │  INTERVIEW  │     │ TRACKING  │
    └──────────┘     └──────────────┘     └─────────────┘     └─────┬─────┘
                                                                      │
         ┌────────────────────────────────────────────────────────────┘
         ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │                    🧠 AI DECISION ENGINE                              │
    │                                                                        │
    │   Score < 60%  ──▶  "Revise Topic"   ──▶  Back to Quiz              │
    │   Score 60-80% ──▶  "Move Ahead"     ──▶  Next Roadmap Week         │
    │   Score > 80%  ──▶  "Interview Ready"──▶  Job Matching              │
    └──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                           ┌─────────────────┐
                           │   JOB MATCHING  │
                           │  + PLACEMENT    │
                           └────────┬────────┘
                                    │
                    ┌───────────────┘  (loop continues until placed)
                    ▼
              ┌──────────┐
              │ ADAPTIVE │
              │  REPEAT  │◀─────── Continuous re-evaluation
              └──────────┘
```

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              React 18 + Vite Frontend                        │   │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │   │
│   │  │ Resume   │ │  JD      │ │  Quiz    │ │  Interview   │  │   │
│   │  │ Upload   │ │ Matcher  │ │ Engine   │ │  Simulator   │  │   │
│   │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │   │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │   │
│   │  │ Roadmap  │ │  Jobs    │ │Progress  │ │  Portfolio   │  │   │
│   │  │ Viewer   │ │ Finder   │ │ Tracker  │ │  Generator   │  │   │
│   │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │   │
│   └──────────────────────────────┬──────────────────────────────┘   │
└──────────────────────────────────┼──────────────────────────────────┘
                                   │  HTTP/REST (Axios)
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API LAYER                                     │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              FastAPI Application (Python)                    │   │
│   │                                                               │   │
│   │   POST /api/resume/upload    POST /api/jd/match              │   │
│   │   POST /api/resume/analyze   POST /api/roadmap               │   │
│   │   POST /api/quiz/generate    POST /api/quiz/evaluate         │   │
│   │   POST /api/interview/start  POST /api/interview/evaluate    │   │
│   │   POST /api/jobs/search      GET  /api/progress/{id}         │   │
│   └──────────────────────────────┬──────────────────────────────┘   │
└──────────────────────────────────┼──────────────────────────────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           ▼                       ▼                        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  SERVICE LAYER  │     │   AI / LLM LAYER │     │  EXTERNAL APIs  │
│                 │     │                  │     │                 │
│ ┌─────────────┐ │     │ ┌──────────────┐ │     │ ┌─────────────┐ │
│ │   parser.py │ │     │ │ Anthropic    │ │     │ │  Adzuna API │ │
│ │  (Regex)    │ │     │ │ Claude API   │ │     │ │  (Jobs)     │ │
│ └─────────────┘ │     │ └──────────────┘ │     │ └─────────────┘ │
│ ┌─────────────┐ │     │ ┌──────────────┐ │     │ ┌─────────────┐ │
│ │ ai_parser   │ │     │ │  ai_service  │ │     │ │ RapidAPI    │ │
│ │ (Claude)    │ │     │ │  (decisions) │ │     │ │ (Jobs)      │ │
│ └─────────────┘ │     │ └──────────────┘ │     │ └─────────────┘ │
│ ┌─────────────┐ │     └──────────────────┘     │ ┌─────────────┐ │
│ │ job_service │ │                               │ │ Google Jobs │ │
│ └─────────────┘ │                               │ └─────────────┘ │
└─────────────────┘                               └─────────────────┘
```

### Backend Directory Structure

```
backend/
├── app/
│   ├── api/
│   │   └── routes.py              # 20+ REST API endpoints
│   ├── core/
│   │   └── config.py              # Environment & configuration
│   ├── models/
│   │   └── schemas.py             # 30+ Pydantic data models
│   ├── services/
│   │   ├── parser.py              # Regex-based resume parser
│   │   ├── ai_parser.py           # Claude-powered AI parser
│   │   ├── ai_service.py          # LLM decision engine
│   │   └── job_service.py         # Multi-source job aggregator
│   └── utils/
│       └── helpers.py             # Shared utility functions
├── main.py                        # FastAPI app entrypoint
├── requirements.txt               # Python dependencies
├── .env                           # Secrets (not committed)
└── .env.example                   # Config template
```

### Frontend Directory Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ResumeUpload.jsx       # Drag & drop PDF/DOCX upload
│   │   ├── ResumeAnalysis.jsx     # ATS score + improvements
│   │   ├── JDMatcher.jsx          # JD paste + focus engine
│   │   ├── Roadmap.jsx            # Week-by-week learning plan
│   │   ├── Quiz.jsx               # Adaptive MCQ + coding
│   │   ├── Interview.jsx          # AI mock interview UI
│   │   ├── JobSearch.jsx          # Matched job listings
│   │   └── ProgressTracker.jsx    # Metrics + AI decisions
│   ├── utils/
│   │   └── api.js                 # Axios API client
│   ├── App.jsx                    # Root component + routing
│   └── index.css                  # Global styles
├── package.json
└── vite.config.js
```

---

## 🔀 Workflow Diagrams

### 1. Resume Analysis Flow

```
User Uploads File (PDF / DOCX / TXT)
         │
         ▼
  ┌──────────────┐
  │ File Type    │
  │ Detection    │
  └──────┬───────┘
         │
   ┌─────┴──────┐
   ▼            ▼
 PDF          DOCX
 PyMuPDF    python-docx
   │            │
   └─────┬──────┘
         ▼
  ┌──────────────────────────────────────┐
  │         DUAL PARSING SYSTEM          │
  │                                       │
  │  ┌────────────────┐                  │
  │  │  AI Parser     │  ← Primary       │
  │  │ (Anthropic     │                  │
  │  │  Claude)       │                  │
  │  └───────┬────────┘                  │
  │          │  if fails                 │
  │          ▼                           │
  │  ┌────────────────┐                  │
  │  │  Regex Parser  │  ← Fallback      │
  │  │  (rules-based) │                  │
  │  └───────┬────────┘                  │
  └──────────┼───────────────────────────┘
             │
             ▼
  ┌──────────────────────────────────────┐
  │       STRUCTURED EXTRACTION          │
  │                                       │
  │  • Experience (title, company, dates) │
  │  • Education (degree, institution)    │
  │  • Skills (technical, soft)          │
  │  • Projects (tech stack, outcomes)   │
  └──────────────────┬───────────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────┐
  │            ATS SCORING               │
  │                                       │
  │  Keyword Density    ──▶  25 pts      │
  │  Action Verbs       ──▶  20 pts      │
  │  Measurable Impact  ──▶  25 pts      │
  │  Formatting         ──▶  15 pts      │
  │  Completeness       ──▶  15 pts      │
  │                       ────────────   │
  │                       Total: /100    │
  └──────────────────────────────────────┘
             │
             ▼
  ┌──────────────────────────────────────┐
  │          AI IMPROVEMENT ENGINE       │
  │                                       │
  │  Before: "Worked on web projects"    │
  │  After:  "Architected 5+ apps        │
  │           serving 10K+ users,        │
  │           cutting load time 40%"     │
  └──────────────────────────────────────┘
```

### 2. JD Matching + Focus Engine Flow

```
  Resume Skills                Job Description
  (extracted)                  (user paste)
       │                            │
       └────────────┬───────────────┘
                    ▼
         ┌──────────────────┐
         │  NLP Tokenisation │
         │  + Normalisation  │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  Skill Comparison │
         │  (fuzzy match +  │
         │   semantic NLP)  │
         └────────┬─────────┘
                  │
       ┌──────────┴───────────┐
       ▼                      ▼
  Matched Skills          Missing Skills
  ["Python","React"]     ["Docker","K8s"]
       │                      │
       └──────────┬───────────┘
                  ▼
         ┌──────────────────────────────────┐
         │          FOCUS ENGINE            │
         │                                   │
         │  For each missing skill:          │
         │                                   │
         │  1. Count JD occurrences          │
         │  2. Calculate weight %            │
         │  3. Assign priority:              │
         │     > 20% weight  → HIGH          │
         │     10-20% weight → MEDIUM        │
         │     < 10% weight  → LOW           │
         │  4. Estimate study time           │
         │  5. Rank by ROI                   │
         └──────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────────────────────┐
         │           OUTPUT                   │
         │                                     │
         │  Match: 68%  │  Hire Prob: Medium  │
         │                                     │
         │  📚 STUDY FIRST:                   │
         │  1. Docker   HIGH  25%  2-3 weeks  │
         │  2. AWS      HIGH  20%  4-5 weeks  │
         │                                     │
         │  📖 STUDY LATER:                   │
         │  3. K8s      MED   15%  3-4 weeks  │
         │                                     │
         │  🚫 LOW PRIORITY:                  │
         │  4. Redis    LOW    5%  1-2 weeks  │
         └────────────────────────────────────┘
```

### 3. Adaptive Quiz Engine Flow

```
  User selects topic
  (e.g., "JavaScript")
         │
         ▼
  ┌──────────────────┐
  │  Question Bank   │
  │  Generation      │
  │  (Claude API)    │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────────────────────┐
  │     ADAPTIVE DIFFICULTY          │
  │                                   │
  │  Session start → Medium           │
  │  Score > 80%   → Hard            │
  │  Score < 60%   → Easy            │
  └────────┬─────────────────────────┘
           │
     ┌─────┴──────────────────────────────┐
     │     QUESTION LOOP                  │
     │                                     │
     │  ┌───────────────────────────────┐ │
     │  │ Q1: Multiple Choice           │ │
     │  │     → User answers            │ │
     │  │     → Immediate evaluation    │ │
     │  │     → Score updated           │ │
     │  └───────────────────────────────┘ │
     │  ┌───────────────────────────────┐ │
     │  │ Q2: Coding Challenge          │ │
     │  │     → Syntax check            │ │
     │  │     → Logic evaluation        │ │
     │  │     → Hint provided if stuck  │ │
     │  └───────────────────────────────┘ │
     └────────────────────────┬───────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │  WEAK AREA DETECTOR  │
                   │                       │
                   │  Closures:   45% ❌  │
                   │  Promises:   72% ✅  │
                   │  Async/Await: 88% ✅ │
                   └──────────┬───────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │  AI DECISION         │
                   │                       │
                   │  "Closures score 45% │
                   │   → Revise & retake" │
                   └──────────────────────┘
```

### 4. Mock Interview Flow

```
  User selects:
  [Technical] or [HR Interview]
  + Target Role
         │
         ▼
  ┌──────────────────────────────────┐
  │      SESSION INITIALISATION      │
  │  • Generate question bank        │
  │  • Set difficulty curve          │
  │  • Load role context             │
  └────────────┬─────────────────────┘
               │
               ▼
  ┌──────────────────────────────────────────────────────┐
  │                  INTERVIEW LOOP                       │
  │                                                        │
  │   AI asks question                                    │
  │        │                                               │
  │        ▼                                               │
  │   User types answer                                   │
  │        │                                               │
  │        ▼                                               │
  │   ┌───────────────────────────────────────────────┐  │
  │   │              REAL-TIME EVALUATION              │  │
  │   │                                                 │  │
  │   │  Score:          7 / 10                        │  │
  │   │  Strengths:      Clear structure, STAR method  │  │
  │   │  Weaknesses:     Missing technical depth       │  │
  │   │  Model Answer:   [AI-generated ideal answer]   │  │
  │   │  Confidence:     Medium                        │  │
  │   │  Tips:           Add metrics, be specific      │  │
  │   └───────────────────────────────────────────────┘  │
  │        │                                               │
  │        ▼                                               │
  │   Adaptive: Next Q harder/easier based on score      │
  │        │                                               │
  │        └──────────────────▶  Repeat                  │
  └──────────────────────────────────────────────────────┘
               │
               ▼
  ┌──────────────────────────────────┐
  │        SESSION SUMMARY           │
  │                                   │
  │  Overall Score:    74/100        │
  │  Strong Areas:     Communication │
  │  Weak Areas:       System Design │
  │  Recommendation:   "Study        │
  │   distributed systems before     │
  │   next session"                  │
  └──────────────────────────────────┘
```

### 5. Progress & AI Decision Engine Flow

```
  ┌───────────────────────────────────────────────────────────────┐
  │                    DATA COLLECTION                             │
  │                                                                 │
  │   Quiz Scores ──┐                                             │
  │   Interview     ├──▶  Progress Database  ──▶  Analytics       │
  │   Scores ───────┘       (per resume_id)                       │
  │   Tasks Done ───┘                                             │
  └───────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌───────────────────────────────────────────────────────────────┐
  │                  AI DECISION ENGINE                            │
  │                                                                 │
  │  Input Signals:                                               │
  │   • avg_quiz_score                                            │
  │   • avg_interview_score                                       │
  │   • tasks_completed / tasks_total                             │
  │   • weak_topics[]                                             │
  │   • days_active                                               │
  │                                                                 │
  │  Decision Logic:                                              │
  │                                                                 │
  │  if quiz < 60% AND interview < 6:                            │
  │     → "revise" + specify weak topic                          │
  │                                                                 │
  │  elif quiz >= 60% AND interview < 7:                         │
  │     → "practice_interview" + tips                            │
  │                                                                 │
  │  elif quiz >= 80% AND interview >= 7:                        │
  │     → "ready_for_jobs" + open Job Finder                     │
  │                                                                 │
  │  else:                                                        │
  │     → "move_ahead" + advance roadmap                         │
  └───────────────────────────────────────────────────────────────┘
                                    │
                  ┌─────────────────┼──────────────────┐
                  ▼                 ▼                   ▼
          ┌──────────┐     ┌──────────────┐    ┌────────────────┐
          │  REVISE  │     │   PRACTICE   │    │  READY FOR     │
          │          │     │  INTERVIEWS  │    │     JOBS!      │
          │ Topic X  │     │              │    │                │
          │ flagged  │     │ 2 more mock  │    │ Job matcher    │
          │          │     │ sessions     │    │ activated      │
          └──────────┘     └──────────────┘    └────────────────┘
```

---

## ✨ Core Features

### 1. 🔍 Resume Analyzer

> AI-powered resume analysis with ATS scoring and targeted improvements

**Capabilities:**
- **Dual Parsing System** — Anthropic Claude (primary) + Regex (fallback)
- Extracts Experience, Education, Skills, and Projects intelligently
- Generates ATS Score (0–100) with component breakdown
- Detects missing keywords, weak verbs, missing metrics
- Rewrites bullet points with measurable impact

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

### 2. 🎯 JD Matcher + Focus Engine

> Unique prioritisation system that tells you exactly what to study FIRST

**The Focus Engine Advantage:**

| Feature | Other Tools | SkillBridge AI |
|---------|-------------|---------------|
| List missing skills | ✅ | ✅ |
| Prioritise by JD weight | ❌ | ✅ |
| Estimate study time | ❌ | ✅ |
| Mark low-priority skills to skip | ❌ | ✅ |
| ROI-ranked study plan | ❌ | ✅ |

**Example Output:**
```json
{
  "match_percentage": 68,
  "hire_probability": "Medium",
  "focus_areas": [
    {
      "skill": "Docker",
      "priority": "HIGH",
      "weight": 25,
      "reason": "Critical for deployment — mentioned 8 times",
      "study_time": "2-3 weeks"
    }
  ]
}
```

---

### 3. 🗺️ Smart Roadmap Generator

> Week-by-week personalised learning paths based on your gaps and availability

```
Week 1:  Docker Fundamentals          [14 hrs]  ●●●●●○○ [MILESTONE]
Week 2:  Docker Compose               [14 hrs]  ●●●●○○○
Week 3-4: Kubernetes Basics           [28 hrs]  ●●●○○○○ [MILESTONE]
Week 5:  AWS Core Services            [21 hrs]  ●●○○○○○
Week 6:  System Design Patterns       [21 hrs]  ●●○○○○○
...
```

- Adjustable hours/day
- Resource links per topic
- Milestone checkpoints
- Re-generates automatically when gaps are updated

---

### 4. 📝 Adaptive Quiz Engine

> Dynamic quizzes that adjust difficulty in real-time based on your performance

- Multiple choice + coding challenges
- Easy / Medium / Hard difficulty tiers
- Automatic weak-area detection
- Detailed explanations per answer
- Revision topic suggestions post-quiz

---

### 5. 🎤 AI Mock Interview ⭐ Star Feature

> Simulates real technical and HR interviews with live scored feedback

**Interview Evaluation Schema:**
```json
{
  "score": 7,
  "strengths": ["Clear structure", "STAR method used", "Relevant example"],
  "weaknesses": ["Missing technical depth", "No specific metrics"],
  "model_answer": "A stronger answer would include...",
  "confidence_level": "Medium",
  "improvement_tips": ["Quantify results", "Mention stack specifics"]
}
```

Modes: `Technical` | `HR Behavioural` | `System Design`

---

### 6. 📊 Progress Intelligence Engine

> The agentic core — tracks everything and decides your next step automatically

**AI Decisions:**
```
Quiz < 60%     ──▶  "Revise JavaScript Closures — quiz score 45%"
Quiz 60–80%    ──▶  "Good progress — move to next roadmap week"
Interview > 7  ──▶  "You are ready for interviews — opening Job Finder"
All metrics ✅  ──▶  "Placement ready — apply to top 5 matches"
```

---

### 7. 💼 AI Job Finder

> Resume-powered job search across multiple live APIs

- Sources: Adzuna, RapidAPI, Google Jobs
- Match % calculated per listing
- Filtered by skills, location, salary range
- Direct apply links
- Salary benchmarking

---

### 8. 🧑‍🏫 Daily AI Coach

> Personalised daily nudges, reminders, and motivational guidance

- Tracks days active and streaks
- Suggests daily focus topic
- Adjusts tone based on progress (motivational vs push)

---

### 9. 🗂️ Portfolio Project Generator

> Recommends projects to build based on your target role and skill gaps

**Example for Frontend Developer:**
```json
{
  "projects": [
    {
      "name": "Real-time Chat Application",
      "difficulty": "Medium",
      "technologies": ["React", "Node.js", "Socket.io", "MongoDB"],
      "estimated_days": 14,
      "learning_outcomes": ["WebSockets", "Auth", "State management"]
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

## 📦 Tech Stack

### Backend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | FastAPI (Python 3.9+) | REST API with async support |
| Validation | Pydantic v2 | 30+ strict data models |
| PDF Parsing | PyMuPDF | Text + layout extraction |
| DOCX Parsing | python-docx | Word document processing |
| HTTP Client | httpx | Async external API calls |
| AI Engine | Anthropic Claude API | Resume parsing, Q&A, evaluation |
| Job Search | Adzuna + RapidAPI | Live job listings |

### Frontend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React 18 | Component-based UI |
| Build Tool | Vite 5 | Fast dev + HMR |
| HTTP | Axios | API communication |
| Upload | React Dropzone | Drag & drop file upload |
| Animations | Framer Motion | Smooth transitions |

### Design System
| Element | Specification |
|---------|--------------|
| Theme | Light only — Apple-inspired |
| Palette | Monochromatic (white → charcoal) |
| Typography | DM Sans (body) + Instrument Serif (display) |
| Spacing | 4px grid system |
| Shadows | Soft diffused, multi-layer |
| Motion | Spring physics, scroll-triggered reveals |

---

## 🚀 Quick Start

### Prerequisites

```
Python 3.9+
Node.js 18+
npm or yarn
Anthropic Claude API key   # optional — regex fallback available
```

### One-Command Start (Windows)

```bat
start.bat
```

This automatically:
1. Activates the Python virtual environment
2. Installs backend dependencies
3. Starts FastAPI on `http://localhost:8000`
4. Installs frontend dependencies
5. Starts Vite dev server on `http://localhost:5173`

---

### Manual Setup

#### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Open .env and add your ANTHROPIC_API_KEY

# Start server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> Backend runs at: **http://localhost:8000**  
> Interactive docs at: **http://localhost:8000/docs**

#### Frontend

```bash
cd frontend

npm install
npm run dev
```

> Frontend runs at: **http://localhost:5173**

#### Environment Variables

```env
# backend/.env

ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx   # Claude AI (required for AI features)
ADZUNA_APP_ID=your_app_id                    # Job search (optional)
ADZUNA_APP_KEY=your_app_key                  # Job search (optional)
RAPIDAPI_KEY=your_rapidapi_key               # Extended job sources (optional)
```

---

## 📡 API Reference

### Resume Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/resume/upload` | Upload and parse resume (AI-powered) |
| `GET`  | `/api/resume/sample` | Load sample resume for demo |
| `POST` | `/api/resume/analyze` | Generate ATS score + issues + suggestions |
| `GET`  | `/api/test-ai` | Verify Anthropic API connection |

### JD Matching

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/jd/match` | Match resume to job description |

### Skill Gap & Roadmap

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/skill-gap` | Analyse skill gaps between resume and target |
| `POST` | `/api/roadmap` | Generate personalised learning roadmap |

### Quiz System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/quiz/generate` | Generate adaptive quiz questions |
| `POST` | `/api/quiz/evaluate` | Evaluate answers + detect weak areas |

### Interview System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/interview/start` | Initialise mock interview session |
| `POST` | `/api/interview/evaluate` | Evaluate user answer in real-time |
| `GET`  | `/api/interview/session/{id}` | Retrieve session history + scores |

### Progress Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/progress/track` | Log quiz / interview activity |
| `GET`  | `/api/progress/{resume_id}` | Get all metrics + AI decision |

### Job Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/jobs/search` | Find matching jobs across sources |

### Coaching & Portfolio

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/coach/daily` | Fetch daily coaching message |
| `POST` | `/api/portfolio/suggest` | Generate project suggestions |

---

## 🏆 Key Differentiators

### 1. Focus Engine (Unique)
```
Other tools:   "You're missing Docker, Kubernetes, AWS"
SkillBridge:   "Study Docker FIRST (25% of JD, 2-3 weeks)
                Skip Redis for now (5% of JD, study later)"
```

### 2. Agentic Loop (Unique)
```
Traditional:  One-time analysis → static output
SkillBridge:  Continuous loop → adapts every session
               → AI makes decisions until you're placed
```

### 3. End-to-End Platform
```
Resume → Gap → Learn → Test → Interview → Jobs → Placed
All in one place. No switching tools.
```

---

## 🚢 Deployment

### Backend — Railway / Render

```bash
# Create Procfile
echo "web: uvicorn main:app --host 0.0.0.0 --port \$PORT" > Procfile

# Deploy to Railway
railway login
railway up

# Or deploy to Render
# Connect GitHub repo → set build command: pip install -r requirements.txt
# Set start command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Set environment variables in your platform dashboard:
```
ANTHROPIC_API_KEY=...
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...
```

### Frontend — Vercel / Netlify

```bash
cd frontend
npm run build

# Vercel
vercel --prod

# Netlify
netlify deploy --prod --dir=dist
```

Update your API base URL for production:
```js
// frontend/src/utils/api.js
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
```

---

## 🎬 Demo Presentation Script

**Duration: ~5 minutes**

### Opening (30 sec)
> *"SkillBridge AI is an Agentic Career Operating System that continuously analyzes, plans, trains, evaluates, and places students. This is not just a chatbot — it's a complete AI career mentor that adapts with you until you get placed."*

### Feature Demo (4 min)

**1. Resume Analysis (60 sec)**
- Upload `sample_resume.pdf`
- Show ATS Score: **72/100**
- Highlight: *"No measurable impact", "Weak action verbs"*
- Show before/after bullet rewrite: generic → quantified

**2. JD Matching + Focus Engine (60 sec)**
- Paste a Senior Backend Engineer JD
- Show: **68% match, Medium hire probability**
- Highlight the Focus Engine output:
  > *"Docker is HIGH priority — 25% of JD weight, study 2–3 weeks"*
- Show matched vs. missing skills table

**3. Learning & Testing (60 sec)**
- Display 12-week personalised roadmap
- Open Quiz: generate JavaScript questions
- Answer one → show real-time evaluation
- Start Mock Interview → show score **7/10** with feedback panel

**4. Jobs & Progress (60 sec)**
- Show Job Finder: 6 matched roles with % scores
- Open Progress dashboard
- Show AI Decision panel: *"Quiz 82%, Interview 7.4/10 — You're ready for interviews!"*

### Closing (30 sec)
> *"SkillBridge AI creates a continuous agentic loop — it doesn't just give advice once. It tracks every quiz, every interview, and every task, then decides what you should do next until you're placed. Thank you."*

---

## 🌐 Health & Monitoring

```
Health Check:    GET  http://localhost:8000/health
API Docs:        GET  http://localhost:8000/docs
ReDoc:           GET  http://localhost:8000/redoc
```

---

## 📝 License

Built for educational purposes. See [LICENSE](LICENSE) for details.

---

<div align="center">

**SkillBridge AI** — *Adapt until you're placed.*

⭐ Star this repo if it helped you · 🐛 [Report an issue](issues) · 💡 [Request a feature](issues)

</div>
