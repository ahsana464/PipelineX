import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Login() {
  const [form, setForm] = useState({ email:'', password:'' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)
  const [focused, setFocused] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { setTimeout(() => setShow(true), 80) }, [])

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await axios.post(`${API}/auth/login`, form)
      login(res.data.user, res.data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'2rem', position:'relative', overflow:'hidden' }}>

      {/* Animated background */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
        <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,229,160,0.07) 0%, transparent 70%)', top:'-20%', right:'-10%', animation:'orb1 10s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)', bottom:'-10%', left:'-8%', animation:'orb2 12s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize:'32px 32px' }}/>
      </div>

      <div style={{
        background:'var(--surface)', border:'1px solid var(--border)',
        borderRadius:18, padding:'2.5rem', width:'100%', maxWidth:420,
        position:'relative', zIndex:1,
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.97)',
        transition:'all 0.6s cubic-bezier(0.16,1,0.3,1)',
        animation: show ? 'glow 4s ease-in-out infinite' : 'none',
      }}>
        <Link to="/" style={{ fontSize:'1.2rem', fontWeight:800, letterSpacing:'-0.5px', color:'var(--text)', textDecoration:'none', display:'block', marginBottom:'1.8rem' }}>
          Pipeline<span style={{color:'var(--accent)'}}>X</span>
        </Link>

        <h1 style={{ fontSize:'1.5rem', fontWeight:800, letterSpacing:'-0.5px', marginBottom:'0.3rem' }}>Welcome back</h1>
        <p style={{ color:'var(--muted)', fontSize:'0.88rem', marginBottom:'1.8rem' }}>Sign in to your account</p>

        {error && (
          <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#ef4444', borderRadius:8, padding:'0.7rem 1rem', fontSize:'0.83rem', marginBottom:'1rem', animation:'fadeUp 0.3s ease' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.2rem' }}>
          {[
            { key:'email',    label:'Email',    type:'email',    placeholder:'you@example.com' },
            { key:'password', label:'Password', type:'password', placeholder:'••••••••' },
          ].map(field => (
            <div key={field.key} style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
              <label style={{ fontSize:'0.8rem', fontWeight:600, color: focused===field.key ? 'var(--accent)' : 'var(--muted2)', transition:'color 0.2s' }}>{field.label}</label>
              <input
                type={field.type}
                placeholder={field.placeholder}
                value={form[field.key]}
                onChange={e => setForm({...form, [field.key]: e.target.value})}
                onFocus={() => setFocused(field.key)}
                onBlur={() => setFocused(null)}
                required
                style={{
                  background:'var(--card)', color:'var(--text)', fontSize:'0.9rem',
                  border: `1px solid ${focused===field.key ? 'var(--accent-border)' : 'var(--border)'}`,
                  borderRadius:8, padding:'0.75rem 1rem', width:'100%', fontFamily:'var(--font)',
                  boxShadow: focused===field.key ? '0 0 0 3px rgba(0,229,160,0.08)' : 'none',
                  transition:'all 0.2s ease',
                  outline:'none',
                }}
              />
            </div>
          ))}

          <button type="submit" disabled={loading} style={{
            background: loading ? 'rgba(0,229,160,0.5)' : 'var(--accent)',
            color:'#0a0c10', border:'none', borderRadius:8, padding:'0.85rem',
            fontWeight:700, fontSize:'0.92rem', cursor: loading ? 'not-allowed' : 'pointer',
            marginTop:'0.5rem', width:'100%', fontFamily:'var(--font)',
            transition:'all 0.2s ease',
            transform: loading ? 'scale(0.98)' : 'scale(1)',
          }}
            onMouseEnter={e => { if(!loading) e.target.style.boxShadow='0 6px 24px rgba(0,229,160,0.35)' }}
            onMouseLeave={e => e.target.style.boxShadow='none'}
          >
            {loading ? '⏳ Signing in...' : 'Sign In →'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:'1.5rem', color:'var(--muted)', fontSize:'0.85rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color:'var(--accent)', fontWeight:600, textDecoration:'none' }}>Create one →</Link>
        </p>
      </div>
    </div>
  )
}
