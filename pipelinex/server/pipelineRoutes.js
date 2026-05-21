import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { Pipeline, Settings } from './models.js'
import { exec, spawn } from 'child_process'
import util from 'util'
import fs from 'fs'
import path from 'path'
import os from 'os'

const execAsync = util.promisify(exec)

const router = Router()
const secret = process.env.JWT_SECRET || 'pipelinex_secret_key_2026'

// Auth middleware
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

// Get all pipelines for user
router.get('/', auth, async (req, res) => {
  try {
    const pipelines = await Pipeline.find({ userId: req.userId }).sort({ createdAt: -1 })
    res.json(pipelines)
  } catch {
    res.status(500).json({ detail: 'Server error' })
  }
})

// Get single pipeline
router.get('/:id', auth, async (req, res) => {
  try {
    const pipeline = await Pipeline.findOne({ _id: req.params.id, userId: req.userId })
    if (!pipeline) return res.status(404).json({ detail: 'Pipeline not found' })
    res.json(pipeline)
  } catch {
    res.status(500).json({ detail: 'Server error' })
  }
})

// Delete pipeline & clean up resources
router.delete('/:id', auth, async (req, res) => {
  try {
    const pipeline = await Pipeline.findOne({ _id: req.params.id, userId: req.userId })
    if (!pipeline) return res.status(404).json({ detail: 'Pipeline not found' })

    const projectName = pipeline.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const containerId = pipeline.containerId

    // Ensure Azure CLI is in PATH for this delete request (Windows fix)
    if (process.platform === 'win32' && !process.env.PATH.includes('CLI2\\wbin')) {
      process.env.PATH = `${process.env.PATH};C:\\Program Files\\Microsoft SDKs\\Azure\\CLI2\\wbin`
    }

    // 1. Clean up deployed container
    if (containerId) {
      if (containerId.startsWith('aci-')) {
        const settings = await Settings.findOne({ userId: req.userId })
        if (settings && settings.azureClientId && settings.azureClientSecret && settings.azureTenantId && settings.azureSubscriptionId) {
          const azCmd = `az login --service-principal -u ${settings.azureClientId} -p ${settings.azureClientSecret} --tenant ${settings.azureTenantId} && az account set -s ${settings.azureSubscriptionId} && az container delete --resource-group PipelineX-Deployments --name ${projectName} --yes`
          execAsync(azCmd).catch(err => console.error("Azure container delete failed:", err))
        }
      } else {
        const dockerCmd = `docker rm -f ${containerId}`
        execAsync(dockerCmd).catch(err => console.error("Local Docker delete failed:", err))
      }
    }

    // 2. Delete database record
    await Pipeline.deleteOne({ _id: req.params.id, userId: req.userId })

    res.json({ message: 'Pipeline deleted and deployment cleanup initiated' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ detail: 'Server error' })
  }
})

// Helper function to parse GitHub URL
function parseGithubUrl(url) {
  let cleanUrl = url.trim().replace(/\/$/, '')
  if (cleanUrl.endsWith('.git')) cleanUrl = cleanUrl.slice(0, -4)
  
  if (cleanUrl.startsWith('git@github.com:')) {
    cleanUrl = cleanUrl.replace('git@github.com:', 'https://github.com/')
  }
  
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl
  }
  
  try {
    const parsed = new URL(cleanUrl)
    if (parsed.hostname.includes('github.com')) {
      const parts = parsed.pathname.split('/').filter(Boolean)
      if (parts.length >= 2) {
        return {
          owner: parts[0],
          repo: parts[1],
          isGithub: true
        }
      }
    }
  } catch (e) {
    console.error("URL parsing error:", e)
  }
  return { isGithub: false }
}

