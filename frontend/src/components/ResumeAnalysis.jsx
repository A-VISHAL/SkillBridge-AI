import { useState, useEffect } from 'react'
import { analyzeResume } from '../utils/api'

export default function ResumeAnalysis({ resumeId }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (resumeId) {
      fetchAnalysis()
    }
  }, [resumeId])

  const fetchAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await analyzeResume(resumeId)
      setAnalysis(result)
    } catch (err) {
      setError(err.message || 'Failed to analyze resume')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading"><div className="spinner"></div></div>
  if (error) return <div className="card"><p style={{color: 'var(--c2)'}}>{error}</p></div>
  if (!analysis) return <div className="card"><button className="btn btn-primary" onClick={fetchAnalysis}>Analyze Resume</button></div>

  const { ats_analysis, problems, bullet_improvements, recruiter_view, overall_rating } = analysis

  return (
    <div>
      <div className="card">
        <h2 className="card-header">🔍 Resume Analysis</h2>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div className="score-circle">
            {ats_analysis.score}
          </div>
          <h3>ATS Score</h3>
          <span className={`badge ${ats_analysis.score >= 80 ? 'badge-success' : ats_analysis.score >= 60 ? 'badge-warning' : 'badge-error'}`}>
            {overall_rating}
          </span>
        </div>

        <div className="grid grid-2">
          <div>
            <h4 style={{ marginBottom: '12px', color: 'var(--c1)' }}>📊 Scores</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Keyword Match</span>
                  <span>{Math.round(ats_analysis.keyword_match * 100)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${ats_analysis.keyword_match * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Formatting</span>
                  <span>{ats_analysis.formatting_score}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${ats_analysis.formatting_score}%` }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Readability</span>
                  <span>{ats_analysis.readability_score}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${ats_analysis.readability_score}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ marginBottom: '12px', color: 'var(--c2)' }}>⚠️ Problems Found</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {problems.slice(0, 5).map((problem, idx) => (
                <li key={idx} style={{ marginBottom: '8px', padding: '8px', background: 'var(--bg3)', borderRadius: '6px' }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>{problem.issue}</div>
                  <div style={{ fontSize: '13px', color: 'var(--muted2)' }}>{problem.suggestion}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {bullet_improvements && bullet_improvements.length > 0 && (
        <div className="card">
          <h3 className="card-header">✨ Bullet Point Improvements</h3>
          {bullet_improvements.map((improvement, idx) => (
            <div key={idx} style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg3)', borderRadius: '8px' }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>BEFORE:</div>
                <div style={{ color: 'var(--c2)' }}>{improvement.original}</div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>AFTER:</div>
                <div style={{ color: 'var(--c1)' }}>{improvement.improved}</div>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted2)' }}>
                💡 {improvement.reason} (Impact: {improvement.impact_score}/10)
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3 className="card-header">👁️ Recruiter View</h3>
        <p style={{ color: 'var(--muted2)' }}>{recruiter_view}</p>
      </div>
    </div>
  )
}
