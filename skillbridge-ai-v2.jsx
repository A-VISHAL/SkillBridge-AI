import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView, useMotionValue, useReducedMotion } from "framer-motion";

// ─── Global CSS ───────────────────────────────────────────────────────────────
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --white: #ffffff;
    --g50:  #f8f8f8;
    --g100: #f2f2f2;
    --g150: #eaeaea;
    --g200: #e0e0e0;
    --g300: #c6c6c6;
    --g400: #9e9e9e;
    --g500: #707070;
    --g600: #505050;
    --g700: #383838;
    --g800: #242424;
    --g900: #141414;
    --black:#080808;
    --sh-xs: 0 1px 2px rgba(0,0,0,0.04);
    --sh-sm: 0 2px 12px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.03);
    --sh-md: 0 4px 24px rgba(0,0,0,0.07),0 2px 6px rgba(0,0,0,0.04);
    --sh-lg: 0 8px 40px rgba(0,0,0,0.09),0 2px 10px rgba(0,0,0,0.04);
    --sh-xl: 0 20px 60px rgba(0,0,0,0.11),0 4px 16px rgba(0,0,0,0.06);
    --r-sm:10px; --r-md:16px; --r-lg:22px; --r-xl:32px; --r-f:9999px;
    --ease: cubic-bezier(0.4,0,0.2,1);
    --spring: cubic-bezier(0.34,1.56,0.64,1);
  }

  html { scroll-behavior:smooth; overflow-x:hidden; }
  body {
    font-family:'DM Sans',system-ui,sans-serif;
    background:var(--white); color:var(--g800);
    -webkit-font-smoothing:antialiased; overflow-x:hidden;
  }

  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:var(--g200);border-radius:99px}

  @keyframes floatA { 0%,100%{transform:translateY(0) rotate(0deg)} 33%{transform:translateY(-14px) rotate(2deg)} 66%{transform:translateY(-7px) rotate(-1deg)} }
  @keyframes floatB { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-20px) rotate(3deg)} }
  @keyframes floatC { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-10px) scale(1.04)} }
  @keyframes gradShift { 0%,100%{opacity:0.4} 50%{opacity:0.7} }
  @keyframes shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
  @keyframes pulseRing { 0%{transform:scale(0.9);opacity:0.8} 100%{transform:scale(1.6);opacity:0} }
  @keyframes drawLine { from{stroke-dashoffset:400} to{stroke-dashoffset:0} }
  @keyframes tickIn { 0%{stroke-dashoffset:20} 100%{stroke-dashoffset:0} }
  @keyframes countUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes waveIn { 0%{clip-path:inset(0 100% 0 0)} 100%{clip-path:inset(0 0% 0 0)} }

  .font-serif { font-family:'Instrument Serif',serif; }
  .font-mono  { font-family:'DM Mono',monospace; }

  .glass {
    background:rgba(255,255,255,0.75);
    backdrop-filter:blur(24px) saturate(1.9);
    -webkit-backdrop-filter:blur(24px) saturate(1.9);
    border:1px solid rgba(255,255,255,0.65);
  }
  .glass-dark {
    background:rgba(20,20,20,0.82);
    backdrop-filter:blur(24px);
    -webkit-backdrop-filter:blur(24px);
    border:1px solid rgba(255,255,255,0.1);
  }

  .tilt-card { transform-style:preserve-3d; perspective:800px; }
  .tilt-inner { transition:transform 0.15s ease, box-shadow 0.15s ease; }

  .skeleton {
    background:linear-gradient(90deg,var(--g100) 25%,var(--g50) 50%,var(--g100) 75%);
    background-size:600px 100%;
    animation:shimmer 1.4s infinite linear;
    border-radius:8px;
  }

  input::placeholder { color:var(--g400); }
  textarea::placeholder { color:var(--g400); }
  input:focus, textarea:focus { outline:none; }

  /* Focus ring animation */
  .focus-ring { transition:box-shadow 0.2s var(--ease); }
  .focus-ring:focus-within { box-shadow:0 0 0 3px rgba(20,20,20,0.12); }
