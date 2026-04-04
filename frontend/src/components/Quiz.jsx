import { useState } from 'react'
import { generateQuiz } from '../utils/api'

const Card = ({ children, style = {} }) => (
  <div style={{
    background: "var(--white)",
    border: "1px solid var(--gray-150)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-md)",
    padding: 24,
    marginBottom: 16,
    ...style,
  }}>
    {children}
  </div>
);

const Badge = ({ children }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "2px 10px", borderRadius: 99,
    fontSize: 11, fontWeight: 500, letterSpacing: "0.02em",
    background: "var(--gray-100)", color: "var(--gray-600)",
    border: "1px solid var(--gray-200)",
  }}>
    {children}
  </span>
);

const Btn = ({ children, variant = "primary", onClick, style = {}, disabled }) => {
  const [hovered, setHovered] = useState(false);
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 8, padding: "10px 22px", borderRadius: 99,
    fontSize: 13.5, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s ease", border: "none", fontFamily: "inherit",
    letterSpacing: "-0.01em", opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    primary: {
      background: hovered && !disabled ? "var(--gray-900)" : "var(--black)",
      color: "var(--white)",
      boxShadow: hovered && !disabled ? "0 6px 20px rgba(0,0,0,0.22)" : "0 2px 8px rgba(0,0,0,0.12)",
      transform: hovered && !disabled ? "translateY(-1px)" : "none",
    },
    secondary: {
      background: hovered && !disabled ? "var(--gray-100)" : "var(--white)",
      color: "var(--gray-800)",
      boxShadow: "var(--shadow-sm)",
      border: "1px solid var(--gray-200)",
      transform: hovered && !disabled ? "translateY(-1px)" : "none",
    },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
};

const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const icons = {
    chevron: <><polyline points="9 18 15 12 9 6"/></>,
    zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round">
      {icons[name] || icons.zap}
    </svg>
  );
};

