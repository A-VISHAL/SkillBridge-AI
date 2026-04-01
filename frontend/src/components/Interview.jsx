import { useState } from 'react'
import { startInterview, evaluateInterviewAnswer } from '../utils/api'

export default function Interview({ jobDescription, resumeId }) {
  const [session, setSession] = useState(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleStart = async (mode) => {
    if (!jobDescription) {
      alert('Please match a JD first')
      return
    }

    setLoading(true)
    try {
      const result = await startInterview(jobDescription, mode, 5)
      setSession(result)
      setCurrentQ(0)
      setFeedback(null)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!answer.trim()) return

    setLoading(true)
    try {
      const result = await evaluateInterviewAnswer(
        session.session_id,
        session.questions[currentQ].id,
        answer,
        60
      )
      setFeedback(result)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    setCurrentQ(currentQ + 1)
    setAnswer('')
    setFeedback(null)
  }

  return (
    <div>
      <div className="card">
        <h2 className="card-header">🎤 AI Mock Interview</h2>
        {!session && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" onClick={() => handleStart('Technical')}>
              Start Technical Interview
            </button>
            <button className="btn btn-secondary" onClick={() => handleStart('HR')}>
              Start HR Interview
            </button>
          </div>
        )}
      </div>

      {loading && <div className="loading"><div className="spinner"></div></div>}

      {session && currentQ < session.questions.length && (
        <div className="card">
          <div style={{ marginBottom: '16px' }}>
            <span className="badge badge-success">
              Question {currentQ + 1} of {session.questions.length}
            </span>
          </div>
          <h3 style={{ marginBottom: '20px' }}>{session.questions[currentQ].question}</h3>
          
          {!feedback && (
            <>
              <textarea
                className="textarea"
                placeholder="Type your answer here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={6}
              />
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ marginTop: '16px' }}>
                Submit Answer
              </button>
            </>
          )}

          {feedback && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div className="score-circle" style={{ width: '80px', height: '80px', fontSize: '24px' }}>
                  {feedback.score}/10
                </div>
                <span className={`badge badge-${feedback.confidence_level === 'High' ? 'success' : feedback.confidence_level === 'Medium' ? 'warning' : 'error'}`}>
                  {feedback.confidence_level} Confidence
                </span>
              </div>

              <div className="grid grid-2">
                <div>
                  <h4 style={{ color: 'var(--c1)', marginBottom: '8px' }}>✅ Strengths</h4>
                  <ul>
                    {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 style={{ color: 'var(--c2)', marginBottom: '8px' }}>⚠️ Weaknesses</h4>
                  <ul>
                    {feedback.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              </div>

              <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg3)', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '8px' }}>💡 Model Answer</h4>
                <p style={{ color: 'var(--muted2)' }}>{feedback.model_answer}</p>
              </div>

              <button className="btn btn-primary" onClick={handleNext} style={{ marginTop: '16px' }}>
                Next Question
              </button>
            </div>
          )}
        </div>
      )}

      {session && currentQ >= session.questions.length && (
        <div className="card">
          <h3>🎉 Interview Complete!</h3>
          <p>You've completed all questions. Check your progress in the Progress tab.</p>
        </div>
      )}
    </div>
  )
}
