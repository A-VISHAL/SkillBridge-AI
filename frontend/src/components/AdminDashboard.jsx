import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase, isSupabaseReady } from '../lib/supabaseClient';
import StudentsSection, { useAdminData } from './admin/Students';

const navItems = [
  { id: 'overview', label: 'Dashboard Overview' },
  { id: 'students', label: 'Students' },
  { id: 'eligibility', label: 'Eligibility Control' },
  { id: 'jobs', label: 'Job Management' },
  { id: 'ats', label: 'ATS Analysis' },
  { id: 'roadmaps', label: 'Roadmaps' },
  { id: 'analytics', label: 'Analytics' },
];

const colors = ['#22c55e', '#38bdf8', '#8b5cf6', '#f59e0b', '#ef4444', '#14b8a6'];

const metricStyle = {
  borderRadius: 28,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 18px 60px rgba(0,0,0,0.22)',
};

function StatCard({ label, value, hint, accent }) {
  return (
    <motion.div whileHover={{ y: -5, scale: 1.01 }} style={{ ...metricStyle, padding: 20, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 20% 20%, ${accent}24, transparent 58%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ color: 'rgba(255,255,255,0.58)', fontSize: 13, fontWeight: 600 }}>{label}</div>
        <div style={{ marginTop: 10, fontSize: 34, fontWeight: 800, letterSpacing: '-0.06em' }}>{value}</div>
        <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.48)', fontSize: 12 }}>{hint}</div>
      </div>
    </motion.div>
  );
}

function SectionShell({ title, subtitle, children, right }) {
  return (
    <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 14, alignItems: 'end' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 28, letterSpacing: '-0.05em' }}>{title}</h2>
          <p style={{ marginTop: 6, color: 'rgba(255,255,255,0.58)' }}>{subtitle}</p>
        </div>
        {right}
      </div>
      {children}
    </motion.section>
  );
}