// Helper function to fetch GitHub files via raw URL
async function fetchGithubFile(owner, repo, filename) {
  const branches = ['main', 'master']
  for (const branch of branches) {
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filename}`
    try {
      const res = await fetch(url)
      if (res.ok) {
        return await res.text()
      }
    } catch (e) {
      console.error(`Failed to fetch ${filename} from branch ${branch}:`, e.message)
    }
  }
  return null
}

// Analyze repository tech stack
router.post('/analyze', auth, async (req, res) => {
  try {
    const { repoUrl } = req.body
    if (!repoUrl) return res.status(400).json({ detail: 'Repo URL required' })

    const parsed = parseGithubUrl(repoUrl)
    let stack = 'React + Node.js'
    let filesFound = ['package.json', 'src/App.jsx', 'public/index.html']

    if (parsed.isGithub) {
      const pkgContent = await fetchGithubFile(parsed.owner, parsed.repo, 'package.json')
      const reqsContent = await fetchGithubFile(parsed.owner, parsed.repo, 'requirements.txt')

      if (pkgContent) {
        let pkg = {}
        try {
          pkg = JSON.parse(pkgContent)
        } catch (e) {}
        
        const isNext = pkgContent.includes('"next"') || pkgContent.includes("'next'") || (pkg.dependencies && pkg.dependencies.next)
        const isReact = pkgContent.includes('"react"') || pkgContent.includes("'react'") || (pkg.dependencies && pkg.dependencies.react)
        const isExpress = pkgContent.includes('"express"') || pkgContent.includes("'express'") || (pkg.dependencies && pkg.dependencies.express)

        if (isNext) {
          stack = 'Next.js'
          filesFound = ['package.json', 'next.config.js', 'pages/index.js']
        } else if (isReact) {
          stack = 'React + Node.js'
          filesFound = ['package.json', 'src/App.jsx', 'public/index.html']
        } else if (isExpress) {
          stack = 'Node.js + Express'
          filesFound = ['package.json', 'server.js', 'routes/api.js']
        } else {
          stack = 'React + Node.js'
          filesFound = ['package.json', 'src/App.jsx']
        }
      } else if (reqsContent) {
        const isDjango = reqsContent.toLowerCase().includes('django')
        const isFlask = reqsContent.toLowerCase().includes('flask')

        if (isDjango) {
          stack = 'Python + Django'
          filesFound = ['requirements.txt', 'manage.py', 'myapp/settings.py']
        } else if (isFlask) {
          stack = 'Python + Flask'
          filesFound = ['requirements.txt', 'app.py', 'config.py']
        } else {
          stack = 'Python + Flask'
          filesFound = ['requirements.txt', 'app.py']
        }
      } else {
        // Fallback heuristics based on URL keywords
        const lowerUrl = repoUrl.toLowerCase()
        if (lowerUrl.includes('django')) {
          stack = 'Python + Django'
          filesFound = ['requirements.txt', 'manage.py']
        } else if (lowerUrl.includes('flask')) {
          stack = 'Python + Flask'
          filesFound = ['requirements.txt', 'app.py']
        } else if (lowerUrl.includes('next')) {
          stack = 'Next.js'
          filesFound = ['package.json', 'next.config.js']
        } else if (lowerUrl.includes('express') || lowerUrl.includes('api') || lowerUrl.includes('backend')) {
          stack = 'Node.js + Express'
          filesFound = ['package.json', 'server.js']
        } else {
          stack = 'React + Node.js'
          filesFound = ['package.json', 'src/App.jsx']
        }
      }
    } else {
      // Fallback heuristics based on URL keywords if not a public GitHub repo
      const lowerUrl = repoUrl.toLowerCase()
      if (lowerUrl.includes('django')) {
        stack = 'Python + Django'
        filesFound = ['requirements.txt', 'manage.py']
      } else if (lowerUrl.includes('flask')) {
        stack = 'Python + Flask'
        filesFound = ['requirements.txt', 'app.py']
      } else if (lowerUrl.includes('next')) {
        stack = 'Next.js'
        filesFound = ['package.json', 'next.config.js']
      } else if (lowerUrl.includes('express') || lowerUrl.includes('api') || lowerUrl.includes('backend')) {
        stack = 'Node.js + Express'
        filesFound = ['package.json', 'server.js']
      } else {
        stack = 'React + Node.js'
        filesFound = ['package.json', 'src/App.jsx']
      }
    }

    res.json({ stack, filesFound })
  } catch (err) {
    console.error("Repository analysis failed:", err)
    res.status(500).json({ detail: 'Failed to analyze repository' })
  }
})


// Create pipeline
router.post('/', auth, async (req, res) => {
  try {
    const { name, repoUrl, stack, dockerfile, cicdConfig, branch } = req.body
    if (!name || !repoUrl) return res.status(400).json({ detail: 'Name and repo URL required' })

    const pipeline = await Pipeline.create({
      userId: req.userId,
      name,
      repoUrl,
      stack: stack || '',
      dockerfile: dockerfile || '',
      cicdConfig: cicdConfig || '',
      branch: branch || 'main',
      status: 'running',
      buildTime: '',
      deployUrl: `https://${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pipelinex.app`,
      stages: [
        { name: 'Clone', status: 'pending', duration: '' },
        { name: 'Test', status: 'pending', duration: '' },
        { name: 'Build', status: 'pending', duration: '' },
        { name: 'Deploy', status: 'pending', duration: '' },
      ],
      logs: ['→ Pipeline initialized', `→ Target Repo: ${repoUrl}`],
    })
    
    res.status(201).json(pipeline)

    // Run build in background
    executePipelineBuild(pipeline._id, repoUrl, dockerfile)

  } catch (err) {
    res.status(500).json({ detail: 'Server error' })
  }
})

