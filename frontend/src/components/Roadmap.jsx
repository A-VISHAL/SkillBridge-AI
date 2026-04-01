import { useState } from 'react'
import { generateRoadmap } from '../utils/api'

const Badge = ({ children, variant = "default", style = {} }) => {
  const styles = {
    default: { bg: "var(--gray-100)", color: "var(--gray-600)", border: "var(--gray-200)" },
    success: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
    warning: { bg: "#fffbeb", color: "#92400e", border: "#fde68a" },
    error: { bg: "#fef2f2", color: "#991b1b", border: "#fca5a5" },
    neutral: { bg: "var(--gray-800)", color: "var(--white)", border: "var(--gray-800)" },
  };
  const s = styles[variant];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 10px", borderRadius: 99,
      fontSize: 11, fontWeight: 500, letterSpacing: "0.02em",
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      ...style,
    }}>
      {children}
    </span>
  );
};

const Btn = ({ children, variant = "primary", onClick, style = {} }) => {
  const [hovered, setHovered] = useState(false);
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 8, padding: "10px 22px", borderRadius: 99,
    fontSize: 13.5, fontWeight: 600, cursor: "pointer",
    transition: "all 0.2s ease", border: "none", fontFamily: "inherit",
    letterSpacing: "-0.01em",
  };
  const variants = {
    primary: {
      background: hovered ? "var(--gray-900)" : "var(--black)",
      color: "var(--white)",
      boxShadow: hovered ? "0 6px 20px rgba(0,0,0,0.22)" : "0 2px 8px rgba(0,0,0,0.12)",
      transform: hovered ? "translateY(-1px)" : "none",
    },
  };
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
};

const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const icons = {
    check: <><polyline points="20 6 9 17 4 12"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
};

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

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ width: 40, height: 40, border: "3px solid var(--gray-150)", borderTopColor: "var(--gray-700)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
    </div>
  )

  // Group tasks by week
  const weekGroups = roadmap ? roadmap.tasks.reduce((acc, task) => {
    if (!acc[task.week]) acc[task.week] = [];
    acc[task.week].push(task);
    return acc;
  }, {}) : {};

  const weeks = Object.keys(weekGroups).map(weekNum => ({
    num: parseInt(weekNum),
    title: `Week ${weekNum}`,
    topics: weekGroups[weekNum].map(t => t.skill),
    tasks: weekGroups[weekNum].map(t => t.task),
    done: false,
    current: parseInt(weekNum) === 1,
  }));

  return (
    <div style={{ padding: 28, animation: "fadeIn 0.4s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--gray-900)", letterSpacing: "-0.04em", marginBottom: 4 }}>
          {roadmap ? `${roadmap.duration_weeks}-Week Roadmap` : 'Learning Roadmap'}
        </h2>
        <p style={{ fontSize: 13.5, color: "var(--gray-500)" }}>
          {roadmap ? `Your personalised journey (${roadmap.daily_hours} hours/day)` : 'Generate your personalized learning path'}
        </p>
      </div>

      {!roadmap && (
        <div style={{ background: "var(--white)", border: "1px solid var(--gray-150)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", padding: 24 }}>
          <Btn onClick={handleGenerate}>Generate Roadmap</Btn>
        </div>
      )}

      {roadmap && (
        <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 16 }}>
          {weeks.map(week => (
            <div key={week.num}
              className="card-hover"
              style={{
                flexShrink: 0, width: 220,
                background: week.current ? "var(--gray-900)" : "var(--white)",
                border: `1px solid ${week.current ? "transparent" : "var(--gray-150)"}`,
                borderRadius: "var(--radius-lg)", padding: "20px 18px",
                boxShadow: week.current ? "var(--shadow-lg)" : "var(--shadow-md)",
                opacity: week.done ? 0.6 : 1,
                transition: "transform var(--transition), box-shadow var(--transition)",
              }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: week.current ? "rgba(255,255,255,0.5)" : "var(--gray-300)", fontFamily: "'DM Mono', monospace" }}>
                  WEEK {week.num}
                </div>
                {week.done && <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--gray-200)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="check" size={10} color="var(--gray-600)"/>
                </div>}
                {week.current && <Badge variant="neutral" style={{ fontSize: 10, padding: "2px 8px" }}>Now</Badge>}
              </div>

              <div style={{ fontSize: 14.5, fontWeight: 650, color: week.current ? "var(--white)" : "var(--gray-900)", marginBottom: 12, letterSpacing: "-0.02em" }}>{week.title}</div>

              <div style={{ marginBottom: 14 }}>
                {week.topics.slice(0, 3).map((t, i) => (
                  <div key={i} style={{ fontSize: 12, color: week.current ? "rgba(255,255,255,0.65)" : "var(--gray-500)", padding: "2px 0" }}>· {t}</div>
                ))}
              </div>

              <div style={{ borderTop: `1px solid ${week.current ? "rgba(255,255,255,0.12)" : "var(--gray-100)"}`, paddingTop: 12 }}>
                {week.tasks.slice(0, 2).map((task, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 0" }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: 4, flexShrink: 0,
                      border: `1.5px solid ${week.current ? "rgba(255,255,255,0.4)" : "var(--gray-300)"}`,
                      background: week.done ? "var(--gray-400)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {week.done && <Icon name="check" size={8} color="white"/>}
                    </div>
                    <span style={{ fontSize: 12, color: week.current ? "rgba(255,255,255,0.7)" : "var(--gray-600)" }}>{task.substring(0, 30)}...</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
