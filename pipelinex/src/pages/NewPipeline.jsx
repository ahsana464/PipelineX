import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { usePipelines } from '../context/PipelineContext'

const stackTemplates = {
  'React + Node.js': {
    dockerfile: `FROM node:20-alpine AS build\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nRUN npm run build\nRUN [ -d "/app/dist" ] && mv /app/dist /app/build || true\n\nFROM nginx:alpine\nCOPY --from=build /app/build /usr/share/nginx/html\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]`,
    cicd: `name: Deploy\non:\n  push:\n    branches: [main]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n      - run: npm install\n      - run: npm test\n      - run: npm run build\n      - name: Build & Push Docker\n        run: |\n          docker build -t $REPO .\n          docker push $REPO\n      - name: Deploy to EC2\n        run: ssh deploy@server "docker pull $REPO && docker-compose up -d"`,
    files: ['package.json','src/App.jsx','src/index.js','public/index.html','.eslintrc.js'],
  },
  'Python + Django': {
    dockerfile: `FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nRUN python manage.py collectstatic --noinput\nEXPOSE 8000\nCMD ["gunicorn","myapp.wsgi:application","--bind","0.0.0.0:8000"]`,
    cicd: `name: Deploy Django\non:\n  push:\n    branches: [main]\njobs:\n  test-and-deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-python@v5\n        with:\n          python-version: '3.11'\n      - run: pip install -r requirements.txt\n      - run: python manage.py test\n      - name: Build & Deploy\n        run: |\n          docker build -t $REPO .\n          docker push $REPO`,
    files: ['requirements.txt','manage.py','myapp/settings.py','myapp/urls.py','myapp/wsgi.py'],
  },
  'Python + Flask': {
    dockerfile: `FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nEXPOSE 5000\nCMD ["gunicorn","app:app","--bind","0.0.0.0:5000"]`,
    cicd: `name: Deploy Flask\non:\n  push:\n    branches: [main]\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: pip install -r requirements.txt\n      - run: pytest\n      - run: docker build -t $REPO . && docker push $REPO`,
    files: ['requirements.txt','app.py','config.py','tests/test_app.py'],
  },
  'Next.js': {
    dockerfile: `FROM node:20-alpine AS deps\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\n\nFROM node:20-alpine AS builder\nWORKDIR /app\nCOPY --from=deps /app/node_modules ./node_modules\nCOPY . .\nRUN npm run build\n\nFROM node:20-alpine\nWORKDIR /app\nCOPY --from=builder /app/.next ./.next\nCOPY --from=builder /app/node_modules ./node_modules\nCOPY --from=builder /app/package.json ./\nEXPOSE 3000\nCMD ["npm","start"]`,
    cicd: `name: Deploy Next.js\non:\n  push:\n    branches: [main]\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm install && npm run build\n      - run: docker build -t $REPO . && docker push $REPO`,
    files: ['package.json','next.config.js','pages/index.js','pages/api/hello.js','styles/globals.css'],
  },
  'Node.js + Express': {
    dockerfile: `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install --production\nCOPY . .\nEXPOSE 3000\nCMD ["node","server.js"]`,
    cicd: `name: Deploy Express\non:\n  push:\n    branches: [main]\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm install && npm test\n      - run: docker build -t $REPO . && docker push $REPO`,
    files: ['package.json','server.js','routes/api.js','middleware/auth.js','models/User.js'],
  },
}

const stacks = Object.keys(stackTemplates)

function detectStack(url) {
  const lower = url.toLowerCase()
  if (lower.includes('react') || lower.includes('portfolio') || lower.includes('passwordgenerator')) return 'React + Node.js'
  if (lower.includes('django')) return 'Python + Django'
  if (lower.includes('flask')) return 'Python + Flask'
  if (lower.includes('next')) return 'Next.js'
  if (lower.includes('express') || lower.includes('api') || lower.includes('backend')) return 'Node.js + Express'
  return 'React + Node.js'
}

