import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { usePipelines } from '../context/PipelineContext'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const statusCfg = {
  success: { bg:'rgba(0,229,160,0.1)', border:'rgba(0,229,160,0.25)', color:'#00e5a0', label:'Success' },
  running: { bg:'rgba(59,130,246,0.1)', border:'rgba(59,130,246,0.25)', color:'#3b82f6', label:'Running' },
  failed:  { bg:'rgba(239,68,68,0.1)', border:'rgba(239,68,68,0.25)', color:'#ef4444', label:'Failed' },
  pending: { bg:'rgba(245,158,11,0.1)', border:'rgba(245,158,11,0.25)', color:'#f59e0b', label:'Pending' },
}

const defaultStages = [
  { name:'Clone',   status:'success', duration:'', icon:'📥' },
  { name:'Test',    status:'success', duration:'', icon:'🧪' },
  { name:'Build',   status:'success', duration:'', icon:'🔨' },
  { name:'Deploy',  status:'success', duration:'', icon:'🚀' },
]



export default function PipelineDetail() {
  const { id } = useParams()
  const { getPipeline } = usePipelines()
  const { token } = useAuth()
  
  // Initialize with context data
  const [pipeline, setPipeline] = useState(getPipeline(id))
  
  const [visibleLogs, setVisibleLogs] = useState([])
  const [logsComplete, setLogsComplete] = useState(false)
  const [activeTab, setActiveTab] = useState('logs')
  const logRef = useRef(null)

  // Sync initial pipeline if context updates
  useEffect(() => {
    if (!pipeline) setPipeline(getPipeline(id))
  }, [id, getPipeline])

  // Poll for live updates
  useEffect(() => {
    let interval;
    if (pipeline && (pipeline.status === 'running' || pipeline.status === 'pending')) {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`${API}/pipelines/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          setPipeline(res.data)
        } catch (err) {
          console.error('Poll failed', err)
        }
      }, 1500)
    }
    return () => clearInterval(interval)
  }, [pipeline?.status, id, token])

  useEffect(() => {
    if (pipeline && pipeline.logs) {
      setVisibleLogs(pipeline.logs)
      if (pipeline.status === 'success' || pipeline.status === 'failed') {
        setLogsComplete(true)
      } else {
        setLogsComplete(false)
      }
    }
  }, [pipeline])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [visibleLogs])

  if (!pipeline) {
    return (
      <Layout>
        <div style={{ textAlign:'center', padding:'4rem', color:'var(--muted)' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔍</div>
          <p>Pipeline not found</p>
          <Link to="/dashboard" style={{ color:'var(--accent)', fontSize:'0.88rem', marginTop:'1rem', display:'inline-block' }}>← Back to Dashboard</Link>
        </div>
      </Layout>
    )
  }

  const st = statusCfg[pipeline.status] || statusCfg.pending
  const stages = pipeline.stages?.length ? pipeline.stages : defaultStages

  return (
    <Layout>
      <div style={{ animation:'fadeUp 0.5s ease' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <Link to="/dashboard" style={{ color:'var(--muted)', fontSize:'0.8rem', marginBottom:'0.5rem', display:'block' }}>← Back to Dashboard</Link>
            <h1 style={{ fontSize:'1.6rem', fontWeight:800, letterSpacing:'-0.5px', display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <span style={{ color:'var(--accent)' }}>◈</span> {pipeline.name}
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'0.2rem 0.6rem', borderRadius:999, fontSize:'0.72rem', fontWeight:600, background:st.bg, border:`1px solid ${st.border}`, color:st.color, marginLeft:8 }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background:st.color, display:'inline-block', animation: pipeline.status==='running'?'pulse 1s infinite':'none' }}/>
                {st.label}
              </span>
            </h1>
            <div style={{ display:'flex', gap:'1.5rem', marginTop:'0.5rem', fontSize:'0.8rem', color:'var(--muted)', fontFamily:'var(--mono)' }}>
              <span>🔧 {pipeline.stack}</span>
              <span>⎇ {pipeline.branch}</span>
              <span>⏱ {pipeline.buildTime || '2m 14s'}</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            <button className="btn-primary" style={{ padding:'0.5rem 1rem', fontSize:'0.82rem' }}>🔄 Rebuild</button>
            <button className="btn-outline" style={{ padding:'0.5rem 1rem', fontSize:'0.82rem' }}>⏪ Rollback</button>
          </div>
        </div>

        {/* Build Stages Pipeline */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:'1.5rem', marginBottom:'1.5rem' }}>
          <h3 style={{ fontSize:'0.88rem', fontWeight:700, marginBottom:'1.2rem' }}>Build Pipeline</h3>
          <div style={{ display:'flex', alignItems:'center', gap:0, overflowX:'auto' }}>
            {stages.map((stage, i) => {
              const sc = statusCfg[stage.status] || statusCfg.pending
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', animation:`fadeUp 0.4s ease ${i*0.1}s forwards`, opacity:0 }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, minWidth:80 }}>
                    <div style={{
                      width:42, height:42, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                      background:sc.bg, border:`2px solid ${sc.color}`, fontSize:'1.1rem',
                      boxShadow: stage.status==='running' ? `0 0 12px ${sc.color}50` : 'none',
                      animation: stage.status==='running' ? 'pulseSlow 1.5s infinite' : 'none',
                    }}>
                      {stage.status==='success' ? '✓' : stage.status==='running' ? '⟳' : defaultStages[i]?.icon || '○'}
                    </div>
                    <span style={{ fontSize:'0.72rem', fontWeight:600, color:sc.color }}>{stage.name}</span>
                    <span style={{ fontSize:'0.65rem', color:'var(--muted)', fontFamily:'var(--mono)' }}>{stage.duration || '—'}</span>
                  </div>
                  {i < stages.length - 1 && (
                    <div style={{ width:40, height:2, background: stage.status==='success' ? 'var(--accent)' : 'var(--border)', margin:'0 -4px', marginBottom:30, transition:'background 0.5s' }}/>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)', marginBottom:'1rem' }}>
          {['logs','info'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background:'transparent', border:'none', padding:'0.7rem 1.2rem',
              color: activeTab===tab ? 'var(--accent)' : 'var(--muted)',
              fontWeight: activeTab===tab ? 700 : 500, fontSize:'0.85rem',
              borderBottom: activeTab===tab ? '2px solid var(--accent)' : '2px solid transparent',
              cursor:'pointer', fontFamily:'var(--font)', transition:'all 0.2s',
              textTransform:'capitalize',
            }}>{tab === 'logs' ? '📋 Build Logs' : 'ℹ️ Deployment Info'}</button>
          ))}
        </div>

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
            <div style={{ background:'#1a1d24', padding:'0.5rem 1rem', display:'flex', alignItems:'center', gap:6, borderBottom:'1px solid var(--border)' }}>
              <span style={{ width:10, height:10, borderRadius:'50%', background:'#ff5f57' }}/>
              <span style={{ width:10, height:10, borderRadius:'50%', background:'#febc2e' }}/>
              <span style={{ width:10, height:10, borderRadius:'50%', background:'#28c840' }}/>
              <span style={{ color:'var(--muted)', fontSize:'0.72rem', margin:'0 auto', fontFamily:'var(--mono)' }}>build logs — {pipeline.name}</span>
            </div>
            <div ref={logRef} style={{ padding:'1rem 1.2rem', fontFamily:'var(--mono)', fontSize:'0.74rem', lineHeight:1.9, maxHeight:400, overflowY:'auto' }}>
              {visibleLogs.map((line, i) => (
                <div key={i} style={{ color: line.includes('✓') ? '#00e5a0' : line.includes('warn') ? '#f59e0b' : line.includes('PASS') ? '#22c55e' : line.includes('🌍') ? '#f59e0b' : 'var(--muted2)', animation:'slideIn 0.2s ease' }}>
                  {line}
                </div>
              ))}
              {!logsComplete && <span style={{ color:'var(--accent)', animation:'blink 1s infinite' }}>█</span>}
            </div>
          </div>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', animation:'fadeUp 0.3s ease' }}>
            {[
              { label:'Deploy URL', value: pipeline.deployUrl || '—', color:'var(--accent)' },
              { label:'Container ID', value: pipeline.containerId || '—', color:'var(--muted2)' },
              { label:'Image Size', value: pipeline.imageSize || '—', color:'var(--muted2)' },
              { label:'Port', value: pipeline.deployedPort ? `Local → ${pipeline.deployedPort}` : '—', color:'var(--muted2)' },
              { label:'Status', value: pipeline.status, color: pipeline.status === 'success' ? '#00e5a0' : pipeline.status === 'failed' ? '#ef4444' : 'var(--muted2)' },
              { label:'Test Command', value: pipeline.testCommand || 'Auto-detected', color:'var(--muted2)' },
            ].map((item, i) => (
              <div key={i} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:'1rem' }}>
                <div style={{ fontSize:'0.72rem', color:'var(--muted)', marginBottom:4 }}>{item.label}</div>
                <div style={{ fontSize:'0.85rem', fontWeight:600, fontFamily:'var(--mono)', color:item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
