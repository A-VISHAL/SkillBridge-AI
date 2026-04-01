import { useState } from 'react'
import { searchJobs } from '../utils/api'

const Card = ({ children, style = {} }) => (
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
    <div style={{ padding: 28, animation: "fadeIn 0.4s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--gray-900)", letterSpacing: "-0.04em", marginBottom: 4 }}>Job Finder</h2>
        <p style={{ fontSize: 13.5, color: "var(--gray-500)" }}>Curated job matches scored against your profile.</p>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: "center" }}>
          <input
            placeholder="Target role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{
              flex: 1, padding: "12px 14px", background: "var(--gray-50)",
              border: "1px solid var(--gray-200)", borderRadius: 10,
              fontSize: 13.5, color: "var(--gray-700)", outline: "none",
              fontFamily: "inherit",
            }}
          />
          <Btn onClick={handleSearch} disabled={loading}>
            Search Jobs
          </Btn>
        </div>
      </Card>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
          <div style={{ width: 40, height: 40, border: "3px solid var(--gray-150)", borderTopColor: "var(--gray-700)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        </div>
      )}

      {jobs && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
          {jobs.map((job, idx) => (
            <Card key={idx} style={{ transition: "all var(--transition)" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "flex-start" }}>
                <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 650, color: "var(--gray-900)", letterSpacing: "-0.02em" }}>{job.title}</h3>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: 99, fontSize: 13, fontWeight: 600,
                  background: job.match_percentage >= 70 ? "#f0fdf4" : job.match_percentage >= 50 ? "#fffbeb" : "#fef2f2",
                  color: job.match_percentage >= 70 ? "#166534" : job.match_percentage >= 50 ? "#92400e" : "#991b1b",
                  border: `1px solid ${job.match_percentage >= 70 ? "#bbf7d0" : job.match_percentage >= 50 ? "#fde68a" : "#fca5a5"}`,
                }}>
                  {Math.round(job.match_percentage)}% Match
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--gray-500)", marginBottom: 8 }}>
                🏢 {job.company} | 📍 {job.location}
              </div>
              {job.salary && (
                <div style={{ fontSize: 13, color: "#166534", marginBottom: 8, fontWeight: 500 }}>
                  💰 {job.salary}
                </div>
              )}
              <p style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 12, lineHeight: 1.65 }}>
                {job.description.substring(0, 150)}...
              </p>
              <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {job.required_skills.slice(0, 5).map((skill, sidx) => (
                  <span key={sidx} style={{
                    padding: "4px 10px", borderRadius: 99,
                    background: "var(--gray-100)", fontSize: 11,
                    color: "var(--gray-600)", fontWeight: 500,
                    border: "1px solid var(--gray-200)",
                  }}>{skill}</span>
                ))}
              </div>
              <a href={job.apply_link} target="_blank" rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  padding: "8px 18px", borderRadius: 99, fontSize: 13, fontWeight: 600,
                  background: "var(--black)", color: "var(--white)",
                  textDecoration: "none", transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--gray-900)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--black)"; e.currentTarget.style.transform = "none"; }}>
                Apply Now
              </a>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