function extractName(url) {
  const parts = url.replace(/https?:\/\//, '').split('/')
  return parts[parts.length - 1] || parts[parts.length - 2] || 'my-project'
}

const scanLines = (stack, files) => [
  { delay:400,  type:'cmd',     text:'pipelinex analyze --auto-detect' },
  { delay:900,  type:'info',    text:'→ Cloning repository...' },
  { delay:1500, type:'success', text:'✓ Repository cloned successfully' },
  { delay:2100, type:'info',    text:'→ Scanning project structure...' },
  ...files.map((f,i) => ({ delay:2600+i*300, type:'info', text:`  📄 Found: ${f}` })),
  { delay:2600+files.length*300+400, type:'success', text:`✓ Stack detected: ${stack}` },
  { delay:2600+files.length*300+900, type:'success', text:'✓ Dockerfile generated' },
  { delay:2600+files.length*300+1400, type:'success', text:'✓ CI/CD pipeline configured' },
  { delay:2600+files.length*300+1800, type:'warn',   text:'🚀 Ready to deploy!' },
]

const deployLines = (name) => [
  { delay:300,  type:'cmd',     text:`docker build -t pipelinex/${name} .` },
  { delay:800,  type:'info',    text:'→ Step 1/8: FROM node:18-alpine' },
  { delay:1400, type:'info',    text:'→ Step 2/8: WORKDIR /app' },
  { delay:1800, type:'info',    text:'→ Step 3/8: COPY package*.json ./' },
  { delay:2400, type:'info',    text:'→ Step 4/8: RUN npm ci' },
  { delay:3200, type:'info',    text:'→ Installing 847 packages...' },
  { delay:4000, type:'success', text:'✓ Dependencies installed (42s)' },
  { delay:4500, type:'info',    text:'→ Step 5/8: COPY . .' },
  { delay:5000, type:'info',    text:'→ Step 6/8: RUN npm run build' },
  { delay:5800, type:'success', text:'✓ Build completed (18s)' },
  { delay:6200, type:'info',    text:'→ Step 7/8: Building image layers...' },
  { delay:6800, type:'success', text:'✓ Image built: 127MB' },
  { delay:7200, type:'cmd',     text:`docker push pipelinex/${name}:latest` },
  { delay:7800, type:'success', text:'✓ Pushed to Docker Hub' },
  { delay:8200, type:'info',    text:'→ Deploying to AWS EC2...' },
  { delay:8800, type:'info',    text:'→ Starting container...' },
  { delay:9200, type:'success', text:'✓ Health check passed' },
  { delay:9600, type:'warn',    text:`🌍 Live → https://${name}.pipelinex.app` },
]

export default function NewPipeline() {
  const [step, setStep] = useState(0) // 0=input, 1=scanning, 2=review, 3=deploying, 4=done
  const [repoUrl, setRepoUrl] = useState('')
  const [focused, setFocused] = useState(false)
  const [scanOutput, setScanOutput] = useState([])
  const [deployOutput, setDeployOutput] = useState([])
  const [detectedStack, setDetectedStack] = useState('')
  const [projectName, setProjectName] = useState('')
  const [copied, setCopied] = useState(null)
  const [deployProgress, setDeployProgress] = useState(0)
  const termRef = useRef(null)
  const { addPipeline } = usePipelines()
  const navigate = useNavigate()

  const scrollToBottom = () => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight
  }

  useEffect(scrollToBottom, [scanOutput, deployOutput])

  const handleAnalyze = async (e) => {
    e.preventDefault()
    if (!repoUrl.trim()) return
    const name = extractName(repoUrl)
    setProjectName(name)
    setStep(1)
    setScanOutput([])

    // Start scanning animation with some initial lines
    const initialLines = [
      { delay: 100, type: 'cmd', text: 'pipelinex analyze --auto-detect' },
      { delay: 400, type: 'info', text: '→ Cloning repository...' },
    ]
    initialLines.forEach(l => setTimeout(() => setScanOutput(p => [...p, l]), l.delay))

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/pipelines/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ repoUrl })
      })

      if (res.ok) {
        const data = await res.json()
        const { stack, filesFound } = data
        setDetectedStack(stack)

        // Complete the scanning animation with actual files found
        const completionLines = [
          { delay: 100, type: 'success', text: '✓ Repository cloned successfully' },
          { delay: 400, type: 'info', text: '→ Scanning project structure...' },
          ...filesFound.map((f, i) => ({ delay: 700 + i * 200, type: 'info', text: `  📄 Found: ${f}` })),
          { delay: 700 + filesFound.length * 200 + 300, type: 'success', text: `✓ Stack detected: ${stack}` },
          { delay: 700 + filesFound.length * 200 + 600, type: 'success', text: '✓ Dockerfile generated' },
          { delay: 700 + filesFound.length * 200 + 900, type: 'success', text: '✓ CI/CD pipeline configured' },
          { delay: 700 + filesFound.length * 200 + 1200, type: 'warn', text: '🚀 Ready to deploy!' }
        ]

        completionLines.forEach(l => setTimeout(() => setScanOutput(p => [...p, l]), l.delay))
        setTimeout(() => setStep(2), 700 + filesFound.length * 200 + 1800)
      } else {
        fallbackAnalyze(name)
      }
    } catch (err) {
      console.error(err)
      fallbackAnalyze(name)
    }
  }

  const fallbackAnalyze = (name) => {
    const stack = detectStack(repoUrl)
    setDetectedStack(stack)
    const files = stackTemplates[stack].files
    const lines = scanLines(stack, files)
    lines.forEach(l => setTimeout(() => setScanOutput(p => [...p, l]), l.delay))
    setTimeout(() => setStep(2), lines[lines.length-1].delay + 800)
  }

  const handleDeploy = async () => {
    setStep(3)
    try {
      const template = stackTemplates[detectedStack]
      const newPipeline = await addPipeline({
        name: projectName,
        repoUrl: repoUrl,
        stack: detectedStack,
        branch: 'main',
        dockerfile: template.dockerfile,
        cicdConfig: template.cicd,
      })
      if (newPipeline && newPipeline._id) {
        navigate(`/pipeline/${newPipeline._id}`)
      } else {
        alert('Failed to create pipeline. Please try again.')
        setStep(0)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to create pipeline. Please try again.')
      setStep(0)
    }
  }

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const template = stackTemplates[detectedStack] || {}

  // Terminal component
  const Terminal = ({ lines, title }) => (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
      <div style={{ background:'#1a1d24', padding:'0.55rem 1rem', display:'flex', alignItems:'center', gap:6, borderBottom:'1px solid var(--border)' }}>
        <span style={{ width:10, height:10, borderRadius:'50%', background:'#ff5f57', display:'inline-block' }}/>
        <span style={{ width:10, height:10, borderRadius:'50%', background:'#febc2e', display:'inline-block' }}/>
        <span style={{ width:10, height:10, borderRadius:'50%', background:'#28c840', display:'inline-block' }}/>
        <span style={{ color:'var(--muted)', fontSize:'0.72rem', margin:'0 auto', fontFamily:'var(--mono)' }}>{title}</span>
      </div>
      <div ref={termRef} style={{ padding:'1rem 1.2rem', fontFamily:'var(--mono)', fontSize:'0.76rem', lineHeight:1.9, maxHeight:300, overflowY:'auto' }}>
        {lines.map((l, i) => (
          <div key={i} style={{ animation:'slideIn 0.3s ease forwards' }}>
            {l.type==='cmd'     && <><span style={{color:'var(--accent)'}}>$</span><span style={{color:'var(--text)',marginLeft:8}}>{l.text}</span></>}
            {l.type==='info'    && <span style={{color:'#6b7280',paddingLeft:16}}>{l.text}</span>}
            {l.type==='success' && <span style={{color:'var(--accent)',paddingLeft:16}}>{l.text}</span>}
            {l.type==='warn'    && <span style={{color:'var(--yellow)',paddingLeft:16}}>{l.text}</span>}
          </div>
        ))}
        {lines.length > 0 && step !== 2 && step !== 4 && <span style={{color:'var(--accent)',animation:'blink 1s infinite'}}>█</span>}
      </div>
    </div>
  )

  // Code block component
  const CodeBlock = ({ code, title, id }) => (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', marginBottom:'1rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.5rem 1rem', borderBottom:'1px solid var(--border)', background:'#1a1d24' }}>
        <span style={{ fontSize:'0.75rem', color:'var(--muted)', fontFamily:'var(--mono)' }}>{title}</span>
        <button onClick={() => copyText(code, id)} style={{ background: copied===id ? 'rgba(0,229,160,0.2)' : 'rgba(255,255,255,0.05)', color: copied===id ? '#00e5a0' : 'var(--muted)', border:'1px solid var(--border)', borderRadius:6, padding:'0.25rem 0.6rem', fontSize:'0.7rem', fontFamily:'var(--mono)', cursor:'pointer' }}>
          {copied===id ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>
      <pre style={{ padding:'1rem 1.2rem', margin:0, fontFamily:'var(--mono)', fontSize:'0.74rem', lineHeight:1.7, color:'var(--muted2)', overflowX:'auto', maxHeight:280 }}>
        {code}
      </pre>
    </div>
  )

  return (
    <Layout>
      <div style={{ maxWidth:800, margin:'0 auto', animation:'fadeUp 0.5s ease' }}>
        <h1 style={{ fontSize:'1.7rem', fontWeight:800, letterSpacing:'-0.5px', marginBottom:'0.25rem' }}>
          {step === 0 && '🚀 Deploy New Project'}
          {step === 1 && '🔍 Analyzing Repository...'}
          {step === 2 && '✅ Analysis Complete'}
          {step === 3 && '🐳 Building & Deploying...'}
          {step === 4 && '🎉 Deployment Successful!'}
        </h1>
        <p style={{ color:'var(--muted)', fontSize:'0.88rem', marginBottom:'2rem' }}>
          {step === 0 && 'Paste your GitHub repository URL and let AI do the rest'}
          {step === 1 && 'AI is scanning your repository and detecting the tech stack'}
          {step === 2 && 'Review the generated configuration before deploying'}
          {step === 3 && `Initializing pipeline and setting up deployment environment...`}
          {step === 4 && 'Your application is now live and running!'}
        </p>

        {/* Progress bar */}
        <div style={{ display:'flex', gap:4, marginBottom:'2rem' }}>
          {['Input','Analyze','Review','Deploy','Live'].map((label, i) => (
            <div key={i} style={{ flex:1, textAlign:'center' }}>
              <div style={{ height:3, borderRadius:2, background: step >= i ? 'var(--accent)' : 'var(--border)', transition:'background 0.5s', marginBottom:4 }}/>
              <span style={{ fontSize:'0.68rem', color: step >= i ? 'var(--accent)' : 'var(--muted)', fontWeight: step===i ? 700 : 400, fontFamily:'var(--mono)' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Step 0: Input */}
        {step === 0 && (
          <form onSubmit={handleAnalyze}>
            <div style={{ background:'var(--card)', border:`1px solid ${focused ? 'var(--accent-border)' : 'var(--border)'}`, borderRadius:14, padding:'2rem', transition:'border-color 0.2s', boxShadow: focused ? '0 0 0 4px rgba(0,229,160,0.06)' : 'none' }}>
              <label style={{ fontSize:'0.8rem', fontWeight:600, color: focused ? 'var(--accent)' : 'var(--muted2)', display:'block', marginBottom:'0.5rem' }}>GitHub Repository URL</label>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                <input
                  type="text" placeholder="github.com/username/repository"
                  value={repoUrl} onChange={e => setRepoUrl(e.target.value)}
                  onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                  style={{ flex:1, background:'var(--surface)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:8, padding:'0.8rem 1rem', fontFamily:'var(--mono)', fontSize:'0.88rem', outline:'none' }}
                />
                <button type="submit" className="btn-primary" style={{ whiteSpace:'nowrap' }}>
                  🔍 Analyze
                </button>
              </div>
              <p style={{ fontSize:'0.75rem', color:'var(--muted)', marginTop:'0.75rem' }}>
                💡 Try: github.com/ahsan/react-portfolio or github.com/ahsan/django-api
              </p>
            </div>
          </form>
        )}

        {/* Step 1: Scanning */}
        {step === 1 && <Terminal lines={scanOutput} title="pipelinex — analyzing" />}

        {/* Step 2: Review */}
        {step === 2 && (
          <div style={{ animation:'fadeUp 0.4s ease' }}>
            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1.5rem', alignItems:'center' }}>
              <span style={{ background:'rgba(0,229,160,0.1)', border:'1px solid rgba(0,229,160,0.25)', color:'#00e5a0', padding:'0.3rem 0.8rem', borderRadius:999, fontSize:'0.78rem', fontWeight:600 }}>📦 {projectName}</span>
              <div style={{ position:'relative', display:'inline-block' }}>
                <select
                  value={detectedStack}
                  onChange={(e) => setDetectedStack(e.target.value)}
                  style={{ appearance:'none', background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)', color:'#3b82f6', padding:'0.3rem 2rem 0.3rem 0.8rem', borderRadius:999, fontSize:'0.78rem', fontWeight:600, outline:'none', cursor:'pointer' }}
                >
                  {Object.keys(stackTemplates).map(s => (
                    <option key={s} value={s} style={{ background:'var(--surface)', color:'var(--text)' }}>🔧 {s}</option>
                  ))}
                </select>
                <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:'0.6rem', color:'#3b82f6', pointerEvents:'none' }}>▼</span>
              </div>
              <span style={{ background:'rgba(168,85,247,0.1)', border:'1px solid rgba(168,85,247,0.25)', color:'#a855f7', padding:'0.3rem 0.8rem', borderRadius:999, fontSize:'0.78rem', fontWeight:600 }}>⎇ main</span>
            </div>
            <CodeBlock code={template.dockerfile} title="Dockerfile" id="dockerfile" />
            <CodeBlock code={template.cicd} title=".github/workflows/deploy.yml" id="cicd" />
            <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.5rem' }}>
              <button onClick={handleDeploy} className="btn-primary" style={{ flex:1, textAlign:'center', padding:'0.9rem' }}>🚀 Deploy Now</button>
              <button onClick={() => setStep(0)} className="btn-outline" style={{ padding:'0.9rem' }}>← Back</button>
            </div>
          </div>
        )}

        {/* Step 3: Deploying */}
        {step === 3 && (
          <div>
            <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:'0.75rem 1rem', marginBottom:'1rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:'0.78rem', color:'var(--muted)', fontFamily:'var(--mono)' }}>Deployment Progress</span>
                <span style={{ fontSize:'0.78rem', color:'var(--accent)', fontWeight:700 }}>{deployProgress}%</span>
              </div>
              <div style={{ height:6, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', background:'linear-gradient(90deg, var(--accent), #3b82f6)', borderRadius:3, width:`${deployProgress}%`, transition:'width 0.5s ease' }}/>
              </div>
            </div>
            <Terminal lines={deployOutput} title="pipelinex — deploying" />
          </div>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <div style={{ textAlign:'center', animation:'fadeUp 0.5s ease' }}>
            <div style={{ fontSize:'4rem', marginBottom:'1rem', animation:'float 3s ease-in-out infinite' }}>🎉</div>
            <div style={{ background:'var(--card)', border:'1px solid var(--accent-border)', borderRadius:14, padding:'2rem', marginBottom:'1.5rem', animation:'glow 3s ease-in-out infinite' }}>
              <p style={{ color:'var(--muted)', fontSize:'0.82rem', marginBottom:'0.5rem' }}>Your app is live at</p>
              <a href={`https://${projectName}.pipelinex.app`} target="_blank" rel="noopener noreferrer" style={{ color:'var(--accent)', fontSize:'1.2rem', fontWeight:700, fontFamily:'var(--mono)', textDecoration:'none' }}>
                https://{projectName}.pipelinex.app
              </a>
              <div style={{ display:'flex', gap:'1.5rem', justifyContent:'center', marginTop:'1.5rem', flexWrap:'wrap' }}>
                {[{l:'Build Time',v:'2m 14s'},{l:'Image Size',v:'127 MB'},{l:'Container',v:'Running'},{l:'Region',v:'us-east-1'}].map((s,i) => (
                  <div key={i}>
                    <div style={{ fontSize:'0.7rem', color:'var(--muted)' }}>{s.l}</div>
                    <div style={{ fontSize:'0.88rem', fontWeight:700, fontFamily:'var(--mono)', color:'var(--accent)' }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
              <button onClick={() => navigate('/dashboard')} className="btn-primary">← Dashboard</button>
              <button onClick={() => { setStep(0); setRepoUrl(''); setScanOutput([]); setDeployOutput([]) }} className="btn-outline">Deploy Another</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