async function executePipelineBuild(pipelineId, repoUrl, customDockerfile) {
  // Ensure Azure CLI is in PATH (Windows fix)
  if (process.platform === 'win32' && !process.env.PATH.includes('CLI2\\wbin')) {
    process.env.PATH = `${process.env.PATH};C:\\Program Files\\Microsoft SDKs\\Azure\\CLI2\\wbin`
  }
  const updateStage = async (stageName, status, duration = '') => {
    await Pipeline.updateOne(
      { _id: pipelineId, 'stages.name': stageName },
      { $set: { 'stages.$.status': status, 'stages.$.duration': duration } }
    )
  }

  const addLog = async (message) => {
    if (!message) return
    await Pipeline.updateOne(
      { _id: pipelineId },
      { $push: { logs: message } }
    )
  }

  try {
    const pipeline = await Pipeline.findById(pipelineId)
    if (!pipeline) return

    const projectName = pipeline.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const clonePath = path.join(os.tmpdir(), `px_${projectName}_${Date.now()}`)

    // --- Stage 1: Clone ---
    await addLog(`→ Cloning repository...`)
    await updateStage('Clone', 'running')
    
    try {
      const cloneStartTime = Date.now()
      let cloneUrl = repoUrl
      if (!cloneUrl.startsWith('http')) cloneUrl = `https://${cloneUrl}`
      await execAsync(`git clone --depth 1 ${cloneUrl} ${clonePath}`, {
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
      })
      await addLog('✓ Clone successful')
      await updateStage('Clone', 'success', `${Math.floor((Date.now() - cloneStartTime) / 1000)}s`)
    } catch (err) {
      await addLog(`❌ Clone failed: ${err.message}`)
      await updateStage('Clone', 'failed')
      await Pipeline.updateOne({ _id: pipelineId }, { status: 'failed' })
      return
    }

    // --- Write Custom Dockerfile if provided ---
    if (customDockerfile) {
      await addLog('→ Writing custom Dockerfile generated by AI')
      fs.writeFileSync(path.join(clonePath, 'Dockerfile'), customDockerfile)
    }

    // --- Stage 2: Test ---
    await updateStage('Test', 'running')
    await addLog(`→ Starting Tests...`)
    try {
      const testStartTime = Date.now()
      
      // Determine test command
      let testCmd = ''
      if (pipeline.testCommand) testCmd = pipeline.testCommand
      else if (fs.existsSync(path.join(clonePath, 'package.json'))) {
        const pkg = JSON.parse(fs.readFileSync(path.join(clonePath, 'package.json'), 'utf8'))
        if (pkg.scripts && pkg.scripts.test) {
          testCmd = 'npm install && npm test'
        }
      } else if (fs.existsSync(path.join(clonePath, 'requirements.txt'))) {
        testCmd = 'pip install -r requirements.txt && pytest' // basic default
      }

      if (testCmd) {
        await addLog(`> Running tests: ${testCmd}`)
        const { stdout, stderr } = await execAsync(testCmd, { cwd: clonePath })
        if (stdout) stdout.split('\n').forEach(l => { if (l.trim()) addLog(l.trim()) })
        if (stderr) stderr.split('\n').forEach(l => { if (l.trim()) addLog(`[err] ${l.trim()}`) })
        await addLog('✓ Tests passed')
      } else {
        await addLog('⚠ No test command detected or configured. Skipping tests.')
      }

      await updateStage('Test', 'success', `${Math.floor((Date.now() - testStartTime) / 1000)}s`)
    } catch (err) {
      await addLog(`❌ Tests failed: ${err.message}`)
      if (err.stdout) err.stdout.split('\n').forEach(l => { if (l.trim()) addLog(l.trim()) })
      if (err.stderr) err.stderr.split('\n').forEach(l => { if (l.trim()) addLog(`[err] ${l.trim()}`) })
      await updateStage('Test', 'failed')
      await Pipeline.updateOne({ _id: pipelineId }, { status: 'failed' })
      return
    }

    // --- Stage 3: Docker Build ---
    await updateStage('Build', 'running')
    await addLog(`→ Starting Docker Build for ${projectName}:latest...`)
    
    let durationSecs = 0;
    try {
      const startTime = Date.now()
      await new Promise((resolve, reject) => {
        const build = spawn('docker', ['build', '-t', `${projectName}:latest`, '.'], { cwd: clonePath })
        
        build.stdout.on('data', (data) => {
          const lines = data.toString().split('\n')
          lines.forEach(l => { if (l.trim()) addLog(l.trim()) })
        })
        
        build.stderr.on('data', (data) => {
          const lines = data.toString().split('\n')
          lines.forEach(l => { if (l.trim()) addLog(`[err] ${l.trim()}`) })
        })
        
        build.on('close', (code) => {
          if (code === 0) resolve()
          else reject(new Error(`Docker build exited with code ${code}`))
        })
      })

      durationSecs = Math.floor((Date.now() - startTime) / 1000)
      await addLog('✓ Docker image built successfully')
      
      // Get image size
      try {
        const { stdout } = await execAsync(`docker inspect --format="{{.Size}}" ${projectName}:latest`)
        const sizeBytes = parseInt(stdout.trim(), 10)
        const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1) + ' MB'
        await addLog(`✓ Image Size: ${sizeMB}`)
        await Pipeline.updateOne({ _id: pipelineId }, { imageSize: sizeMB })
      } catch (e) {
        console.error("Failed to get image size", e)
      }

      await updateStage('Build', 'success', `${durationSecs}s`)

    } catch (err) {
      await addLog(`❌ Docker Build failed: ${err.message}`)
      await updateStage('Build', 'failed')
      await Pipeline.updateOne({ _id: pipelineId }, { status: 'failed' })
      return
    }

    // --- Stage 4: Deploy ---
    await updateStage('Deploy', 'running')
    await addLog(`→ Deploying container...`)
    
    try {
      const deployStartTime = Date.now()
      
      const settings = await Settings.findOne({ userId: pipeline.userId })
      const hasAzure = settings && settings.azureClientId && settings.azureClientSecret && settings.azureTenantId && settings.azureSubscriptionId
      const hasDocker = settings && settings.dockerHubToken && settings.dockerHubUsername

      let deployUrl = ''
      let containerId = ''
      let deployedPort = 0

      if (hasAzure && hasDocker) {
        await addLog('→ Azure credentials detected. Preparing to deploy to Azure Container Instances (ACI).')
        
        // Push to Docker Hub
        await addLog(`> docker login -u ${settings.dockerHubUsername}`)
        await execAsync(`docker login -u ${settings.dockerHubUsername} -p ${settings.dockerHubToken}`)
        
        await addLog(`> docker tag ${projectName}:latest ${settings.dockerHubUsername}/${projectName}:latest`)
        await execAsync(`docker tag ${projectName}:latest ${settings.dockerHubUsername}/${projectName}:latest`)
        
        await addLog(`> docker push ${settings.dockerHubUsername}/${projectName}:latest`)
        await execAsync(`docker push ${settings.dockerHubUsername}/${projectName}:latest`)
        await addLog('✓ Image pushed to Docker Hub successfully.')

        // Login to Azure
        await addLog('> az login --service-principal')
        await execAsync(`az login --service-principal -u ${settings.azureClientId} -p ${settings.azureClientSecret} --tenant ${settings.azureTenantId}`)
        await execAsync(`az account set -s ${settings.azureSubscriptionId}`)

        const resourceGroup = 'PipelineX-Deployments'
        try {
          await execAsync(`az group show --name ${resourceGroup}`)
        } catch {
          await addLog(`> Creating Azure Resource Group: ${resourceGroup}`)
          await execAsync(`az group create --name ${resourceGroup} --location eastus`)
        }

        const dnsLabel = `px-${projectName}-${Math.floor(Math.random() * 10000)}`
        await addLog(`> Creating Azure Container Instance...`)
        const aciCmd = `az container create --resource-group ${resourceGroup} --name ${projectName} --image ${settings.dockerHubUsername}/${projectName}:latest --dns-name-label ${dnsLabel} --ports 80 3000 --os-type Linux --cpu 1 --memory 1.5 --registry-login-server index.docker.io --registry-username ${settings.dockerHubUsername} --registry-password ${settings.dockerHubToken}`
        await execAsync(aciCmd)
        
        const fqdn = `${dnsLabel}.eastus.azurecontainer.io`
        await addLog(`✓ ACI Created! App is live at ${fqdn}`)
        
        containerId = `aci-${projectName}`
        deployUrl = `http://${fqdn}`
        deployedPort = 80

      } else {
        await addLog('⚠ Missing Azure or Docker Hub credentials. Falling back to local Docker deployment.')
        // Stop and remove existing container if it exists
        try {
          await execAsync(`docker rm -f px_${projectName}`)
        } catch(e) {}
        
        await addLog(`> docker run -d -P --name px_${projectName} ${projectName}:latest`)
        const { stdout: runOut } = await execAsync(`docker run -d -P --name px_${projectName} ${projectName}:latest`)
        containerId = runOut.trim().substring(0, 12)
        
        // Get mapped port
        const { stdout: portOut } = await execAsync(`docker port px_${projectName}`)
        const portMatch = portOut.match(/:(\d+)/)
        if (portMatch) deployedPort = parseInt(portMatch[1], 10)

        await addLog(`✓ Local Container started! ID: ${containerId}`)
        if (deployedPort) {
           await addLog(`🌍 App is live at port ${deployedPort}`)
           deployUrl = `http://localhost:${deployedPort}`
        }
      }
      
      const deployDuration = Math.floor((Date.now() - deployStartTime) / 1000)
      await updateStage('Deploy', 'success', `${deployDuration}s`)
      
      await Pipeline.updateOne(
        { _id: pipelineId },
        { 
          status: 'success', 
          buildTime: `${durationSecs}s`,
          containerId: containerId,
          deployedPort: deployedPort,
          deployUrl: deployUrl
        }
      )
      await addLog(`🎉 Pipeline completed successfully!`)

    } catch (err) {
      await addLog(`❌ Deploy failed: ${err.message}`)
      await updateStage('Deploy', 'failed')
      await Pipeline.updateOne({ _id: pipelineId }, { status: 'failed' })
    }

    // Clean up
    fs.rmSync(clonePath, { recursive: true, force: true })

  } catch (err) {
    console.error("Pipeline execution failed:", err)
    await Pipeline.updateOne({ _id: pipelineId }, { status: 'failed' })
  }
}

