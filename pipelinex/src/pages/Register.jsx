import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Register() {
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)
  const [focused, setFocused] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { setTimeout(() => setShow(true), 80) }, [])

  const strength = form.password.length === 0 ? 0 : form.password.length < 4 ? 1 : form.password.length < 8 ? 2 : 3
  const strengthColor = ['transparent','#ef4444','#f59e0b','#00e5a0'][strength]
  const strengthLabel = ['','Weak','Medium','Strong'][strength]

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); 
    if (form.password !== form.confirm) return setError('Passwords do not match')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true)
    try {
      const res = await axios.post(`${API}/auth/register`, { name:form.name, email:form.email, password:form.password })
      login(res.data.user, res.data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Try again.')
    } finally { setLoading(false) }
  }

  const fields = [
    { key:'name',     label:'Full Name',        type:'text',     placeholder:'Ahsan Ahmed',       span:2 },
    { key:'email',    label:'Email Address',    type:'email',    placeholder:'you@example.com',   span:2 },
    { key:'password', label:'Password',         type:'password', placeholder:'Min 6 characters',  span:1 },
    { key:'confirm',  label:'Confirm Password', type:'password', placeholder:'Repeat password',   span:1 },
  ]

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'2rem', position:'relative', overflow:'hidden' }}>

      <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
        <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,229,160,0.07) 0%, transparent 70%)', top:'-15%', left:'-10%', animation:'orb1 10s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 70%)', bottom:'-10%', right:'-5%', animation:'orb2 13s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,0.012) 1px, transparent 1px)', backgroundSize:'32px 32px' }}/>
      </div>

      <div style={{
        background:'var(--surface)', border:'1px solid var(--border)',
        borderRadius:18, padding:'2.5rem', width:'100%', maxWidth:500,
        position:'relative', zIndex:1,
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.97)',
        transition:'all 0.6s cubic-bezier(0.16,1,0.3,1)',
        animation: show ? 'glowBlue 5s ease-in-out infinite' : 'none',
      }}>
        <Link to="/" style={{ fontSize:'1.2rem', fontWeight:800, letterSpacing:'-0.5px', color:'var(--text)', textDecoration:'none', display:'block', marginBottom:'1.8rem' }}>
          Pipeline<span style={{color:'var(--accent)'}}>X</span>
        </Link>

        <h1 style={{ fontSize:'1.5rem', fontWeight:800, letterSpacing:'-0.5px', marginBottom:'0.3rem' }}>Create your account</h1>
        <p style={{ color:'var(--muted)', fontSize:'0.88rem', marginBottom:'1.8rem' }}>Start deploying with AI in minutes</p>

        {error && (
          <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#ef4444', borderRadius:8, padding:'0.7rem 1rem', fontSize:'0.83rem', marginBottom:'1rem', animation:'fadeUp 0.3s ease' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
            {fields.map(field => (
              <div key={field.key} style={{ gridColumn: field.span===2 ? 'span 2' : 'span 1', display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                <label style={{ fontSize:'0.8rem', fontWeight:600, color: focused===field.key ? 'var(--accent)' : 'var(--muted2)', transition:'color 0.2s' }}>{field.label}</label>
                <input
                  type={field.type} placeholder={field.placeholder}
                  value={form[field.key]}
                  onChange={e => setForm({...form, [field.key]: e.target.value})}
                  onFocus={() => setFocused(field.key)}
                  onBlur={() => setFocused(null)}
                  required
                  style={{
                    background:'var(--card)', color:'var(--text)', fontSize:'0.88rem',
                    border:`1px solid ${focused===field.key ? 'var(--accent-border)' : 'var(--border)'}`,
                    borderRadius:8, padding:'0.7rem 1rem', width:'100%', fontFamily:'var(--font)',
                    boxShadow: focused===field.key ? '0 0 0 3px rgba(0,229,160,0.08)' : 'none',
                    transition:'all 0.2s ease', outline:'none',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Password strength */}
          {form.password.length > 0 && (
            <div style={{ marginBottom:'1rem', animation:'fadeUp 0.3s ease' }}>
              <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ flex:1, height:3, borderRadius:2, background: strength >= i ? strengthColor : 'var(--border)', transition:'background 0.3s' }}/>
                ))}
              </div>
              <span style={{ fontSize:'0.72rem', color:strengthColor, fontWeight:600, transition:'color 0.3s' }}>{strengthLabel} password</span>
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            background: loading ? 'rgba(0,229,160,0.5)' : 'var(--accent)',
            color:'#0a0c10', border:'none', borderRadius:8, padding:'0.85rem',
            fontWeight:700, fontSize:'0.92rem', cursor: loading ? 'not-allowed' : 'pointer',
            width:'100%', fontFamily:'var(--font)', transition:'all 0.2s ease',
          }}
            onMouseEnter={e => { if(!loading) e.target.style.boxShadow='0 6px 24px rgba(0,229,160,0.35)' }}
            onMouseLeave={e => e.target.style.boxShadow='none'}
          >
            {loading ? '⏳ Creating account...' : 'Create Account →'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:'1.5rem', color:'var(--muted)', fontSize:'0.85rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:'var(--accent)', fontWeight:600, textDecoration:'none' }}>Sign in →</Link>
        </p>
      </div>
    </div>
  )
}