`;

// ─── Motion presets ───────────────────────────────────────────────────────────
const fadeUp   = { hidden:{opacity:0,y:28}, visible:{opacity:1,y:0,transition:{duration:0.65,ease:[0.4,0,0.2,1]}} };
const fadeIn   = { hidden:{opacity:0},       visible:{opacity:1,transition:{duration:0.5}} };
const scaleIn  = { hidden:{opacity:0,scale:0.94}, visible:{opacity:1,scale:1,transition:{duration:0.55,ease:[0.34,1.2,0.64,1]}} };
const stagger  = (d=0.08) => ({ visible:{ transition:{ staggerChildren:d } } });
const slideL   = { hidden:{opacity:0,x:-32}, visible:{opacity:1,x:0,transition:{duration:0.6,ease:[0.4,0,0.2,1]}} };
const slideR   = { hidden:{opacity:0,x:32},  visible:{opacity:1,x:0,transition:{duration:0.6,ease:[0.4,0,0.2,1]}} };

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
const Ic = ({ n, s=18, c="currentColor" }) => {
  const p = {
    dashboard:<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    resume:<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
    match:<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    roadmap:<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
    quiz:<><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    interview:<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
    jobs:<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>,
    bell:<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
    search:<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    upload:<><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
    check:<polyline points="20 6 9 17 4 12"/>,
    chevron:<polyline points="9 18 15 12 9 6"/>,
    star:<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
    zap:<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    target:<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    brain:<><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.84A2.5 2.5 0 0 1 9.5 2"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.84A2.5 2.5 0 0 0 14.5 2"/></>,
    logo:<><circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeWidth="2.5"/><path d="M5.64 5.64l2.12 2.12M16.24 16.24l2.12 2.12M5.64 18.36l2.12-2.12M16.24 7.76l2.12-2.12"/></>,
    trending:<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    award:<><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></>,
    play:<polygon points="5 3 19 12 5 21 5 3"/>,
    mic:<><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></>,
    send:<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    x:<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    layers:<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
    settings:<><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>,
    sparkle:<><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5Z"/><path d="M19 3L19.8 5.2L22 6L19.8 6.8L19 9L18.2 6.8L16 6L18.2 5.2Z"/><path d="M5 16L5.5 17.5L7 18L5.5 18.5L5 20L4.5 18.5L3 18L4.5 17.5Z"/></>,
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {p[n]||p.zap}
    </svg>
  );
};

// ─── Particle Canvas Background ───────────────────────────────────────────────
const ParticleField = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);

    const N = 55;
    const pts = Array.from({length:N}, () => ({
      x: Math.random()*canvas.width, y: Math.random()*canvas.height,
      vx:(Math.random()-0.5)*0.22, vy:(Math.random()-0.5)*0.22,
      r: Math.random()*1.5+0.5, o: Math.random()*0.3+0.05,
    }));

    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if(p.x<0||p.x>canvas.width) p.vx*=-1;
        if(p.y<0||p.y>canvas.height) p.vy*=-1;
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle = `rgba(80,80,80,${p.o})`;
        ctx.fill();
      });
      // Connections
      for(let i=0;i<N;i++) for(let j=i+1;j<N;j++){
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d<120){
          ctx.beginPath();
          ctx.moveTo(pts[i].x,pts[i].y);
          ctx.lineTo(pts[j].x,pts[j].y);
          ctx.strokeStyle=`rgba(120,120,120,${0.08*(1-d/120)})`;
          ctx.lineWidth=0.7;
          ctx.stroke();
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize",resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none" }}/>;
};

// ─── Floating 3D-ish shapes (CSS-based, no dependency) ───────────────────────
const FloatingShapes = () => (
  <div style={{ position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0 }}>
    {/* Large soft sphere */}
    <div style={{
      position:"absolute",top:"-8%",right:"-4%",
      width:480,height:480,borderRadius:"50%",
      background:"radial-gradient(ellipse at 35% 35%, rgba(230,230,230,0.35), rgba(200,200,200,0.05) 60%)",
      filter:"blur(1px)",
      animation:"floatA 9s ease-in-out infinite",
      boxShadow:"inset 0 0 80px rgba(255,255,255,0.5), 0 0 60px rgba(180,180,180,0.12)",
    }}/>
    {/* Medium glass cube look */}
    <div style={{
      position:"absolute",bottom:"12%",left:"3%",
      width:200,height:200,borderRadius:40,
      background:"rgba(255,255,255,0.18)",
      backdropFilter:"blur(10px)",
      border:"1px solid rgba(255,255,255,0.5)",
      boxShadow:"0 8px 48px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
      transform:"rotate(-18deg)",
      animation:"floatB 12s ease-in-out infinite",
    }}/>
    {/* Small orb */}
    <div style={{
      position:"absolute",top:"42%",right:"8%",
      width:110,height:110,borderRadius:"50%",
      background:"radial-gradient(circle at 40% 35%, rgba(255,255,255,0.9), rgba(210,210,210,0.2))",
      boxShadow:"0 4px 30px rgba(0,0,0,0.08), inset 0 2px 4px rgba(255,255,255,0.9)",
      animation:"floatC 7s ease-in-out infinite",
    }}/>
    {/* Thin ring */}
    <div style={{
      position:"absolute",top:"18%",left:"8%",
      width:160,height:160,borderRadius:"50%",
      border:"1.5px solid rgba(150,150,150,0.18)",
      animation:"floatA 15s ease-in-out infinite reverse",
    }}/>
    <div style={{
      position:"absolute",top:"18%",left:"8%",
      width:130,height:130,borderRadius:"50%",
      border:"1px solid rgba(150,150,150,0.1)",
      margin:"15px",
      animation:"floatA 15s ease-in-out infinite",
    }}/>
  </div>
);

// ─── 3D Tilt Card HOC ────────────────────────────────────────────────────────
const TiltCard = ({ children, style={}, intensity=12, glare=true }) => {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({rx:0,ry:0,gx:50,gy:50,hover:false});
  const shouldReduce = useReducedMotion();

  const handleMove = useCallback((e) => {
    if(shouldReduce) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top)  / r.height;
    setTilt({ rx:(y-0.5)*-intensity, ry:(x-0.5)*intensity, gx:x*100, gy:y*100, hover:true });
  },[intensity,shouldReduce]);

  const handleLeave = () => setTilt({rx:0,ry:0,gx:50,gy:50,hover:false});

  return (
    <div ref={ref} onMouseMove={handleMove} onMouseLeave={handleLeave}
      style={{ perspective:800, ...style }}>
      <motion.div
        animate={{ rotateX:tilt.rx, rotateY:tilt.ry, scale:tilt.hover?1.025:1 }}
        transition={{ type:"spring", stiffness:300, damping:28 }}
        style={{
          transformStyle:"preserve-3d",
          background:"var(--white)",
          border:"1px solid var(--g150)",
          borderRadius:"var(--r-lg)",
          boxShadow: tilt.hover ? "0 20px 60px rgba(0,0,0,0.13), 0 4px 16px rgba(0,0,0,0.06)" : "var(--sh-md)",
          position:"relative", overflow:"hidden",
        }}>
        {glare && tilt.hover && (
          <div style={{
            position:"absolute",inset:0,borderRadius:"inherit",
            background:`radial-gradient(ellipse at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.35) 0%, transparent 65%)`,
            pointerEvents:"none",zIndex:10,
          }}/>
        )}
        {children}
      </motion.div>
    </div>
  );
};

// ─── Animated Circular Progress ──────────────────────────────────────────────
const CircProg = ({ value, size=120, label, animate=true }) => {
  const [v, setV] = useState(0);
  useEffect(() => { const t = setTimeout(()=>setV(value),300); return()=>clearTimeout(t); },[value]);
  const r = (size-14)/2;
  const circ = 2*Math.PI*r;
  const offset = circ-(v/100)*circ;
  return (
    <div style={{position:"relative",width:size,height:size,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)",position:"absolute"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--g100)" strokeWidth="7"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="var(--g800)" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{transition:"stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)"}}/>
      </svg>
      <div style={{textAlign:"center",zIndex:1}}>
        <motion.div
          key={v}
          initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
          style={{fontSize:size*0.21,fontWeight:700,color:"var(--g900)",lineHeight:1,letterSpacing:"-0.04em"}}>
          {v}
        </motion.div>
        {label && <div style={{fontSize:9.5,color:"var(--g400)",marginTop:3,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase"}}>{label}</div>}
      </div>
    </div>
  );
};

// ─── Animated Progress Bar ───────────────────────────────────────────────────
const ProgBar = ({ value, label, sub, delay=0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, {once:true, margin:"-20px"});
  return (
    <div ref={ref}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:7,alignItems:"baseline"}}>
        <span style={{fontSize:13,fontWeight:500,color:"var(--g700)"}}>{label}</span>
        {sub && <span style={{fontSize:12,color:"var(--g400)",fontWeight:500}}>{sub}</span>}
      </div>
      <div style={{height:5,background:"var(--g100)",borderRadius:99,overflow:"hidden"}}>
        <motion.div
          initial={{width:0}} animate={inView?{width:`${value}%`}:{width:0}}
          transition={{duration:1.1,delay,ease:[0.4,0,0.2,1]}}
          style={{height:"100%",borderRadius:99,background:"linear-gradient(90deg,var(--g800),var(--g400))"}}/>
      </div>
    </div>
  );
};

// ─── Skeleton Loader ─────────────────────────────────────────────────────────
const Skel = ({ w="100%", h=16, r=8, style={} }) => (
  <div className="skeleton" style={{width:w,height:h,borderRadius:r,...style}}/>
);

// ─── Badge ────────────────────────────────────────────────────────────────────
const Badge = ({ children, v="default" }) => {
  const map = {
    default:{ bg:"var(--g100)",   c:"var(--g600)",  b:"var(--g200)" },
    success:{ bg:"#f0fdf4",       c:"#166534",       b:"#bbf7d0" },
    dark:   { bg:"var(--g900)",   c:"var(--white)",  b:"var(--g900)" },
  };
  const s = map[v]||map.default;
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 10px",borderRadius:99,
      fontSize:11,fontWeight:600,letterSpacing:"0.02em",background:s.bg,color:s.c,border:`1px solid ${s.b}`}}>
      {children}
    </span>
  );
};

// ─── Button ───────────────────────────────────────────────────────────────────
const Btn = ({ children, v="primary", onClick, style={}, icon, disabled=false }) => {
  const base = {
    display:"inline-flex",alignItems:"center",justifyContent:"center",
    gap:7,padding:"10px 22px",borderRadius:99,fontSize:13.5,
    fontWeight:600,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",
    letterSpacing:"-0.01em",border:"none",
    opacity:disabled?0.5:1,
  };
  const vs = {
    primary:{ background:"var(--black)", color:"var(--white)" },
    secondary:{ background:"var(--white)", color:"var(--g800)", border:"1px solid var(--g200)", boxShadow:"var(--sh-sm)" },
    ghost:{ background:"transparent", color:"var(--g700)" },
    outline:{ background:"transparent", color:"var(--g800)", border:"1.5px solid var(--g300)" },
  };
  return (
    <motion.button onClick={onClick} disabled={disabled}
      whileHover={disabled?{}:{ y:-1.5, boxShadow: v==="primary" ? "0 8px 24px rgba(0,0,0,0.22)" : "var(--sh-md)" }}
      whileTap={disabled?{}:{ scale:0.97, y:0 }}
      transition={{ type:"spring", stiffness:500, damping:30 }}
      style={{...base,...vs[v],...style}}>
      {icon && <span style={{display:"flex"}}>{icon}</span>}
      {children}
    </motion.button>
  );
};

// ─── Section Wrapper ──────────────────────────────────────────────────────────
const Section = ({ children, style={}, delay=0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, {once:true, margin:"-60px"});
  return (
    <motion.div ref={ref}
      variants={fadeUp} initial="hidden" animate={inView?"visible":"hidden"}
      transition={{ duration:0.65, delay, ease:[0.4,0,0.2,1] }}
      style={style}>
      {children}
    </motion.div>
  );
};

// ─── Card ────────────────────────────────────────────────────────────────────
const Card = ({ children, style={}, tilt=false, glass=false, hover=true }) => {
  if(tilt) return <TiltCard style={style}><div style={{padding:24}}>{children}</div></TiltCard>;
  return (
    <motion.div
      whileHover={hover?{y:-3,boxShadow:"0 16px 48px rgba(0,0,0,0.1),0 4px 12px rgba(0,0,0,0.05)"}:{}}
      transition={{type:"spring",stiffness:400,damping:30}}
      className={glass?"glass":""}
      style={{
        background:glass?undefined:"var(--white)",
        border:"1px solid var(--g150)",
        borderRadius:"var(--r-lg)",
        boxShadow:"var(--sh-md)",
        padding:24,
        ...style,
      }}>
      {children}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const Landing = ({ onEnter }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mouse, setMouse] = useState({x:0,y:0});
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0,500], [0,80]);
  const heroO = useTransform(scrollY, [0,400], [1,0]);

  useEffect(() => {
    const s = () => setScrolled(window.scrollY>40);
    window.addEventListener("scroll",s);
    return ()=>window.removeEventListener("scroll",s);
  },[]);

  const handleMouseMove = useCallback((e) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if(!rect) return;
    setMouse({ x:(e.clientX-rect.left)/rect.width-0.5, y:(e.clientY-rect.top)/rect.height-0.5 });
  },[]);

  const features = [
    {icon:"resume",   t:"Resume Analyzer",  d:"AI-powered ATS scoring with line-by-line feedback to maximise your resume's impact instantly."},
    {icon:"match",    t:"JD Matcher",        d:"Paste any job description and receive an instant skill-gap analysis with targeted upskill plans."},
    {icon:"roadmap",  t:"Smart Roadmap",     d:"Personalised week-by-week learning plans built to your target role, level, and timeline."},
    {icon:"quiz",     t:"Adaptive Quiz",     d:"Dynamic questions that recalibrate to your knowledge, reinforcing gaps and building confidence."},
    {icon:"interview",t:"Mock Interview",    d:"AI conducts lifelike interviews, evaluates every response, and provides scored actionable feedback."},
    {icon:"jobs",     t:"Job Finder",        d:"Curated openings scored against your evolving profile with one-click application tracking."},
  ];

  const steps = [
    {n:"01",t:"Upload resume",    d:"AI analyses your resume against ATS standards in under 3 seconds."},
    {n:"02",t:"Set target role",  d:"Paste a JD or choose from curated roles to anchor your destination."},
    {n:"03",t:"Follow roadmap",   d:"Move through structured topics, resources, and timed practice sessions."},
    {n:"04",t:"Get hired",        d:"Apply with a polished profile and interview-ready confidence."},
  ];

  const testimonials = [
    {name:"Ananya S.", role:"SWE @ Google",  text:"SkillBridge AI helped me close a 4-month skill gap in just 6 weeks. The roadmap is incredibly precise.", av:"A"},
    {name:"Rahul M.",  role:"PM @ Stripe",   text:"The JD Matcher revealed exactly what was missing. I tailored my resume and got 3× more responses overnight.", av:"R"},
    {name:"Priya K.",  role:"Analyst @ Airbnb", text:"The mock interview feature is eerily realistic. It caught nervousness patterns I had never noticed myself.", av:"P"},
  ];

  const px = useSpring(mouse.x, {stiffness:80,damping:20});
  const py = useSpring(mouse.y, {stiffness:80,damping:20});

  return (
    <div style={{minHeight:"100vh", background:"var(--white)", overflowX:"hidden"}}>
      {/* Navbar */}
      <motion.nav className="glass"
        initial={{y:-80,opacity:0}} animate={{y:0,opacity:1}}
        transition={{duration:0.7,ease:[0.4,0,0.2,1]}}
        style={{
          position:"fixed",top:0,left:0,right:0,zIndex:100,
          padding:scrolled?"12px 48px":"20px 48px",
          transition:"padding 0.3s ease",
          borderBottom:scrolled?"1px solid var(--g150)":"1px solid transparent",
          boxShadow:scrolled?"var(--sh-sm)":"none",
        }}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <motion.div style={{display:"flex",alignItems:"center",gap:9}} whileHover={{scale:1.02}}>
            <div style={{width:32,height:32,borderRadius:10,background:"var(--g900)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Ic n="logo" s={15} c="white"/>
            </div>
            <span style={{fontWeight:700,fontSize:15.5,letterSpacing:"-0.04em",color:"var(--g900)"}}>SkillBridge AI</span>
          </motion.div>

          <div style={{display:"flex",gap:32,alignItems:"center"}}>
            {["Features","How it works","Pricing"].map(n=>(
              <motion.a key={n} href="#" style={{fontSize:14,color:"var(--g500)",textDecoration:"none",fontWeight:500}}
                whileHover={{color:"var(--g900)"}} transition={{duration:0.15}}>{n}</motion.a>
            ))}
          </div>

          <div style={{display:"flex",gap:10}}>
            <Btn v="ghost" style={{fontSize:13.5,padding:"8px 18px"}}>Sign in</Btn>
            <Btn v="primary" onClick={onEnter} style={{padding:"8px 18px",fontSize:13.5}}>Get started</Btn>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section ref={heroRef} onMouseMove={handleMouseMove}
        style={{position:"relative",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>

        <ParticleField/>
        <FloatingShapes/>

        {/* Parallax blob shapes */}
        <motion.div style={{
          position:"absolute",top:"10%",left:"15%",width:340,height:340,borderRadius:"50%",
          background:"radial-gradient(circle, rgba(220,220,220,0.2), transparent 70%)",
          filter:"blur(40px)", x:useTransform(px,[-0.5,0.5],[-24,24]), y:useTransform(py,[-0.5,0.5],[-16,16]),
          pointerEvents:"none",
        }}/>
        <motion.div style={{
          position:"absolute",bottom:"15%",right:"10%",width:280,height:280,borderRadius:"50%",
          background:"radial-gradient(circle, rgba(200,200,200,0.15), transparent 70%)",
          filter:"blur(30px)", x:useTransform(px,[-0.5,0.5],[16,-16]), y:useTransform(py,[-0.5,0.5],[10,-10]),
          pointerEvents:"none",
        }}/>

        <motion.div style={{textAlign:"center",maxWidth:820,padding:"0 24px",position:"relative",zIndex:2,y:heroY,opacity:heroO}}>
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.6,delay:0.2}}>
            <Badge v="dark">✦ Powered by advanced AI</Badge>
          </motion.div>

          <motion.h1
            className="font-serif"
            initial={{opacity:0,y:32}} animate={{opacity:1,y:0}}
            transition={{duration:0.9,delay:0.35,ease:[0.4,0,0.2,1]}}
            style={{fontSize:"clamp(44px,8vw,82px)",fontWeight:400,lineHeight:1.04,
              letterSpacing:"-0.02em",color:"var(--g900)",margin:"20px 0 18px",
              fontStyle:"italic"}}>
            Your AI Career<br/>
            <span style={{fontStyle:"normal",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:"0.9em",letterSpacing:"-0.04em"}}>Operating System</span>
          </motion.h1>

          <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.5}}
            style={{fontSize:18,color:"var(--g500)",lineHeight:1.7,maxWidth:520,margin:"0 auto 42px",fontWeight:400}}>
            Analyze, learn, practice, and get hired — powered by AI that understands every nuance of your career journey.
          </motion.p>

          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.6,delay:0.65}}
            style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <Btn v="primary" onClick={onEnter} style={{padding:"14px 32px",fontSize:15}}>Get started free</Btn>
            <Btn v="secondary" style={{padding:"14px 28px",fontSize:15}} icon={<Ic n="play" s={14}/>}>See demo</Btn>
          </motion.div>

          {/* Floating preview card */}
          <motion.div
            initial={{opacity:0,y:48,scale:0.94}} animate={{opacity:1,y:0,scale:1}}
            transition={{duration:1,delay:0.9,ease:[0.34,1.1,0.64,1]}}
            style={{marginTop:60}}>
            <div className="glass" style={{
              borderRadius:"var(--r-xl)",padding:"28px 32px",
              boxShadow:"var(--sh-xl)",maxWidth:600,margin:"0 auto",
              animation:"floatC 7s ease-in-out infinite",
            }}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
                <div>
                  <div style={{fontSize:11,color:"var(--g400)",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4}}>Today's Progress</div>
                  <div style={{fontSize:18,fontWeight:700,color:"var(--g900)",letterSpacing:"-0.04em"}}>3 tasks completed</div>
                </div>
                <CircProg value={78} size={78} label="ATS"/>
              </div>
              <div style={{display:"flex",gap:10}}>
                {[{l:"Resume",v:82},{l:"JD Match",v:74},{l:"Quiz",v:91}].map(i=>(
                  <div key={i.l} style={{flex:1,background:"var(--g50)",borderRadius:14,padding:"12px 14px",border:"1px solid var(--g150)"}}>
                    <div style={{fontSize:20,fontWeight:700,color:"var(--g900)",letterSpacing:"-0.04em"}}>{i.v}%</div>
                    <div style={{fontSize:11,color:"var(--g400)",marginTop:2,fontWeight:500}}>{i.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{opacity:0}} animate={{opacity:1}} transition={{delay:2}}
          style={{position:"absolute",bottom:36,left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
          <div style={{fontSize:11,color:"var(--g400)",fontWeight:500,letterSpacing:"0.08em",textTransform:"uppercase"}}>Scroll</div>
          <motion.div animate={{y:[0,7,0]}} transition={{duration:1.8,repeat:Infinity}}
            style={{width:1,height:36,background:"linear-gradient(to bottom,var(--g400),transparent)"}}/>
        </motion.div>
      </section>

      {/* Features */}
      <section style={{maxWidth:1100,margin:"0 auto",padding:"100px 24px"}}>
        <Section style={{textAlign:"center",marginBottom:60}}>
          <div style={{fontSize:11,color:"var(--g400)",fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:14}}>Features</div>
          <h2 style={{fontSize:"clamp(28px,4vw,44px)",fontWeight:700,letterSpacing:"-0.04em",color:"var(--g900)",lineHeight:1.1}}>
            Everything you need to level up
          </h2>
        </Section>
        <motion.div
          variants={stagger(0.09)} initial="hidden" whileInView="visible" viewport={{once:true,margin:"-40px"}}
          style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
          {features.map((f)=>(
            <motion.div key={f.t} variants={scaleIn}>
              <TiltCard>
                <div style={{padding:"26px 24px"}}>
                  <motion.div
                    whileHover={{rotate:[0,8,-4,0],scale:1.08}}
                    transition={{duration:0.4}}
                    style={{width:42,height:42,borderRadius:13,background:"var(--g100)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:18}}>
                    <Ic n={f.icon} s={18} c="var(--g700)"/>
                  </motion.div>
                  <h3 style={{fontSize:15.5,fontWeight:650,color:"var(--g900)",marginBottom:9,letterSpacing:"-0.025em"}}>{f.t}</h3>
                  <p style={{fontSize:13.5,color:"var(--g500)",lineHeight:1.7}}>{f.d}</p>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section style={{maxWidth:1100,margin:"0 auto",padding:"80px 24px 100px"}}>
        <Section style={{textAlign:"center",marginBottom:64}}>
          <div style={{fontSize:11,color:"var(--g400)",fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:14}}>Process</div>
          <h2 style={{fontSize:"clamp(28px,4vw,44px)",fontWeight:700,letterSpacing:"-0.04em",color:"var(--g900)"}}>From zero to hired in 4 steps</h2>
        </Section>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:0,position:"relative"}}>
          {/* Connector line */}
          <div style={{position:"absolute",top:24,left:"12%",right:"12%",height:1,background:"linear-gradient(90deg,transparent,var(--g200),transparent)",pointerEvents:"none"}}/>
          {steps.map((s,i)=>(
            <Section key={s.n} delay={i*0.12} style={{padding:"0 20px 0",textAlign:"center"}}>
              <motion.div
                whileHover={{scale:1.06}} transition={{type:"spring",stiffness:400,damping:25}}
                style={{width:48,height:48,borderRadius:"50%",background:"var(--white)",
                  border:"1.5px solid var(--g200)",display:"flex",alignItems:"center",justifyContent:"center",
                  margin:"0 auto 20px",boxShadow:"var(--sh-sm)",position:"relative",zIndex:1}}>
                <span className="font-mono" style={{fontSize:12,fontWeight:600,color:"var(--g600)"}}>{s.n}</span>
              </motion.div>
              <h3 style={{fontSize:16,fontWeight:650,color:"var(--g900)",marginBottom:10,letterSpacing:"-0.025em"}}>{s.t}</h3>
              <p style={{fontSize:13.5,color:"var(--g500)",lineHeight:1.65}}>{s.d}</p>
            </Section>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{maxWidth:1100,margin:"0 auto",padding:"60px 24px 100px"}}>
        <Section style={{textAlign:"center",marginBottom:56}}>
          <h2 style={{fontSize:"clamp(28px,4vw,44px)",fontWeight:700,letterSpacing:"-0.04em",color:"var(--g900)"}}>Trusted by ambitious professionals</h2>
        </Section>
        <motion.div variants={stagger(0.1)} initial="hidden" whileInView="visible" viewport={{once:true}}
          style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:18}}>
          {testimonials.map(t=>(
            <motion.div key={t.name} variants={fadeUp}>
              <TiltCard intensity={8}>
                <div style={{padding:"24px 22px"}}>
                  <div style={{display:"flex",gap:3,marginBottom:16}}>
                    {[...Array(5)].map((_,j)=><Ic key={j} n="star" s={12} c="var(--g400)"/>)}
                  </div>
                  <p style={{fontSize:14,color:"var(--g600)",lineHeight:1.72,marginBottom:20}}>"{t.text}"</p>
                  <div style={{display:"flex",alignItems:"center",gap:11}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:"var(--g900)",color:"var(--white)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700}}>{t.av}</div>
                    <div>
                      <div style={{fontSize:13.5,fontWeight:650,color:"var(--g900)"}}>{t.name}</div>
                      <div style={{fontSize:12,color:"var(--g400)"}}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section style={{maxWidth:1100,margin:"0 auto 100px",padding:"0 24px"}}>
        <Section>
          <motion.div
            style={{background:"var(--g900)",borderRadius:"var(--r-xl)",padding:"64px 64px",textAlign:"center",position:"relative",overflow:"hidden"}}
            whileHover={{scale:1.005}} transition={{type:"spring",stiffness:200,damping:30}}>
            {/* Inner glow */}
            <div style={{position:"absolute",top:"-30%",left:"50%",transform:"translateX(-50%)",
              width:500,height:300,borderRadius:"50%",
              background:"radial-gradient(ellipse, rgba(255,255,255,0.06), transparent 70%)",pointerEvents:"none"}}/>
            <motion.div
              initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}
              style={{position:"relative",zIndex:1}}>
              <h2 className="font-serif" style={{fontSize:"clamp(24px,3.5vw,40px)",fontWeight:400,fontStyle:"italic",color:"var(--white)",letterSpacing:"-0.02em",marginBottom:14}}>
                Start your career transformation today
              </h2>
              <p style={{fontSize:16,color:"rgba(255,255,255,0.45)",marginBottom:32}}>Join thousands of professionals accelerating their careers with AI.</p>
              <Btn v="secondary" onClick={onEnter} style={{padding:"13px 32px",fontSize:15}}>Get started free — no credit card</Btn>
            </motion.div>
          </motion.div>
        </Section>
      </section>

      {/* Footer */}
      <footer style={{borderTop:"1px solid var(--g150)",padding:"32px 48px",maxWidth:1100,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:24,height:24,borderRadius:7,background:"var(--g900)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Ic n="logo" s={12} c="white"/>
            </div>
            <span style={{fontWeight:700,fontSize:13,color:"var(--g900)",letterSpacing:"-0.03em"}}>SkillBridge AI</span>
          </div>
          <div style={{fontSize:12,color:"var(--g400)"}}>© 2025 SkillBridge AI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════════
const Sidebar = ({ active, setActive }) => {
  const nav = [
    {id:"dashboard",icon:"dashboard",label:"Overview"},
    {id:"resume",   icon:"resume",   label:"Resume"},
    {id:"matcher",  icon:"match",    label:"JD Matcher"},
    {id:"roadmap",  icon:"roadmap",  label:"Roadmap"},
    {id:"quiz",     icon:"quiz",     label:"Quiz"},
    {id:"interview",icon:"interview",label:"Interview"},
    {id:"jobs",     icon:"jobs",     label:"Jobs"},
  ];
  return (
    <motion.aside initial={{x:-220,opacity:0}} animate={{x:0,opacity:1}} transition={{duration:0.6,ease:[0.4,0,0.2,1]}}
      style={{width:220,flexShrink:0,background:"var(--white)",borderRight:"1px solid var(--g150)",display:"flex",flexDirection:"column",padding:"24px 0",height:"100vh",position:"sticky",top:0}}>
      <div style={{padding:"0 20px 22px",borderBottom:"1px solid var(--g100)"}}>
        <motion.div style={{display:"flex",alignItems:"center",gap:9}} whileHover={{scale:1.02}} transition={{type:"spring",stiffness:400}}>
          <div style={{width:30,height:30,borderRadius:9,background:"var(--g900)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Ic n="logo" s={14} c="white"/>
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:13.5,color:"var(--g900)",letterSpacing:"-0.03em"}}>SkillBridge</div>
            <div style={{fontSize:10,color:"var(--g400)",fontWeight:500}}>AI Career OS</div>
          </div>
        </motion.div>
      </div>

      <nav style={{flex:1,padding:"14px 12px",display:"flex",flexDirection:"column",gap:2}}>
        {nav.map((item,i)=>{
          const isActive = active===item.id;
          return (
            <motion.button key={item.id} onClick={()=>setActive(item.id)}
              initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}}
              transition={{duration:0.4,delay:i*0.04,ease:[0.4,0,0.2,1]}}
              whileHover={{x:2}} whileTap={{scale:0.97}}
              style={{
                display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,
                border:"none",cursor:"pointer",width:"100%",textAlign:"left",fontFamily:"inherit",
                background:isActive?"var(--g100)":"transparent",
                color:isActive?"var(--g900)":"var(--g500)",
                fontSize:13.5,fontWeight:isActive?600:500,
                position:"relative", outline:"none",
              }}>
              {isActive && (
                <motion.div layoutId="activeNav"
                  style={{position:"absolute",inset:0,background:"var(--g100)",borderRadius:10,zIndex:-1}}
                  transition={{type:"spring",stiffness:400,damping:32}}/>
              )}
              <Ic n={item.icon} s={16} c={isActive?"var(--g900)":"var(--g400)"}/>
              {item.label}
            </motion.button>
          );
        })}
      </nav>

      <div style={{padding:"16px 20px",borderTop:"1px solid var(--g100)"}}>
        <motion.div style={{display:"flex",alignItems:"center",gap:10}} whileHover={{x:2}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:"var(--g900)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"var(--white)"}}>A</div>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:"var(--g800)"}}>Aryan Sharma</div>
            <div style={{fontSize:11,color:"var(--g400)"}}>Pro plan</div>
          </div>
        </motion.div>
      </div>
    </motion.aside>
  );
};

// ─── Topbar ───────────────────────────────────────────────────────────────────
const Topbar = ({ title }) => (
  <motion.header initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{duration:0.5}}
    style={{height:60,borderBottom:"1px solid var(--g150)",display:"flex",alignItems:"center",
      justifyContent:"space-between",padding:"0 28px",background:"rgba(255,255,255,0.92)",
      backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:10}}>
    <motion.h1 key={title} initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}}
      style={{fontSize:16,fontWeight:650,color:"var(--g900)",letterSpacing:"-0.025em"}}>{title}</motion.h1>
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      <motion.div whileFocus={{boxShadow:"0 0 0 3px rgba(20,20,20,0.1)"}}
        style={{display:"flex",alignItems:"center",gap:8,background:"var(--g50)",
          border:"1px solid var(--g200)",borderRadius:99,padding:"8px 14px",width:210}}>
        <Ic n="search" s={14} c="var(--g400)"/>
        <input placeholder="Search anything…" style={{border:"none",background:"transparent",fontSize:13,color:"var(--g600)",outline:"none",width:"100%",fontFamily:"inherit"}}/>
      </motion.div>
      <motion.div whileHover={{scale:1.07}} whileTap={{scale:0.95}}
        style={{width:36,height:36,borderRadius:"50%",background:"var(--g50)",border:"1px solid var(--g200)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative"}}>
        <Ic n="bell" s={15} c="var(--g500)"/>
        <motion.div animate={{scale:[1,1.3,1]}} transition={{duration:2,repeat:Infinity,repeatDelay:4}}
          style={{position:"absolute",top:8,right:8,width:7,height:7,borderRadius:"50%",background:"var(--g700)",border:"1.5px solid var(--white)"}}/>
      </motion.div>
      <motion.div whileHover={{scale:1.07}} whileTap={{scale:0.95}}
        style={{width:32,height:32,borderRadius:"50%",background:"var(--g900)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"var(--white)",cursor:"pointer"}}>A</motion.div>
    </div>
  </motion.header>
);

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════
const DashboardOverview = () => {
  const [loaded, setLoaded] = useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setLoaded(true),600); return()=>clearTimeout(t); },[]);

  const stats = [
    {l:"ATS Score",v:"82",u:"/100",icon:"award",    trend:"+6 this week"},
    {l:"JD Match", v:"74",u:"%",   icon:"target",   trend:"+12 vs last JD"},
    {l:"Quiz Streak",v:"7",u:"days",icon:"zap",     trend:"Personal best!"},
    {l:"Jobs Applied",v:"4",u:"/ 12",icon:"jobs",   trend:"2 in review"},
  ];

  const tasks = [
    {t:"Complete React module quiz",done:true},
    {t:"Update resume summary",    done:true},
    {t:"Practice system design",   done:false},
    {t:"Apply to 2 new jobs",       done:false},
  ];

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{padding:28,display:"flex",flexDirection:"column",gap:22}}>
      <Section>
        <h2 style={{fontSize:22,fontWeight:700,color:"var(--g900)",letterSpacing:"-0.04em",marginBottom:4}}>Good morning, Aryan ✦</h2>
        <p style={{fontSize:13.5,color:"var(--g500)"}}>Here's your career progress at a glance.</p>
      </Section>

      {/* Stat cards */}
      <motion.div variants={stagger(0.08)} initial="hidden" animate="visible"
        style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        {stats.map(s=>(
          <motion.div key={s.l} variants={scaleIn}>
            {loaded ? (
              <TiltCard intensity={10}>
                <div style={{padding:"20px 22px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                    <div style={{width:34,height:34,borderRadius:10,background:"var(--g100)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <Ic n={s.icon} s={16} c="var(--g600)"/>
                    </div>
                    <Badge>{s.trend}</Badge>
                  </div>
                  <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
                    style={{fontSize:28,fontWeight:700,color:"var(--g900)",letterSpacing:"-0.04em",lineHeight:1}}>
                    {s.v}<span style={{fontSize:13,color:"var(--g400)",fontWeight:500,marginLeft:3}}>{s.u}</span>
                  </motion.div>
                  <div style={{fontSize:12,color:"var(--g400)",marginTop:6,fontWeight:500}}>{s.l}</div>
                </div>
              </TiltCard>
            ) : (
              <Card hover={false} style={{padding:"20px 22px"}}>
                <Skel w={34} h={34} r={10} style={{marginBottom:14}}/>
                <Skel w="60%" h={28} style={{marginBottom:8}}/>
                <Skel w="40%" h={12}/>
              </Card>
            )}
          </motion.div>
        ))}
      </motion.div>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:18}}>
        <Section>
          <Card>
            <div style={{fontSize:13.5,fontWeight:650,color:"var(--g900)",marginBottom:20,letterSpacing:"-0.02em",display:"flex",alignItems:"center",gap:8}}>
              <Ic n="trending" s={15} c="var(--g500)"/> Weekly Progress
            </div>
            {loaded ? (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <ProgBar value={82} label="Resume strength" sub="82%" delay={0}/>
                <ProgBar value={74} label="JD match rate"   sub="74%" delay={0.1}/>
                <ProgBar value={65} label="Roadmap completion" sub="Week 3/8" delay={0.2}/>
                <ProgBar value={91} label="Quiz accuracy"   sub="91%" delay={0.3}/>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                {[...Array(4)].map((_,i)=><Skel key={i} h={24}/>)}
              </div>
            )}
          </Card>
        </Section>

        <Section delay={0.1}>
          <Card style={{height:"100%"}}>
            <div style={{fontSize:13.5,fontWeight:650,color:"var(--g900)",marginBottom:18,letterSpacing:"-0.02em"}}>Today's Tasks</div>
            {tasks.map((task,i)=>(
              <motion.div key={i}
                initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:0.1+i*0.07}}
                style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:i<tasks.length-1?"1px solid var(--g100)":"none"}}>
                <motion.div
                  whileTap={{scale:0.85}} whileHover={{scale:1.1}}
                  style={{width:18,height:18,borderRadius:5,border:`1.5px solid ${task.done?"var(--g700)":"var(--g250)"}`,
                    background:task.done?"var(--g900)":"transparent",
                    display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer"}}>
                  {task.done && (
                    <motion.div initial={{scale:0,rotate:-30}} animate={{scale:1,rotate:0}}
                      transition={{type:"spring",stiffness:600,damping:20}}>
                      <Ic n="check" s={10} c="white"/>
                    </motion.div>
                  )}
                </motion.div>
                <span style={{fontSize:13,color:task.done?"var(--g400)":"var(--g700)",textDecoration:task.done?"line-through":"none",fontWeight:500}}>
                  {task.t}
                </span>
              </motion.div>
            ))}
          </Card>
        </Section>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// RESUME ANALYZER
// ═══════════════════════════════════════════════════════════════════════════════
const ResumeAnalyzer = () => {
  const [uploaded, setUploaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const doUpload = () => {
    setAnalyzing(true);
    setTimeout(()=>{ setAnalyzing(false); setUploaded(true); },1800);
  };

  const issues = [
    {type:"error",  text:"Missing quantified achievements in Experience section"},
    {type:"warning",text:"Skills section lacks industry keywords for target role"},
    {type:"info",   text:"Summary could be more specifically targeted to this role"},
  ];
  const suggestions = [
    "Add metrics to project descriptions (e.g., 'reduced load time by 40%')",
    "Include tools: Docker, Kubernetes, CI/CD pipelines, Terraform",
    "Rewrite summary specifically targeting Senior Software Engineer roles",
  ];

  return (
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} style={{padding:28,display:"flex",flexDirection:"column",gap:22}}>
      <Section>
        <h2 style={{fontSize:20,fontWeight:700,color:"var(--g900)",letterSpacing:"-0.04em",marginBottom:4}}>Resume Analyzer</h2>
        <p style={{fontSize:13.5,color:"var(--g500)"}}>Upload your resume for AI-powered ATS analysis.</p>
      </Section>

      <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:18,alignItems:"start"}}>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <AnimatePresence mode="wait">
            {!uploaded && !analyzing && (
              <motion.div key="upload" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,scale:0.97}}
                onDragOver={e=>{e.preventDefault();setDragging(true)}}
                onDragLeave={()=>setDragging(false)}
                onDrop={e=>{e.preventDefault();setDragging(false);doUpload()}}
                onClick={doUpload}
                style={{
                  border:`2px dashed ${dragging?"var(--g600)":"var(--g200)"}`,
                  borderRadius:"var(--r-lg)",padding:"52px 32px",textAlign:"center",cursor:"pointer",
                  background:dragging?"var(--g50)":"transparent",transition:"all 0.2s ease",
                }}>
                <motion.div animate={dragging?{scale:1.12,y:-4}:{scale:1,y:0}} transition={{type:"spring",stiffness:400}}
                  style={{width:52,height:52,borderRadius:16,background:"var(--g100)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
                  <Ic n="upload" s={22} c="var(--g500)"/>
                </motion.div>
                <div style={{fontSize:15,fontWeight:600,color:"var(--g800)",marginBottom:6}}>Drop your resume here</div>
                <div style={{fontSize:13,color:"var(--g400)"}}>PDF, DOCX supported · Max 5 MB</div>
                <Btn v="secondary" style={{marginTop:20,padding:"8px 20px",fontSize:13}}>Browse files</Btn>
              </motion.div>
            )}

            {analyzing && (
              <motion.div key="loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                style={{border:"1.5px solid var(--g200)",borderRadius:"var(--r-lg)",padding:"48px 32px",textAlign:"center"}}>
                <div style={{display:"flex",flexDirection:"column",gap:14,alignItems:"center"}}>
                  <motion.div animate={{rotate:360}} transition={{duration:1.5,repeat:Infinity,ease:"linear"}}
                    style={{width:40,height:40,borderRadius:"50%",border:"3px solid var(--g100)",borderTopColor:"var(--g700)"}}/>
                  <div style={{fontSize:14,fontWeight:500,color:"var(--g600)"}}>Analyzing your resume…</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8,width:"100%",maxWidth:280}}>
                    {["Parsing document structure","Running ATS checks","Scoring keyword density"].map((s,i)=>(
                      <motion.div key={s} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.3}}
                        style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"var(--g500)"}}>
                        <motion.div animate={{opacity:[0.4,1,0.4]}} transition={{duration:1.2,delay:i*0.3,repeat:Infinity}}
                          style={{width:6,height:6,borderRadius:"50%",background:"var(--g400)",flexShrink:0}}/>
                        {s}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {uploaded && (
              <motion.div key="results" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} style={{display:"flex",flexDirection:"column",gap:14}}>
                <Card style={{padding:"14px 18px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:40,height:40,borderRadius:11,background:"var(--g100)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <Ic n="resume" s={18} c="var(--g600)"/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:"var(--g900)"}}>Aryan_Sharma_Resume_2025.pdf</div>
                      <div style={{fontSize:12,color:"var(--g400)"}}>Uploaded · 245 KB</div>
                    </div>
                    <Badge v="success">Analyzed</Badge>
                    <motion.button whileTap={{scale:0.88}} onClick={()=>setUploaded(false)}
                      style={{background:"none",border:"none",cursor:"pointer",padding:4}}>
                      <Ic n="x" s={16} c="var(--g400)"/>
                    </motion.button>
                  </div>
                </Card>

                <Card>
                  <div style={{fontSize:13.5,fontWeight:650,color:"var(--g900)",marginBottom:14}}>Issues Found</div>
                  <motion.div variants={stagger(0.07)} initial="hidden" animate="visible"
                    style={{display:"flex",flexDirection:"column",gap:9}}>
                    {issues.map((issue,i)=>(
                      <motion.div key={i} variants={slideL}
                        style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 14px",borderRadius:10,
                          background:issue.type==="error"?"#fef2f2":issue.type==="warning"?"#fffbeb":"var(--g50)",
                          border:`1px solid ${issue.type==="error"?"#fecaca":issue.type==="warning"?"#fde68a":"var(--g150)"}`,
                        }}>
                        <div style={{width:6,height:6,borderRadius:"50%",marginTop:5,flexShrink:0,
                          background:issue.type==="error"?"#ef4444":issue.type==="warning"?"#f59e0b":"var(--g400)"}}/>
                        <span style={{fontSize:13,color:"var(--g700)",lineHeight:1.5}}>{issue.text}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </Card>

                <Card>
                  <div style={{fontSize:13.5,fontWeight:650,color:"var(--g900)",marginBottom:14}}>AI Suggestions</div>
                  <motion.div variants={stagger(0.08)} initial="hidden" animate="visible">
                    {suggestions.map((s,i)=>(
                      <motion.div key={i} variants={fadeUp}
                        style={{display:"flex",gap:10,padding:"9px 0",borderBottom:i<suggestions.length-1?"1px solid var(--g100)":"none"}}>
                        <Ic n="sparkle" s={14} c="var(--g400)"/>
                        <span style={{fontSize:13,color:"var(--g600)",lineHeight:1.65}}>{s}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Score panel */}
        <Section delay={0.1}>
          <Card style={{padding:"26px 22px",textAlign:"center"}}>
            <div style={{fontSize:11,color:"var(--g400)",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:18}}>ATS Score</div>
            <CircProg value={uploaded?82:0} size={140} label="Score"/>
            <motion.div initial={{opacity:0}} animate={uploaded?{opacity:1}:{opacity:0}} transition={{delay:0.5}}
              style={{marginTop:22,display:"flex",flexDirection:"column",gap:12}}>
              {[{l:"Formatting",v:90},{l:"Keywords",v:68},{l:"Impact",v:74}].map((item,i)=>(
                <ProgBar key={item.l} value={uploaded?item.v:0} label={item.l} sub={`${item.v}%`} delay={i*0.15}/>
              ))}
            </motion.div>
            {uploaded && (
              <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.8}}>
                <Btn v="primary" style={{marginTop:18,width:"100%",justifyContent:"center",padding:"10px"}}>Download report</Btn>
              </motion.div>
            )}
          </Card>
        </Section>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// JD MATCHER
// ═══════════════════════════════════════════════════════════════════════════════
const JDMatcher = () => {
  const [jd, setJD] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const analyze = () => { setAnalyzing(true); setTimeout(()=>{setAnalyzing(false);setAnalyzed(true);},1400); };
  const missing = ["Docker","Kubernetes","GraphQL","Redis","gRPC","Terraform"];
  const focus = ["System Design","Distributed Systems","Cloud Architecture"];

  return (
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} style={{padding:28,display:"flex",flexDirection:"column",gap:22}}>
      <Section>
        <h2 style={{fontSize:20,fontWeight:700,color:"var(--g900)",letterSpacing:"-0.04em",marginBottom:4}}>JD Matcher</h2>
        <p style={{fontSize:13.5,color:"var(--g500)"}}>Paste a job description to see your match score and skill gaps.</p>
      </Section>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card style={{padding:20}}>
            <div style={{fontSize:13,fontWeight:600,color:"var(--g700)",marginBottom:10}}>Paste Job Description</div>
            <motion.textarea value={jd} onChange={e=>setJD(e.target.value)}
              placeholder="Paste the full job description here…"
              whileFocus={{boxShadow:"0 0 0 3px rgba(20,20,20,0.1)"}}
              style={{width:"100%",height:200,border:"1px solid var(--g200)",borderRadius:10,
                padding:"12px 14px",fontSize:13,color:"var(--g700)",background:"var(--g50)",
                outline:"none",resize:"none",fontFamily:"inherit",lineHeight:1.65,transition:"box-shadow 0.2s"}}/>
            <Btn v="primary" onClick={analyze} style={{marginTop:12,width:"100%",justifyContent:"center"}}
              icon={analyzing?<motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:"linear"}}><Ic n="sparkle" s={14} c="white"/></motion.div>:<Ic n="search" s={14} c="white"/>}>
              {analyzing?"Analyzing…":"Analyze match"}
            </Btn>
          </Card>

          <AnimatePresence>
            {analyzed && (
              <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
                <Card style={{padding:20}}>
                  <div style={{fontSize:13,fontWeight:650,color:"var(--g900)",marginBottom:14}}>Focus Areas</div>
                  <motion.div variants={stagger(0.1)} initial="hidden" animate="visible" style={{display:"flex",flexDirection:"column",gap:8}}>
                    {focus.map((a,i)=>(
                      <motion.div key={a} variants={slideL}
                        style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
                          borderRadius:10,background:"var(--g900)",color:"var(--white)",fontSize:13,fontWeight:500}}>
                        <Ic n="target" s={14} c="rgba(255,255,255,0.6)"/>{a}
                      </motion.div>
                    ))}
                  </motion.div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {analyzed ? (
            <motion.div key="results" initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
              style={{display:"flex",flexDirection:"column",gap:14}}>
              <Card style={{padding:"24px 22px",textAlign:"center"}}>
                <div style={{fontSize:11,fontWeight:600,color:"var(--g400)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:16}}>Overall Match</div>
                <CircProg value={74} size={130} label="Match"/>
                <p style={{marginTop:16,fontSize:13,color:"var(--g500)",lineHeight:1.65}}>
                  You match <strong style={{color:"var(--g900)"}}>74%</strong> of this role's requirements. Upskilling in 3 areas could bring you to <strong style={{color:"var(--g900)"}}>90%+</strong>.
                </p>
              </Card>
              <Card style={{padding:20}}>
                <div style={{fontSize:13,fontWeight:650,color:"var(--g900)",marginBottom:14}}>Missing Skills</div>
                <motion.div variants={stagger(0.05)} initial="hidden" animate="visible"
                  style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:18}}>
                  {missing.map(skill=>(
                    <motion.span key={skill} variants={scaleIn}
                      style={{padding:"5px 12px",borderRadius:99,background:"var(--g100)",fontSize:12,color:"var(--g600)",fontWeight:500,border:"1px solid var(--g200)"}}>
                      {skill}
                    </motion.span>
                  ))}
                </motion.div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <ProgBar value={92} label="Technical skills" sub="92%" delay={0}/>
                  <ProgBar value={68} label="DevOps & infra" sub="68%" delay={0.1}/>
                  <ProgBar value={80} label="Soft skills" sub="80%" delay={0.2}/>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <Card style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14,padding:40,minHeight:300}} hover={false}>
                <motion.div animate={{opacity:[0.4,0.8,0.4]}} transition={{duration:2.5,repeat:Infinity}}
                  style={{width:56,height:56,borderRadius:16,background:"var(--g100)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Ic n="match" s={24} c="var(--g400)"/>
                </motion.div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:14,fontWeight:600,color:"var(--g700)",marginBottom:6}}>Awaiting analysis</div>
                  <div style={{fontSize:13,color:"var(--g400)"}}>Paste a JD and click Analyze</div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROADMAP
// ═══════════════════════════════════════════════════════════════════════════════
const Roadmap = () => {
  const weeks = [
    {n:1,t:"Foundations",   topics:["Data Structures","Algorithms","Big-O"],         tasks:["LeetCode Easy ×10","DSA notes"],             done:true},
    {n:2,t:"Core CS",       topics:["OS Concepts","Networking","DB Basics"],          tasks:["Mock quiz ×3","OS flashcards"],               done:true},
    {n:3,t:"System Design", topics:["Scalability","Load Balancing","Caching"],        tasks:["Design Twitter","Design URL shortener"],      done:false,current:true},
    {n:4,t:"Advanced",      topics:["Distributed Systems","Consensus Algorithms"],    tasks:["Raft deep-dive","Kafka exercise"],             done:false},
    {n:5,t:"Behavioural",   topics:["STAR Method","Storytelling"],                    tasks:["10 mock answers","Record practice"],           done:false},
    {n:6,t:"Mock Rounds",   topics:["Full simulations","Feedback loop"],              tasks:["2 full mock interviews"],                      done:false},
  ];
  return (
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} style={{padding:28}}>
      <Section style={{marginBottom:24}}>
        <h2 style={{fontSize:20,fontWeight:700,color:"var(--g900)",letterSpacing:"-0.04em",marginBottom:4}}>8-Week Roadmap</h2>
        <p style={{fontSize:13.5,color:"var(--g500)"}}>Your personalised journey to becoming interview-ready.</p>
      </Section>
      <motion.div variants={stagger(0.07)} initial="hidden" animate="visible"
        style={{display:"flex",gap:14,overflowX:"auto",paddingBottom:20}}>
        {weeks.map(week=>(
          <motion.div key={week.n} variants={scaleIn}
            whileHover={week.current?{}:{y:-4,boxShadow:"var(--sh-lg)"}}
            style={{flexShrink:0,width:220,
              background:week.current?"var(--g900)":"var(--white)",
              border:`1px solid ${week.current?"transparent":"var(--g150)"}`,
              borderRadius:"var(--r-lg)",padding:"20px 18px",
              boxShadow:week.current?"var(--sh-xl)":"var(--sh-sm)",
              opacity:week.done?0.55:1,
              transition:"box-shadow 0.2s",cursor:"pointer",
            }}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <span className="font-mono" style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",color:week.current?"rgba(255,255,255,0.4)":"var(--g300)"}}>
                WEEK {week.n}
              </span>
              {week.done && <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",stiffness:600}}
                style={{width:18,height:18,borderRadius:"50%",background:"var(--g200)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Ic n="check" s={10} c="var(--g600)"/>
              </motion.div>}
              {week.current && <Badge v="dark">Now</Badge>}
            </div>
            <div style={{fontSize:15,fontWeight:650,color:week.current?"var(--white)":"var(--g900)",marginBottom:12,letterSpacing:"-0.02em"}}>{week.t}</div>
            <div style={{marginBottom:14}}>
              {week.topics.map(t=>(
                <div key={t} style={{fontSize:12,color:week.current?"rgba(255,255,255,0.6)":"var(--g500)",padding:"2px 0"}}>· {t}</div>
              ))}
            </div>
            <div style={{borderTop:`1px solid ${week.current?"rgba(255,255,255,0.12)":"var(--g100)"}`,paddingTop:12}}>
              {week.tasks.map((task,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:7,padding:"4px 0"}}>
                  <div style={{width:14,height:14,borderRadius:4,flexShrink:0,
                    border:`1.5px solid ${week.current?"rgba(255,255,255,0.35)":"var(--g300)"}`,
                    background:week.done?"var(--g400)":"transparent",
                    display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {week.done && <Ic n="check" s={8} c="white"/>}
                  </div>
                  <span style={{fontSize:12,color:week.current?"rgba(255,255,255,0.65)":"var(--g600)"}}>{task}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════
const Quiz = () => {
  const [selected, setSelected] = useState(null);
  const [showExpl, setShowExpl] = useState(false);
  const correct = 1;
  const q = {
    q:"What is the time complexity of binary search in a sorted array?",
    options:["O(n)","O(log n)","O(n log n)","O(1)"],
    expl:"Binary search repeatedly halves the search space, resulting in O(log n) time. Each comparison eliminates half the remaining elements.",
  };

  return (
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} style={{padding:28}}>
      <Section style={{marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <h2 style={{fontSize:20,fontWeight:700,color:"var(--g900)",letterSpacing:"-0.04em"}}>Adaptive Quiz</h2>
          <Badge>Question 7 / 20</Badge>
        </div>
        <div style={{height:4,background:"var(--g100)",borderRadius:99,overflow:"hidden"}}>
          <motion.div initial={{width:0}} animate={{width:"35%"}} transition={{duration:0.8,delay:0.3}}
            style={{height:"100%",borderRadius:99,background:"var(--g700)"}}/>
        </div>
      </Section>

      <div style={{maxWidth:600}}>
        <Section delay={0.05}>
          <Card style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:600,color:"var(--g400)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14}}>
              Data Structures & Algorithms
            </div>
            <p style={{fontSize:16,fontWeight:550,color:"var(--g900)",lineHeight:1.65,letterSpacing:"-0.02em"}}>{q.q}</p>
          </Card>
        </Section>

        <motion.div variants={stagger(0.06)} initial="hidden" animate="visible" style={{display:"flex",flexDirection:"column",gap:9,marginBottom:16}}>
          {q.options.map((opt,i)=>{
            const isSel = selected===i, isCorr = i===correct, showR = selected!==null;
            let bg="var(--white)", border="var(--g200)", col="var(--g700)";
            if(showR&&isCorr){bg="#f0fdf4";border="#86efac";col="#166534";}
            else if(showR&&isSel&&!isCorr){bg="#fef2f2";border="#fca5a5";col="#991b1b";}
            else if(isSel){bg="var(--g900)";border="var(--g900)";col="var(--white)";}
            return (
              <motion.button key={i} variants={slideL}
                onClick={()=>setSelected(i)}
                whileHover={selected===null?{x:4,boxShadow:"var(--sh-md)"}:{}}
                whileTap={{scale:0.98}}
                style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderRadius:12,
                  border:`1.5px solid ${border}`,background:bg,color:col,
                  cursor:"pointer",textAlign:"left",fontFamily:"inherit",fontSize:14,fontWeight:500,transition:"background 0.2s, border 0.2s, color 0.2s"}}>
                <span style={{width:26,height:26,borderRadius:7,background:"rgba(0,0,0,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>
                  {["A","B","C","D"][i]}
                </span>
                {opt}
                {showR && isCorr && <motion.span initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",stiffness:600}} style={{marginLeft:"auto"}}><Ic n="check" s={14} c="#166534"/></motion.span>}
              </motion.button>
            );
          })}
        </motion.div>

        <AnimatePresence>
          {selected!==null && (
            <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
              <Card style={{background:"var(--g50)"}}>
                <motion.button onClick={()=>setShowExpl(!showExpl)} whileTap={{scale:0.97}}
                  style={{display:"flex",alignItems:"center",gap:8,background:"none",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,color:"var(--g700)",fontFamily:"inherit",width:"100%",justifyContent:"space-between"}}>
                  <span style={{display:"flex",alignItems:"center",gap:8}}><Ic n="sparkle" s={14} c="var(--g500)"/>Explanation</span>
                  <motion.span animate={{rotate:showExpl?90:0}} transition={{duration:0.2}}>
                    <Ic n="chevron" s={14} c="var(--g400)"/>
                  </motion.span>
                </motion.button>
                <AnimatePresence>
                  {showExpl && (
                    <motion.p initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
                      transition={{duration:0.3}} style={{fontSize:13,color:"var(--g600)",marginTop:10,lineHeight:1.7,overflow:"hidden"}}>
                      {q.expl}
                    </motion.p>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{display:"flex",gap:10,marginTop:18}}>
          <Btn v="secondary" style={{flex:1,justifyContent:"center"}}>Previous</Btn>
          <Btn v="primary" style={{flex:2,justifyContent:"center"}}>Next question</Btn>
        </div>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK INTERVIEW
// ═══════════════════════════════════════════════════════════════════════════════
const MockInterview = () => {
  const [messages, setMessages] = useState([
    {role:"ai",text:"Welcome to your mock interview! I'll be playing the role of a senior engineer at a top tech company. Let's begin: Tell me about yourself and why you're interested in this Software Engineer role."},
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const chatRef = useRef(null);

  const aiReplies = [
    "Great answer! You clearly articulated your background. Let me follow up: Can you describe a challenging technical problem you faced and how you solved it?",
    "Excellent! You've shown strong problem-solving skills. Now, how would you design a URL shortening service like bit.ly at scale?",
    "Very thoughtful. One more: How do you approach debugging a system that's intermittently failing in production?",
  ];
  const [replyIdx, setReplyIdx] = useState(0);

  const send = () => {
    if(!input.trim()) return;
    const userMsg = { role:"user", text:input };
    setMessages(p=>[...p, userMsg]);
    setInput(""); setTyping(true);
    setTimeout(()=>{
      setTyping(false);
      setMessages(p=>[...p, { role:"ai", text:aiReplies[replyIdx%aiReplies.length] }]);
      setReplyIdx(i=>i+1);
    }, 1600);
    setTimeout(()=>chatRef.current?.scrollTo({top:99999,behavior:"smooth"}),100);
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{padding:28,height:"calc(100vh - 60px)",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexShrink:0}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:"var(--g900)",letterSpacing:"-0.04em",marginBottom:4}}>Mock Interview</h2>
          <p style={{fontSize:13.5,color:"var(--g500)"}}>AI-powered simulation with scored feedback.</p>
        </div>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <div style={{textAlign:"right"}}>
            <motion.div initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} transition={{delay:0.3,type:"spring",stiffness:400}}
              style={{fontSize:22,fontWeight:700,color:"var(--g900)",letterSpacing:"-0.04em"}}>84</motion.div>
            <div style={{fontSize:11,color:"var(--g400)",fontWeight:500}}>Score</div>
          </div>
          <div style={{width:1,height:28,background:"var(--g150)"}}/>
          <Btn v="outline" style={{padding:"8px 16px",fontSize:13}} icon={<Ic n="mic" s={14}/>}>Voice mode</Btn>
        </div>
      </div>

      <div ref={chatRef} style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:16,padding:"4px 0 20px"}}>
        <AnimatePresence initial={false}>
          {messages.map((msg,i)=>(
            <motion.div key={i}
              initial={{opacity:0,y:12,scale:0.96}} animate={{opacity:1,y:0,scale:1}}
              transition={{type:"spring",stiffness:400,damping:32}}
              style={{display:"flex",gap:12,flexDirection:msg.role==="user"?"row-reverse":"row",
                maxWidth:640,alignSelf:msg.role==="user"?"flex-end":"flex-start"}}>
              {msg.role==="ai" && (
                <motion.div whileHover={{scale:1.08}}
                  style={{width:32,height:32,borderRadius:"50%",background:"var(--g900)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Ic n="brain" s={14} c="white"/>
                </motion.div>
              )}
              <div style={{padding:"13px 16px",
                borderRadius:msg.role==="ai"?"4px 16px 16px 16px":"16px 4px 16px 16px",
                background:msg.role==="ai"?"var(--white)":"var(--g900)",
                color:msg.role==="ai"?"var(--g800)":"var(--white)",
                border:msg.role==="ai"?"1px solid var(--g150)":"none",
                boxShadow:"var(--sh-sm)",fontSize:13.5,lineHeight:1.7,maxWidth:500}}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {typing && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            style={{display:"flex",gap:12,alignSelf:"flex-start",maxWidth:200}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:"var(--g900)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Ic n="brain" s={14} c="white"/>
            </div>
            <div style={{padding:"14px 18px",background:"var(--white)",border:"1px solid var(--g150)",borderRadius:"4px 16px 16px 16px",boxShadow:"var(--sh-sm)",display:"flex",gap:5,alignItems:"center"}}>
              {[0,1,2].map(i=>(
                <motion.div key={i} animate={{y:[0,-4,0]}} transition={{duration:0.8,delay:i*0.18,repeat:Infinity}}
                  style={{width:6,height:6,borderRadius:"50%",background:"var(--g400)"}}/>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <div style={{display:"flex",gap:10,padding:"14px 0 0",borderTop:"1px solid var(--g150)",flexShrink:0}}>
        <motion.div whileFocus={{boxShadow:"0 0 0 3px rgba(20,20,20,0.1)"}}
          style={{flex:1,display:"flex",alignItems:"center",gap:10,background:"var(--g50)",
            border:"1px solid var(--g200)",borderRadius:99,padding:"10px 18px",transition:"box-shadow 0.2s"}}>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&send()}
            placeholder="Type your answer…"
            style={{flex:1,border:"none",background:"transparent",fontSize:13.5,color:"var(--g700)",outline:"none",fontFamily:"inherit"}}/>
        </motion.div>
        <Btn v="primary" onClick={send} style={{borderRadius:"50%",width:44,height:44,padding:0}} icon={<Ic n="send" s={16}/>}/>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// JOB FINDER
// ═══════════════════════════════════════════════════════════════════════════════
const JobFinder = () => {
  const jobs = [
    {t:"Senior Software Engineer",c:"Stripe",    l:"Remote",       m:91,type:"Full-time"},
    {t:"Frontend Engineer",       c:"Linear",    l:"San Francisco",m:87,type:"Full-time"},
    {t:"Full-Stack Developer",    c:"Vercel",    l:"Remote",       m:84,type:"Full-time"},
    {t:"Software Engineer II",    c:"Figma",     l:"New York",     m:79,type:"Full-time"},
    {t:"Backend Engineer",        c:"PlanetScale",l:"Remote",      m:76,type:"Full-time"},
    {t:"Software Engineer",       c:"Notion",    l:"San Francisco",m:72,type:"Contract"},
  ];
  const [saved, setSaved] = useState({});

  return (
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} style={{padding:28}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <Section>
          <h2 style={{fontSize:20,fontWeight:700,color:"var(--g900)",letterSpacing:"-0.04em",marginBottom:4}}>Job Finder</h2>
          <p style={{fontSize:13.5,color:"var(--g500)"}}>12 curated roles matched to your profile.</p>
        </Section>
        <motion.div whileFocus={{boxShadow:"0 0 0 3px rgba(20,20,20,0.1)"}}
          style={{display:"flex",alignItems:"center",gap:8,background:"var(--g50)",border:"1px solid var(--g200)",borderRadius:99,padding:"8px 14px"}}>
          <Ic n="search" s={14} c="var(--g400)"/>
          <input placeholder="Filter jobs…" style={{border:"none",background:"transparent",fontSize:13,color:"var(--g600)",outline:"none",fontFamily:"inherit",width:140}}/>
        </motion.div>
      </div>

      <motion.div variants={stagger(0.07)} initial="hidden" animate="visible"
        style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
        {jobs.map((job,i)=>(
          <motion.div key={i} variants={scaleIn}>
            <TiltCard intensity={8}>
              <div style={{padding:"22px 22px"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
                  <motion.div whileHover={{scale:1.08,rotate:3}} transition={{type:"spring",stiffness:400}}
                    style={{width:42,height:42,borderRadius:13,background:"var(--g100)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"var(--g700)"}}>
                    {job.c[0]}
                  </motion.div>
                  <Badge v={job.m>=85?"success":"default"}>{job.m}% match</Badge>
                </div>
                <div style={{fontSize:15,fontWeight:650,color:"var(--g900)",marginBottom:3,letterSpacing:"-0.025em"}}>{job.t}</div>
                <div style={{fontSize:13,color:"var(--g500)",marginBottom:4}}>{job.c}</div>
                <div style={{fontSize:12,color:"var(--g400)",marginBottom:16,display:"flex",gap:8}}>
                  <span>📍 {job.l}</span><span>· {job.type}</span>
                </div>
                <div style={{height:3,background:"var(--g100)",borderRadius:99,marginBottom:14,overflow:"hidden"}}>
                  <motion.div initial={{width:0}} animate={{width:`${job.m}%`}} transition={{duration:0.9,delay:0.2+i*0.06}}
                    style={{height:"100%",borderRadius:99,background:"linear-gradient(90deg,var(--g800),var(--g400))"}}/>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <Btn v="primary" style={{flex:2,justifyContent:"center",padding:"8px",fontSize:13}}>Apply now</Btn>
                  <motion.button whileTap={{scale:0.88}} onClick={()=>setSaved(p=>({...p,[i]:!p[i]}))}
                    style={{flex:1,justifyContent:"center",padding:"8px",fontSize:13,borderRadius:99,
                      border:`1.5px solid ${saved[i]?"var(--g700)":"var(--g200)"}`,
                      background:saved[i]?"var(--g900)":"var(--white)",
                      color:saved[i]?"var(--white)":"var(--g700)",
                      cursor:"pointer",fontFamily:"inherit",fontWeight:600,transition:"all 0.2s"}}>
                    {saved[i]?"Saved ✓":"Save"}
                  </motion.button>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD SHELL
// ═══════════════════════════════════════════════════════════════════════════════
const Dashboard = () => {
  const [active, setActive] = useState("dashboard");

  const pages = {
    dashboard:{ c:<DashboardOverview/>,  title:"Overview" },
    resume:   { c:<ResumeAnalyzer/>,     title:"Resume Analyzer" },
    matcher:  { c:<JDMatcher/>,          title:"JD Matcher" },
    roadmap:  { c:<Roadmap/>,            title:"Learning Roadmap" },
    quiz:     { c:<Quiz/>,               title:"Adaptive Quiz" },
    interview:{ c:<MockInterview/>,      title:"Mock Interview" },
    jobs:     { c:<JobFinder/>,          title:"Job Finder" },
  };

  const cur = pages[active];

  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"var(--g50)"}}>
      <Sidebar active={active} setActive={setActive}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <Topbar title={cur.title}/>
        <main style={{flex:1,overflowY:"auto"}}>
          <AnimatePresence mode="wait">
            <motion.div key={active}
              initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
              transition={{duration:0.3,ease:[0.4,0,0.2,1]}}>
              {cur.c}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [view, setView] = useState("landing");
  return (
    <>
      <style>{G}</style>
      <AnimatePresence mode="wait">
        {view==="landing"
          ? <motion.div key="landing" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,scale:0.98}} transition={{duration:0.4}}>
              <Landing onEnter={()=>setView("app")}/>
            </motion.div>
          : <motion.div key="app" initial={{opacity:0,scale:1.02}} animate={{opacity:1,scale:1}} exit={{opacity:0}} transition={{duration:0.4}}>
              <Dashboard/>
            </motion.div>
        }
      </AnimatePresence>
    </>
  );
}
