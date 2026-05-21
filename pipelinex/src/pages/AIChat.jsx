import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const suggestions = [
  '🐳 Generate a Dockerfile for React',
  '🔧 Fix my build error',
  '📊 How to add monitoring?',
  '🚀 Best practices for CI/CD',
]

// Fallback responses when API is down
const fallbackResponses = {
  'dockerfile': "Here's a production-ready Dockerfile for a React app:\n\n```dockerfile\nFROM node:18-alpine AS build\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM nginx:alpine\nCOPY --from=build /app/build /usr/share/nginx/html\nEXPOSE 80\nCMD [\"nginx\", \"-g\", \"daemon off;\"]\n```\n\nThis uses multi-stage builds for a ~25MB final image.",
  'error': "Common build fixes:\n\n```bash\n# Module not found → npm install\n# No space → docker system prune -a\n# Permission denied → Add USER node in Dockerfile\n# Port in use → docker-compose down && docker-compose up -d\n```",
  'monitor': "Add monitoring with Prometheus + Grafana:\n\n```yaml\nservices:\n  prometheus:\n    image: prom/prometheus\n    ports: [\"9090:9090\"]\n  grafana:\n    image: grafana/grafana\n    ports: [\"3001:3000\"]\n```",
  'cicd': "CI/CD best practices:\n\n```yaml\nname: CI/CD Pipeline\non:\n  push:\n    branches: [main]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci && npm test\n  deploy:\n    needs: test\n    runs-on: ubuntu-latest\n    steps:\n      - run: docker build -t app . && docker push app\n```",
}

function getFallback(msg) {
  const l = msg.toLowerCase()
  if (l.includes('docker')) return fallbackResponses.dockerfile
  if (l.includes('error') || l.includes('fix') || l.includes('bug')) return fallbackResponses.error
  if (l.includes('monitor') || l.includes('metric')) return fallbackResponses.monitor
  if (l.includes('ci') || l.includes('cd') || l.includes('pipeline') || l.includes('deploy')) return fallbackResponses.cicd
  return "I'm your DevOps assistant! Ask me about Docker, CI/CD, deployments, or debugging. *(Note: AI service is currently offline, using cached responses)*"
}

// Parse markdown-ish text to render code blocks nicely
function renderMessage(text) {
  if (!text) return null

  const parts = []
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Text before code block
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'code', lang: match[1] || 'code', content: match[2].trim() })
    lastIndex = match.index + match[0].length
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }

  if (parts.length === 0) {
    parts.push({ type: 'text', content: text })
  }

  return parts
}

export default function AIChat() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hey! 👋 I'm your AI DevOps assistant powered by Groq. Ask me anything about Docker, CI/CD, deployments, or debugging.", parsed: null }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [copied, setCopied] = useState(null)
  const chatRef = useRef(null)

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages, typing])

  const send = async (text) => {
    if (!text.trim() || typing) return
    const userMsg = text.trim()
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setInput('')
    setTyping(true)

    try {
      // Build conversation history for Gemini
      const history = messages
        .filter(m => m.role === 'user' || m.role === 'ai')
        .map(m => ({ role: m.role === 'ai' ? 'model' : 'user', text: m.text }))

      history.push({ role: 'user', text: userMsg })

      const res = await axios.post(`${API}/ai`, { messages: history })
      const reply = res.data.reply

      setMessages(prev => [...prev, {
        role: 'ai',
        text: reply,
        parsed: renderMessage(reply),
      }])
    } catch (err) {
      console.warn('AI API error, using fallback:', err.message)
      const fallback = getFallback(userMsg)
      setMessages(prev => [...prev, {
        role: 'ai',
        text: fallback,
        parsed: renderMessage(fallback),
      }])
    }
    setTyping(false)
  }

  const handleSubmit = (e) => { e.preventDefault(); send(input) }
  const copyCode = (code, id) => { navigator.clipboard.writeText(code); setCopied(id); setTimeout(() => setCopied(null), 2000) }

  const CodeBlock = ({ code, lang, id }) => (
    <div style={{ marginTop: '0.6rem', marginBottom: '0.4rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.8rem', borderBottom: '1px solid var(--border)', background: '#1a1d24' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{lang}</span>
        <button onClick={() => copyCode(code, id)} style={{ background: copied === id ? 'rgba(0,229,160,0.2)' : 'rgba(255,255,255,0.05)', color: copied === id ? '#00e5a0' : 'var(--muted)', border: '1px solid var(--border)', borderRadius: 5, padding: '0.15rem 0.5rem', fontSize: '0.68rem', fontFamily: 'var(--mono)', cursor: 'pointer', transition: 'all 0.2s' }}>
          {copied === id ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>
      <pre style={{ padding: '0.8rem', margin: 0, fontFamily: 'var(--mono)', fontSize: '0.73rem', lineHeight: 1.7, color: 'var(--muted2)', overflowX: 'auto' }}>
        {code}
      </pre>
    </div>
  )

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)', animation: 'fadeUp 0.5s ease' }}>
        {/* Header */}
        <div style={{ marginBottom: '1rem', flexShrink: 0 }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🤖 AI Assistant
            <span style={{ fontSize: '0.65rem', background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.25)', color: '#00e5a0', padding: '0.15rem 0.5rem', borderRadius: 999, fontWeight: 600, verticalAlign: 'middle' }}>Groq</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Your DevOps copilot — powered by Groq AI</p>
        </div>

        {/* Chat Area */}
        <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1rem' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '1rem', animation: 'fadeUp 0.3s ease' }}>
              <div style={{
                maxWidth: '78%',
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--card)',
                color: msg.role === 'user' ? '#0a0c10' : 'var(--text)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                padding: '1rem 1.2rem',
              }}>
                {msg.role === 'ai' && <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600, marginBottom: '0.5rem' }}>🤖 PipelineX AI</div>}

                {/* Render parsed message with code blocks */}
                {msg.parsed ? (
                  msg.parsed.map((part, j) => (
                    part.type === 'code' ? (
                      <CodeBlock key={j} code={part.content} lang={part.lang} id={`${i}-${j}`} />
                    ) : (
                      <div key={j} style={{ fontSize: '0.86rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{part.content}</div>
                    )
                  ))
                ) : (
                  <div style={{ fontSize: '0.86rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px 14px 14px 4px', padding: '1rem 1.2rem' }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600, marginRight: 8 }}>🤖 PipelineX AI</span>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: `pulse 1s infinite`, animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem', flexShrink: 0 }}>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => send(s.replace(/^[^\s]+\s/, ''))}
              disabled={typing}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 999, padding: '0.35rem 0.8rem', fontSize: '0.75rem', color: 'var(--muted2)', cursor: typing ? 'not-allowed' : 'pointer', fontFamily: 'var(--font)', transition: 'all 0.2s', opacity: typing ? 0.5 : 1 }}
              onMouseEnter={e => { if (!typing) { e.target.style.borderColor = 'var(--accent-border)'; e.target.style.color = 'var(--accent)' } }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--muted2)' }}
            >{s}</button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            placeholder="Ask about Docker, CI/CD, deployments..."
            style={{ flex: 1, background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.8rem 1rem', fontSize: '0.88rem', fontFamily: 'var(--font)', outline: 'none', transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent-border)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <button type="submit" disabled={!input.trim() || typing} className="btn-primary" style={{ padding: '0.8rem 1.2rem', opacity: !input.trim() || typing ? 0.5 : 1 }}>
            Send →
          </button>
        </form>
      </div>
    </Layout>
  )
}