function Gauge({ value, label }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: 10 }}>
      <div style={{ width: 130, height: 130, borderRadius: '50%', background: `conic-gradient(#22c55e 0deg, #22c55e ${value * 3.6}deg, rgba(255,255,255,0.08) ${value * 3.6}deg 360deg)`, display: 'grid', placeItems: 'center' }}>
        <div style={{ width: 98, height: 98, borderRadius: '50%', background: '#0b1020', display: 'grid', placeItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{Math.round(value)}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.48)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function evaluateEligibility(student, settings) {
  const cgpa = Number(student.cgpa);
  const requiredSkills = settings.required_skills || [];
  const skillList = student.skills || [];
  const meetsCGPA = !Number.isNaN(cgpa) && cgpa >= Number(settings.min_cgpa);
  const meetsATS = Number(student.ats_score || 0) >= Number(settings.min_ats_score);
  const meetsSkills = requiredSkills.length === 0 || requiredSkills.every((requiredSkill) =>
    skillList.some((skill) => skill.toLowerCase().includes(requiredSkill.toLowerCase())),
  );

  return {
    meetsCGPA,
    meetsATS,
    meetsSkills,
    eligible: meetsCGPA && meetsATS && meetsSkills,
  };
}

export function AdminDashboard({ onLogout }) {
  const { students, jobs, roadmaps, roadmapTasks, settings, loading, error, refetch } = useAdminData();
  const [active, setActive] = useState('overview');
  const [savedSettings, setSavedSettings] = useState(settings);
  const [editingJob, setEditingJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobForm, setJobForm] = useState({ title: '', company: '', location: '' });
  const [toast, setToast] = useState('');
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    setSavedSettings(settings);
  }, [settings]);

  const eligibilitySnapshot = useMemo(() => {
    return students.map((student) => ({
      student,
      ...evaluateEligibility(student, savedSettings),
    }));
  }, [students, savedSettings.min_cgpa, savedSettings.min_ats_score, savedSettings.required_skills]);

  // Calculate bottleneck eligibility (minimum of all criteria)
  const eligibilityBreakdown = useMemo(() => {
    const cgpaCount = eligibilitySnapshot.filter(e => e.meetsCGPA).length;
    const atsCount = eligibilitySnapshot.filter(e => e.meetsATS).length;
    const skillsCount = eligibilitySnapshot.filter(e => e.meetsSkills).length;
    
    // Total eligible is the minimum (bottleneck)
    const totalEligible = Math.min(cgpaCount, atsCount, skillsCount);
    
    return {
      cgpaCount,
      atsCount,
      skillsCount,
      totalEligible,
      notEligible: students.length - totalEligible
    };
  }, [eligibilitySnapshot, students.length]);

  const eligibleStudents = useMemo(
    () => ({ length: eligibilityBreakdown.totalEligible }),
    [eligibilityBreakdown.totalEligible],
  );

  const eligibilityCounts = useMemo(() => {
    return eligibilitySnapshot.reduce((counts, entry) => {
      if (entry.meetsCGPA) counts.cgpa += 1;
      if (entry.meetsATS) counts.ats += 1;
      if (entry.meetsSkills) counts.skills += 1;
      if (entry.eligible) counts.eligible += 1;
      return counts;
    }, { cgpa: 0, ats: 0, skills: 0, eligible: 0 });
  }, [eligibilitySnapshot]);

  const totalStudents = students.length;
  const averageAts = totalStudents ? students.reduce((sum, student) => sum + Number(student.ats_score || 0), 0) / totalStudents : 0;
  const placementReadiness = totalStudents ? Math.round((eligibilityCounts.eligible / totalStudents) * 100) : 0;
  const activeJobs = jobs.length;

  const chartData = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0];
    students.forEach((student) => {
      const score = Number(student.ats_score || 0);
      if (score < 20) buckets[0] += 1;
      else if (score < 40) buckets[1] += 1;
      else if (score < 60) buckets[2] += 1;
      else if (score < 80) buckets[3] += 1;
      else buckets[4] += 1;
    });
    return [
      { name: '0-20', value: buckets[0] },
      { name: '20-40', value: buckets[1] },
      { name: '40-60', value: buckets[2] },
      { name: '60-80', value: buckets[3] },
      { name: '80-100', value: buckets[4] },
    ];
  }, [students]);

  const skillGaps = useMemo(() => {
    const required = savedSettings.required_skills || [];
    return required.map((skill) => {
      const matchCount = students.filter((student) => student.skills.some((value) => value.toLowerCase().includes(skill.toLowerCase()))).length;
      return { skill, students: Math.max(0, students.length - matchCount) };
    });
  }, [students, savedSettings]);

  const trendData = useMemo(() => {
    return students.slice(0, 6).map((student, index) => ({
      name: `Student ${index + 1}`,
      ats: Number(student.ats_score || 0),
      progress: Number(student.progress || 0),
      order: index + 1,
    }));
  }, [students]);

  const roadmapRows = useMemo(() => {
    const grouped = new Map();
    roadmaps.forEach((roadmap) => {
      const tasksForRoadmap = roadmapTasks.filter((task) => task.roadmap_id === roadmap.id);
      grouped.set(roadmap.resume_id, {
        roadmap,
        tasks: tasksForRoadmap,
        completed: tasksForRoadmap.filter((task) => task.completed).length,
      });
    });
    return Array.from(grouped.values()).slice(0, 6);
  }, [roadmaps, roadmapTasks]);

  const saveEligibility = () => {
    setToast('Eligibility criteria saved locally for this session.');
    window.setTimeout(() => setToast(''), 2600);
  };

  const handleJobSave = () => {
    setToast(editingJob ? 'Job updated locally.' : 'Job created locally.');
    setShowJobModal(false);
    setEditingJob(null);
    setJobForm({ title: '', company: '', location: '' });
    window.setTimeout(() => setToast(''), 2600);
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setJobForm({ title: job.title || '', company: job.company || '', location: job.location || '' });
    setShowJobModal(true);
  };

  const handleDeleteJob = () => {
    setToast('Job removed locally. Refresh will restore live Supabase data.');
    window.setTimeout(() => setToast(''), 2600);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top left, #111827 0%, #060814 55%, #03030a 100%)', color: 'white', padding: 28 }}>
        <div style={{ display: 'grid', gap: 16 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} style={{ height: 120, borderRadius: 28, background: 'linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.1), rgba(255,255,255,0.05))', backgroundSize: '250% 100%', animation: 'shimmer 1.6s infinite' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top left, #162033 0%, #090d17 46%, #05070d 100%)', color: 'white' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: '100vh' }}>
        <aside style={{ position: 'sticky', top: 0, height: '100vh', padding: 20, borderRight: '1px solid rgba(255,255,255,0.08)', background: 'rgba(8,11,20,0.7)', backdropFilter: 'blur(18px)' }}>
          <div style={{ padding: 14, borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.04em' }}>SkillBridge Admin</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>Connected to Supabase</div>
          </div>

          <nav style={{ display: 'grid', gap: 10, marginTop: 18 }}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                style={{
                  border: '1px solid',
                  borderColor: active === item.id ? 'rgba(147,197,253,0.35)' : 'transparent',
                  background: active === item.id ? 'linear-gradient(135deg, rgba(99,102,241,0.24), rgba(34,211,238,0.16))' : 'transparent',
                  color: 'white',
                  borderRadius: 18,
                  padding: '14px 16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div style={{ marginTop: 18, padding: 16, borderRadius: 24, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Admin tools</div>
            <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700 }}>{savedSettings.min_cgpa} CGPA / {savedSettings.min_ats_score}% ATS</div>
          </div>
        </aside>

        <main style={{ padding: 24, overflow: 'auto' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.56)', fontSize: 13 }}>Premium Admin Dashboard</div>
              <h1 style={{ margin: '8px 0 0', fontSize: 'clamp(30px, 4vw, 48px)', letterSpacing: '-0.06em' }}>Company control center</h1>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button onClick={refetch} style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: 'white', borderRadius: 999, padding: '10px 16px', cursor: 'pointer' }}>Refresh</button>
              <button onClick={onLogout} style={{ border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)', color: 'white', borderRadius: 999, padding: '10px 16px', cursor: 'pointer', fontWeight: 700 }}>Logout</button>
            </div>
          </header>

          {error && (
            <div style={{ marginBottom: 18, padding: 16, borderRadius: 22, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.22)', color: '#fecaca' }}>
              {error}
            </div>
          )}

          {toast && (
            <div style={{ marginBottom: 18, padding: 14, borderRadius: 22, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.18)', color: '#bbf7d0' }}>
              {toast}
            </div>
          )}

          <AnimatePresence mode="wait">
            {active === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'grid', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
                  <StatCard label="Total Students" value={totalStudents} hint="Synced from resumes table" accent="#38bdf8" />
                  <StatCard label="Average ATS Score" value={Math.round(averageAts)} hint="From jd_matches" accent="#8b5cf6" />
                  <StatCard label="Placement Readiness" value={`${placementReadiness}%`} hint="Eligible students vs total" accent="#22c55e" />
                  <StatCard label="Active Jobs" value={activeJobs} hint="Live job descriptions" accent="#f59e0b" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.9fr', gap: 14 }}>
                  <div style={{ ...metricStyle, padding: 20, minHeight: 300 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>ATS score distribution</div>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.48)" />
                        <YAxis stroke="rgba(255,255,255,0.48)" />
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }} />
                        <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                          {chartData.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ ...metricStyle, padding: 20, display: 'grid', placeItems: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Readiness gauge</div>
                    <Gauge value={Math.max(placementReadiness, Math.round(averageAts))} label="ready" />
                    <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.56)', fontSize: 13, textAlign: 'center' }}>
                      Based on eligibility settings and student performance.
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {active === 'students' && (
              <motion.div key="students" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <StudentsSection students={students} settings={savedSettings} loading={loading} error={error} onRefresh={refetch} />
              </motion.div>
            )}

            {active === 'eligibility' && (
              <motion.div key="eligibility" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'grid', gap: 18 }}>
                <SectionShell title="Eligibility control panel" subtitle="Tune screening rules for company placement and shortlist automation.">
                  <div style={{ ...metricStyle, padding: 22, display: 'grid', gap: 18 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontWeight: 700 }}>Minimum CGPA</span>
                        <span>{savedSettings.min_cgpa.toFixed(1)}</span>
                      </div>
                      <input type="range" min="4" max="10" step="0.1" value={savedSettings.min_cgpa} onChange={(e) => setSavedSettings((prev) => ({ ...prev, min_cgpa: Number(e.target.value) }))} style={rangeStyle} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontWeight: 700 }}>Minimum ATS Score</span>
                        <span>{savedSettings.min_ats_score}%</span>
                      </div>
                      <input type="range" min="0" max="100" step="1" value={savedSettings.min_ats_score} onChange={(e) => setSavedSettings((prev) => ({ ...prev, min_ats_score: Number(e.target.value) }))} style={rangeStyle} />
                    </div>

                    <div>
                      <div style={{ marginBottom: 12, fontWeight: 700 }}>Required Skills</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                        {(savedSettings.required_skills || []).map((skill) => (
                          <span 
                            key={skill} 
                            style={{ 
                              padding: '8px 12px', 
                              borderRadius: 999, 
                              background: 'rgba(255,255,255,0.08)', 
                              border: '1px solid rgba(255,255,255,0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8
                            }}
                          >
                            {skill}
                            <button
                              onClick={() => {
                                setSavedSettings(prev => ({
                                  ...prev,
                                  required_skills: prev.required_skills.filter(s => s !== skill)
                                }));
                              }}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: 'rgba(255,255,255,0.6)',
                                cursor: 'pointer',
                                padding: 0,
                                fontSize: 16,
                                lineHeight: 1
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newSkill.trim()) {
                              setSavedSettings(prev => ({
                                ...prev,
                                required_skills: [...(prev.required_skills || []), newSkill.trim()]
                              }));
                              setNewSkill('');
                            }
                          }}
                          placeholder="Add a skill (e.g., Docker, AWS)"
                          style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: 12,
                            border: '1px solid rgba(255,255,255,0.12)',
                            background: 'rgba(255,255,255,0.08)',
                            color: 'white',
                            fontSize: 13,
                            outline: 'none'
                          }}
                        />
                        <button
                          onClick={() => {
                            if (newSkill.trim()) {
                              setSavedSettings(prev => ({
                                ...prev,
                                required_skills: [...(prev.required_skills || []), newSkill.trim()]
                              }));
                              setNewSkill('');
                            }
                          }}
                          style={{
                            borderRadius: 12,
                            padding: '10px 18px',
                            background: 'rgba(139,92,246,0.2)',
                            border: '1px solid rgba(139,92,246,0.3)',
                            color: '#a78bfa',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: 13
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={saveEligibility} style={{ border: 'none', borderRadius: 999, padding: '12px 16px', background: 'linear-gradient(135deg, #8b5cf6, #38bdf8)', color: 'white', fontWeight: 800, cursor: 'pointer' }}>Save criteria</button>
                    </div>
                  </div>
                </SectionShell>

                <SectionShell title="Eligibility statistics" subtitle="Visual breakdown of student eligibility based on current criteria.">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                    <div style={{ ...metricStyle, padding: 20 }}>
                      <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>Eligibility breakdown</div>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart key={`pie-${eligibilityBreakdown.totalEligible}-${students.length}`}>
                          <Pie
                            data={[
                              { name: 'Eligible', value: eligibilityBreakdown.totalEligible, fill: '#22c55e' },
                              { name: 'Not Eligible', value: eligibilityBreakdown.notEligible, fill: '#ef4444' }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={800}
                          >
                          </Pie>
                          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Eligible: {eligibilityBreakdown.totalEligible}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Not Eligible: {eligibilityBreakdown.notEligible}</span>
                        </div>
                      </div>
                      <div style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.52)' }}>
                        Total eligible is the bottleneck (minimum) of all three criteria.
                      </div>
                    </div>

                    <div style={{ ...metricStyle, padding: 20 }}>
                      <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>CGPA distribution</div>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={[
                          { range: '4-5', count: students.filter(s => !isNaN(Number(s.cgpa)) && Number(s.cgpa) >= 4 && Number(s.cgpa) < 5).length },
                          { range: '5-6', count: students.filter(s => !isNaN(Number(s.cgpa)) && Number(s.cgpa) >= 5 && Number(s.cgpa) < 6).length },
                          { range: '6-7', count: students.filter(s => !isNaN(Number(s.cgpa)) && Number(s.cgpa) >= 6 && Number(s.cgpa) < 7).length },
                          { range: '7-8', count: students.filter(s => !isNaN(Number(s.cgpa)) && Number(s.cgpa) >= 7 && Number(s.cgpa) < 8).length },
                          { range: '8-9', count: students.filter(s => !isNaN(Number(s.cgpa)) && Number(s.cgpa) >= 8 && Number(s.cgpa) < 9).length },
                          { range: '9-10', count: students.filter(s => !isNaN(Number(s.cgpa)) && Number(s.cgpa) >= 9).length },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                          <XAxis dataKey="range" stroke="rgba(255,255,255,0.48)" style={{ fontSize: 11 }} />
                          <YAxis stroke="rgba(255,255,255,0.48)" style={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }} />
                          <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#38bdf8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div style={{ ...metricStyle, padding: 20 }}>
                      <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>Students meeting criteria</div>
                      <div style={{ display: 'grid', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 12, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>CGPA ≥ {savedSettings.min_cgpa}</span>
                          <span style={{ fontSize: 18, fontWeight: 800, color: '#22c55e' }}>{eligibilityBreakdown.cgpaCount}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 12, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)' }}>
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>ATS ≥ {savedSettings.min_ats_score}%</span>
                          <span style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8' }}>{eligibilityBreakdown.atsCount}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 12, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>Has required skills</span>
                          <span style={{ fontSize: 18, fontWeight: 800, color: '#8b5cf6' }}>
                            {eligibilityBreakdown.skillsCount}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(56,189,248,0.15))', border: '1px solid rgba(139,92,246,0.3)' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Total Eligible</span>
                          <span style={{ fontSize: 22, fontWeight: 800, color: 'white' }}>{eligibilityBreakdown.totalEligible}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionShell>
              </motion.div>
            )}

            {active === 'jobs' && (
              <motion.div key="jobs" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'grid', gap: 16 }}>
                <SectionShell title="Job management" subtitle="Add, edit, and monitor company job postings.">
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowJobModal(true)} style={{ border: 'none', borderRadius: 999, padding: '12px 16px', background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)', color: 'white', fontWeight: 800, cursor: 'pointer' }}>Add job</button>
                  </div>
                  <div style={{ overflow: 'hidden', borderRadius: 26, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', color: 'rgba(255,255,255,0.64)' }}>
                          <th style={th}>Title</th>
                          <th style={th}>Company</th>
                          <th style={th}>Location</th>
                          <th style={th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobs.map((job) => (
                          <tr key={job.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <td style={td}>{job.title || 'Untitled role'}</td>
                            <td style={td}>{job.company || '-'}</td>
                            <td style={td}>{job.location || '-'}</td>
                            <td style={td}>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => handleEditJob(job)} style={tableButton}>Edit</button>
                                <button onClick={handleDeleteJob} style={tableButton}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionShell>
              </motion.div>
            )}

            {active === 'ats' && (
              <motion.div key="ats" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'grid', gap: 16 }}>
                <SectionShell title="ATS analysis" subtitle="Track student resumes, strengths, and weak areas at a glance.">
                  <div style={{ display: 'grid', gap: 14 }}>
                    {students.slice(0, 8).map((student) => (
                      <details key={student.id} style={{ ...metricStyle, padding: 18 }}>
                        <summary style={{ cursor: 'pointer', listStyle: 'none', fontWeight: 800, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                          <span>{student.name}</span>
                          <span style={{ color: '#22c55e' }}>{Math.round(student.ats_score || 0)}%</span>
                        </summary>
                        <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
                          <Gauge value={Number(student.ats_score || 0)} label="ATS" />
                          <div>
                            <div style={{ fontWeight: 700, marginBottom: 8 }}>Matched skills</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{(student.matched_skills.length ? student.matched_skills : student.skills).slice(0, 8).map((item) => <span key={item} style={chip}>{item}</span>)}</div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, marginBottom: 8 }}>Missing skills</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{student.missing_skills.length ? student.missing_skills.map((item) => <span key={item} style={chipMuted}>{item}</span>) : <span style={{ color: 'rgba(255,255,255,0.46)' }}>No missing skills stored</span>}</div>
                          </div>
                          <div style={{ display: 'grid', gap: 8 }}>
                            <MiniText title="Strengths" items={student.strengths} />
                            <MiniText title="Weaknesses" items={student.weaknesses} />
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>
                </SectionShell>
              </motion.div>
            )}

            {active === 'roadmaps' && (
              <motion.div key="roadmaps" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'grid', gap: 16 }}>
                <SectionShell title="Roadmap monitoring" subtitle="Observe weekly progress and completed tasks from Supabase data.">
                  <div style={{ display: 'grid', gap: 14 }}>
                    {roadmapRows.map(({ roadmap, tasks, completed }) => (
                      <div key={roadmap.id} style={{ ...metricStyle, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                          <div>
                            <div style={{ fontWeight: 800 }}>Resume {roadmap.resume_id.slice(0, 8)}</div>
                            <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.54)', fontSize: 13 }}>{roadmap.duration_weeks} weeks · {tasks.length} tasks</div>
                          </div>
                          <div style={{ fontSize: 28, fontWeight: 800 }}>{tasks.length ? Math.round((completed / tasks.length) * 100) : 0}%</div>
                        </div>
                        <div style={{ marginTop: 14, height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                          <div style={{ width: `${tasks.length ? (completed / tasks.length) * 100 : 0}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #22c55e, #38bdf8)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionShell>
              </motion.div>
            )}

            {active === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: 'grid', gap: 16 }}>
                <SectionShell title="Analytics" subtitle="See ATS distribution, skills gaps, and student performance trends.">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div style={{ ...metricStyle, padding: 18, minHeight: 320 }}>
                      <div style={{ fontWeight: 800, marginBottom: 12 }}>Skills gap analysis</div>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={skillGaps}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                          <XAxis dataKey="skill" stroke="rgba(255,255,255,0.48)" />
                          <YAxis stroke="rgba(255,255,255,0.48)" />
                          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }} />
                          <Bar dataKey="students" radius={[10, 10, 0, 0]} fill="#8b5cf6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ ...metricStyle, padding: 18, minHeight: 320 }}>
                      <div style={{ fontWeight: 800, marginBottom: 12 }}>Student performance trends</div>
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                          <XAxis dataKey="name" stroke="rgba(255,255,255,0.48)" />
                          <YAxis stroke="rgba(255,255,255,0.48)" />
                          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }} />
                          <Legend />
                          <Line type="monotone" dataKey="ats" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="progress" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </SectionShell>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {showJobModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={modalBackdrop} onClick={() => setShowJobModal(false)}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} transition={{ duration: 0.2 }} style={modalCard} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.05em' }}>{editingJob ? 'Edit job' : 'Add job'}</div>
              <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
                <input value={jobForm.title} onChange={(e) => setJobForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Title" style={modalInput} />
                <input value={jobForm.company} onChange={(e) => setJobForm((prev) => ({ ...prev, company: e.target.value }))} placeholder="Company" style={modalInput} />
                <input value={jobForm.location} onChange={(e) => setJobForm((prev) => ({ ...prev, location: e.target.value }))} placeholder="Location" style={modalInput} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                  <button onClick={() => setShowJobModal(false)} style={secondaryButton}>Cancel</button>
                  <button onClick={handleJobSave} style={primaryButton}>Save</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const th = { padding: '14px 16px', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' };
const td = { padding: '16px', fontSize: 14, color: 'rgba(255,255,255,0.82)' };
const tableButton = { border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: 'white', borderRadius: 999, padding: '8px 12px', cursor: 'pointer' };
const rangeStyle = { width: '100%', accentColor: '#8b5cf6' };
const chip = { padding: '6px 10px', borderRadius: 999, background: 'rgba(34,197,94,0.12)', color: '#bbf7d0', border: '1px solid rgba(34,197,94,0.18)' };
const chipMuted = { padding: '6px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.08)' };
const modalBackdrop = { position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.66)', backdropFilter: 'blur(10px)', display: 'grid', placeItems: 'center', zIndex: 100 };
const modalCard = { width: 'min(92vw, 520px)', borderRadius: 28, background: '#0b1020', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 28px 90px rgba(0,0,0,0.5)', padding: 24 };
const modalInput = { border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: 'white', borderRadius: 16, padding: '14px 16px', outline: 'none' };
const primaryButton = { border: 'none', borderRadius: 999, padding: '12px 16px', background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)', color: 'white', cursor: 'pointer', fontWeight: 800 };
const secondaryButton = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '12px 16px', background: 'rgba(255,255,255,0.06)', color: 'white', cursor: 'pointer' };

function MiniText({ title, items }) {
  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: 13, lineHeight: 1.6 }}>{items.length ? items.join(' • ') : 'No data available.'}</div>
    </div>
  );
}
