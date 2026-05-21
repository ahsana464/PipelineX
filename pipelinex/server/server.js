import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './authRoutes.js'
import pipelineRoutes from './pipelineRoutes.js'
import settingsRoutes from './settingsRoutes.js'
import aiRoutes from './aiRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8001
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pipelinex'

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/auth', authRoutes)
app.use('/pipelines', pipelineRoutes)
app.use('/settings', settingsRoutes)
app.use('/ai', aiRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
})

// Connect to MongoDB and start
async function start() {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('✅ MongoDB connected')
    app.listen(PORT, () => {
      console.log(`🚀 PipelineX API running on http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message)
    console.log('⚠️  Server starting without DB — frontend will use mock mode')
    app.listen(PORT, () => {
      console.log(`🚀 PipelineX API running on http://localhost:${PORT} (no DB)`)
    })
  }
}

start()
