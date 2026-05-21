import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'

const terminalLines = [
  { delay: 300,  type: 'cmd',     text: 'pipelinex deploy github.com/ahsan/myapp' },
  { delay: 900,  type: 'info',    text: '→ Connecting to repository...' },
  { delay: 1600, type: 'success', text: '✓ Stack detected: React + Node.js + PostgreSQL' },
  { delay: 2300, type: 'success', text: '✓ Dockerfile generated automatically' },
  { delay: 3000, type: 'success', text: '✓ CI/CD pipeline configured' },
  { delay: 3700, type: 'info',    text: '→ Building Docker image... (2m 14s)' },
  { delay: 4400, type: 'success', text: '✓ Image pushed to Docker Hub' },
  { delay: 5100, type: 'success', text: '✓ Deployed to AWS EC2' },
  { delay: 5800, type: 'warn',    text: '🌍 Live → https://myapp.pipelinex.app' },
]

const features = [
  { icon: '🧠', title: 'AI Stack Detection',   desc: 'Detects React, Django, Node, Flask automatically', color: '#00e5a0' },
  { icon: '🐳', title: 'Dockerfile Generator', desc: 'AI writes production-ready Dockerfiles instantly',  color: '#3b82f6' },
  { icon: '⚙️', title: 'CI/CD Pipeline',       desc: 'GitHub Actions auto-created and triggered on push', color: '#a855f7' },
  { icon: '📋', title: 'Live Build Logs',       desc: 'Real-time terminal logs streamed to your browser',  color: '#f59e0b' },
  { icon: '🤖', title: 'AI Error Explainer',   desc: 'Build failures explained in plain English + fixes',  color: '#ef4444' },
  { icon: '📊', title: 'Monitoring Dashboard', desc: 'CPU, memory, uptime and deployment history live',    color: '#00e5a0' },
]

