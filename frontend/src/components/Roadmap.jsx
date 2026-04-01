import { useState } from 'react'
import { generateRoadmap } from '../utils/api'

export default function Roadmap({ resumeId, jobDescription }) {
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!jobDescription) {
      alert('Please match a JD first')
      return
    }

    setLoading(true)
    try {
      const result = await generateRoadmap(resumeId, jobDescription, 2)
      setRoadmap(result)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading"><div className="spinner"></div></div>

  return (
    <div>
      <div className="card">
        <h2 className="card-header">🗺️ Personalized Learning Roadmap</h2>
        {!roadmap && (
          <button className="btn btn-primary" onClick={handleGenerate}>
            Generate Roadmap
          </button>
        )}
      </div>

      {roadmap && (
        <div className="card">
          <div style={{ marginBottom: '24px' }}>
            <h3>{roadmap.duration_weeks} Week Plan</h3>
            <p style={{ color: 'var(--muted2)' }}>
              {roadmap.daily_hours} hours/day | {roadmap.tasks.length} tasks
            </p>
          </div>

          <div className="roadmap-timeline">
            {roadmap.tasks.map((task, idx) => (
              <div key={idx} className={`roadmap-item ${task.milestone ? 'milestone' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong>Week {task.week}: {task.task}</strong>
                  <span className={`badge ${task.difficulty === 'Hard' ? 'badge-error' : task.difficulty === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
                    {task.difficulty}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: 'var(--muted2)', marginBottom: '8px' }}>
                  🎯 {task.skill} | ⏱️ {task.estimated_hours} hours
                </div>
                {task.resources.length > 0 && (
                  <div style={{ fontSize: '13px' }}>
                    📚 {task.resources.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
