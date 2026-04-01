import { useState } from 'react'
import { generateQuiz } from '../utils/api'

export default function Quiz({ resumeId }) {
  const [topic, setTopic] = useState('Python')
  const [questions, setQuestions] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const result = await generateQuiz(topic, 'Medium', 5)
      setQuestions(result.questions)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="card">
        <h2 className="card-header">📝 Adaptive Quiz</h2>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <input
            className="input"
            placeholder="Topic (e.g., Python, React, DSA)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
            Generate Quiz
          </button>
        </div>
      </div>

      {loading && <div className="loading"><div className="spinner"></div></div>}

      {questions && questions.map((q, idx) => (
        <div key={idx} className="question-card">
          <h4 style={{ marginBottom: '12px' }}>Q{idx + 1}. {q.question}</h4>
          <span className={`badge badge-${q.difficulty === 'Hard' ? 'error' : q.difficulty === 'Medium' ? 'warning' : 'success'}`}>
            {q.difficulty}
          </span>
          {q.options && (
            <div style={{ marginTop: '16px' }}>
              {q.options.map((opt, oidx) => (
                <div key={oidx} className="option">
                  {opt.text}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
