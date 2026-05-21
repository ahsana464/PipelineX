import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { Settings } from './models.js'

const router = Router()
const secret = process.env.JWT_SECRET || 'pipelinex_secret_key_2026'

function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ detail: 'No token' })
    const decoded = jwt.verify(token, secret)
    req.userId = decoded.id
    next()
  } catch {
    res.status(401).json({ detail: 'Invalid token' })
  }
}

// Get settings
router.get('/', auth, async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.userId })
    if (!settings) {
      settings = await Settings.create({ userId: req.userId })
    }
    res.json(settings)
  } catch {
    res.status(500).json({ detail: 'Server error' })
  }
})

// Update settings
router.put('/', auth, async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { userId: req.userId },
      { $set: req.body },
      { new: true, upsert: true }
    )
    res.json(settings)
  } catch {
    res.status(500).json({ detail: 'Server error' })
  }
})

export default router