const steps = [
  { icon: '🔗', num: '01', title: 'Connect GitHub',    desc: 'Paste repo URL or connect via OAuth',          bg: 'rgba(0,229,160,0.08)',  border: 'rgba(0,229,160,0.2)' },
  { icon: '🤖', num: '02', title: 'AI Analyzes',       desc: 'Detects stack, generates all config files',    bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
  { icon: '🐳', num: '03', title: 'Auto Build',         desc: 'Docker image built and tested automatically',  bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)' },
  { icon: '🚀', num: '04', title: 'Go Live',            desc: 'Deployed to cloud with a shareable URL',       bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
]

function useInView(threshold = 0.1) {
  const ref = useRef()
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

function FeatCard({ f, i }) {
  const [ref, visible] = useInView()
  const [hovered, setHovered] = useState(false)
  return (
    <div ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `rgba(${f.color === '#00e5a0' ? '0,229,160' : f.color === '#3b82f6' ? '59,130,246' : f.color === '#a855f7' ? '168,85,247' : f.color === '#f59e0b' ? '245,158,11' : '239,68,68'},0.06)` : 'var(--card)',
        border: `1px solid ${hovered ? f.color + '40' : 'var(--border)'}`,
        borderRadius: 14, padding: '1.5rem', cursor: 'default',
        opacity: visible ? 1 : 0,
        transform: visible ? (hovered ? 'translateY(-6px) scale(1.01)' : 'translateY(0)') : 'translateY(24px)',
        transition: `opacity 0.5s ease ${i * 0.08}s, transform 0.3s ease, border-color 0.3s, background 0.3s`,
        boxShadow: hovered ? `0 12px 40px ${f.color}20` : 'none',
      }}>
      <div style={{ fontSize: '1.6rem', marginBottom: '0.8rem', display: 'inline-block',
        animation: `floatSlow ${5 + i * 0.5}s ease-in-out infinite`,
        filter: hovered ? `drop-shadow(0 0 8px ${f.color}80)` : 'none',
        transition: 'filter 0.3s',
      }}>{f.icon}</div>
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem', color: hovered ? f.color : 'var(--text)', transition: 'color 0.3s' }}>{f.title}</div>
      <div style={{ color: 'var(--muted)', fontSize: '0.82rem', lineHeight: 1.5 }}>{f.desc}</div>
    </div>
  )
}

function StepCard({ step, i }) {
  const [ref, visible] = useInView()
  const [hovered, setHovered] = useState(false)
  return (
    <div ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: step.bg, border: `1px solid ${hovered ? step.border.replace('0.2', '0.5') : step.border}`,
        borderRadius: 14, padding: '1.8rem', position: 'relative',
        opacity: visible ? 1 : 0,
        transform: visible ? (hovered ? 'translateY(-5px)' : 'translateY(0)') : 'translateY(24px)',
        transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.3s ease, border-color 0.3s`,
        boxShadow: hovered ? `0 10px 32px ${step.border}` : 'none',
      }}>
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.15)', fontFamily: 'var(--mono)', fontWeight: 700 }}>{step.num}</div>
      <div style={{ fontSize: '2rem', marginBottom: '0.9rem', display: 'inline-block',
        animation: `float ${4 + i}s ease-in-out infinite`,
      }}>{step.icon}</div>
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem' }}>{step.title}</div>
      <div style={{ color: 'var(--muted2)', fontSize: '0.82rem', lineHeight: 1.5 }}>{step.desc}</div>
    </div>
  )
}

export default function Landing() {
  const [visibleLines, setVisibleLines] = useState([])
  const [show, setShow] = useState(false)

  const [isLight, setIsLight] = useState(() => {
    return document.body.classList.contains('light-mode')
  })

  useEffect(() => {
    const savedTheme = localStorage.getItem('px_theme')
    if (savedTheme === 'light') setIsLight(true)
  }, [])

  useEffect(() => {
    if (isLight) {
      document.body.classList.add('light-mode')
      localStorage.setItem('px_theme', 'light')
    } else {
      document.body.classList.remove('light-mode')
      localStorage.setItem('px_theme', 'dark')
    }
  }, [isLight])

  const toggleTheme = () => setIsLight(prev => !prev)

  useEffect(() => {
    setTimeout(() => setShow(true), 80)
    terminalLines.forEach(l => setTimeout(() => setVisibleLines(p => [...p, l]), l.delay))
  }, [])

  const t = (delay) => ({
    opacity: show ? 1 : 0,
    transform: show ? 'translateY(0)' : 'translateY(20px)',
    transition: `all 0.6s ease ${delay}s`,
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden' }}>

      {/* BG ORBS */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {[
          { s:600, c:'rgba(0,229,160,0.06)',  t:'-15%', l:'-8%',  dur:10 },
          { s:500, c:'rgba(59,130,246,0.05)',  t:'30%',  l:'65%',  dur:13 },
          { s:400, c:'rgba(168,85,247,0.04)', t:'70%',  l:'5%',   dur:11 },
          { s:300, c:'rgba(245,158,11,0.04)', t:'85%',  l:'75%',  dur:14 },
        ].map((o, i) => (
          <div key={i} style={{
            position:'absolute', width:o.s, height:o.s, borderRadius:'50%',
            background:`radial-gradient(circle, ${o.c} 0%, transparent 70%)`,
            top:o.t, left:o.l,
            animation:`orb${i%2+1} ${o.dur}s ease-in-out infinite`,
            animationDelay:`${i*2}s`,
          }}/>
        ))}
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize:'32px 32px' }} />
      </div>

      {/* NAV */}
      <nav style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'1.2rem 2.5rem', borderBottom:'1px solid var(--border)',
        position:'sticky', top:0, zIndex:50,
        background:'color-mix(in srgb, var(--bg) 85%, transparent)', backdropFilter:'blur(16px)',
        animation:'fadeIn 0.6s ease',
        transition:'background-color 0.5s ease',
      }}>
        <div style={{ fontSize:'1.3rem', fontWeight:800, letterSpacing:'-0.5px' }}>
          Pipeline<span style={{ color:'var(--accent)' }}>X</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'1.5rem' }}>
          <button 
            className="theme-toggle-btn"
            onClick={toggleTheme}
            style={{ transform: isLight ? 'rotate(180deg)' : 'rotate(0deg)', width: 32, height: 32, fontSize: '0.9rem' }}
            title="Toggle Light/Dark Mode"
          >
            <span className={isLight ? 'theme-icon-light' : 'theme-icon-dark'} style={{ display: 'inline-block' }}>
              {isLight ? '☀️' : '🌙'}
            </span>
          </button>
          <a href="#features" style={{ color:'var(--muted)', fontSize:'0.88rem', fontWeight:500, transition:'color 0.2s' }}
            onMouseEnter={e=>e.target.style.color='var(--text)'} onMouseLeave={e=>e.target.style.color='var(--muted)'}>Features</a>
          <a href="#steps" style={{ color:'var(--muted)', fontSize:'0.88rem', fontWeight:500, transition:'color 0.2s' }}
            onMouseEnter={e=>e.target.style.color='var(--text)'} onMouseLeave={e=>e.target.style.color='var(--muted)'}>How it works</a>
          <Link to="/login" style={{ color:'var(--muted)', fontSize:'0.88rem', fontWeight:500 }}>Login</Link>
          <Link to="/register" className="btn-primary" style={{ padding:'0.45rem 1.1rem', fontSize:'0.82rem' }}>Get Started →</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding:'6rem 2.5rem 3rem', textAlign:'center', maxWidth:900, margin:'0 auto', position:'relative', zIndex:1 }}>

        <div style={{ ...t(0.15), display:'inline-flex', alignItems:'center', gap:8,
          background:'var(--accent-dim)', border:'1px solid var(--accent-border)',
          color:'var(--accent)', fontSize:'0.75rem', fontWeight:500,
          padding:'0.3rem 0.9rem', borderRadius:999, marginBottom:'1.5rem',
          fontFamily:'var(--mono)',
        }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--accent)', display:'inline-block', animation:'pulse 1.5s infinite' }}/>
          AI-Powered DevOps Platform — Now Live
        </div>

        <h1 style={{ ...t(0.25), fontSize:'clamp(2.5rem, 6vw, 4rem)', fontWeight:800, lineHeight:1.1, letterSpacing:'-2px', marginBottom:'1.2rem' }}>
          Deploy anything.<br/>
          <span className="shimmer-text">Zero config. Pure AI.</span>
        </h1>

        <p style={{ ...t(0.35), color:'var(--muted)', fontSize:'1.05rem', maxWidth:500, margin:'0 auto 2.2rem', lineHeight:1.7 }}>
          Paste your GitHub repo. PipelineX detects your stack, writes your Dockerfile,
          builds your pipeline, and deploys — fully automatically.
        </p>

        <div style={{ ...t(0.45), display:'flex', gap:'0.8rem', justifyContent:'center', marginBottom:'3.5rem' }}>
          <Link to="/register" className="btn-primary">Start Building Free →</Link>
          <Link to="/login" className="btn-outline">Sign In</Link>
        </div>

        {/* TERMINAL */}
        <div style={{ ...t(0.55),
          background:'var(--surface)', border:'1px solid var(--border)',
          borderRadius:16, overflow:'hidden', maxWidth:680, margin:'0 auto', textAlign:'left',
          animation:'floatSlow 7s ease-in-out infinite, glow 4s ease-in-out infinite',
        }}>
          <div style={{ background:'#1a1d24', padding:'0.65rem 1rem', display:'flex', alignItems:'center', gap:6, borderBottom:'1px solid var(--border)' }}>
            <span style={{ width:11, height:11, borderRadius:'50%', background:'#ff5f57', display:'inline-block' }}/>
            <span style={{ width:11, height:11, borderRadius:'50%', background:'#febc2e', display:'inline-block' }}/>
            <span style={{ width:11, height:11, borderRadius:'50%', background:'#28c840', display:'inline-block' }}/>
            <span style={{ color:'var(--muted)', fontSize:'0.75rem', margin:'0 auto', fontFamily:'var(--mono)' }}>pipelinex — terminal</span>
          </div>
          <div style={{ padding:'1.2rem 1.5rem', fontFamily:'var(--mono)', fontSize:'0.78rem', lineHeight:2, minHeight:200 }}>
            {visibleLines.map((line, i) => (
              <div key={i} style={{ animation:'slideIn 0.3s ease forwards' }}>
                {line.type==='cmd'     && <><span style={{color:'var(--accent)'}}>$</span><span style={{color:'var(--text)',marginLeft:8}}>{line.text}</span></>}
                {line.type==='info'    && <span style={{color:'#6b7280',paddingLeft:16}}>{line.text}</span>}
                {line.type==='success' && <span style={{color:'var(--accent)',paddingLeft:16}}>{line.text}</span>}
                {line.type==='warn'    && <span style={{color:'var(--yellow)',paddingLeft:16}}>{line.text}</span>}
              </div>
            ))}
            {visibleLines.length < terminalLines.length && <span style={{color:'var(--accent)',animation:'blink 1s infinite'}}>█</span>}
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section id="steps" style={{ padding:'4rem 2.5rem', maxWidth:1100, margin:'0 auto', position:'relative', zIndex:1 }}>
        <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--accent)', letterSpacing:'2px', textTransform:'uppercase', fontFamily:'var(--mono)', marginBottom:'0.6rem' }}>How it works</div>
        <h2 style={{ fontSize:'1.9rem', fontWeight:800, letterSpacing:'-0.5px', marginBottom:'2.5rem' }}>From repo to live in 4 steps</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
          {steps.map((step, i) => <StepCard key={i} step={step} i={i} />)}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding:'4rem 2.5rem', maxWidth:1100, margin:'0 auto', position:'relative', zIndex:1 }}>
        <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--accent)', letterSpacing:'2px', textTransform:'uppercase', fontFamily:'var(--mono)', marginBottom:'0.6rem' }}>Features</div>
        <h2 style={{ fontSize:'1.9rem', fontWeight:800, letterSpacing:'-0.5px', marginBottom:'2.5rem' }}>Everything you need to ship fast</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16 }}>
          {features.map((f, i) => <FeatCard key={i} f={f} i={i} />)}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign:'center', padding:'5rem 2.5rem', borderTop:'1px solid var(--border)', position:'relative', zIndex:1 }}>
        <h2 style={{ fontSize:'2.2rem', fontWeight:800, letterSpacing:'-0.5px', marginBottom:'0.75rem' }}>Ready to automate your deployments?</h2>
        <p style={{ color:'var(--muted)', marginBottom:'2rem', fontSize:'0.95rem' }}>Join developers who deploy smarter with AI.</p>
        <Link to="/register" className="btn-primary" style={{ fontSize:'1rem', padding:'0.9rem 2.2rem' }}>Create Free Account →</Link>
      </section>

      {/* FOOTER */}
      <footer style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.5rem 2.5rem', borderTop:'1px solid var(--border)', flexWrap:'wrap', gap:'1rem', position:'relative', zIndex:1 }}>
        <div style={{ fontSize:'1.1rem', fontWeight:800 }}>Pipeline<span style={{color:'var(--accent)'}}>X</span></div>
        <span style={{ color:'var(--muted)', fontSize:'0.8rem' }}>Built with ❤️ by Ahsan · 2026</span>
        <span style={{ color:'var(--muted)', fontSize:'0.8rem', fontFamily:'var(--mono)' }}>React · FastAPI · OpenAI · Docker</span>
      </footer>
    </div>
  )
}
