import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const defaultCredentials = {
  student: { username: 'student', password: '1234' },
  admin: { username: 'admin', password: 'admin123' },
};

const roleLabels = {
  student: {
    title: 'Student Login',
    subtitle: 'Access resume analysis, roadmaps, quiz, interview, and job tools.',
  },
  admin: {
    title: 'Admin Login',
    subtitle: 'Manage eligibility, students, jobs, ATS analytics, and screening rules.',
  },
};

const cubeFaces = [
  { transform: 'translateZ(70px)', background: 'linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08))' },
  { transform: 'rotateY(180deg) translateZ(70px)', background: 'linear-gradient(135deg, rgba(120,200,255,0.24), rgba(255,255,255,0.06))' },
  { transform: 'rotateY(90deg) translateZ(70px)', background: 'linear-gradient(135deg, rgba(170,120,255,0.22), rgba(255,255,255,0.06))' },
  { transform: 'rotateY(-90deg) translateZ(70px)', background: 'linear-gradient(135deg, rgba(70,180,255,0.24), rgba(255,255,255,0.06))' },
  { transform: 'rotateX(90deg) translateZ(70px)', background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(120,120,255,0.08))' },
  { transform: 'rotateX(-90deg) translateZ(70px)', background: 'linear-gradient(135deg, rgba(50,50,70,0.5), rgba(10,10,18,0.75))' },
];