export default function Quiz({ resumeId }) {
  const [topic, setTopic] = useState('Python')
  const [questions, setQuestions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [showExpl, setShowExpl] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [showCongrats, setShowCongrats] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const result = await generateQuiz(topic, 'Medium', 5)
      setQuestions(result.questions)
      setCurrentQuestion(0)
      setScore(0)
      setAnswers([])
      setQuizCompleted(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    const isCorrect = selected === questions[currentQuestion].correctAnswerIndex
    const newAnswers = [...answers, { questionIdx: currentQuestion, selected, correct: isCorrect }]
    setAnswers(newAnswers)
    
    if (isCorrect) {
      setScore(score + 1)
    }

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1)
      setSelected(null)
      setShowExpl(false)
    } else {
      // Quiz completed
      const finalScore = isCorrect ? score + 1 : score
      const percentage = Math.round((finalScore / questions.length) * 100)
      setQuizCompleted(true)
      if (percentage >= 80) {
        setShowCongrats(true)
      }
    }
  }

  const handleRetake = () => {
    setCurrentQuestion(0)
    setScore(0)
    setAnswers([])
    setQuizCompleted(false)
    setShowCongrats(false)
    setSelected(null)
    setShowExpl(false)
  }

  const percentage = quizCompleted ? Math.round((score / questions.length) * 100) : 0
  const passed = percentage >= 80

  return (
    <div style={{ padding: 28, animation: "fadeIn 0.4s ease" }}>
      {/* Congratulations Modal */}
      {showCongrats && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "var(--white)", borderRadius: 24, padding: 40,
            maxWidth: 500, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            animation: "fadeUp 0.4s ease"
          }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--gray-900)", marginBottom: 8, letterSpacing: "-0.02em" }}>Congratulations!</h1>
            <p style={{ fontSize: 16, color: "var(--gray-600)", marginBottom: 24, lineHeight: 1.6 }}>You've successfully completed the {topic} quiz with a score of <strong>{percentage}%</strong></p>
            <p style={{ fontSize: 13, color: "var(--gray-500)", marginBottom: 32 }}>Great job! Keep practicing to master more skills.</p>
            <Btn onClick={() => setShowCongrats(false)} style={{ width: "100%", justifyContent: "center" }}>Continue</Btn>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--gray-900)", letterSpacing: "-0.04em" }}>Adaptive Quiz</h2>
          {questions && !quizCompleted && <Badge>Question {currentQuestion + 1} / {questions.length}</Badge>}
        </div>
        {questions && !quizCompleted && (
          <div style={{ height: 4, background: "var(--gray-100)", borderRadius: 99 }}>
            <div style={{ height: "100%", borderRadius: 99, width: `${((currentQuestion + 1) / questions.length) * 100}%`, background: "var(--gray-700)", transition: "width 0.4s ease" }}/>
          </div>
        )}
      </div>

      {!questions && (
        <Card>
          <div style={{ display: 'flex', gap: '12px', alignItems: "center" }}>
            <input
              placeholder="Topic (e.g., Python, React, DSA)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              style={{
                flex: 1, padding: "12px 14px", background: "var(--gray-50)",
                border: "1px solid var(--gray-200)", borderRadius: 10,
                fontSize: 13.5, color: "var(--gray-700)", outline: "none",
                fontFamily: "inherit",
              }}
            />
            <Btn onClick={handleGenerate} disabled={loading}>
              Generate Quiz
            </Btn>
          </div>
        </Card>
      )}

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
          <div style={{ width: 40, height: 40, border: "3px solid var(--gray-150)", borderTopColor: "var(--gray-700)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        </div>
      )}

      {quizCompleted && (
        <Card style={{ maxWidth: 600, textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gray-400)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Quiz Result</div>
          <div style={{ fontSize: 56, fontWeight: 800, color: passed ? "var(--gray-900)" : "var(--gray-600)", marginBottom: 8, letterSpacing: "-0.02em" }}>
            {percentage}%
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: passed ? "var(--gray-900)" : "var(--gray-600)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {passed ? "PASS" : "TRY AGAIN"}
          </div>
          <p style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 28, lineHeight: 1.5 }}>
            {passed 
              ? `Passing criteria is 80%. You cleared ${topic} section.`
              : `Passing criteria is 80%. Score more than 80% to pass.`
            }
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Btn variant="secondary" style={{ flex: 1, justifyContent: "center" }}>Back to Setup</Btn>
            <Btn onClick={handleRetake} style={{ flex: 1, justifyContent: "center" }}>Retake Quiz</Btn>
          </div>
        </Card>
      )}

      {questions && questions.length > 0 && !quizCompleted && (
        <div style={{ maxWidth: 600 }}>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gray-400)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>{topic}</div>
            <p style={{ fontSize: 16, fontWeight: 550, color: "var(--gray-900)", lineHeight: 1.6, letterSpacing: "-0.02em" }}>{questions[currentQuestion].question}</p>
          </Card>

          {questions[currentQuestion].options && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {questions[currentQuestion].options.map((opt, i) => {
                const isSelected = selected === i;
                let bg = "var(--white)", border = "var(--gray-200)", color = "var(--gray-700)";
                if (isSelected) { bg = "var(--gray-900)"; border = "var(--gray-900)"; color = "var(--white)"; }

                return (
                  <button key={i} onClick={() => setSelected(i)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "14px 18px", borderRadius: 12,
                      border: `1.5px solid ${border}`, background: bg, color,
                      cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                      fontSize: 14, fontWeight: 500, transition: "all var(--transition)",
                    }}>
                    <span style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {["A","B","C","D"][i]}
                    </span>
                    {opt.text}
                  </button>
                );
              })}
            </div>
          )}

          {selected !== null && (
            <Card style={{ background: "var(--gray-50)", borderStyle: "dashed" }}>
              <button onClick={() => setShowExpl(!showExpl)}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--gray-700)", fontFamily: "inherit", width: "100%", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name="zap" size={14} color="var(--gray-500)"/> Explanation</span>
                <Icon name="chevron" size={14} color="var(--gray-400)" style={{ transform: showExpl ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}/>
              </button>
              {showExpl && <p style={{ fontSize: 13, color: "var(--gray-600)", marginTop: 10, lineHeight: 1.65 }}>This is the explanation for the correct answer.</p>}
            </Card>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Btn variant="secondary" style={{ flex: 1, justifyContent: "center" }} disabled={currentQuestion === 0}>Previous</Btn>
            <Btn onClick={handleNext} style={{ flex: 2, justifyContent: "center" }} disabled={selected === null}>
              {currentQuestion + 1 === questions.length ? "Submit Quiz" : "Next question"}
            </Btn>
          </div>
        </div>
      )}
    </div>
  )
}
