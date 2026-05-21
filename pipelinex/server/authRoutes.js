import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from './models.js'

const router = Router()
const secret = process.env.JWT_SECRET || 'pipelinex_secret_key_2026'

function makeToken(user) {
  return jwt.sign({ id: user._id, email: user.email }, secret, { expiresIn: '7d' })
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) return res.status(400).json({ detail: 'All fields required' })

    const exists = await User.findOne({ email: email.toLowerCase() })
    if (exists) return res.status(400).json({ detail: 'Email already registered' })

    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed })

    const token = makeToken(user)
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email },
      token
    })
  } catch (err) {
    res.status(500).json({ detail: 'Server error' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ detail: 'Email and password required' })

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return res.status(401).json({ detail: 'Invalid email or password' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ detail: 'Invalid email or password' })

    const token = makeToken(user)
    res.json({
      user: { id: user._id, name: user.name, email: user.email },
      token
    })
  } catch (err) {
    res.status(500).json({ detail: 'Server error' })
  }
})

// Get current user
router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization
    if (!auth) return res.status(401).json({ detail: 'No token' })
    const decoded = jwt.verify(auth.replace('Bearer ', ''), secret)
    const user = await User.findById(decoded.id).select('-password')
    if (!user) return res.status(404).json({ detail: 'User not found' })
    res.json({ id: user._id, name: user.name, email: user.email })
  } catch {
    res.status(401).json({ detail: 'Invalid token' })
  }
})

export default router
