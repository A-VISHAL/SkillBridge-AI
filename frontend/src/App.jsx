import { useState } from 'react'
import './App.css'
import ResumeUpload from './components/ResumeUpload'
import ResumeAnalysis from './components/ResumeAnalysis'
import JDMatcher from './components/JDMatcher'
import Roadmap from './components/Roadmap'
import Quiz from './components/Quiz'
import Interview from './components/Interview'
import JobSearch from './components/JobSearch'
import ProgressTracker from './components/ProgressTracker'

function App() {
  const [resumeId, setResumeId] = useState(null)
  const [resumeData, setResumeData] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [activeTab, setActiveTab] = useState('upload')

  const tabs = [
    { id: 'upload', label: '📄 Resume' },
    { id: 'analysis', label: '🔍 Analysis' },
    { id: 'match', label: '🎯 JD Match' },
    { id: 'roadmap', label: '🗺️ Roadmap' },
    { id: 'quiz', label: '📝 Quiz' },
    { id: 'interview', label: '🎤 Interview' },
    { id: 'jobs', label: '💼 Jobs' },
    { id: 'progress', label: '📊 Progress' },
  ]

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <h1 className="logo">🧠 SkillBridge AI</h1>
          <p className="tagline">Agentic Career Operating System</p>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                disabled={!resumeId && tab.id !== 'upload'}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {activeTab === 'upload' && (
              <ResumeUpload
                onResumeUploaded={(id, data) => {
                  setResumeId(id)
                  setResumeData(data)
                  setActiveTab('analysis')
                }}
              />
            )}

            {activeTab === 'analysis' && resumeId && (
              <ResumeAnalysis resumeId={resumeId} />
            )}

            {activeTab === 'match' && resumeId && (
              <JDMatcher
                resumeId={resumeId}
                jobDescription={jobDescription}
                setJobDescription={setJobDescription}
              />
            )}

            {activeTab === 'roadmap' && resumeId && (
              <Roadmap
                resumeId={resumeId}
                jobDescription={jobDescription}
              />
            )}

            {activeTab === 'quiz' && (
              <Quiz resumeId={resumeId} />
            )}

            {activeTab === 'interview' && (
              <Interview
                jobDescription={jobDescription}
                resumeId={resumeId}
              />
            )}

            {activeTab === 'jobs' && resumeId && (
              <JobSearch
                resumeId={resumeId}
                resumeData={resumeData}
              />
            )}

            {activeTab === 'progress' && resumeId && (
              <ProgressTracker resumeId={resumeId} />
            )}
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>Built for HackHazards '26 | SkillBridge AI - Your Career Copilot</p>
        </div>
      </footer>
    </div>
  )
}

export default App
