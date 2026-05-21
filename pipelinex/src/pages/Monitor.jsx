import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

function AnimCount({ target }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let s = 0
    const t = setInterval(() => { s++; setVal(s); if (s >= target) clearInterval(t) }, 30)
    return () => clearInterval(t)
  }, [target])
  return <>{val}</>
}

export default function Monitor() {
  const { token } = useAuth()
  const [cpuData, setCpuData] = useState([])
  const [memData, setMemData] = useState([])
  const [latencyData, setLatencyData] = useState([])
  const [deployData, setDeployData] = useState([])
  const [containers, setContainers] = useState([])
  const [hoveredStat, setHoveredStat] = useState(null)
  const [show, setShow] = useState(false)

  // Initialize empty data arrays
  useEffect(() => {
    setTimeout(() => setShow(true), 100)
    const initial = Array.from({ length: 20 }, (_, i) => ({ time: '', value: 0 }))
    setCpuData([...initial])
    setMemData([...initial])
    setLatencyData([...initial])
  }, [])

  // Live polling
  useEffect(() => {
    if (!token) return
    const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const interval = setInterval(async () => {
      try {
        const start = Date.now()
        const res = await axios.get(`${API}/pipelines/system`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const lat = Date.now() - start
        const time = new Date().toLocaleTimeString().slice(0, 5)
        
        setCpuData(prev => [...prev.slice(-19), { time, value: res.data.cpu }])
        setMemData(prev => [...prev.slice(-19), { time, value: res.data.mem }])
        setLatencyData(prev => [...prev.slice(-19), { time, value: lat }])
        setDeployData(res.data.deployData)
        setContainers(res.data.containers)
      } catch (err) {}
    }, 2000)
    return () => clearInterval(interval)
  }, [token])

  const currentCpu = cpuData[cpuData.length-1]?.value || 0
  const currentMem = memData[memData.length-1]?.value || 0
  const activeCount = containers.filter(c => c.status === 'running').length

  const stats = [
    { label:'CPU Usage',          val:`${currentCpu}%`,  icon:'⚡', color:'#00e5a0', bg:'rgba(0,229,160,0.08)',  border:'rgba(0,229,160,0.15)' },
    { label:'Memory Usage',       val:`${currentMem}%`,  icon:'💾', color:'#3b82f6', bg:'rgba(59,130,246,0.08)', border:'rgba(59,130,246,0.15)' },
    { label:'Active Containers',  val:`${activeCount}`,   icon:'🐳', color:'#a855f7', bg:'rgba(168,85,247,0.08)', border:'rgba(168,85,247,0.15)' },
    { label:'Uptime',             val:'99.9%',            icon:'⏱️', color:'#22c55e', bg:'rgba(34,197,94,0.08)',  border:'rgba(34,197,94,0.15)' },
  ]

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'0.5rem 0.8rem', fontSize:'0.75rem', fontFamily:'var(--mono)' }}>
        <div style={{ color:'var(--muted)', marginBottom:2 }}>{label}</div>
        <div style={{ color:'var(--accent)', fontWeight:700 }}>{payload[0].value.toFixed(1)}%</div>
      </div>
    )
  }

  return (
    <Layout>
      <div style={{ animation:'fadeUp 0.5s ease' }}>
        <div style={{ marginBottom:'2rem' }}>
          <h1 style={{ fontSize:'1.6rem', fontWeight:800, letterSpacing:'-0.5px', marginBottom:'0.25rem' }}>📊 Monitoring Dashboard</h1>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <p style={{ color:'var(--muted)', fontSize:'0.88rem' }}>Real-time system metrics</p>
            <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:'0.72rem', color:'#00e5a0', fontFamily:'var(--mono)' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#00e5a0', animation:'pulse 1.5s infinite' }}/>LIVE
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:'2rem' }}>
          {stats.map((s, i) => (
            <div key={i} onMouseEnter={() => setHoveredStat(i)} onMouseLeave={() => setHoveredStat(null)}
              style={{
                background: hoveredStat===i ? s.bg : 'var(--card)', border:`1px solid ${hoveredStat===i ? s.border : 'var(--border)'}`,
                borderRadius:14, padding:'1.2rem',
                opacity: show ? 1 : 0, transform: show ? (hoveredStat===i ? 'translateY(-4px)' : 'translateY(0)') : 'translateY(20px)',
                transition:`all 0.3s ease ${i*0.06}s`, boxShadow: hoveredStat===i ? `0 8px 24px ${s.border}` : 'none', cursor:'default',
              }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.6rem' }}>
                <span style={{ fontSize:'0.73rem', color:'var(--muted)', fontWeight:500 }}>{s.label}</span>
                <span style={{ fontSize:'1.1rem' }}>{s.icon}</span>
              </div>
              <div style={{ fontSize:'1.8rem', fontWeight:800, letterSpacing:'-1px', color: hoveredStat===i ? s.color : 'var(--text)', transition:'color 0.3s' }}>
                {s.val}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
          {/* CPU Chart */}
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:'1.2rem' }}>
            <h3 style={{ fontSize:'0.88rem', fontWeight:700, marginBottom:'1rem', display:'flex', alignItems:'center', gap:6 }}>
              ⚡ CPU Usage <span style={{ fontSize:'0.72rem', color:'var(--accent)', fontFamily:'var(--mono)', fontWeight:500 }}>{currentCpu}%</span>
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={cpuData}>
                <defs><linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00e5a0" stopOpacity={0.3}/><stop offset="100%" stopColor="#00e5a0" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fontSize:10, fill:'#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0,100]} tick={{ fontSize:10, fill:'#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#00e5a0" strokeWidth={2} fill="url(#cpuGrad)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Memory Chart */}
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:'1.2rem' }}>
            <h3 style={{ fontSize:'0.88rem', fontWeight:700, marginBottom:'1rem', display:'flex', alignItems:'center', gap:6 }}>
              💾 Memory Usage <span style={{ fontSize:'0.72rem', color:'#3b82f6', fontFamily:'var(--mono)', fontWeight:500 }}>{currentMem}%</span>
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={memData}>
                <defs><linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fontSize:10, fill:'#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0,100]} tick={{ fontSize:10, fill:'#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#memGrad)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Deployments Bar Chart */}
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:'1.2rem' }}>
            <h3 style={{ fontSize:'0.88rem', fontWeight:700, marginBottom:'1rem' }}>🚀 Deployments This Week</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={deployData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fontSize:10, fill:'#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill:'#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                  <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'0.5rem 0.8rem', fontSize:'0.75rem', fontFamily:'var(--mono)' }}>
                    <div style={{ color:'var(--muted)' }}>{label}</div>
                    <div style={{ color:'#a855f7', fontWeight:700 }}>{payload[0].value} deploys</div>
                  </div>
                ) : null} />
                <Bar dataKey="deploys" fill="#a855f7" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Response Time Line Chart */}
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:'1.2rem' }}>
            <h3 style={{ fontSize:'0.88rem', fontWeight:700, marginBottom:'1rem' }}>📈 Response Time (ms)</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fontSize:10, fill:'#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill:'#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                  <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'0.5rem 0.8rem', fontSize:'0.75rem', fontFamily:'var(--mono)' }}>
                    <div style={{ color:'var(--muted)' }}>{label}</div>
                    <div style={{ color:'#f59e0b', fontWeight:700 }}>{payload[0].value.toFixed(0)}ms</div>
                  </div>
                ) : null} />
                <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Containers Table */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
          <div style={{ padding:'1rem 1.2rem', borderBottom:'1px solid var(--border)' }}>
            <h3 style={{ fontSize:'0.88rem', fontWeight:700 }}>🐳 Active Containers</h3>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 0.8fr 0.8fr 1fr', padding:'0.6rem 1.2rem', borderBottom:'1px solid var(--border)', fontSize:'0.72rem', color:'var(--muted)', fontWeight:600 }}>
            {['Container','Status','Port','CPU','Memory','Uptime'].map(h => <span key={h}>{h}</span>)}
          </div>
          {containers.map((c, i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 0.8fr 0.8fr 1fr', padding:'0.8rem 1.2rem', borderBottom: i<containers.length-1 ? '1px solid var(--border)':'none', fontSize:'0.82rem', alignItems:'center' }}>
              <span style={{ fontWeight:600, fontFamily:'var(--mono)', fontSize:'0.78rem' }}>{c.name}</span>
              <span>
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'0.15rem 0.5rem', borderRadius:999, fontSize:'0.7rem', fontWeight:600,
                  background: c.status==='running' ? 'rgba(0,229,160,0.1)' : 'rgba(239,68,68,0.1)',
                  color: c.status==='running' ? '#00e5a0' : '#ef4444',
                  border: `1px solid ${c.status==='running' ? 'rgba(0,229,160,0.25)' : 'rgba(239,68,68,0.25)'}`,
                }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background: c.status==='running' ? '#00e5a0' : '#ef4444', animation: c.status==='running' ? 'pulse 1.5s infinite' : 'none' }}/>
                  {c.status}
                </span>
              </span>
              <span style={{ fontFamily:'var(--mono)', fontSize:'0.75rem', color:'var(--muted2)' }}>{c.port}</span>
              <span style={{ fontFamily:'var(--mono)', fontSize:'0.75rem', color:'var(--muted2)' }}>{c.cpu}</span>
              <span style={{ fontFamily:'var(--mono)', fontSize:'0.75rem', color:'var(--muted2)' }}>{c.mem}</span>
              <span style={{ fontFamily:'var(--mono)', fontSize:'0.75rem', color:'var(--muted2)' }}>{c.uptime}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
