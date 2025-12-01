const express = require('express');
const Docker = require('dockerode');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const port = 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000' // Admin API origin
}));
app.use(express.json({ limit: '10mb' }));

// Initialize Dockerode
const docker = new Docker({
  socketPath: '/var/run/docker.sock'
});

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  
  const token = authHeader.substring(7);
  const validToken = process.env.DOCKER_PROXY_TOKEN || 'docker-proxy-secret-token';
  
  if (token !== validToken) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  next();
};

// Rate limiting middleware
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// Validate container name to prevent malicious container names
const isValidContainerName = (name) => {
  if (!name) return false;
  
  // Only allow container names from our allowed list
  const allowedNames = [
    'mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 
    'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play'
  ];
  
  return allowedNames.includes(name);
};

// Proxy endpoint: Get container status
app.get('/containers/:id/status', authenticate, async (req, res) => {
  try {
    const containerId = req.params.id;
    
    if (!isValidContainerName(containerId)) {
      return res.status(400).json({ error: 'Invalid container name' });
    }
    
    const container = docker.getContainer(containerId);
    const data = await container.inspect();
    
    res.json({
      id: data.Id,
      status: data.State.Status,
      running: data.State.Running,
      paused: data.State.Paused,
      restarting: data.State.Restarting,
      startedAt: data.State.StartedAt,
      finishedAt: data.State.FinishedAt,
      health: data.State.Health || null
    });
  } catch (error) {
    console.error('Error getting container status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint: Start a container
app.post('/containers/:id/start', authenticate, async (req, res) => {
  try {
    const containerId = req.params.id;
    
    if (!isValidContainerName(containerId)) {
      return res.status(400).json({ error: 'Invalid container name' });
    }
    
    const container = docker.getContainer(containerId);
    await container.start();
    
    res.json({ success: true, message: `Container ${containerId} started` });
  } catch (error) {
    console.error('Error starting container:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint: Stop a container
app.post('/containers/:id/stop', authenticate, async (req, res) => {
  try {
    const containerId = req.params.id;
    
    if (!isValidContainerName(containerId)) {
      return res.status(400).json({ error: 'Invalid container name' });
    }
    
    const container = docker.getContainer(containerId);
    await container.stop();
    
    res.json({ success: true, message: `Container ${containerId} stopped` });
  } catch (error) {
    console.error('Error stopping container:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint: Restart a container
app.post('/containers/:id/restart', authenticate, async (req, res) => {
  try {
    const containerId = req.params.id;
    
    if (!isValidContainerName(containerId)) {
      return res.status(400).json({ error: 'Invalid container name' });
    }
    
    const container = docker.getContainer(containerId);
    await container.restart();
    
    res.json({ success: true, message: `Container ${containerId} restarted` });
  } catch (error) {
    console.error('Error restarting container:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint: Get container logs
app.get('/containers/:id/logs', authenticate, async (req, res) => {
  try {
    const containerId = req.params.id;
    const { lines = 100 } = req.query;
    
    if (!isValidContainerName(containerId)) {
      return res.status(400).json({ error: 'Invalid container name' });
    }
    
    const container = docker.getContainer(containerId);
    const logs = await container.logs({
      follow: false,
      stdout: true,
      stderr: true,
      tail: parseInt(lines, 10) || 100
    });
    
    res.setHeader('Content-Type', 'text/plain');
    res.send(logs.toString());
  } catch (error) {
    console.error('Error getting container logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint: Execute command in container
app.post('/containers/:id/exec', authenticate, async (req, res) => {
  try {
    const containerId = req.params.id;
    const { cmd, attachStdout = true, attachStderr = true } = req.body;
    
    if (!isValidContainerName(containerId)) {
      return res.status(400).json({ error: 'Invalid container name' });
    }
    
    if (!cmd || !Array.isArray(cmd)) {
      return res.status(400).json({ error: 'Command array required' });
    }
    
    const container = docker.getContainer(containerId);
    const options = {
      Cmd: cmd,
      AttachStdout: attachStdout,
      AttachStderr: attachStderr,
    };
    
    const exec = await container.exec(options);
    const stream = await exec.start();
    
    let output = '';
    stream.on('data', (chunk) => {
      output += chunk.toString();
    });
    
    // Wait for the stream to finish
    await new Promise((resolve) => {
      stream.on('end', resolve);
    });
    
    res.json({ success: true, output });
  } catch (error) {
    console.error('Error executing command:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint: Get container stats
app.get('/containers/:id/stats', authenticate, async (req, res) => {
  try {
    const containerId = req.params.id;
    
    if (!isValidContainerName(containerId)) {
      return res.status(400).json({ error: 'Invalid container name' });
    }
    
    const container = docker.getContainer(containerId);
    const stats = await container.stats({ stream: false });
    
    res.json({
      cpu_stats: stats.cpu_stats,
      memory_stats: stats.memory_stats,
      network_stats: stats.networks || {},
      blkio_stats: stats.blkio_stats
    });
  } catch (error) {
    console.error('Error getting container stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'docker-proxy', timestamp: new Date().toISOString() });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Docker Proxy Server running on port ${port}`);
});