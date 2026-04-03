import { useState, useEffect, useRef } from "react";
import Roadmap from "./components/Roadmap";

// ─── Design tokens ───────────────────────────────────────────────────────────
const tokens = {
  font: "'Geist', 'DM Sans', system-ui, sans-serif",
  fontMono: "'Geist Mono', monospace",
};

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --white: #ffffff;
    --gray-50: #f9f9f9;
    --gray-100: #f3f3f3;
    --gray-150: #ebebeb;
    --gray-200: #e2e2e2;
    --gray-300: #c8c8c8;
    --gray-400: #a0a0a0;
    --gray-500: #737373;
    --gray-600: #525252;
    --gray-700: #3a3a3a;
    --gray-800: #262626;
    --gray-900: #171717;
    --black: #0a0a0a;
    --shadow-xs: 0 1px 2px rgba(0,0,0,0.04);
    --shadow-sm: 0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04);
    --shadow-lg: 0 8px 32px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.04);
    --shadow-xl: 0 16px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06);
    --radius-sm: 10px;
    --radius-md: 14px;
    --radius-lg: 20px;
    --radius-xl: 28px;
    --radius-full: 9999px;
    --transition: 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-slow: 0.45s cubic-bezier(0.4, 0, 0.2, 1);
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: 'DM Sans', system-ui, sans-serif;
    background: var(--white);
    color: var(--gray-800);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--gray-200); border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--gray-300); }

  /* Fade-in animation */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  @keyframes spin {
    to { stroke-dashoffset: 0; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  @keyframes floatParticle1 {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(30px, -40px); }
    50% { transform: translate(-20px, -80px); }
    75% { transform: translate(40px, -60px); }
  }
  @keyframes floatParticle2 {
    0%, 100% { transform: translate(0, 0); }
    33% { transform: translate(-40px, -50px); }
    66% { transform: translate(30px, -90px); }
  }
  @keyframes floatParticle3 {
    0%, 100% { transform: translate(0, 0); }
    20% { transform: translate(50px, -30px); }
    40% { transform: translate(-30px, -70px); }
    60% { transform: translate(20px, -100px); }
    80% { transform: translate(-40px, -50px); }
  }
  @keyframes floatSlow {
    0%, 100% { transform: translateY(0px) translateX(0px); }
    50% { transform: translateY(-20px) translateX(10px); }
  }

  .fade-up { animation: fadeUp 0.6s ease forwards; }
  .fade-in { animation: fadeIn 0.5s ease forwards; }

  /* Card hover */
  .card-hover {
    transition: transform var(--transition), box-shadow var(--transition);
  }
  .card-hover:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06);
  }

  /* Glass */
  .glass {
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(20px) saturate(1.8);
    -webkit-backdrop-filter: blur(20px) saturate(1.8);
    border: 1px solid rgba(255,255,255,0.6);
  }

  /* Gradient mesh background */
  .mesh-bg {
    background:
      radial-gradient(ellipse 80% 50% at 20% -10%, rgba(200,200,200,0.13) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 110%, rgba(180,180,180,0.1) 0%, transparent 60%),
      var(--white);
  }
