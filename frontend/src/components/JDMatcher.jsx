import { useState } from 'react'
import { matchJD } from '../utils/api'

export default function JDMatcher({ resumeId, jobDescription, setJobDescription }) {
  const [matchResult, setMatchResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleMatch = async () => {
    if (!jobDescription.trim()) {
      alert('Please enter a job description')
      return
    }

    setLoading(true)
    try {
      const result = await matchJD(resumeId, jobDescription)
      setMatchResult(result)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="card">
        <h2 className="card-header">🎯 JD Matcher + Focus Engine</h2>
        <textarea
          className="textarea"
          placeholder="Paste job description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={8}
        />
        <button className="btn btn-primary" onClick={handleMatch} disabled={loading} style={{ marginTop: '16px' }}>
          {loading ? 'Analyzing...' : 'Analyze Match'}
        </button>
      </div>

      {matchResult && (
        <>
          <div className="card">
            <div style={{ textAlign: 'center' }}>
              <div className="score-circle">
                {Math.round(matchResult.match_percentage)}%
              </div>
              <h3>Match Score</h3>
              <span className={`badge ${matchResult.hire_probability === 'High' ? 'badge-success' : matchResult.hire_probability === 'Medium' ? 'badge-warning' : 'badge-error'}`}>
                {matchResult.hire_probability} Hire Probability
              </span>
            </div>
          </div>

          <div className="card">
            <h3 className="card-header">🎯 Focus Areas (What to Study FIRST)</h3>
            {matchResult.focus_areas.map((area, idx) => (
              <div key={idx} style={{ marginBottom: '16px', padding: '16px', background: 'var(--bg3)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0 }}>{area.skill}</h4>
                  <span className={`badge ${area.priority === 'HIGH' ? 'badge-error' : area.priority === 'MEDIUM' ? 'badge-warning' : 'badge-success'}`}>
                    {area.priority} PRIORITY
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: 'var(--muted2)', marginBottom: '4px' }}>
                  📊 {area.weight}% of JD weight | ⏱️ {area.study_time}
                </div>
                <div style={{ fontSize: '14px' }}>{area.reason}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-2">
            <div className="card">
              <h4 style={{ color: 'var(--c1)', marginBottom: '12px' }}>✅ Matched Skills</h4>
              <div>
                {matchResult.matched_skills.map((skill, idx) => (
                  <span key={idx} className="skill-tag matched">{skill}</span>
                ))}
              </div>
            </div>
            <div className="card">
              <h4 style={{ color: 'var(--c2)', marginBottom: '12px' }}>❌ Missing Skills</h4>
              <div>
                {matchResult.missing_skills.map((skill, idx) => (
                  <span key={idx} className="skill-tag missing">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