// Update pipeline status
router.patch('/:id', auth, async (req, res) => {
  try {
    const pipeline = await Pipeline.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: req.body },
      { new: true }
    )
    if (!pipeline) return res.status(404).json({ detail: 'Pipeline not found' })
    res.json(pipeline)
  } catch {
    res.status(500).json({ detail: 'Server error' })
  }
})

// Delete pipeline
router.delete('/:id', auth, async (req, res) => {
  try {
    const pipeline = await Pipeline.findOneAndDelete({ _id: req.params.id, userId: req.userId })
    if (!pipeline) return res.status(404).json({ detail: 'Pipeline not found' })
    res.json({ message: 'Pipeline deleted' })
  } catch {
    res.status(500).json({ detail: 'Server error' })
  }
})

// Get system stats
const getCpuUsage = async () => {
  const cpus = os.cpus();
  const startIdle = cpus.map(c => c.times.idle);
  const startTotal = cpus.map(c => Object.values(c.times).reduce((a, b) => a + b, 0));
  
  await new Promise(r => setTimeout(r, 100));
  
  const endCpus = os.cpus();
  const endIdle = endCpus.map(c => c.times.idle);
  const endTotal = endCpus.map(c => Object.values(c.times).reduce((a, b) => a + b, 0));

  let idleDiff = 0, totalDiff = 0;
  for (let i = 0; i < cpus.length; i++) {
    idleDiff += endIdle[i] - startIdle[i];
    totalDiff += endTotal[i] - startTotal[i];
  }
  if (totalDiff === 0) return 0;
  const usage = 100 - Math.floor((idleDiff / totalDiff) * 100);
  return isNaN(usage) ? 0 : usage;
};