function FloatingCube() {
  return (
    <div style={{ perspective: 1200, width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
      <motion.div
        animate={{ rotateX: [0, 18, 0], rotateY: [0, 35, 360], y: [0, -12, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 140,
          height: 140,
          position: 'relative',
          transformStyle: 'preserve-3d',
        }}
      >
        {cubeFaces.map((face, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 28,
              border: '1px solid rgba(255,255,255,0.22)',
              backdropFilter: 'blur(10px)',
              transform: face.transform,
              background: face.background,
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

export function AuthPage({ onLogin }) {
  const [role, setRole] = useState('student');
  const [username, setUsername] = useState(defaultCredentials.student.username);
  const [password, setPassword] = useState(defaultCredentials.student.password);
  const [error, setError] = useState('');

  const activeConfig = useMemo(() => roleLabels[role], [role]);

  const switchRole = (nextRole) => {
    setRole(nextRole);
    setError('');
    setUsername(defaultCredentials[nextRole].username);
    setPassword(defaultCredentials[nextRole].password);
  };

  const handleLogin = () => {
    const valid =
      username.trim() === defaultCredentials[role].username &&
      password === defaultCredentials[role].password;

    if (!valid) {
      setError('Invalid credentials. Use the pre-filled demo login.');
      return;
    }

    onLogin?.(role);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top left, #132238 0%, #0b1020 42%, #060814 100%)', color: 'white', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5, background:
        'radial-gradient(circle at 20% 20%, rgba(98, 171, 255, 0.18), transparent 25%), radial-gradient(circle at 80% 10%, rgba(155, 107, 255, 0.16), transparent 24%), radial-gradient(circle at 80% 80%, rgba(33, 212, 180, 0.12), transparent 28%)' }} />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.2fr 0.9fr' }}>
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', boxShadow: '0 18px 50px rgba(0,0,0,0.35)' }}>
              <span style={{ fontSize: 18 }}>✦</span>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em' }}>SkillBridge AI</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Career operating system</div>
            </div>
          </div>

          <div style={{ maxWidth: 640 }}>
            <div style={{ display: 'inline-flex', padding: '8px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.86)', fontSize: 12, fontWeight: 600, marginBottom: 24 }}>
              Powered by Supabase + AI workflows
            </div>
            <h1 style={{ fontSize: 'clamp(42px, 7vw, 82px)', lineHeight: 0.95, letterSpacing: '-0.06em', margin: 0, fontWeight: 800 }}>
              {role === 'admin' ? 'Command the dashboard.' : 'Start your career mission.'}
            </h1>
            <p style={{ marginTop: 22, maxWidth: 560, fontSize: 18, lineHeight: 1.7, color: 'rgba(255,255,255,0.7)' }}>
              {role === 'admin'
                ? 'Control eligibility rules, review student performance, and monitor live Supabase data from one premium dashboard.'
                : 'Upload resumes, compare job descriptions, generate roadmaps, and practice interviews from a single student workspace.'}
            </p>
          </div>

          <div style={{ width: '100%', maxWidth: 520, alignSelf: 'center', marginTop: 10 }}>
            <div style={{ height: 320, borderRadius: 32, background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 28px 90px rgba(0,0,0,0.32)', backdropFilter: 'blur(18px)', display: 'grid', placeItems: 'center' }}>
              <FloatingCube />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, maxWidth: 620 }}>
            {[
              ['Live ATS', 'Real student data'],
              ['Supabase', 'Persistent records'],
              ['Motion UI', 'Smooth transitions'],
            ].map(([title, desc]) => (
              <div key={title} style={{ padding: 18, borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <div style={{ padding: 24, display: 'grid', placeItems: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12 }}
            style={{ width: '100%', maxWidth: 480, background: 'rgba(10,14,26,0.72)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 32, padding: 28, boxShadow: '0 28px 100px rgba(0,0,0,0.5)', backdropFilter: 'blur(24px)' }}
          >
            <div style={{ display: 'flex', gap: 8, padding: 6, borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => switchRole('student')}
                style={{ flex: 1, border: 'none', cursor: 'pointer', padding: '12px 16px', borderRadius: 999, background: role === 'student' ? 'linear-gradient(135deg, #ffffff, #c7d2fe)' : 'transparent', color: role === 'student' ? '#0b1020' : 'rgba(255,255,255,0.7)', fontWeight: 700 }}
              >
                Student Login
              </button>
              <button
                onClick={() => switchRole('admin')}
                style={{ flex: 1, border: 'none', cursor: 'pointer', padding: '12px 16px', borderRadius: 999, background: role === 'admin' ? 'linear-gradient(135deg, #8b5cf6, #38bdf8)' : 'transparent', color: role === 'admin' ? 'white' : 'rgba(255,255,255,0.7)', fontWeight: 700 }}
              >
                Admin Login
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={role}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.25 }}
                style={{ marginTop: 24 }}
              >
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>{activeConfig.title}</div>
                  <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800, letterSpacing: '-0.05em' }}>{role === 'admin' ? 'Admin access' : 'Student access'}</div>
                  <p style={{ marginTop: 10, fontSize: 14, color: 'rgba(255,255,255,0.68)', lineHeight: 1.65 }}>{activeConfig.subtitle}</p>
                </div>

                <div style={{ display: 'grid', gap: 14 }}>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', fontWeight: 600 }}>Username</span>
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      style={{ width: '100%', borderRadius: 18, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: 'white', padding: '14px 16px', outline: 'none', fontSize: 14 }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', fontWeight: 600 }}>Password</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ width: '100%', borderRadius: 18, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: 'white', padding: '14px 16px', outline: 'none', fontSize: 14 }}
                    />
                  </label>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                    <span>Demo credentials are prefilled.</span>
                    <span>{role === 'admin' ? 'admin / admin123' : 'student / 1234'}</span>
                  </div>

                  {error && (
                    <div style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(244,63,94,0.14)', border: '1px solid rgba(244,63,94,0.26)', color: '#fecdd3', fontSize: 13, fontWeight: 600 }}>
                      {error}
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogin}
                    style={{
                      border: 'none',
                      cursor: 'pointer',
                      padding: '15px 18px',
                      borderRadius: 18,
                      background: role === 'admin' ? 'linear-gradient(135deg, #8b5cf6, #22d3ee)' : 'linear-gradient(135deg, #ffffff, #dbeafe)',
                      color: '#0b1020',
                      fontWeight: 800,
                      fontSize: 15,
                      boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
                    }}
                  >
                    Sign in
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {Array.from({ length: 18 }).map((_, index) => (
          <motion.span
            key={index}
            animate={{ y: [0, -18, 0], opacity: [0.25, 0.55, 0.25], x: [0, 8, 0] }}
            transition={{ duration: 5 + (index % 4), repeat: Infinity, ease: 'easeInOut', delay: index * 0.2 }}
            style={{ position: 'absolute', left: `${(index * 17) % 100}%`, top: `${(index * 29) % 100}%`, width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', filter: 'blur(0.3px)' }}
          />
        ))}
      </div>
    </div>
  );
}
