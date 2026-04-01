import { useState } from 'react'
import { searchJobs } from '../utils/api'

export default function JobSearch({ resumeId, resumeData }) {
  const [jobs, setJobs] = useState(null)
  const [role, setRole] = useState('Software Developer')
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    setLoading(true)
    try {
      const result = await searchJobs(resumeId, role, 'India')
      setJobs(result.jobs)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="card">
        <h2 className="card-header">💼 AI Job Finder</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            className="input"
            placeholder="Target role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
            Search Jobs
          </button>
        </div>
      </div>

      {loading && <div className="loading"><div className="spinner"></div></div>}

      {jobs && (
        <div className="grid grid-2">
          {jobs.map((job, idx) => (
            <div key={idx} className="job-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ margin: 0 }}>{job.title}</h3>
                <span className={`match-badge ${job.match_percentage >= 70 ? 'match-high' : job.match_percentage >= 50 ? 'match-medium' : 'match-low'}`}>
                  {Math.round(job.match_percentage)}% Match
                </span>
              </div>
              <div style={{ color: 'var(--muted2)', marginBottom: '8px' }}>
                🏢 {job.company} | 📍 {job.location}
              </div>
              {job.salary && (
                <div style={{ color: 'var(--c1)', marginBottom: '8px' }}>
                  💰 {job.salary}
                </div>
              )}
              <p style={{ fontSize: '14px', color: 'var(--muted2)', marginBottom: '12px' }}>
                {job.description.substring(0, 150)}...
              </p>
              <div style={{ marginBottom: '12px' }}>
                {job.required_skills.slice(0, 5).map((skill, sidx) => (
                  <span key={sidx} className="skill-tag">{skill}</span>
                ))}
              </div>
              <a href={job.apply_link} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                Apply Now
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
