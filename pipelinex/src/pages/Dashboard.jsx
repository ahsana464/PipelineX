import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { usePipelines } from '../context/PipelineContext'

const statusCfg = {
  success: { bg:'rgba(0,229,160,0.1)',  border:'rgba(0,229,160,0.25)',  color:'#00e5a0', dot:'#00e5a0', label:'Success' },
  running: { bg:'rgba(59,130,246,0.1)', border:'rgba(59,130,246,0.25)', color:'#3b82f6', dot:'#3b82f6', label:'Running' },
  failed:  { bg:'rgba(239,68,68,0.1)',  border:'rgba(239,68,68,0.25)',  color:'#ef4444', dot:'#ef4444', label:'Failed'  },
  pending: { bg:'rgba(245,158,11,0.1)', border:'rgba(245,158,11,0.25)', color:'#f59e0b', dot:'#f59e0b', label:'Pending' },
}

const actions = [
  { to:'/new-pipeline', icon:'🚀', label:'Deploy New Project',  color:'#00e5a0', bg:'rgba(0,229,160,0.08)',  border:'rgba(0,229,160,0.2)' },
  { to:'/ai-chat',      icon:'🤖', label:'Ask AI Assistant',    color:'#3b82f6', bg:'rgba(59,130,246,0.08)', border:'rgba(59,130,246,0.2)' },
  { to:'/monitor',      icon:'📊', label:'View Monitoring',     color:'#a855f7', bg:'rgba(168,85,247,0.08)', border:'rgba(168,85,247,0.2)' },
  { to:'/settings',     icon:'⚙️', label:'Settings & API Keys', color:'#f59e0b', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.2)' },
]

function AnimCount({ target, duration = 1200 }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === 0) {
      setVal(0)
      return
    }
    let start = 0
    const step = Math.ceil(duration / (target * 20))
    const timer = setInterval(() => {
      start += 1
      setVal(start)
      if (start >= target) clearInterval(timer)
    }, step)
    return () => clearInterval(timer)
  }, [target, duration])
  return <>{val}</>
}

