import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

export default function Settings() {
  const { user, token } = useAuth()
  const [show, setShow] = useState(false)
  const [saved, setSaved] = useState(false)
  const [focused, setFocused] = useState(null)
  const [showKeys, setShowKeys] = useState({})
  const [form, setForm] = useState({
    name: user?.name || 'Developer',
    email: user?.email || 'dev@pipelinex.app',
    dockerHubUsername: '',
    dockerHubToken: '',
    githubToken: '',
    azureClientId: '',
    azureClientSecret: '',
    azureTenantId: '',
    azureSubscriptionId: '',
    emailNotif: true,
    slackNotif: false,
    webhookNotif: false,
    webhookUrl: '',
  })

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

  useEffect(() => { setTimeout(() => setShow(true), 80) }, [])

  const handleSave = async () => {
    if (!token) return
    const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    try {
      await axios.put(`${API}/settings`, {
        dockerHubUsername: form.dockerHubUsername,
        dockerHubToken: form.dockerHubToken,
        githubToken: form.githubToken,
        azureClientId: form.azureClientId,
        azureClientSecret: form.azureClientSecret,
        azureTenantId: form.azureTenantId,
        azureSubscriptionId: form.azureSubscriptionId,
        notifications: {
          email: form.emailNotif,
          slack: form.slackNotif,
          webhook: form.webhookNotif,
        },
        webhookUrl: form.webhookUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch(e) {
      console.error(e)
    }
  }

  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) return
      const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      try {
        const res = await axios.get(`${API}/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.data) {
          setForm(prev => ({
            ...prev,
            dockerHubUsername: res.data.dockerHubUsername || '',
            dockerHubToken: res.data.dockerHubToken || '',
            githubToken: res.data.githubToken || '',
            azureClientId: res.data.azureClientId || '',
            azureClientSecret: res.data.azureClientSecret || '',
            azureTenantId: res.data.azureTenantId || '',
            azureSubscriptionId: res.data.azureSubscriptionId || '',
            emailNotif: res.data.notifications?.email ?? prev.emailNotif,
            slackNotif: res.data.notifications?.slack ?? prev.slackNotif,
            webhookNotif: res.data.notifications?.webhook ?? prev.webhookNotif,
            webhookUrl: res.data.webhookUrl || '',
          }))
        }
      } catch(e) {}
    }
    fetchSettings()
  }, [token])

  const Field = ({ label, name, type, placeholder, span }) => (
    <div style={{ gridColumn: span === 2 ? 'span 2' : 'span 1' }}>
      <label style={{ fontSize:'0.78rem', fontWeight:600, color: focused===name ? 'var(--accent)' : 'var(--muted2)', display:'block', marginBottom:4, transition:'color 0.2s' }}>{label}</label>
      <div style={{ position:'relative' }}>
        <input
          type={type === 'secret' ? (showKeys[name] ? 'text' : 'password') : type}
          placeholder={placeholder} value={form[name]}
          onChange={e => setForm({ ...form, [name]: e.target.value })}
          onFocus={() => setFocused(name)} onBlur={() => setFocused(null)}
          style={{
            background:'var(--card)', color:'var(--text)', border:`1px solid ${focused===name ? 'var(--accent-border)' : 'var(--border)'}`,
            borderRadius:8, padding:'0.7rem 1rem', width:'100%', fontSize:'0.85rem', fontFamily: type==='secret' ? 'var(--mono)' : 'var(--font)',
            outline:'none', boxShadow: focused===name ? '0 0 0 3px rgba(0,229,160,0.06)' : 'none', transition:'all 0.2s',
            paddingRight: type==='secret' ? '3rem' : '1rem',
          }}
        />
        {type === 'secret' && (
          <button onClick={() => setShowKeys(p => ({ ...p, [name]: !p[name] }))}
            style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:'0.82rem', padding:4 }}>
            {showKeys[name] ? '🙈' : '👁️'}
          </button>
        )}
      </div>
    </div>
  )

  const Toggle = ({ label, name, desc }) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.8rem 0', borderBottom:'1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize:'0.85rem', fontWeight:600 }}>{label}</div>
        <div style={{ fontSize:'0.75rem', color:'var(--muted)' }}>{desc}</div>
      </div>
      <button onClick={() => setForm({ ...form, [name]: !form[name] })}
        style={{
          width:44, height:24, borderRadius:12, border:'none', cursor:'pointer', position:'relative', transition:'background 0.3s',
          background: form[name] ? 'var(--accent)' : 'var(--border)',
        }}>
        <span style={{
          position:'absolute', top:2, left: form[name] ? 22 : 2,
          width:20, height:20, borderRadius:'50%', background:'white', transition:'left 0.3s',
          boxShadow:'0 1px 3px rgba(0,0,0,0.3)',
        }}/>
      </button>
    </div>
  )

  const Section = ({ title, icon, children }) => (
    <div style={{
      background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:'1.5rem', marginBottom:'1rem',
      opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(16px)', transition:'all 0.5s ease',
    }}>
      <h3 style={{ fontSize:'0.95rem', fontWeight:700, marginBottom:'1.2rem', display:'flex', alignItems:'center', gap:8 }}>
        {icon} {title}
      </h3>
      {children}
    </div>
  )

  return (
    <Layout>
      <div style={{ maxWidth:700, margin:'0 auto', animation:'fadeUp 0.5s ease' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem' }}>
          <div>
            <h1 style={{ fontSize:'1.6rem', fontWeight:800, letterSpacing:'-0.5px' }}>⚙️ Settings</h1>
            <p style={{ color:'var(--muted)', fontSize:'0.85rem' }}>Manage your profile, API keys, and preferences</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="theme-toggle-btn"
              onClick={toggleTheme}
              style={{ transform: isLight ? 'rotate(180deg)' : 'rotate(0deg)' }}
              title="Toggle Light/Dark Mode"
            >
              <span className={isLight ? 'theme-icon-light' : 'theme-icon-dark'} style={{ display: 'inline-block' }}>
                {isLight ? '☀️' : '🌙'}
              </span>
            </button>
            <button onClick={handleSave} className="btn-primary" style={{ padding:'0.5rem 1.2rem', fontSize:'0.85rem' }}>
              {saved ? '✓ Saved!' : '💾 Save Changes'}
            </button>
          </div>
        </div>

        {/* Success toast */}
        {saved && (
          <div style={{ background:'rgba(0,229,160,0.1)', border:'1px solid rgba(0,229,160,0.25)', color:'#00e5a0', borderRadius:10, padding:'0.7rem 1rem', fontSize:'0.83rem', marginBottom:'1rem', animation:'fadeUp 0.3s ease', display:'flex', alignItems:'center', gap:8 }}>
            ✅ Settings saved successfully
          </div>
        )}

        {/* Profile */}
        <Section title="Profile" icon="👤">
          <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.2rem' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--accent-dim)', border:'2px solid var(--accent-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', fontWeight:800, color:'var(--accent)', flexShrink:0 }}>
              {form.name?.[0]?.toUpperCase() || 'D'}
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:'1rem' }}>{form.name}</div>
              <div style={{ fontSize:'0.8rem', color:'var(--muted)', fontFamily:'var(--mono)' }}>{form.email}</div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <Field label="Full Name" name="name" type="text" placeholder="Your name" />
            <Field label="Email" name="email" type="email" placeholder="you@example.com" />
          </div>
        </Section>

        {/* API Keys */}
        <Section title="API Keys & Tokens" icon="🔑">
          <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'1rem' }}>
            <Field label="Docker Hub Username" name="dockerHubUsername" type="text" placeholder="username" span={2} />
            <Field label="Docker Hub Token" name="dockerHubToken" type="secret" placeholder="dckr_pat_xxxxxxxxxxxx" span={2} />
            <Field label="GitHub Personal Token" name="githubToken" type="secret" placeholder="ghp_xxxxxxxxxxxx" span={2} />
            <Field label="Azure Client ID" name="azureClientId" type="secret" placeholder="xxxx-xxxx-xxxx-xxxx" span={1} />
            <Field label="Azure Client Secret" name="azureClientSecret" type="secret" placeholder="xxxx~xxxx~xxxx" span={1} />
            <Field label="Azure Tenant ID" name="azureTenantId" type="text" placeholder="xxxx-xxxx-xxxx-xxxx" span={1} />
            <Field label="Azure Subscription ID" name="azureSubscriptionId" type="text" placeholder="xxxx-xxxx-xxxx-xxxx" span={1} />
          </div>
          <p style={{ fontSize:'0.73rem', color:'var(--muted)', marginTop:'1rem' }}>🔒 Keys are encrypted and stored securely. Never shared with third parties.</p>
        </Section>

        {/* Notifications */}
        <Section title="Notifications" icon="🔔">
          <Toggle label="Email Notifications" name="emailNotif" desc="Get build status updates via email" />
          <Toggle label="Slack Notifications" name="slackNotif" desc="Post deployment updates to Slack" />
          <Toggle label="Webhook Notifications" name="webhookNotif" desc="Send events to a custom webhook URL" />
          {form.webhookNotif && (
            <div style={{ marginTop:'0.8rem', animation:'fadeUp 0.3s ease' }}>
              <Field label="Webhook URL" name="webhookUrl" type="text" placeholder="https://hooks.example.com/webhook" span={2} />
            </div>
          )}
        </Section>

        {/* Danger Zone */}
        <div style={{
          background:'rgba(239,68,68,0.04)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:14, padding:'1.5rem',
          opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(16px)', transition:'all 0.5s ease 0.2s',
        }}>
          <h3 style={{ fontSize:'0.95rem', fontWeight:700, marginBottom:'0.5rem', color:'#ef4444' }}>⚠️ Danger Zone</h3>
          <p style={{ fontSize:'0.82rem', color:'var(--muted)', marginBottom:'1rem' }}>Once you delete your account, there is no going back. Please be certain.</p>
          <button style={{ background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'0.5rem 1rem', fontSize:'0.82rem', fontWeight:600, cursor:'pointer', fontFamily:'var(--font)', transition:'all 0.2s' }}
            onMouseEnter={e => { e.target.style.background='rgba(239,68,68,0.2)' }}
            onMouseLeave={e => { e.target.style.background='rgba(239,68,68,0.1)' }}
          >🗑️ Delete Account</button>
        </div>
      </div>
    </Layout>
  )
}
