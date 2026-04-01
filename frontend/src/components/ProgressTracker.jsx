import { useState, useEffect } from 'react'
import { trackProgress } from '../utils/api'

export default function ProgressTracker({ resumeId }) {
  const [progress, setProgress] = useState(null)
  const [decision, setDecision] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProgress()
  }, [resumeId])

  const fetchProgress = async () => {
    setLoading(true)
    try {
      const result = await trackProgress(resumeId, null, null)
      setProgress(result.progress)
      setDecision(result.ai_decision)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading"><div className="spinner"></div></div>

  return (
    <div>
      <div className="card">
        <h2 className="card-header">📊 Progress Intelligence</h2>
        
        {decision && (
          <div style={{ padding: '20px', background: 'var(--bg3)', borderRadius: '12px', marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '12px', color: 'var(--c1)' }}>🤖 AI Decision</h3>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              {decision.decision === 'ready_for_interviews' && '🎉 You are ready for interviews!'}
              {decision.decision === 'move_ahead' && '✅ Keep moving forward'}
              {decision.decision === 'revise' && '📚 Time to revise'}
            </div>
            <p style={{ color: 'var(--muted2)', marginBottom: '12px' }}>{decision.reason}</p>
            <div style={{ padding: '12px', background: 'var(--bg2)', borderRadius: '8px' }}>
              <strong>Next Action:</strong> {decision.next_action}
            </div>
            <div style={{ marginTop: '12px', fontSize: '14px', color: 'var(--muted)' }}>
              Confidence: {Math.round(decision.confidence * 100)}%
            </div>
          </div>
        )}

        {progress && (
          <div className="grid grid-2">
            <div>
              <h4 style={{ marginBottom: '12px' }}>📝 Quiz Performance</h4>
              {progress.quiz_scores.length > 0 ? (
                <>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--c1)' }}>
                    {Math.round(progress.quiz_scores.reduce((a, b) => a + b, 0) / progress.quiz_scores.length)}%
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--muted2)' }}>
                    Average from {progress.quiz_scores.length} quizzes
                  </div>
                </>
              ) : (
                <p style={{ color: 'var(--muted)' }}>No quiz data yet</p>
              )}
            </div>

            <div>
              <h4 style={{ marginBottom: '12px' }}>🎤 Interview Performance</h4>
              {progress.interview_scores.length > 0 ? (
                <>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--c3)' }}>
                    {(progress.interview_scores.reduce((a, b) => a + b, 0) / progress.interview_scores.length).toFixed(1)}/10
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--muted2)' }}>
                    Average from {progress.interview_scores.length} interviews
                  </div>
                </>
              ) : (
                <p style={{ color: 'var(--muted)' }}>No interview data yet</p>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          <h4 style={{ marginBottom: '12px' }}>📈 Tasks Completed</h4>
          <div className="progress-bar" style={{ height: '12px' }}>
            <div className="progress-fill" style={{ width: progress ? `${(progress.completed_tasks / progress.total_tasks) * 100}%` : '0%' }}></div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: 'var(--muted2)' }}>
            {progress?.completed_tasks || 0} of {progress?.total_tasks || 0} tasks
          </div>
        </div>
      </div>
    </div>
  )
}
