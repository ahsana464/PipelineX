import { Router } from 'express'

const router = Router()

const SYSTEM_PROMPT = `You are PipelineX AI — a senior DevOps assistant built into the PipelineX CI/CD platform.

Your expertise includes:
- Docker & containerization (Dockerfiles, docker-compose, multi-stage builds)
- CI/CD pipelines (GitHub Actions, GitLab CI, Jenkins)
- Cloud deployment (AWS, GCP, Azure)
- Kubernetes & orchestration
- Monitoring, logging, and observability
- Security best practices for DevOps
- Build optimization & caching strategies

Rules:
- Keep responses concise and actionable
- Always provide code examples when relevant
- Use markdown formatting for code blocks
- If asked something outside DevOps, politely redirect to your domain
- Be friendly but professional
- When showing config files, use proper YAML/JSON/Dockerfile syntax`

// Models to try in order (fallback chain)
const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
]

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Chat endpoint
router.post('/', async (req, res) => {
  try {
    const { messages } = req.body
    if (!messages || !messages.length) {
      return res.status(400).json({ detail: 'Messages required' })
    }

    const GROQ_KEY = process.env.GROQ_API_KEY
    if (!GROQ_KEY) {
      return res.status(500).json({ detail: 'Groq API key not configured' })
    }

    // Build OpenAI-compatible messages format
    const chatMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(m => ({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: m.text,
      }))
    ]

    // Try each model with fallback
    let lastError = null
    for (const model of MODELS) {
      try {
        console.log(`🤖 Trying model: ${model}`)
        const response = await fetch(GROQ_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: chatMessages,
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 0.9,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.'
          console.log(`✅ AI response from ${model} (${data.usage?.total_tokens || '?'} tokens)`)
          return res.json({ reply })
        }

        // Rate limited
        if (response.status === 429) {
          const errText = await response.text()
          console.log(`⏳ Rate limited on ${model}:`, errText.slice(0, 200))
          lastError = `Rate limited on ${model}`
          continue // Try next model
        }

        // Other error
        const errText = await response.text()
        console.error(`❌ Groq API error (${model}): status=${response.status}`, errText.slice(0, 300))
        lastError = `API error ${response.status}`
        continue // Try next model
      } catch (fetchErr) {
        console.error(`❌ Fetch error (${model}):`, fetchErr.message)
        lastError = fetchErr.message
        continue
      }
    }

    console.error('All models failed:', lastError)
    return res.status(502).json({ detail: 'AI service temporarily unavailable. Please try again in a moment.' })
  } catch (err) {
    console.error('AI route error:', err.message)
    res.status(500).json({ detail: 'Server error' })
  }
})

export default router