function timeAgo(dateStr) {
  if (!dateStr) return 'just now'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min${mins>1?'s':''} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs>1?'s':''} ago`
  return `${Math.floor(hrs/24)} day${Math.floor(hrs/24)>1?'s':''} ago`
}

export default function Dashboard() {
  const { user } = useAuth()
  const { pipelines, deletePipeline } = usePipelines()
  const [rowsVisible, setRowsVisible] = useState(false)
  const [statsVisible, setStatsVisible] = useState(false)
  const [hoveredRow, setHoveredRow] = useState(null)
  const [hoveredAction, setHoveredAction] = useState(null)
  const [hoveredStat, setHoveredStat] = useState(null)

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to stop the deployment and delete pipeline "${name}"? This will permanently shut down its container.`)) {
      await deletePipeline(id)
    }
  }

  useEffect(() => {
    setTimeout(() => setStatsVisible(true), 200)
    setTimeout(() => setRowsVisible(true), 500)
  }, [])

  const stats = [
    { label:'Total Pipelines',   val: pipelines.length,                                      icon:'⚙️', color:'#00e5a0', bg:'rgba(0,229,160,0.08)',   border:'rgba(0,229,160,0.15)' },
    { label:'Successful Builds', val: pipelines.filter(p=>p.status==='success').length,       icon:'✅', color:'#22c55e', bg:'rgba(34,197,94,0.08)',    border:'rgba(34,197,94,0.15)' },
    { label:'Failed Builds',     val: pipelines.filter(p=>p.status==='failed').length,        icon:'❌', color:'#ef4444', bg:'rgba(239,68,68,0.08)',    border:'rgba(239,68,68,0.15)' },
    { label:'Running Now',       val: pipelines.filter(p=>p.status==='running').length,       icon:'🚀', color:'#3b82f6', bg:'rgba(59,130,246,0.08)',   border:'rgba(59,130,246,0.15)' },
  ]

  return (
    <Layout>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem', animation:'fadeUp 0.5s ease' }}>
        <div>
          <h1 style={{ fontSize:'1.7rem', fontWeight:800, letterSpacing:'-0.5px', marginBottom:'0.25rem' }}>
            <span style={{ color:'var(--accent)' }}>{user?.name?.split(' ')[0] || 'Developer'}</span> 👋
          </h1>
          <p style={{ color:'var(--muted)', fontSize:'0.88rem' }}>Here's what's happening with your pipelines today</p>
        </div>
        <Link to="/new-pipeline" className="btn-primary">+ New Pipeline</Link>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:'2rem' }}>
        {stats.map((stat, i) => (
          <div key={i}
            onMouseEnter={() => setHoveredStat(i)}
            onMouseLeave={() => setHoveredStat(null)}
            style={{
              background: hoveredStat === i ? stat.bg : 'var(--card)',
              border: `1px solid ${hoveredStat === i ? stat.border : 'var(--border)'}`,
              borderRadius: 14, padding:'1.3rem',
              opacity: statsVisible ? 1 : 0,
              transform: statsVisible ? (hoveredStat === i ? 'translateY(-5px) scale(1.02)' : 'translateY(0)') : 'translateY(20px)',
              transition: `opacity 0.5s ease ${i*0.07}s, transform 0.3s ease, border-color 0.3s, background 0.3s`,
              boxShadow: hoveredStat === i ? `0 8px 28px ${stat.border}` : 'none',
              cursor: 'default',
            }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.8rem' }}>
              <span style={{ fontSize:'0.75rem', color:'var(--muted)', fontWeight:500 }}>{stat.label}</span>
              <span style={{ fontSize:'1.2rem', animation:`floatSlow ${5+i}s ease-in-out infinite` }}>{stat.icon}</span>
            </div>
            <div style={{ fontSize:'2.2rem', fontWeight:800, letterSpacing:'-1px', color: hoveredStat===i ? stat.color : 'var(--text)', transition:'color 0.3s' }}>
              {statsVisible ? <AnimCount target={stat.val} /> : 0}
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline Table */}
      <div style={{ marginBottom:'2.5rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <h2 style={{ fontSize:'1.1rem', fontWeight:700 }}>Recent Pipelines</h2>
          <Link to="/new-pipeline" style={{ color:'var(--accent)', fontSize:'0.83rem', textDecoration:'none' }}>View all →</Link>
        </div>
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
          {/* Table head */}
          <div style={{ display:'grid', gridTemplateColumns:'1.8fr 1.5fr 1fr 1fr 0.8fr 1fr 0.8fr', padding:'0.75rem 1.2rem', borderBottom:'1px solid var(--border)', fontSize:'0.73rem', color:'var(--muted)', fontWeight:600, gap:'0.5rem' }}>
            {['Project','Stack','Branch','Status','Duration','Last Run',''].map((h,i) => <span key={i}>{h}</span>)}
          </div>
          {/* Rows */}
          {pipelines.slice(0, 8).map((p, i) => {
            const st = statusCfg[p.status] || statusCfg.pending
            const active = hoveredRow === i
            return (
              <div key={p._id}
                onMouseEnter={() => setHoveredRow(i)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  display:'grid', gridTemplateColumns:'1.8fr 1.5fr 1fr 1fr 0.8fr 1fr 0.8fr',
                  padding:'0.9rem 1.2rem', borderBottom: i < pipelines.length-1 ? '1px solid var(--border)' : 'none',
                  alignItems:'center', fontSize:'0.84rem', gap:'0.5rem',
                  background: active ? 'rgba(255,255,255,0.02)' : 'transparent',
                  opacity: rowsVisible ? 1 : 0,
                  transform: rowsVisible ? 'translateX(0)' : 'translateX(-12px)',
                  transition: `opacity 0.4s ease ${i*0.06}s, transform 0.4s ease ${i*0.06}s, background 0.2s`,
                  cursor:'default',
                  borderLeft: active ? `2px solid ${st.color}` : '2px solid transparent',
                }}>
                <span style={{ display:'flex', alignItems:'center', gap:6, fontWeight:600, fontFamily:'var(--mono)', fontSize:'0.8rem' }}>
                  <span style={{ color:'var(--accent)', fontSize:'0.9rem', animation: active ? `pulseSlow 1s infinite` : 'none' }}>◈</span>
                  {p.name}
                </span>
                <span style={{ color:'var(--muted2)', fontSize:'0.78rem' }}>{p.stack}</span>
                <span style={{ display:'flex', alignItems:'center', fontFamily:'var(--mono)', fontSize:'0.75rem', color:'var(--muted2)' }}>
                  <span style={{ color:'var(--accent)', marginRight:4 }}>⎇</span>{p.branch}
                </span>
                <span>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'0.22rem 0.65rem', borderRadius:999, fontSize:'0.72rem', fontWeight:600, background:st.bg, border:`1px solid ${st.border}`, color:st.color }}>
                    <span style={{ width:5, height:5, borderRadius:'50%', background:st.dot, display:'inline-block', animation: p.status==='running'?'pulse 1s infinite':'none' }}/>
                    {st.label}
                  </span>
                </span>
                <span style={{ color:'var(--muted)', fontFamily:'var(--mono)', fontSize:'0.78rem' }}>{p.buildTime || '—'}</span>
                <span style={{ color:'var(--muted)', fontSize:'0.78rem' }}>{timeAgo(p.createdAt)}</span>
                <span style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
                  <Link to={`/pipeline/${p._id}`} style={{ color:'var(--accent)', fontSize:'0.78rem', fontWeight:600, textDecoration:'none',
                    opacity: active ? 1 : 0.5, transition:'opacity 0.2s' }}>View →</Link>
                  <button 
                    onClick={() => handleDelete(p._id, p.name)} 
                    style={{ background:'transparent', border:'none', color:'#ef4444', fontSize:'0.85rem', cursor:'pointer', opacity: active ? 0.7 : 0, transition:'opacity 0.2s', padding:0 }}
                    title="Stop deployment & delete"
                  >
                    🗑️
                  </button>
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 style={{ fontSize:'1.1rem', fontWeight:700, marginBottom:'1rem' }}>Quick Actions</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12 }}>
          {actions.map((a, i) => (
            <Link key={i} to={a.to}
              onMouseEnter={() => setHoveredAction(i)}
              onMouseLeave={() => setHoveredAction(null)}
              style={{
                background: hoveredAction===i ? a.bg : 'var(--card)',
                border: `1px solid ${hoveredAction===i ? a.border : 'var(--border)'}`,
                borderRadius:14, padding:'1.4rem',
                display:'flex', flexDirection:'column', gap:'0.6rem',
                textDecoration:'none',
                transform: hoveredAction===i ? 'translateY(-5px)' : 'translateY(0)',
                transition:'all 0.25s ease',
                boxShadow: hoveredAction===i ? `0 10px 30px ${a.border}` : 'none',
                opacity: rowsVisible ? 1 : 0,
                animationDelay:`${i*0.05}s`,
              }}>
              <span style={{ fontSize:'1.6rem', animation:`floatSlow ${5+i}s ease-in-out infinite`,
                filter: hoveredAction===i ? `drop-shadow(0 0 8px ${a.color}80)` : 'none',
                transition:'filter 0.3s',
              }}>{a.icon}</span>
              <span style={{ fontSize:'0.85rem', fontWeight:700, color: hoveredAction===i ? a.color : 'var(--text)', transition:'color 0.25s' }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  )
}