`;

// ─── Shared micro-components ─────────────────────────────────────────────────

const Badge = ({ children, variant = "default", style = {} }) => {
  const styles = {
    default: { bg: "var(--gray-100)", color: "var(--gray-600)", border: "var(--gray-200)" },
    success: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
    warning: { bg: "#fffbeb", color: "#92400e", border: "#fde68a" },
    error: { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
    neutral: { bg: "var(--gray-800)", color: "var(--white)", border: "var(--gray-800)" },
  };
  const s = styles[variant] ?? styles.default;
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

const Btn = ({ children, variant = "primary", onClick, style = {}, icon }) => {
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
    secondary: {
      background: hovered ? "var(--gray-100)" : "var(--white)",
      color: "var(--gray-800)",
      boxShadow: "var(--shadow-sm)",
      border: "1px solid var(--gray-200)",
      transform: hovered ? "translateY(-1px)" : "none",
    },
    ghost: {
      background: hovered ? "var(--gray-100)" : "transparent",
      color: "var(--gray-700)",
      boxShadow: "none",
    },
    outline: {
      background: "transparent",
      color: "var(--gray-800)",
      border: "1.5px solid var(--gray-300)",
      boxShadow: "none",
      transform: hovered ? "translateY(-1px)" : "none",
    },
  };
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...base, ...variants[variant], ...style }}>
      {icon && <span style={{ display: "flex" }}>{icon}</span>}
      {children}
    </button>
  );
};

const Card = ({ children, style = {}, hover = true, glass = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`${hover ? "card-hover" : ""} ${glass ? "glass" : ""}`}
      onMouseEnter={() => hover && setIsHovered(true)}
      onMouseLeave={() => hover && setIsHovered(false)}
      style={{
        background: glass ? undefined : "var(--white)",
        border: "1px solid var(--gray-150)",
        borderRadius: "var(--radius-lg)",
        boxShadow: isHovered && hover ? "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)" : "var(--shadow-md)",
        padding: 24,
        transform: isHovered && hover ? "translateY(-8px)" : "translateY(0)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        ...style,
      }}>
      {children}
    </div>
  );
}

// ─── Icons (minimal inline SVGs) ────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const icons = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    resume: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    match: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    roadmap: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
    quiz: <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    interview: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
    jobs: <><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>,
    bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    upload: <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    chevron: <><polyline points="9 18 15 12 9 6"/></>,
    star: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
    zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    layers: <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
    brain: <><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.84A2.5 2.5 0 0 1 9.5 2"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.84A2.5 2.5 0 0 0 14.5 2"/></>,
    logo: <><circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeWidth="2.5"/><path d="M5.64 5.64l2.12 2.12M16.24 16.24l2.12 2.12M5.64 18.36l2.12-2.12M16.24 7.76l2.12-2.12"/></>,
    trending: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    award: <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></>,
    play: <><polygon points="5 3 19 12 5 21 5 3"/></>,
    mic: <><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></>,
    send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round">
      {icons[name] || icons.zap}
    </svg>
  );
};

// ─── Circular Progress ───────────────────────────────────────────────────────
const CircularProgress = ({ value, size = 120, label }) => {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--gray-100)" strokeWidth="8"/>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--gray-800)" strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}/>
      </svg>
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ fontSize: size * 0.22, fontWeight: 700, color: "var(--gray-900)", lineHeight: 1 }}>{value}</div>
        {label && <div style={{ fontSize: 10, color: "var(--gray-400)", marginTop: 2, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</div>}
      </div>
    </div>
  );
};

// ─── Progress Bar ────────────────────────────────────────────────────────────
const ProgressBar = ({ value, label, sublabel }) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, alignItems: "baseline" }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--gray-700)" }}>{label}</span>
      {sublabel && <span style={{ fontSize: 12, color: "var(--gray-400)", fontWeight: 500 }}>{sublabel}</span>}
    </div>
    <div style={{ height: 6, background: "var(--gray-100)", borderRadius: 99, overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: 99,
        background: "linear-gradient(90deg, var(--gray-700), var(--gray-400))",
        width: `${value}%`,
        transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
      }}/>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const LandingPage = ({ onEnterApp }) => {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState({});
  const sectionsRef = useRef({});

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);

    // Intersection observer for reveal
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) setVisible(p => ({ ...p, [e.target.dataset.key]: true }));
      });
    }, { threshold: 0.15 });

    document.querySelectorAll("[data-key]").forEach(el => obs.observe(el));
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    { icon: "resume", title: "Resume Analyzer", desc: "AI-powered ATS scoring with line-by-line feedback to maximize your resume's impact." },
    { icon: "match", title: "JD Matcher", desc: "Paste any job description and get an instant skill-gap analysis with targeted guidance." },
    { icon: "roadmap", title: "Smart Roadmap", desc: "Personalized week-by-week learning plans tailored to your target role and timeline." },
    { icon: "quiz", title: "Adaptive Quiz", desc: "Dynamic questions that adapt to your knowledge level, reinforcing key concepts." },
    { icon: "interview", title: "Mock Interview", desc: "AI conducts real-time interviews, evaluates responses, and provides actionable scores." },
    { icon: "jobs", title: "Job Finder", desc: "Curated job matches scored against your profile, with one-click application tracking." },
  ];

  const steps = [
    { num: "01", title: "Upload your resume", desc: "Our AI analyses your existing resume against ATS standards in seconds." },
    { num: "02", title: "Set your target role", desc: "Paste a job description or choose from curated roles to define your destination." },
    { num: "03", title: "Follow your roadmap", desc: "Work through a structured plan of topics, resources, and practice sessions." },
    { num: "04", title: "Get hired", desc: "Apply with confidence — your profile is now optimised and interview-ready." },
  ];

  const testimonials = [
    { name: "Ananya S.", role: "SWE @ Google", text: "SkillBridge AI helped me close a 4-month gap in my skillset in just 6 weeks. The roadmap feature is incredibly smart.", avatar: "A" },
    { name: "Rahul M.", role: "PM @ Stripe", text: "The JD Matcher revealed exactly what was missing in my profile. I tailored my resume and got 3x more responses.", avatar: "R" },
    { name: "Priya K.", role: "Data Analyst @ Airbnb", text: "The mock interview feature is eerily realistic. It caught nervousness patterns I didn't even notice.", avatar: "P" },
  ];

  // Animated particles
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 3,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 4,
    duration: Math.random() * 12 + 18,
    animation: `floatParticle${(i % 3) + 1}`
  }));

  return (
    <div className="mesh-bg" style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Animated Background Particles */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        {particles.map(p => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: "rgba(180, 180, 180, 0.25)",
              animation: `${p.animation} ${p.duration}s ease-in-out ${p.delay}s infinite`,
              boxShadow: `0 0 ${p.size * 2}px rgba(180, 180, 180, 0.15)`,
              filter: "blur(0.5px)"
            }}
          />
        ))}
        
        {/* Larger floating shapes */}
        <div style={{
          position: "absolute",
          top: "15%",
          right: "20%",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200, 200, 200, 0.12), transparent 70%)",
          animation: "floatSlow 22s ease-in-out infinite",
          filter: "blur(50px)"
        }}/>
        <div style={{
          position: "absolute",
          bottom: "20%",
          left: "15%",
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(190, 190, 190, 0.1), transparent 70%)",
          animation: "floatSlow 26s ease-in-out infinite 4s",
          filter: "blur(55px)"
        }}/>
        <div style={{
          position: "absolute",
          top: "40%",
          left: "60%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(185, 185, 185, 0.08), transparent 70%)",
          animation: "floatSlow 24s ease-in-out infinite 8s",
          filter: "blur(52px)"
        }}/>
      </div>

      {/* Navbar */}
      <nav className="glass" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: scrolled ? "12px 48px" : "20px 48px",
        transition: "all var(--transition)",
        borderBottom: scrolled ? "1px solid var(--gray-150)" : "1px solid transparent",
        boxShadow: scrolled ? "var(--shadow-sm)" : "none",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--gray-900)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="logo" size={16} color="white"/>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15.5, letterSpacing: "-0.03em", color: "var(--gray-900)" }}>SkillBridge AI</span>
          </div>

          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {["Features", "How it works", "Pricing"].map(n => (
              <a key={n} href="#" style={{ fontSize: 14, color: "var(--gray-500)", textDecoration: "none", fontWeight: 500, letterSpacing: "-0.01em", transition: "color 0.15s" }}
                onMouseEnter={e => e.target.style.color = "var(--gray-900)"}
                onMouseLeave={e => e.target.style.color = "var(--gray-500)"}>{n}</a>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="ghost" style={{ fontSize: 13.5, padding: "8px 18px" }}>Sign in</Btn>
            <Btn variant="primary" onClick={onEnterApp} style={{ padding: "8px 18px", fontSize: 13.5 }}>Get started</Btn>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: 160, paddingBottom: 120, textAlign: "center", maxWidth: 860, margin: "0 auto", padding: "160px 24px 120px" }}>
        <div className="fade-up" style={{ animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}>
          <Badge variant="neutral" style={{ marginBottom: 24 }}>✦ Powered by Claude AI</Badge>
        </div>
        <h1 className="fade-up" style={{
          fontSize: "clamp(40px, 7vw, 72px)", fontWeight: 700,
          lineHeight: 1.06, letterSpacing: "-0.04em",
          color: "var(--gray-900)", marginBottom: 22,
          animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards",
        }}>
          Your AI Career<br/>
          <span style={{ color: "var(--gray-400)" }}>Operating System</span>
        </h1>
        <p className="fade-up" style={{
          fontSize: 18, color: "var(--gray-500)", lineHeight: 1.65,
          maxWidth: 520, margin: "0 auto 44px",
          fontWeight: 400, letterSpacing: "-0.01em",
          animationDelay: "0.3s", opacity: 0, animationFillMode: "forwards",
        }}>
          Analyze, learn, practice, and get hired — powered by AI that understands every nuance of your career journey.
        </p>
        <div className="fade-up" style={{ display: "flex", gap: 12, justifyContent: "center", animationDelay: "0.4s", opacity: 0, animationFillMode: "forwards" }}>
          <Btn variant="primary" onClick={onEnterApp} style={{ padding: "13px 30px", fontSize: 15 }}>
            Get started free
          </Btn>
          <Btn variant="secondary" style={{ padding: "13px 30px", fontSize: 15 }} icon={<Icon name="play" size={14}/>}>
            See demo
          </Btn>
        </div>

        {/* Floating preview card */}
        <div className="fade-up" style={{ animationDelay: "0.6s", opacity: 0, animationFillMode: "forwards", marginTop: 64 }}>
          <div className="glass card-hover" style={{
            borderRadius: "var(--radius-xl)", padding: "28px 32px",
            boxShadow: "var(--shadow-xl)", maxWidth: 640, margin: "0 auto",
            animation: "float 6s ease-in-out infinite",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--gray-400)", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Your Progress Today</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--gray-900)", letterSpacing: "-0.03em" }}>3 tasks completed</div>
              </div>
              <CircularProgress value={78} size={80} label="ATS"/>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { label: "Resume score", val: 82, color: "var(--gray-700)" },
                { label: "JD match", val: 74, color: "var(--gray-500)" },
                { label: "Quiz streak", val: 91, color: "var(--gray-400)" },
              ].map(item => (
                <div key={item.label} style={{ flex: 1, background: "var(--gray-50)", borderRadius: 12, padding: "12px 14px", border: "1px solid var(--gray-150)" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--gray-900)", letterSpacing: "-0.03em" }}>{item.val}%</div>
                  <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 2, fontWeight: 500 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section data-key="features" style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 12, color: "var(--gray-400)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Features</div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700, letterSpacing: "-0.035em", color: "var(--gray-900)", lineHeight: 1.12 }}>
            Everything you need to level up
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
          {features.map((f, i) => (
            <Card key={f.title} style={{
              animationDelay: `${i * 0.07}s`,
              ...(visible.features ? { animation: `fadeUp 0.6s ${i * 0.07}s ease forwards` } : { opacity: 0 }),
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: "var(--gray-100)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 16,
              }}>
                <Icon name={f.icon} size={18} color="var(--gray-700)"/>
              </div>
              <h3 style={{ fontSize: 15.5, fontWeight: 650, color: "var(--gray-900)", marginBottom: 8, letterSpacing: "-0.02em" }}>{f.title}</h3>
              <p style={{ fontSize: 13.5, color: "var(--gray-500)", lineHeight: 1.65 }}>{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section data-key="howto" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <div style={{ fontSize: 11, color: "var(--gray-400)", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 14 }}>PROCESS</div>
          <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, letterSpacing: "-0.04em", color: "var(--gray-900)", lineHeight: 1.1 }}>
            From zero to hired in 4 steps
          </h2>
        </div>
        
        {/* Horizontal Timeline */}
        <div style={{ 
          display: "flex", 
          alignItems: "flex-start", 
          justifyContent: "space-between",
          gap: 40,
          position: "relative",
          maxWidth: 1100,
          margin: "0 auto"
        }}>
          {steps.map((s, i) => (
            <div key={s.num} style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              position: "relative",
              ...(visible.howto ? { animation: `fadeUp 0.7s ${i * 0.15}s ease forwards` } : { opacity: 0 }),
            }}>
              {/* Step Number Circle */}
              <div style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--gray-100)",
                border: "1px solid var(--gray-200)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
                fontSize: 16,
                fontWeight: 700,
                color: "var(--gray-400)",
                fontFamily: "'DM Mono', monospace",
                transition: "all 0.3s ease"
              }}>
                {s.num}
              </div>
              
              {/* Connecting Line */}
              {i < steps.length - 1 && (
                <div style={{
                  position: "absolute",
                  top: 28,
                  left: "calc(50% + 28px)",
                  width: "calc(100% - 56px)",
                  height: 2,
                  background: "var(--gray-200)",
                  zIndex: -1
                }}/>
              )}
              
              {/* Content */}
              <div>
                <h3 style={{ 
                  fontSize: 17, 
                  fontWeight: 700, 
                  color: "var(--gray-900)", 
                  marginBottom: 12, 
                  letterSpacing: "-0.02em" 
                }}>
                  {s.title}
                </h3>
                <p style={{ 
                  fontSize: 13.5, 
                  color: "var(--gray-500)", 
                  lineHeight: 1.7,
                  maxWidth: 220
                }}>
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section data-key="testimonials" style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700, letterSpacing: "-0.035em", color: "var(--gray-900)" }}>
            Trusted by ambitious professionals
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
          {testimonials.map((t, i) => (
            <Card key={t.name} style={{
              ...(visible.testimonials ? { animation: `fadeUp 0.6s ${i * 0.1}s ease forwards` } : { opacity: 0 }),
            }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                {[...Array(5)].map((_, j) => <Icon key={j} name="star" size={13} color="var(--gray-400)"/>)}
              </div>
              <p style={{ fontSize: 14, color: "var(--gray-600)", lineHeight: 1.7, marginBottom: 20 }}>"{t.text}"</p>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "var(--gray-900)", color: "var(--white)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700,
                }}>{t.avatar}</div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 650, color: "var(--gray-900)" }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: "var(--gray-400)" }}>{t.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ maxWidth: 1100, margin: "0 auto 100px", padding: "0 24px" }}>
        <div style={{
          background: "var(--gray-900)", borderRadius: "var(--radius-xl)",
          padding: "60px 64px", textAlign: "center",
          boxShadow: "var(--shadow-xl)",
        }}>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 38px)", fontWeight: 700, color: "var(--white)", letterSpacing: "-0.04em", marginBottom: 14 }}>
            Start your career transformation today
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", marginBottom: 32 }}>
            Join thousands of professionals accelerating their careers with AI.
          </p>
          <Btn variant="secondary" onClick={onEnterApp} style={{ padding: "13px 32px", fontSize: 15 }}>
            Get started free — no credit card
          </Btn>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--gray-150)", padding: "32px 48px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: "var(--gray-900)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="logo" size={12} color="white"/>
            </div>
            <span style={{ fontWeight: 700, fontSize: 13, color: "var(--gray-900)", letterSpacing: "-0.03em" }}>SkillBridge AI</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--gray-400)" }}>© 2025 SkillBridge AI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const Sidebar = ({ active, setActive }) => {
  const nav = [
    { id: "dashboard", icon: "dashboard", label: "Overview" },
    { id: "resume", icon: "resume", label: "Resume" },
    { id: "matcher", icon: "match", label: "JD Matcher" },
    { id: "roadmap", icon: "roadmap", label: "Roadmap" },
    { id: "quiz", icon: "quiz", label: "Quiz" },
    { id: "interview", icon: "interview", label: "Interview" },
    { id: "jobs", icon: "jobs", label: "Jobs" },
  ];

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      background: "var(--white)",
      borderRight: "1px solid var(--gray-150)",
      display: "flex", flexDirection: "column",
      padding: "24px 0",
      height: "100vh", position: "sticky", top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "0 20px 24px", borderBottom: "1px solid var(--gray-100)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--gray-900)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="logo" size={14} color="white"/>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--gray-900)", letterSpacing: "-0.03em" }}>SkillBridge</div>
            <div style={{ fontSize: 10, color: "var(--gray-400)", fontWeight: 500 }}>AI Career OS</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        {nav.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => setActive(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10,
                border: "none", cursor: "pointer", width: "100%", textAlign: "left",
                background: isActive ? "var(--gray-100)" : "transparent",
                color: isActive ? "var(--gray-900)" : "var(--gray-500)",
                fontSize: 13.5, fontWeight: isActive ? 600 : 500,
                transition: "all var(--transition)",
                fontFamily: "inherit",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--gray-50)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
              <Icon name={item.icon} size={16} color={isActive ? "var(--gray-900)" : "var(--gray-400)"}/>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--gray-100)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--gray-900)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--white)" }}>A</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-800)" }}>Aryan Sharma</div>
            <div style={{ fontSize: 11, color: "var(--gray-400)" }}>Pro plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

// ─── Topbar ───────────────────────────────────────────────────────────────────
const Topbar = ({ title, onLogout }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header style={{
      height: 60, borderBottom: "1px solid var(--gray-150)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 28px", background: "var(--white)", position: "sticky", top: 0, zIndex: 10,
    }}>
      <h1 style={{ fontSize: 16, fontWeight: 650, color: "var(--gray-900)", letterSpacing: "-0.025em" }}>{title}</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--gray-50)", border: "1px solid var(--gray-200)",
          borderRadius: 99, padding: "8px 14px", width: 200,
        }}>
          <Icon name="search" size={14} color="var(--gray-400)"/>
          <input placeholder="Search anything..." style={{
            border: "none", background: "transparent", fontSize: 13, color: "var(--gray-600)",
            outline: "none", width: "100%", fontFamily: "inherit",
          }}/>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: "50%", background: "var(--gray-50)",
          border: "1px solid var(--gray-200)", display: "flex", alignItems: "center",
          justifyContent: "center", cursor: "pointer", position: "relative",
        }}>
          <Icon name="bell" size={15} color="var(--gray-500)"/>
          <div style={{
            position: "absolute", top: 8, right: 8,
            width: 7, height: 7, borderRadius: "50%",
            background: "var(--gray-700)", border: "1.5px solid var(--white)",
          }}/>
        </div>
        <div ref={profileRef} style={{ position: "relative" }}>
          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{ 
              width: 32, height: 32, borderRadius: "50%", 
              background: "var(--gray-900)", display: "flex", 
              alignItems: "center", justifyContent: "center", 
              fontSize: 12, fontWeight: 700, color: "var(--white)", 
              cursor: "pointer",
              transition: "transform 0.2s ease",
              transform: showProfileMenu ? "scale(0.95)" : "scale(1)"
            }}>
            A
          </div>
          {showProfileMenu && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              background: "var(--white)", border: "1px solid var(--gray-150)",
              borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)",
              minWidth: 180, padding: "6px", zIndex: 100,
              animation: "fadeIn 0.15s ease"
            }}>
              <div style={{
                padding: "10px 12px", borderRadius: "8px",
                cursor: "pointer", transition: "background 0.15s ease",
                display: "flex", alignItems: "center", gap: 10,
                fontSize: 13.5, color: "var(--gray-700)", fontWeight: 500
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--gray-50)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <Icon name="user" size={15} color="var(--gray-500)"/>
                Profile
              </div>
              <div style={{
                padding: "10px 12px", borderRadius: "8px",
                cursor: "pointer", transition: "background 0.15s ease",
                display: "flex", alignItems: "center", gap: 10,
                fontSize: 13.5, color: "var(--gray-700)", fontWeight: 500
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--gray-50)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <Icon name="settings" size={15} color="var(--gray-500)"/>
                Settings
              </div>
              <div style={{ height: 1, background: "var(--gray-150)", margin: "6px 0" }}/>
              <div 
                onClick={onLogout}
                style={{
                  padding: "10px 12px", borderRadius: "8px",
                  cursor: "pointer", transition: "background 0.15s ease",
                  display: "flex", alignItems: "center", gap: 10,
                  fontSize: 13.5, color: "var(--gray-700)", fontWeight: 500
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--gray-50)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <Icon name="x" size={15} color="var(--gray-500)"/>
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// ─── Dashboard Overview ───────────────────────────────────────────────────────
const DashboardOverview = () => {
  const stats = [
    { label: "ATS Score", value: "82", unit: "/100", icon: "award", trend: "+6 this week" },
    { label: "JD Match", value: "74", unit: "%", icon: "target", trend: "+12 since last JD" },
    { label: "Quiz Streak", value: "7", unit: "days", icon: "zap", trend: "Personal best!" },
    { label: "Jobs Applied", value: "4", unit: "/ 12 shortlisted", icon: "jobs", trend: "2 in review" },
  ];

  return (
    <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: 24, animation: "fadeIn 0.4s ease" }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--gray-900)", letterSpacing: "-0.04em", marginBottom: 4 }}>Good morning, Aryan ✦</h2>
        <p style={{ fontSize: 13.5, color: "var(--gray-500)" }}>Here's your career progress at a glance.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {stats.map(s => (
          <Card key={s.label} style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--gray-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={s.icon} size={16} color="var(--gray-600)"/>
              </div>
              <Badge>{s.trend}</Badge>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--gray-900)", letterSpacing: "-0.04em", lineHeight: 1 }}>
              {s.value}<span style={{ fontSize: 13, color: "var(--gray-400)", fontWeight: 500, marginLeft: 3 }}>{s.unit}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 6, fontWeight: 500 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>
        <Card>
          <div style={{ fontSize: 13.5, fontWeight: 650, color: "var(--gray-900)", marginBottom: 18, letterSpacing: "-0.02em" }}>Weekly Progress</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <ProgressBar value={82} label="Resume strength" sublabel="82%"/>
            <ProgressBar value={74} label="JD match rate" sublabel="74%"/>
            <ProgressBar value={65} label="Roadmap completion" sublabel="Week 3 / 8"/>
            <ProgressBar value={91} label="Quiz accuracy" sublabel="91%"/>
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 13.5, fontWeight: 650, color: "var(--gray-900)", marginBottom: 18, letterSpacing: "-0.02em" }}>Today's Tasks</div>
          {[
            { task: "Complete React module quiz", done: true },
            { task: "Update resume summary", done: true },
            { task: "Practice system design Q&A", done: false },
            { task: "Apply to 2 new jobs", done: false },
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < 3 ? "1px solid var(--gray-100)" : "none" }}>
              <div style={{
                width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${t.done ? "var(--gray-700)" : "var(--gray-250)"}`,
                background: t.done ? "var(--gray-900)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {t.done && <Icon name="check" size={10} color="white"/>}
              </div>
              <span style={{ fontSize: 13, color: t.done ? "var(--gray-400)" : "var(--gray-700)", textDecoration: t.done ? "line-through" : "none", fontWeight: 500 }}>{t.task}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// ─── Resume Analyzer ──────────────────────────────────────────────────────────