router.get('/system', auth, async (req, res) => {
  try {
    const cpu = await getCpuUsage();
    const mem = Math.floor(((os.totalmem() - os.freemem()) / os.totalmem()) * 100);
    
    let containers = [];
    try {
      const [{ stdout: psOut }, { stdout: statsOut }] = await Promise.all([
        execAsync('docker ps --format "{{json .}}"').catch(() => ({ stdout: '' })),
        execAsync('docker stats --no-stream --format "{{json .}}"').catch(() => ({ stdout: '' }))
      ]);
      
      const psLines = psOut.trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
      const statsLines = statsOut.trim().split('\n').filter(Boolean).map(l => JSON.parse(l));

      containers = psLines.map(c => {
        const stat = statsLines.find(s => s.Name === c.Names || s.ID === c.ID) || {};
        return {
          name: c.Names,
          status: c.State,
          port: c.Ports || '—',
          cpu: stat.CPUPerc || '—',
          mem: stat.MemUsage || '—',
          uptime: c.Status
        };
      });
    } catch (e) {}

    // Fetch active Azure ACI containers from the database
    try {
      const activeAciPipelines = await Pipeline.find({ userId: req.userId, status: 'success', containerId: { $regex: /^aci-/ } });
      const aciContainers = activeAciPipelines.map(p => ({
        name: `${p.name} (Azure ACI)`,
        status: 'running',
        port: '80, 3000',
        cpu: '1.0 core',
        mem: '1.5 GB',
        uptime: 'Live (Cloud)'
      }));
      containers = [...containers, ...aciContainers];
    } catch (err) {
      console.error(err);
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const deploys = await Pipeline.aggregate([
      { $match: { userId: req.userId, createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dayOfWeek: "$createdAt" }, count: { $sum: 1 } } }
    ]);
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let deployData = days.map((day, i) => ({ day, deploys: 0 }));
    
    deploys.forEach(d => {
      deployData[d._id - 1].deploys = d.count;
    });

    res.json({ cpu, mem, containers, deployData });
  } catch (err) {
    res.status(500).json({ detail: 'Server error' });
  }
})

