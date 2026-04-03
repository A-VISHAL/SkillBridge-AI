import { useState, useEffect, useRef } from 'react'

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

const Btn = ({ children, variant = "primary", onClick, style = {}, disabled = false }) => {
  const [hovered, setHovered] = useState(false);
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 8, padding: "10px 22px", borderRadius: 99,
    fontSize: 13.5, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s ease", border: "none", fontFamily: "inherit",
    letterSpacing: "-0.01em", opacity: disabled ? 0.6 : 1,
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
      border: "1px solid var(--gray-200)",
      boxShadow: "var(--shadow-sm)",
    },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
};

const Card = ({ children, style = {}, hover = false }) => (
  <div style={{
    background: "var(--white)",
    border: "1px solid var(--gray-150)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-md)",
    padding: 24,
    ...style,
  }}>
    {children}
  </div>
);

const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const icons = {
    check: <><polyline points="20 6 9 17 4 12"/></>,
    chevron: <><polyline points="9 18 15 12 9 6"/></>,
    zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
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
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [taskProgress, setTaskProgress] = useState({});
  const weeklyProgressRef = useRef({});

  const generateRoadmap = async (weeks) => {
    if (!resumeId) {
      setError("Upload your resume in Resume Analyzer first.");
      setRoadmap(null);
      return;
    }
    if (!jobDescription) {
      setError("Analyze a JD in JD Matcher first to generate a roadmap.");
      setRoadmap(null);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("resume_id", resumeId);
      formData.append("job_description", jobDescription);
      formData.append("daily_hours", 2);

      // Use the AI service or fallback
      const response = await fetch('/api/roadmap', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to generate roadmap");
      }

      const data = await response.json();
      
      // Validate and filter tasks by duration
      if (data.tasks && Array.isArray(data.tasks)) {
        data.tasks = data.tasks.filter(task => task.week <= weeks);
      }
      
      data.duration_weeks = weeks;
      setRoadmap(data);
      setTaskProgress({});
      weeklyProgressRef.current = {};
    } catch (e) {
      console.error(e);
      setError("Could not generate roadmap. Ensure API is configured and try again.");
      setRoadmap(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskComplete = (weekNum, taskIdx) => {
    const key = `${weekNum}-${taskIdx}`;
    setTaskProgress(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDurationChange = (weeks) => {
    setDurationWeeks(weeks);
    generateRoadmap(weeks);
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ width: 40, height: 40, border: "3px solid var(--gray-150)", borderTopColor: "var(--gray-700)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
    </div>
  );

  // Group tasks by week
  const weekGroups = roadmap ? (roadmap.tasks || []).reduce((acc, task) => {
    if (!acc[task.week]) acc[task.week] = [];
    acc[task.week].push(task);
    return acc;
  }, {}) : {};

  const weeks = Object.keys(weekGroups)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map(weekNum => {
      const num = parseInt(weekNum);
      const tasks = weekGroups[weekNum];
      const completedCount = tasks.filter((_, idx) => taskProgress[`${num}-${idx}`]).length;
      const isWeekComplete = completedCount === tasks.length && tasks.length > 0;
      
      return {
        num,
        title: `Week ${weekNum}`,
        topics: [...new Set(tasks.map(t => t.skill).filter(Boolean))],
        tasks: tasks.map((t, idx) => ({ ...t, idx, isComplete: taskProgress[`${num}-${idx}`] })),
        completed: completedCount,
        total: tasks.length,
        isComplete: isWeekComplete,
        current: num === 1,
      };
    });

  const totalTasks = weeks.reduce((sum, w) => sum + w.total, 0);
  const completedTasks = weeks.reduce((sum, w) => sum + w.completed, 0);
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div style={{ padding: 28, animation: "fadeIn 0.4s ease", display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--gray-900)", letterSpacing: "-0.04em", marginBottom: 4 }}>
          {roadmap ? `${durationWeeks}-Week Roadmap` : 'Learning Roadmap'}
        </h2>
        <p style={{ fontSize: 13.5, color: "var(--gray-500)" }}>
          {roadmap 
            ? `Your personalized learning path (${roadmap.daily_hours || 2} hours/day)` 
            : 'Generate a custom learning roadmap based on your resume and target JD'}
        </p>
      </div>

      {error && (
        <Card style={{ background: "#fef2f2", border: "1px solid #fca5a5", padding: "14px 16px" }}>
          <div style={{ fontSize: 13, color: "#991b1b", fontWeight: 600 }}>{error}</div>
        </Card>
      )}

      {!roadmap ? (
        <Card style={{ padding: "24px 28px" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13.5, fontWeight: 650, color: "var(--gray-900)", marginBottom: 12 }}>Select Roadmap Duration</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[4, 8, 12].map(weeks => (
                <Btn 
                  key={weeks}
                  variant={durationWeeks === weeks ? "primary" : "secondary"}
                  onClick={() => handleDurationChange(weeks)}
                  style={{ padding: "10px 20px", fontSize: 13 }}
                >
                  {weeks} weeks
                </Btn>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Progress Overview */}
          <Card style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 650, color: "var(--gray-900)" }}>Overall Progress</div>
                <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}>
                  {completedTasks} of {totalTasks} tasks completed
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--gray-900)", textAlign: "right" }}>
                {overallProgress}%
              </div>
            </div>
            <div style={{ height: 6, background: "var(--gray-100)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                background: "linear-gradient(90deg, var(--gray-700), var(--gray-400))",
                width: `${overallProgress}%`,
                transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                borderRadius: 99,
              }}/>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              {[4, 8, 12].map(w => (
                <button
                  key={w}
                  onClick={() => handleDurationChange(w)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 99,
                    border: durationWeeks === w ? "2px solid var(--gray-900)" : "1px solid var(--gray-200)",
                    background: durationWeeks === w ? "var(--gray-900)" : "var(--white)",
                    color: durationWeeks === w ? "var(--white)" : "var(--gray-700)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontFamily: "inherit",
                  }}
                >
                  {w}w
                </button>
              ))}
            </div>
          </Card>

          {/* Weekly Cards */}
          <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 16 }}>
            {weeks.map(week => (
              <div
                key={week.num}
                style={{
                  flexShrink: 0, width: 260,
                  background: week.current ? "var(--gray-900)" : "var(--white)",
                  border: `1px solid ${week.current ? "transparent" : "var(--gray-150)"}`,
                  borderRadius: "var(--radius-lg)", padding: "20px 18px",
                  boxShadow: week.current ? "var(--shadow-lg)" : "var(--shadow-md)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: week.current ? "rgba(255,255,255,0.5)" : "var(--gray-300)", fontFamily: "'DM Mono', monospace" }}>
                    WEEK {week.num}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {week.isComplete && (
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="check" size={10} color="white"/>
                      </div>
                    )}
                    {week.current && <Badge variant="neutral" style={{ fontSize: 10, padding: "2px 8px" }}>Now</Badge>}
                  </div>
                </div>

                <div style={{ fontSize: 14.5, fontWeight: 650, color: week.current ? "var(--white)" : "var(--gray-900)", marginBottom: 4, letterSpacing: "-0.02em" }}>
                  {week.title}
                </div>
                <div style={{ fontSize: 12, color: week.current ? "rgba(255,255,255,0.6)" : "var(--gray-500)", marginBottom: 12 }}>
                  {week.completed}/{week.total} tasks
                </div>

                {/* Topics */}
                {week.topics.length > 0 && (
                  <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${week.current ? "rgba(255,255,255,0.12)" : "var(--gray-100)"}` }}>
                    {week.topics.slice(0, 3).map((t, i) => (
                      <div key={i} style={{ fontSize: 11.5, color: week.current ? "rgba(255,255,255,0.65)" : "var(--gray-600)", padding: "2px 0", fontWeight: 500 }}>
                        • {t}
                      </div>
                    ))}
                  </div>
                )}

                {/* Tasks with Checkboxes */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {week.tasks.slice(0, 4).map((task) => (
                    <div key={task.idx} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <button
                        onClick={() => toggleTaskComplete(week.num, task.idx)}
                        style={{
                          width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 2,
                          border: `1.5px solid ${week.current ? "rgba(255,255,255,0.4)" : task.isComplete ? "var(--gray-700)" : "var(--gray-300)"}`,
                          background: task.isComplete ? (week.current ? "rgba(255,255,255,0.3)" : "var(--gray-700)") : "transparent",
                          cursor: "pointer", transition: "all 0.2s",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "inherit",
                        }}
                      >
                        {task.isComplete && <Icon name="check" size={10} color={week.current ? "rgba(255,255,255,0.8)" : "white"}/>}
                      </button>
                      <span style={{
                        fontSize: 12,
                        color: week.current ? "rgba(255,255,255,0.7)" : "var(--gray-600)",
                        textDecoration: task.isComplete ? "line-through" : "none",
                        opacity: task.isComplete ? 0.6 : 1,
                        lineHeight: 1.4,
                      }}>
                        {task.task}
                      </span>
                    </div>
                  ))}
                  {week.tasks.length > 4 && (
                    <div style={{ fontSize: 11, color: week.current ? "rgba(255,255,255,0.5)" : "var(--gray-500)", fontWeight: 500 }}>
                      +{week.tasks.length - 4} more tasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tracking Section */}
          <Card>
            <div style={{ fontSize: 13.5, fontWeight: 650, color: "var(--gray-900)", marginBottom: 16 }}>Track Your Progress</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              {weeks.map(week => (
                <div key={week.num} style={{
                  padding: "14px 16px", borderRadius: "12px",
                  background: week.isComplete ? "#f0fdf4" : "var(--gray-50)",
                  border: week.isComplete ? "1px solid #bbf7d0" : "1px solid var(--gray-200)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{
                      fontSize: 13, fontWeight: 600,
                      color: week.isComplete ? "#166534" : "var(--gray-700)",
                    }}>
                      Week {week.num}
                    </span>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: week.isComplete ? "#166534" : "var(--gray-600)",
                    }}>
                      {week.completed}/{week.total}
                    </span>
                  </div>
                  <div style={{
                    height: 4, background: "rgba(0,0,0,0.1)", borderRadius: 99, overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%", background: week.isComplete ? "#10b981" : "var(--gray-600)",
                      width: `${week.total > 0 ? (week.completed / week.total) * 100 : 0}%`,
                      transition: "width 0.4s ease",
                      borderRadius: 99,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