const ResumeAnalyzer = ({ onResumeParsed }) => {
  const [uploaded, setUploaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [resumeId, setResumeId] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [atsScore, setAtsScore] = useState(0);
  const [scoreBreakdown, setScoreBreakdown] = useState({
    formatting_score: 0,
    keyword_match: 0,
    readability_score: 0
  });
  const [issues, setIssues] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (file) {
      setLoading(true);
      const sizeInKB = Math.round(file.size / 1024);
      setFileName(file.name);
      setFileSize(`${sizeInKB} KB`);
      
      try {
        // Upload resume
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadResponse = await fetch('/api/resume/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          let message = 'Upload failed';
          try {
            const errorData = await uploadResponse.json();
            message = errorData?.detail || errorData?.message || message;
          } catch {
            // Keep the default error message when the response is not JSON.
          }
          throw new Error(message);
        }
        
        const uploadData = await uploadResponse.json();
        const resumeId = uploadData.resume_id;
        setResumeId(resumeId);
        setResumeData(uploadData.resume); // Store parsed resume data
        onResumeParsed?.(resumeId, uploadData.resume);
        
        // Analyze resume
        const analyzeFormData = new FormData();
        analyzeFormData.append('resume_id', resumeId);
        analyzeFormData.append('target_role', 'Software Engineer');
        
        const analyzeResponse = await fetch('/api/resume/analyze', {
          method: 'POST',
          body: analyzeFormData,
        });
        
        if (!analyzeResponse.ok) {
          throw new Error('Analysis failed');
        }
        
        const analyzeData = await analyzeResponse.json();
        
        // Update state with real data
        setAtsScore(analyzeData.ats_analysis?.score || 0);
        setScoreBreakdown({
          formatting_score: analyzeData.ats_analysis?.formatting_score || 0,
          keyword_match: Math.round((analyzeData.ats_analysis?.keyword_match || 0) * 100),
          readability_score: analyzeData.ats_analysis?.readability_score || 0
        });
        
        // Set issues from problems
        const problemIssues = (analyzeData.problems || []).map(p => ({
          type: p.severity === 'high' ? 'error' : p.severity === 'medium' ? 'warning' : 'info',
          text: p.issue
        }));
        setIssues(problemIssues);
        
        // Set suggestions
        const allSuggestions = [];
        if (analyzeData.detailed_ats_analysis?.suggestions) {
          const sug = analyzeData.detailed_ats_analysis.suggestions;
          allSuggestions.push(...(sug.improve_keywords || []));
          allSuggestions.push(...(sug.enhance_experience || []));
          allSuggestions.push(...(sug.formatting_fixes || []));
        }
        setSuggestions(allSuggestions.slice(0, 5));
        
        setUploaded(true);
      } catch (error) {
        console.error('Error:', error);
        // Keep analyzer visible but show a real error state.
        setAtsScore(0);
        setScoreBreakdown({ formatting_score: 0, keyword_match: 0, readability_score: 0 });
        setIssues([{ type: "error", text: error?.message || "Failed to analyze resume. Please try again." }]);
        setSuggestions(["Ensure resume is in PDF or DOCX format"]);
        setUploaded(false);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === "application/pdf" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
      handleFileSelect(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSampleResume = async () => {
    setLoading(true);
    try {
      // Get sample resume
      const sampleResponse = await fetch('/api/resume/sample');
      const sampleData = await sampleResponse.json();
      
      setFileName("Sample_Resume.pdf");
      setFileSize("245 KB");
      setResumeId(sampleData.resume_id);
      setResumeData(sampleData.resume); // Store parsed resume data
      onResumeParsed?.(sampleData.resume_id, sampleData.resume);
      
      // Analyze sample resume
      const analyzeFormData = new FormData();
      analyzeFormData.append('resume_id', sampleData.resume_id);
      analyzeFormData.append('target_role', 'Software Engineer');
      
      const analyzeResponse = await fetch('/api/resume/analyze', {
        method: 'POST',
        body: analyzeFormData,
      });
      
      const analyzeData = await analyzeResponse.json();
      
      // Update state with real data
      setAtsScore(analyzeData.ats_analysis?.score || 0);
      setScoreBreakdown({
        formatting_score: analyzeData.ats_analysis?.formatting_score || 0,
        keyword_match: Math.round((analyzeData.ats_analysis?.keyword_match || 0) * 100),
        readability_score: analyzeData.ats_analysis?.readability_score || 0
      });
      
      const problemIssues = (analyzeData.problems || []).map(p => ({
        type: p.severity === 'high' ? 'error' : p.severity === 'medium' ? 'warning' : 'info',
        text: p.issue
      }));
      setIssues(problemIssues);
      
      const allSuggestions = [];
      if (analyzeData.detailed_ats_analysis?.suggestions) {
        const sug = analyzeData.detailed_ats_analysis.suggestions;
        allSuggestions.push(...(sug.improve_keywords || []));
        allSuggestions.push(...(sug.enhance_experience || []));
        allSuggestions.push(...(sug.formatting_fixes || []));
      }
      setSuggestions(allSuggestions.slice(0, 5));
      
      setUploaded(true);
    } catch (error) {
      console.error('Error:', error);
      setFileName("Sample_Resume.pdf");
      setFileSize("245 KB");
      setAtsScore(0);
      setScoreBreakdown({ formatting_score: 0, keyword_match: 0, readability_score: 0 });
      setIssues([{ type: "error", text: "Failed to load sample resume" }]);
      setSuggestions([]);
      setUploaded(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 22, animation: "fadeIn 0.4s ease" }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--gray-900)", letterSpacing: "-0.04em", marginBottom: 4 }}>Resume Analyzer</h2>
        <p style={{ fontSize: 13.5, color: "var(--gray-500)" }}>Upload your resume for AI-powered ATS analysis and improvement suggestions.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 18, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Upload */}
          {!uploaded ? (
            <div>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragging ? "var(--gray-600)" : "var(--gray-200)"}`,
                  borderRadius: "var(--radius-lg)", padding: "48px 32px",
                  textAlign: "center", cursor: loading ? "wait" : "pointer",
                  background: dragging ? "var(--gray-50)" : "transparent",
                  transition: "all var(--transition)",
                  opacity: loading ? 0.6 : 1,
                  pointerEvents: loading ? "none" : "auto",
                }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--gray-100)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <Icon name="upload" size={22} color="var(--gray-500)"/>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--gray-800)", marginBottom: 6 }}>
                  {loading ? "Processing resume..." : "Drop your resume here"}
                </div>
                <div style={{ fontSize: 13, color: "var(--gray-400)", marginBottom: 20 }}>PDF, DOCX supported · Max 5MB</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileInputChange}
                  style={{ display: "none" }}
                />
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <Btn variant="secondary" onClick={handleBrowseClick} style={{ padding: "8px 20px", fontSize: 13 }}>Browse files</Btn>
                  <Btn variant="ghost" onClick={handleSampleResume} style={{ padding: "8px 20px", fontSize: 13 }}>Use sample resume</Btn>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <Card style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: "var(--gray-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="resume" size={18} color="var(--gray-600)"/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--gray-900)" }}>{fileName}</div>
                    <div style={{ fontSize: 12, color: "var(--gray-400)" }}>Uploaded · {fileSize}</div>
                  </div>
                  <Badge variant="success">Analyzed</Badge>
                  <button onClick={() => setUploaded(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    <Icon name="x" size={16} color="var(--gray-400)"/>
                  </button>
                </div>
              </Card>

              {/* Extracted Information */}
              {resumeData && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--gray-900)", marginBottom: 14 }}>Extracted Information</div>
                  
                  {/* Personal Info Card */}
                  {(resumeData.name || resumeData.email || resumeData.phone) && (
                    <Card style={{ marginBottom: 12, padding: 20 }}>
                      {resumeData.name && <div style={{ fontSize: 17, fontWeight: 700, color: "var(--gray-900)", marginBottom: 12 }}>{resumeData.name}</div>}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {resumeData.email && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 14 }}>📧</span>
                            <span style={{ fontSize: 13, color: "var(--gray-600)" }}>{resumeData.email}</span>
                          </div>
                        )}
                        {resumeData.phone && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 14 }}>📱</span>
                            <span style={{ fontSize: 13, color: "var(--gray-600)" }}>{resumeData.phone}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  {/* Skills Card */}
                  {resumeData.skills && resumeData.skills.length > 0 && (
                    <Card style={{ marginBottom: 12, padding: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 650, color: "var(--gray-900)", marginBottom: 12 }}>Skills</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                        {resumeData.skills.map((skill, i) => (
                          <span key={i} style={{
                            padding: "6px 12px", borderRadius: 8,
                            background: "var(--gray-100)", fontSize: 12.5,
                            color: "var(--gray-700)", fontWeight: 500,
                            border: "1px solid var(--gray-200)",
                          }}>{typeof skill === 'string' ? skill : skill.name}</span>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Experience Card */}
                  {resumeData.experiences && resumeData.experiences.length > 0 && (
                    <Card style={{ marginBottom: 12, padding: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 650, color: "var(--gray-900)", marginBottom: 14 }}>Experience</div>
                      {resumeData.experiences.map((exp, i) => (
                        <div key={i} style={{ 
                          marginBottom: i < resumeData.experiences.length - 1 ? 16 : 0,
                          paddingBottom: i < resumeData.experiences.length - 1 ? 16 : 0,
                          borderBottom: i < resumeData.experiences.length - 1 ? "1px solid var(--gray-100)" : "none"
                        }}>
                          {exp.title && <div style={{ fontSize: 14, fontWeight: 650, color: "var(--gray-900)", marginBottom: 4 }}>{exp.title}</div>}
                          {(exp.company || exp.duration) && (
                            <div style={{ fontSize: 12.5, color: "var(--gray-500)", marginBottom: 6 }}>
                              {exp.company}{exp.company && exp.duration ? ' · ' : ''}{exp.duration}
                            </div>
                          )}
                          {exp.description && Array.isArray(exp.description) && exp.description.length > 0 && (
                            <div style={{ fontSize: 12.5, color: "var(--gray-600)", lineHeight: 1.6 }}>
                              {exp.description.join('. ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </Card>
                  )}

                  {/* Education Card */}
                  {resumeData.education && resumeData.education.length > 0 && (
                    <Card style={{ marginBottom: 12, padding: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 650, color: "var(--gray-900)", marginBottom: 14 }}>Education</div>
                      {resumeData.education.map((edu, i) => (
                        <div key={i} style={{ 
                          marginBottom: i < resumeData.education.length - 1 ? 14 : 0,
                          paddingBottom: i < resumeData.education.length - 1 ? 14 : 0,
                          borderBottom: i < resumeData.education.length - 1 ? "1px solid var(--gray-100)" : "none"
                        }}>
                          {edu.degree && <div style={{ fontSize: 14, fontWeight: 650, color: "var(--gray-900)", marginBottom: 4 }}>{edu.degree}</div>}
                          {(edu.institution || edu.year) && (
                            <div style={{ fontSize: 12.5, color: "var(--gray-500)", marginBottom: 4 }}>
                              {edu.institution}{edu.institution && edu.year ? ' · ' : ''}{edu.year}
                            </div>
                          )}
                          {edu.gpa && <div style={{ fontSize: 12.5, color: "var(--gray-600)" }}>CGPA: {edu.gpa}</div>}
                        </div>
                      ))}
                    </Card>
                  )}

                  {/* Projects Card */}
                  {resumeData.projects && resumeData.projects.length > 0 && (
                    <Card style={{ marginBottom: 12, padding: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 650, color: "var(--gray-900)", marginBottom: 14 }}>Projects</div>
                      {resumeData.projects.map((proj, i) => (
                        <div key={i} style={{ 
                          marginBottom: i < resumeData.projects.length - 1 ? 14 : 0,
                          paddingBottom: i < resumeData.projects.length - 1 ? 14 : 0,
                          borderBottom: i < resumeData.projects.length - 1 ? "1px solid var(--gray-100)" : "none"
                        }}>
                          {proj.name && (
                            <div style={{ fontSize: 13.5, fontWeight: 650, color: "var(--gray-900)", marginBottom: 8 }}>
                              {proj.name}
                            </div>
                          )}
                          {proj.technologies && proj.technologies.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {proj.technologies.map((tech, j) => (
                                <span key={j} style={{
                                  padding: "4px 10px", borderRadius: 6,
                                  background: "var(--gray-100)", fontSize: 11.5,
                                  color: "var(--gray-600)", fontWeight: 500,
                                  border: "1px solid var(--gray-200)",
                                }}>{tech}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </Card>
                  )}
                </div>
              )}

              {/* Issues */}
              <Card style={{ marginTop: 14 }}>
                <div style={{ fontSize: 13.5, fontWeight: 650, color: "var(--gray-900)", marginBottom: 14 }}>Issues Found</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {issues.map((issue, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "10px 14px", borderRadius: 10,
                      background: issue.type === "error" ? "#fef2f2" : issue.type === "warning" ? "#fffbeb" : "var(--gray-50)",
                      border: `1px solid ${issue.type === "error" ? "#fecaca" : issue.type === "warning" ? "#fde68a" : "var(--gray-150)"}`,
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", marginTop: 5, flexShrink: 0, background: issue.type === "error" ? "#ef4444" : issue.type === "warning" ? "#f59e0b" : "var(--gray-400)" }}/>
                      <span style={{ fontSize: 13, color: "var(--gray-700)", lineHeight: 1.5 }}>{issue.text}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Suggestions */}
              <Card style={{ marginTop: 14 }}>
                <div style={{ fontSize: 13.5, fontWeight: 650, color: "var(--gray-900)", marginBottom: 14 }}>AI Suggestions</div>
                {suggestions.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < suggestions.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
                    <Icon name="zap" size={14} color="var(--gray-400)" style={{ marginTop: 2, flexShrink: 0 }}/>
                    <span style={{ fontSize: 13, color: "var(--gray-600)", lineHeight: 1.6 }}>{s}</span>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </div>

        {/* Score */}
        <Card style={{ padding: "28px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "var(--gray-400)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20 }}>ATS Score</div>
          <CircularProgress value={uploaded ? atsScore : 0} size={140} label="Score"/>
          {loading && <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 10 }}>Analyzing...</div>}
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Formatting", val: scoreBreakdown.formatting_score },
              { label: "Keywords", val: scoreBreakdown.keyword_match },
              { label: "Impact", val: scoreBreakdown.readability_score },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5, color: "var(--gray-500)", fontWeight: 500 }}>
                  <span>{item.label}</span><span>{item.val}%</span>
                </div>
                <div style={{ height: 4, background: "var(--gray-100)", borderRadius: 99 }}>
                  <div style={{ height: "100%", borderRadius: 99, width: `${uploaded ? item.val : 0}%`, background: "var(--gray-700)", transition: "width 1s ease" }}/>
                </div>
              </div>
            ))}
          </div>
          {uploaded && <Btn variant="primary" style={{ marginTop: 20, width: "100%", justifyContent: "center", padding: "10px" }}>Download report</Btn>}
        </Card>
      </div>
    </div>
  );
}

// ─── JD Matcher ───────────────────────────────────────────────────────────────
const JDMatcher = ({ resumeId, onJobMatched }) => {
  const [jd, setJD] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [matchResult, setMatchResult] = useState(null);

  const analyzeMatch = async () => {
    if (!resumeId) {
      setError("Upload your resume in Resume Analyzer first.");
      setMatchResult(null);
      return;
    }
    if (!jd.trim()) {
      setError("Paste a job description first.");
      setMatchResult(null);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("resume_id", resumeId);
      formData.append("job_description", jd);

      const response = await fetch('/api/jd/match', {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to analyze JD match");
      }

      const data = await response.json();
      setMatchResult(data);
      // Call the callback to update parent state with job description and match result
      if (onJobMatched) {
        onJobMatched(jd, data);
      }
    } catch (e) {
      console.error(e);
      setError("Could not analyze JD match with real data. Please check API key/config and try again.");
      setMatchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const analyzed = matchResult !== null;
  const missingSkills = matchResult?.missing_skills || [];
  const focusAreas = matchResult?.focus_areas || [];
  const strengths = matchResult?.strengths || [];
  const weaknesses = matchResult?.weaknesses || [];
  const overallMatch = Math.round(matchResult?.match_percentage || 0);

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 22, animation: "fadeIn 0.4s ease" }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--gray-900)", letterSpacing: "-0.04em", marginBottom: 4 }}>JD Matcher</h2>
        <p style={{ fontSize: 13.5, color: "var(--gray-500)" }}>Paste a job description to discover your match percentage and skill gaps.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-700)", marginBottom: 10 }}>Paste Job Description</div>
            <textarea
              value={jd}
              onChange={e => setJD(e.target.value)}
              placeholder="Paste the full job description here..."
              style={{
                width: "100%", height: 200, border: "1px solid var(--gray-200)",
                borderRadius: 10, padding: "12px 14px", fontSize: 13,
                color: "var(--gray-700)", background: "var(--gray-50)",
                outline: "none", resize: "none", fontFamily: "inherit",
                lineHeight: 1.65,
              }}
            />
            <Btn variant="primary" onClick={analyzeMatch} style={{ marginTop: 12, width: "100%", justifyContent: "center" }} icon={<Icon name="search" size={14}/>}> 
              {loading ? "Analyzing..." : "Analyze match"}
            </Btn>
            {error && <div style={{ marginTop: 10, fontSize: 12.5, color: "#b91c1c", fontWeight: 600 }}>{error}</div>}
          </Card>

          {analyzed && (
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-700)", marginBottom: 14 }}>Focus Areas</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {focusAreas.length === 0 && (
                  <div style={{ fontSize: 12.5, color: "var(--gray-500)" }}>No focus areas returned for this JD.</div>
                )}
                {focusAreas.map((a, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", borderRadius: 10,
                    background: "var(--gray-900)", color: "var(--white)",
                    fontSize: 13, fontWeight: 500,
                  }}>
                    <Icon name="target" size={14} color="rgba(255,255,255,0.6)"/>
                    {a.skill || "Skill"}
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{a.priority || "MEDIUM"}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {analyzed && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card style={{ padding: "24px 22px", textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-400)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Overall Match</div>
              <CircularProgress value={overallMatch} size={130} label="Match"/>
              <div style={{ marginTop: 18, fontSize: 13, color: "var(--gray-500)", lineHeight: 1.6 }}>
                You match <strong style={{ color: "var(--gray-900)" }}>{overallMatch}%</strong> of this job's requirements.
              </div>
            </Card>

            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 650, color: "var(--gray-900)", marginBottom: 14 }}>Missing Skills</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {missingSkills.length === 0 && (
                  <span style={{ fontSize: 12.5, color: "var(--gray-500)" }}>No missing skills detected.</span>
                )}
                {missingSkills.map(skill => (
                  <span key={skill} style={{
                    padding: "5px 12px", borderRadius: 99,
                    background: "var(--gray-100)", fontSize: 12,
                    color: "var(--gray-600)", fontWeight: 500,
                    border: "1px solid var(--gray-200)",
                  }}>{skill}</span>
                ))}
              </div>

              <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                <ProgressBar value={Math.max(0, Math.min(100, overallMatch))} label="Overall technical match" sublabel={`${overallMatch}%`}/>
                <ProgressBar value={Math.max(0, 100 - Math.min(100, missingSkills.length * 8))} label="Skill coverage" sublabel={`${Math.max(0, 100 - Math.min(100, missingSkills.length * 8))}%`}/>
              </div>

              {(strengths.length > 0 || weaknesses.length > 0) && (
                <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 8 }}>Strengths</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {strengths.slice(0, 3).map((s, i) => (
                        <span key={i} style={{ fontSize: 12, color: "var(--gray-600)" }}>• {s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#b45309", marginBottom: 8 }}>Weaknesses</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {weaknesses.slice(0, 3).map((w, i) => (
                        <span key={i} style={{ fontSize: 12, color: "var(--gray-600)" }}>• {w}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {!analyzed && (
          <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, padding: 40, minHeight: 300 }} hover={false}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--gray-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="match" size={24} color="var(--gray-400)"/>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--gray-700)", marginBottom: 6 }}>Awaiting analysis</div>
              <div style={{ fontSize: 13, color: "var(--gray-400)" }}>Paste a JD and click Analyze to see your match</div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

// ─── Quiz ────────────────────────────────────────────────────────────────────
const Quiz = ({ resumeId, resumeData, jobDescription }) => {
  const [domain, setDomain] = useState("Coding DSA");
  const [difficulty, setDifficulty] = useState("Easy");
  const [phase, setPhase] = useState("setup"); // setup | rules | quiz | result
  const [questions, setQuestions] = useState([]);
  const [studyMaterials, setStudyMaterials] = useState([]);
  const [rules, setRules] = useState([]);
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [score, setScore] = useState(0);

  const passingPercentage = 80;

  const getOptionText = (opt) => (typeof opt === "string" ? opt : opt?.text || "");

  const startQuizGeneration = async () => {
    if (!resumeId) {
      setError("Upload your resume first in Resume Analyzer.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("topic", `${domain} ${difficulty}`);
      formData.append("domain", domain);
      formData.append("difficulty", difficulty);
      formData.append("count", 10);
      formData.append("resume_id", resumeId);
      formData.append("job_description", jobDescription || "");

      const response = await fetch("/api/quiz/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to generate quiz");
      }

      const data = await response.json();
      const quizQuestions = Array.isArray(data.questions) ? data.questions.slice(0, 10) : [];

      setQuestions(quizQuestions);
      setStudyMaterials(Array.isArray(data.study_materials) ? data.study_materials : []);
      setRules(Array.isArray(data.rules) ? data.rules : [
        "No external help during quiz.",
        "Each section has 10 questions.",
        "Passing criteria is 80%.",
      ]);
      setAnswers({});
      setIndex(0);
      setPhase("rules");
    } catch (e) {
      console.error(e);
      setError("Could not generate quiz right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      const selected = answers[idx];
      const optionObjs = Array.isArray(q.options) ? q.options : [];
      const correctOption = optionObjs.find((o) => o?.is_correct);
      const correctText = correctOption ? getOptionText(correctOption) : (q.correct_answer || "");
      if (selected && selected === correctText) correct += 1;
    });

    const computed = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    setScore(computed);
    setPhase("result");
  };

  const current = questions[index];
  const progressPct = questions.length > 0 ? ((index + 1) / questions.length) * 100 : 0;

  return (
    <div style={{ padding: 28, animation: "fadeIn 0.4s ease", display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 18 }}>
      <div>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--gray-900)", letterSpacing: "-0.04em" }}>Adaptive Quiz</h2>
          <p style={{ fontSize: 13.5, color: "var(--gray-500)", marginTop: 4 }}>
            Resume + JD + roadmap-based quizzes by section and difficulty.
          </p>
        </div>

        <Card style={{ padding: 18, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gray-500)", marginBottom: 8 }}>Select Section</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            {["Coding DSA", "Development"].map((d) => (
              <Btn key={d} variant={domain === d ? "primary" : "secondary"} onClick={() => setDomain(d)}>
                {d}
              </Btn>
            ))}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gray-500)", marginBottom: 8 }}>Difficulty</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            {["Easy", "Hard", "Advanced"].map((d) => (
              <Btn key={d} variant={difficulty === d ? "primary" : "secondary"} onClick={() => setDifficulty(d)}>
                {d}
              </Btn>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Badge>10 questions per section</Badge>
            <Badge variant="warning">Pass: {passingPercentage}%</Badge>
          </div>
          <div style={{ marginTop: 14 }}>
            <Btn variant="primary" onClick={startQuizGeneration} disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
              {loading ? "Generating quiz..." : "Generate Quiz"}
            </Btn>
          </div>
          {error && <div style={{ marginTop: 10, color: "#b91c1c", fontSize: 12.5, fontWeight: 600 }}>{error}</div>}
        </Card>

        {phase === "rules" && (
          <Card style={{ padding: 18 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: "var(--gray-900)" }}>Rules & Regulations</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {rules.map((rule, i) => (
                <div key={i} style={{ fontSize: 13.5, color: "var(--gray-700)", lineHeight: 1.6 }}>• {rule}</div>
              ))}
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <Btn variant="secondary" onClick={() => setPhase("setup")} style={{ flex: 1, justifyContent: "center" }}>Back</Btn>
              <Btn variant="primary" onClick={() => setPhase("quiz")} style={{ flex: 2, justifyContent: "center" }}>Start Test</Btn>
            </div>
          </Card>
        )}

        {phase === "quiz" && current && (
          <>
            <Card style={{ padding: 18, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <Badge>{domain}</Badge>
                <Badge>Question {index + 1} / {questions.length}</Badge>
              </div>
              <div style={{ height: 4, background: "var(--gray-100)", borderRadius: 99, marginBottom: 14 }}>
                <div style={{ width: `${progressPct}%`, height: "100%", borderRadius: 99, background: "var(--gray-800)" }}/>
              </div>
              <p style={{ fontSize: 17, fontWeight: 600, color: "var(--gray-900)", lineHeight: 1.55 }}>{current.question}</p>
            </Card>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(current.options || []).map((opt, i) => {
                const label = getOptionText(opt);
                const chosen = answers[index] === label;
                return (
                  <button
                    key={i}
                    onClick={() => setAnswers((prev) => ({ ...prev, [index]: label }))}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      borderRadius: 12, border: `1.5px solid ${chosen ? "var(--gray-900)" : "var(--gray-200)"}`,
                      background: chosen ? "var(--gray-900)" : "var(--white)",
                      color: chosen ? "var(--white)" : "var(--gray-700)",
                      padding: "13px 16px", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                      fontSize: 14,
                    }}
                  >
                    <span style={{ width: 24, height: 24, borderRadius: 7, background: chosen ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <Btn variant="secondary" onClick={() => setIndex((p) => Math.max(0, p - 1))} style={{ flex: 1, justifyContent: "center" }}>
                Previous
              </Btn>
              {index < questions.length - 1 ? (
                <Btn variant="primary" onClick={() => setIndex((p) => Math.min(questions.length - 1, p + 1))} style={{ flex: 2, justifyContent: "center" }}>
                  Next Question
                </Btn>
              ) : (
                <Btn variant="primary" onClick={submitQuiz} style={{ flex: 2, justifyContent: "center" }}>
                  Submit Test
                </Btn>
              )}
            </div>
          </>
        )}

        {phase === "result" && (
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--gray-900)", marginBottom: 8 }}>Quiz Result</div>
            <div style={{ fontSize: 13, color: "var(--gray-500)", marginBottom: 14 }}>{domain} • {difficulty} • {questions.length} questions</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: score >= passingPercentage ? "#166534" : "#b91c1c" }}>{score}%</div>
              <Badge variant={score >= passingPercentage ? "success" : "error"}>{score >= passingPercentage ? "PASS" : "FAIL"}</Badge>
            </div>
            <div style={{ fontSize: 13.5, color: "var(--gray-700)", lineHeight: 1.6, marginBottom: 16 }}>
              Passing criteria is <strong>{passingPercentage}%</strong>. {score >= passingPercentage ? "You cleared this section." : "Review study materials and retry."}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="secondary" onClick={() => setPhase("setup")} style={{ flex: 1, justifyContent: "center" }}>Back to Setup</Btn>
              <Btn variant="primary" onClick={startQuizGeneration} style={{ flex: 2, justifyContent: "center" }}>Retake Quiz</Btn>
            </div>
          </Card>
        )}
      </div>

      <div>
        <Card style={{ padding: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--gray-900)", marginBottom: 10 }}>Study Material</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {studyMaterials.length === 0 && (
              <div style={{ fontSize: 13, color: "var(--gray-500)", lineHeight: 1.6 }}>
                Generate a quiz to load week-wise study materials based on resume, JD, and roadmap.
              </div>
            )}
            {studyMaterials.map((item, i) => (
              <div key={i} style={{ border: "1px solid var(--gray-150)", borderRadius: 12, padding: 12, background: "var(--gray-50)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gray-500)", letterSpacing: "0.06em", marginBottom: 6 }}>WEEK {item.week}</div>
                <div style={{ fontSize: 13.5, fontWeight: 650, color: "var(--gray-900)", marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 12.5, color: "var(--gray-600)", lineHeight: 1.55, marginBottom: 8 }}>{item.what_to_study}</div>
                {Array.isArray(item.resources) && item.resources.length > 0 && (
                  <div style={{ fontSize: 11.5, color: "var(--gray-500)", lineHeight: 1.5 }}>
                    {item.resources.slice(0, 3).join(" • ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─── Mock Interview ───────────────────────────────────────────────────────────
const MockInterview = () => {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Welcome to your mock interview! I'll be playing the role of a senior engineer at a top tech company. Let's begin with a classic: Tell me about yourself and why you're interested in this Software Engineer role." },
  ]);
  const [input, setInput] = useState("");
  const chatRef = useRef(null);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsgs = [
      ...messages,
      { role: "user", text: input },
      { role: "ai", text: "Great answer! You clearly articulated your background. Let me follow up: Can you describe a challenging technical problem you faced and how you solved it? Focus on your thought process and the outcome." },
    ];
    setMessages(newMsgs);
    setInput("");
    setTimeout(() => chatRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 100);
  };

  return (
    <div style={{ padding: 28, animation: "fadeIn 0.4s ease", height: "calc(100vh - 60px)", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--gray-900)", letterSpacing: "-0.04em", marginBottom: 4 }}>Mock Interview</h2>
          <p style={{ fontSize: 13.5, color: "var(--gray-500)" }}>AI-powered interview simulation with real-time feedback.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--gray-900)", letterSpacing: "-0.04em" }}>84</div>
            <div style={{ fontSize: 11, color: "var(--gray-400)", fontWeight: 500 }}>Interview score</div>
          </div>
          <div style={{ width: 1, background: "var(--gray-150)" }}/>
          <Btn variant="outline" style={{ padding: "8px 16px", fontSize: 13 }} icon={<Icon name="mic" size={14}/>}>Voice mode</Btn>
        </div>
      </div>

      {/* Chat */}
      <div ref={chatRef} style={{
        flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16,
        padding: "4px 0 20px",
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex", gap: 12,
            flexDirection: msg.role === "user" ? "row-reverse" : "row",
            maxWidth: 640,
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
          }}>
            {msg.role === "ai" && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--gray-900)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="brain" size={14} color="white"/>
              </div>
            )}
            <div style={{
              padding: "13px 16px", borderRadius: msg.role === "ai" ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
              background: msg.role === "ai" ? "var(--white)" : "var(--gray-900)",
              color: msg.role === "ai" ? "var(--gray-800)" : "var(--white)",
              border: msg.role === "ai" ? "1px solid var(--gray-150)" : "none",
              boxShadow: "var(--shadow-sm)",
              fontSize: 13.5, lineHeight: 1.65, maxWidth: 500,
            }}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{
        display: "flex", gap: 10, padding: "14px 0 0",
        borderTop: "1px solid var(--gray-150)", flexShrink: 0,
      }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "var(--gray-50)", border: "1px solid var(--gray-200)", borderRadius: 99, padding: "10px 18px" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Type your answer..."
            style={{ flex: 1, border: "none", background: "transparent", fontSize: 13.5, color: "var(--gray-700)", outline: "none", fontFamily: "inherit" }}
          />
        </div>
        <Btn variant="primary" onClick={handleSend} style={{ borderRadius: "50%", width: 44, height: 44, padding: 0 }} icon={<Icon name="send" size={16}/>}></Btn>
      </div>
    </div>
  );
};

// ─── Job Finder ───────────────────────────────────────────────────────────────
const JobFinder = ({ resumeId, resumeData }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [location, setLocation] = useState("India");
  const [activeChip, setActiveChip] = useState("all");
  const [savedJobs, setSavedJobs] = useState({});

  const deriveRoleFromResume = (data) => {
    if (data?.experiences?.length > 0) {
      const title = data.experiences[0]?.title?.trim();
      if (title) return title;
    }

    const skillNames = (data?.skills || [])
      .map((s) => (typeof s === "string" ? s : s?.name || ""))
      .filter(Boolean)
      .map((s) => s.toLowerCase());

    if (skillNames.includes("react")) return "React Developer";
    if (skillNames.includes("python")) return "Python Developer";
    if (skillNames.includes("node.js")) return "Node.js Developer";

    return "Software Engineer";
  };

  const [role, setRole] = useState(deriveRoleFromResume(resumeData));

  useEffect(() => {
    setRole(deriveRoleFromResume(resumeData));
  }, [resumeData]);

  const fetchJobs = async () => {
    if (!resumeId) {
      setError("Upload your resume in Resume Analyzer first to get matched jobs.");
      setJobs([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("resume_id", resumeId);
      formData.append("role", role || "Software Engineer");
      formData.append("location", location || "India");
      formData.append("remote", "false");

      const response = await fetch('/api/jobs/search', {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data = await response.json();
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
    } catch (e) {
      console.error(e);
      setError("Could not load jobs right now. Please try again.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resumeId) {
      fetchJobs();
    }
  }, [resumeId]);

  const filterByChip = (job) => {
    const match = Math.round(job.match_percentage || 0);
    const title = (job.title || "").toLowerCase();

    if (activeChip === "high") return match >= 70;
    if (activeChip === "entry") return /junior|intern|trainee|associate|graduate/.test(title);
    if (activeChip === "remote") return (job.location || "").toLowerCase().includes("remote");
    if (activeChip === "saved") return Boolean(savedJobs[job.id]);
    return true;
  };

  const filteredJobs = jobs.filter((job) => {
    const haystack = `${job.title || ""} ${job.company || ""} ${job.location || ""}`.toLowerCase();
    return haystack.includes(filter.toLowerCase()) && filterByChip(job);
  });

  const toggleSave = (jobId) => {
    setSavedJobs((prev) => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  const quickChips = [
    { id: "all", label: "All jobs" },
    { id: "high", label: "70%+ match" },
    { id: "entry", label: "Entry level" },
    { id: "remote", label: "Remote" },
    { id: "saved", label: "Saved" },
  ];

  return (
    <div style={{ padding: 28, animation: "fadeIn 0.4s ease" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 14,
        marginBottom: 20,
        alignItems: "start",
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--gray-900)", letterSpacing: "-0.04em", marginBottom: 4 }}>Job Finder</h2>
          <p style={{ fontSize: 13.5, color: "var(--gray-500)" }}>
            {loading ? "Finding jobs from your extracted resume data..." : `${filteredJobs.length} curated roles matched to your profile.`}
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <Badge variant="default">Role: {role || "Software Engineer"}</Badge>
            <Badge variant="default">Location: {location}</Badge>
            <Badge variant="default">Saved: {Object.values(savedJobs).filter(Boolean).length}</Badge>
          </div>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--gray-50)", border: "1px solid var(--gray-200)", borderRadius: 99, padding: "8px 14px" }}>
            <Icon name="search" size={14} color="var(--gray-400)"/>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter jobs..."
              style={{ border: "none", background: "transparent", fontSize: 13, color: "var(--gray-600)", outline: "none", fontFamily: "inherit", width: 170 }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Target role"
              style={{
                border: "1px solid var(--gray-200)",
                background: "var(--white)",
                fontSize: 12.5,
                color: "var(--gray-700)",
                outline: "none",
                fontFamily: "inherit",
                borderRadius: 99,
                padding: "8px 12px",
                width: 140,
              }}
            />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              style={{
                border: "1px solid var(--gray-200)",
                background: "var(--white)",
                fontSize: 12.5,
                color: "var(--gray-700)",
                outline: "none",
                fontFamily: "inherit",
                borderRadius: 99,
                padding: "8px 12px",
                width: 120,
              }}
            />
            <Btn variant="secondary" onClick={fetchJobs} style={{ padding: "8px 14px", fontSize: 13 }}>Refresh</Btn>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {quickChips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => setActiveChip(chip.id)}
            style={{
              border: activeChip === chip.id ? "1px solid var(--gray-700)" : "1px solid var(--gray-200)",
              background: activeChip === chip.id ? "var(--gray-900)" : "var(--white)",
              color: activeChip === chip.id ? "var(--white)" : "var(--gray-700)",
              borderRadius: 99,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all var(--transition)",
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {error && (
        <Card style={{ marginBottom: 14, padding: "14px 16px", border: "1px solid #fde68a", background: "#fffbeb" }}>
          <div style={{ fontSize: 13, color: "#92400e", fontWeight: 600 }}>{error}</div>
        </Card>
      )}

      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx} style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(90deg, var(--gray-100), var(--gray-150), var(--gray-100))", backgroundSize: "250% 100%", animation: "shimmer 1.8s infinite" }}/>
                <div style={{ width: 72, height: 20, borderRadius: 99, background: "linear-gradient(90deg, var(--gray-100), var(--gray-150), var(--gray-100))", backgroundSize: "250% 100%", animation: "shimmer 1.8s infinite" }}/>
              </div>
              <div style={{ width: "75%", height: 14, borderRadius: 6, marginBottom: 8, background: "linear-gradient(90deg, var(--gray-100), var(--gray-150), var(--gray-100))", backgroundSize: "250% 100%", animation: "shimmer 1.8s infinite" }}/>
              <div style={{ width: "45%", height: 12, borderRadius: 6, marginBottom: 14, background: "linear-gradient(90deg, var(--gray-100), var(--gray-150), var(--gray-100))", backgroundSize: "250% 100%", animation: "shimmer 1.8s infinite" }}/>
              <div style={{ width: "100%", height: 4, borderRadius: 99, marginBottom: 14, background: "linear-gradient(90deg, var(--gray-100), var(--gray-150), var(--gray-100))", backgroundSize: "250% 100%", animation: "shimmer 1.8s infinite" }}/>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 2, height: 34, borderRadius: 99, background: "linear-gradient(90deg, var(--gray-100), var(--gray-150), var(--gray-100))", backgroundSize: "250% 100%", animation: "shimmer 1.8s infinite" }}/>
                <div style={{ flex: 1, height: 34, borderRadius: 99, background: "linear-gradient(90deg, var(--gray-100), var(--gray-150), var(--gray-100))", backgroundSize: "250% 100%", animation: "shimmer 1.8s infinite" }}/>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && filteredJobs.length === 0 && (
        <Card style={{ marginBottom: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 13.5, color: "var(--gray-600)" }}>
            No matching jobs found yet. Try clicking Refresh after uploading your latest resume.
          </div>
        </Card>
      )}

      {!loading && (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
        {filteredJobs.map((job, i) => {
          const match = Math.round(job.match_percentage || 0);
          const company = job.company || "Company";
          const skills = (job.required_skills || []).slice(0, 4);
          const isSaved = Boolean(savedJobs[job.id]);
          return (
          <Card key={i} style={{ padding: "20px 22px", overflow: "hidden", position: "relative" }}>
            <div style={{
              position: "absolute",
              right: -40,
              top: -40,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: match >= 70 ? "radial-gradient(circle, rgba(16,185,129,0.15), transparent 70%)" : "radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%)",
              pointerEvents: "none",
            }}/>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--gray-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--gray-700)" }}>
                {company[0]}
              </div>
              <Badge variant={match >= 85 ? "success" : "default"}>
                {match}% match
              </Badge>
            </div>
            <div style={{ fontSize: 15, fontWeight: 650, color: "var(--gray-900)", marginBottom: 4, letterSpacing: "-0.02em" }}>{job.title || "Role"}</div>
            <div style={{ fontSize: 13, color: "var(--gray-500)", marginBottom: 4 }}>{company}</div>
            <div style={{ fontSize: 12, color: "var(--gray-400)", marginBottom: 16, display: "flex", gap: 8 }}>
              <span>📍 {job.location || "India"}</span>
              <span>· {job.source || "Job Board"}</span>
            </div>
            {job.salary && (
              <div style={{ fontSize: 12, color: "var(--gray-500)", marginBottom: 10, fontWeight: 600 }}>
                Salary: {job.salary}
              </div>
            )}
            <div style={{ height: 3, background: "var(--gray-100)", borderRadius: 99, marginBottom: 14 }}>
              <div style={{
                height: "100%",
                borderRadius: 99,
                width: `${match}%`,
                background: match >= 70 ? "linear-gradient(90deg, #10b981, #34d399)" : "linear-gradient(90deg, var(--gray-700), var(--gray-400))",
                transition: "width 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
              }}/>
            </div>
            {skills.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                {skills.map((skill, idx) => (
                  <span key={idx} style={{
                    fontSize: 11.5,
                    padding: "4px 8px",
                    borderRadius: 99,
                    border: "1px solid var(--gray-200)",
                    background: "var(--gray-50)",
                    color: "var(--gray-600)",
                    fontWeight: 600,
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <Btn
                variant="primary"
                onClick={() => job.apply_link && window.open(job.apply_link, "_blank", "noopener,noreferrer")}
                style={{ flex: 2, justifyContent: "center", padding: "8px", fontSize: 13 }}
              >
                Apply now
              </Btn>
              <Btn
                variant={isSaved ? "primary" : "secondary"}
                onClick={() => {
                  toggleSave(job.id);
                  navigator.clipboard?.writeText(job.apply_link || "");
                }}
                style={{ flex: 1, justifyContent: "center", padding: "8px", fontSize: 13 }}
              >
                {isSaved ? "Saved" : "Save"}
              </Btn>
            </div>
          </Card>
          );
        })}
      </div>
      )}
    </div>
  );
};

// ─── Dashboard Shell ──────────────────────────────────────────────────────────
const Dashboard = ({ onLogout }) => {
  const [active, setActive] = useState("resume");
  const [resumeContext, setResumeContext] = useState({ 
    resumeId: null, 
    resumeData: null, 
    jobDescription: null,
    matchResult: null,
  });

  const handleResumeParsed = (resumeId, resumeData) => {
    setResumeContext(prev => ({ ...prev, resumeId, resumeData }));
  };

  const handleJobDescriptionMatched = (jobDescription, matchResult) => {
    setResumeContext(prev => ({ ...prev, jobDescription, matchResult }));
  };

  const pages = {
    dashboard: { component: <DashboardOverview/>, title: "Overview" },
    resume: { component: <ResumeAnalyzer onResumeParsed={handleResumeParsed}/>, title: "Resume Analyzer" },
    matcher: { component: <JDMatcher resumeId={resumeContext.resumeId} onJobMatched={handleJobDescriptionMatched}/>, title: "JD Matcher" },
    roadmap: { component: <Roadmap resumeId={resumeContext.resumeId} jobDescription={resumeContext.jobDescription}/>, title: "Learning Roadmap" },
    quiz: { component: <Quiz resumeId={resumeContext.resumeId} resumeData={resumeContext.resumeData} jobDescription={resumeContext.jobDescription}/>, title: "Adaptive Quiz" },
    interview: { component: <MockInterview/>, title: "Mock Interview" },
    jobs: { component: <JobFinder resumeId={resumeContext.resumeId} resumeData={resumeContext.resumeData}/>, title: "Job Finder" },
  };

  const current = pages[active];

  // Animated particles
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 3,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 4,
    duration: Math.random() * 12 + 18,
    animation: `floatParticle${(i % 3) + 1}`
  }));

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--gray-50)", position: "relative" }}>
      {/* Animated Background Particles */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        {particles.map(p => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: "rgba(160, 160, 160, 0.22)",
              animation: `${p.animation} ${p.duration}s ease-in-out ${p.delay}s infinite`,
              boxShadow: `0 0 ${p.size * 2}px rgba(160, 160, 160, 0.12)`,
              filter: "blur(0.5px)"
            }}
          />
        ))}
        
        {/* Larger floating shapes */}
        <div style={{
          position: "absolute",
          top: "15%",
          right: "20%",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(180, 180, 180, 0.1), transparent 70%)",
          animation: "floatSlow 22s ease-in-out infinite",
          filter: "blur(50px)"
        }}/>
        <div style={{
          position: "absolute",
          bottom: "25%",
          left: "15%",
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(170, 170, 170, 0.08), transparent 70%)",
          animation: "floatSlow 26s ease-in-out infinite 4s",
          filter: "blur(55px)"
        }}/>
        <div style={{
          position: "absolute",
          top: "40%",
          left: "60%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(165, 165, 165, 0.07), transparent 70%)",
          animation: "floatSlow 24s ease-in-out infinite 8s",
          filter: "blur(52px)"
        }}/>
      </div>

      <Sidebar active={active} setActive={setActive}/>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 }}>
        <Topbar title={current.title} onLogout={onLogout}/>
        <main style={{ flex: 1, overflowY: "auto" }}>
          {current.component}
        </main>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [view, setView] = useState("landing"); // "landing" | "app"

  const handleLogout = () => {
    setView("landing");
  };

  return (
    <>
      <style>{globalStyles}</style>
      {view === "landing"
        ? <LandingPage onEnterApp={() => setView("app")}/>
        : <Dashboard onLogout={handleLogout}/>}
    </>
  );
}