// Get stats
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const total = await Pipeline.countDocuments({ userId: req.userId })
    const success = await Pipeline.countDocuments({ userId: req.userId, status: 'success' })
    const failed = await Pipeline.countDocuments({ userId: req.userId, status: 'failed' })
    const running = await Pipeline.countDocuments({ userId: req.userId, status: 'running' })
    res.json({ total, success, failed, running })
  } catch {
    res.status(500).json({ detail: 'Server error' })
  }
})

// Webhook endpoint
router.post('/webhook/github', async (req, res) => {
  try {
    const payload = req.body
    
    // Check if it's a push event
    if (req.headers['x-github-event'] === 'push' || payload.ref) {
      const repoUrl = payload.repository?.html_url || payload.repository?.url
      if (!repoUrl) return res.status(400).send('No repository URL found')
      
      // Find pipelines matching this repoUrl
      const pipelines = await Pipeline.find({ repoUrl: repoUrl })
      
      if (pipelines.length === 0) {
        return res.status(200).send('No matching pipelines found')
      }

      for (const pipeline of pipelines) {
        // Reset pipeline to pending/running
        await Pipeline.updateOne(
          { _id: pipeline._id },
          { 
            status: 'running',
            logs: [`→ Triggered by GitHub Webhook: ${payload.head_commit?.message || 'push event'}`, `→ Target Repo: ${repoUrl}`],
            'stages.$[].status': 'pending',
            'stages.$[].duration': ''
          }
        )
        // Execute build asynchronously
        executePipelineBuild(pipeline._id, repoUrl, pipeline.dockerfile)
      }
      return res.status(200).send('Pipelines triggered')
    }
    
    res.status(200).send('Ignored event')
  } catch (err) {
    console.error('Webhook error:', err)
    res.status(500).send('Server error')
  }
})

export default router
