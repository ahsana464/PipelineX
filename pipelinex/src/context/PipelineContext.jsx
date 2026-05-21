import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import axios from 'axios'

const PipelineContext = createContext(null)
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const demoPipelines = [
  { _id:'demo1', name:'react-portfolio',    repoUrl:'github.com/ahsan/react-portfolio',    stack:'React + Node.js',   status:'success', branch:'main',    buildTime:'2m 14s', createdAt: new Date(Date.now()-300000).toISOString(),  deployUrl:'https://react-portfolio.pipelinex.app' },
  { _id:'demo2', name:'django-api',         repoUrl:'github.com/ahsan/django-api',         stack:'Python + Django',   status:'running', branch:'develop', buildTime:'...',    createdAt: new Date(Date.now()-60000).toISOString(),   deployUrl:'https://django-api.pipelinex.app' },
  { _id:'demo3', name:'flask-microservice', repoUrl:'github.com/ahsan/flask-microservice', stack:'Python + Flask',    status:'failed',  branch:'main',    buildTime:'1m 02s', createdAt: new Date(Date.now()-3600000).toISOString(), deployUrl:'https://flask-micro.pipelinex.app' },
  { _id:'demo4', name:'nextjs-blog',        repoUrl:'github.com/ahsan/nextjs-blog',        stack:'Next.js + Prisma',  status:'success', branch:'main',    buildTime:'3m 41s', createdAt: new Date(Date.now()-10800000).toISOString(),deployUrl:'https://nextjs-blog.pipelinex.app' },
  { _id:'demo5', name:'express-backend',    repoUrl:'github.com/ahsan/express-backend',    stack:'Node.js + Express', status:'pending', branch:'feature', buildTime:'—',      createdAt: new Date(Date.now()-600000).toISOString(),  deployUrl:'https://express-api.pipelinex.app' },
]

export function PipelineProvider({ children }) {
  const { token } = useAuth()
  const [pipelines, setPipelines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPipelines()
  }, [token])

  const loadPipelines = async () => {
    setLoading(true)
    try {
      if (token) {
        const res = await axios.get(`${API}/pipelines`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const merged = [...res.data]
        setPipelines(merged)
      } else {
        setPipelines([])
      }
    } catch (err) {
      console.error("Failed to load pipelines:", err)
      setPipelines([])
    }
    setLoading(false)
  }

  const addPipeline = async (pipeline) => {
    try {
      if (token) {
        const res = await axios.post(`${API}/pipelines`, pipeline, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setPipelines(prev => [res.data, ...prev])
        return res.data
      }
    } catch { /* fallback below */ }

    // Removed fallback to local storage
  }

  const getPipeline = (id) => pipelines.find(p => p._id === id)

  const updatePipeline = async (id, data) => {
    try {
      if (token) {
        const res = await axios.patch(`${API}/pipelines/${id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setPipelines(prev => prev.map(p => p._id === id ? res.data : p))
        return res.data
      }
    } catch (err) {
      console.error("Failed to update pipeline:", err)
    }
  }

  const deletePipeline = async (id) => {
    try {
      if (token) {
        await axios.delete(`${API}/pipelines/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setPipelines(prev => prev.filter(p => p._id !== id))
      }
    } catch (err) {
      console.error("Failed to delete pipeline:", err)
    }
  }

  return (
    <PipelineContext.Provider value={{ pipelines, loading, addPipeline, getPipeline, updatePipeline, deletePipeline, loadPipelines }}>
      {children}
    </PipelineContext.Provider>
  )
}

export const usePipelines = () => useContext(PipelineContext)
