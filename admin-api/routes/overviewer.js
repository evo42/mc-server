const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const overviewerService = require('../services/overviewerService');

const router = express.Router();

// Rate limiting for Overviewer endpoints
const overviewerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input validation schemas
const serverSchema = Joi.string().pattern(/^[a-zA-Z0-9-_]+$/).min(3).max(50);
const worldSchema = Joi.string().pattern(/^[a-zA-Z0-9-_]+$/).min(1).max(50);
const renderModeSchema = Joi.string().valid('lighting', 'night', 'cave', 'smooth_lighting', 'mineral');
const jobIdSchema = Joi.string().pattern(/^[a-zA-Z0-9-_]+$/).min(5).max(100);
const titleSchema = Joi.string().trim().min(1).max(200);
const descriptionSchema = Joi.string().trim().max(500);

// Validation middleware
const validateServer = (req, res, next) => {
  const { error } = serverSchema.validate(req.params.server);
  if (error) {
    return res.status(400).json({
      error: 'Invalid server name format',
      details: 'Server name must contain only alphanumeric characters, hyphens, and underscores',
      provided: req.params.server
    });
  }
  next();
};

const validateWorld = (req, res, next) => {
  const { error } = worldSchema.validate(req.params.world);
  if (error) {
    return res.status(400).json({
      error: 'Invalid world name format',
      details: 'World name must contain only alphanumeric characters, hyphens, and underscores',
      provided: req.params.world
    });
  }
  next();
};

const validateJobId = (req, res, next) => {
  const { error } = jobIdSchema.validate(req.params.jobId);
  if (error) {
    return res.status(400).json({
      error: 'Invalid job ID format',
      details: 'Job ID must be between 5-100 characters, containing only alphanumeric characters, hyphens, and underscores',
      provided: req.params.jobId
    });
  }
  next();
};

const validateRenderRequest = (req, res, next) => {
  const renderSchema = Joi.object({
    rendermode: renderModeSchema.default('lighting'),
    forcerender: Joi.boolean().default(false)
  });

  const { error, value } = renderSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Invalid render request parameters',
      details: error.details.map(detail => detail.message)
    });
  }

  req.body = value;
  next();
};

const validatePublicRequest = (req, res, next) => {
  const publicSchema = Joi.object({
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    renderJobId: jobIdSchema.optional()
  });

  const { error, value } = publicSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Invalid public map request parameters',
      details: error.details.map(detail => detail.message)
    });
  }

  req.body = value;
  next();
};

// Apply rate limiting to all Overviewer routes
router.use(overviewerLimiter);

// Overviewer service configuration
const OVERVIEWER_SERVICE_URL = process.env.OVERVIEWER_SERVICE_URL || 'http://overviewer:8080';
const RENDER_OUTPUT_DIR = '/data/output';
const WORLD_DATA_DIR = '/data/worlds';

// Available servers and their world paths
const serverWorldPaths = {
  'mc-ilias': '/data/worlds/mc-ilias',
  'mc-niilo': '/data/worlds/mc-niilo',
  'mc-bgstpoelten': '/data/worlds/mc-bgstpoelten',
  'mc-htlstp': '/data/worlds/mc-htlstp',
  'mc-borgstpoelten': '/data/worlds/mc-borgstpoelten',
  'mc-hakstpoelten': '/data/worlds/mc-hakstpoelten',
  'mc-basop-bafep-stp': '/data/worlds/mc-basop-bafep-stp',
  'mc-play': '/data/worlds/mc-play'
};

// Utility function to check if Overviewer service is available
async function checkOverviewerHealth() {
  try {
    const response = await axios.get(`${OVERVIEWER_SERVICE_URL}/health`, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.error('Overviewer health check failed:', error.message);
    return false;
  }
}

// Utility function to run Overviewer commands
async function runOverviewerCommand(args, worldPath, outputPath) {
  return new Promise((resolve, reject) => {
    const overviewerPath = '/usr/local/bin/overviewer.py';

    const overviewer = spawn('python', [
      overviewerPath,
      '--config=/app/overviewer_config.py',
      '--processes=4'
    ], {
      cwd: '/app',
      env: { ...process.env, PYTHONPATH: '/app' }
    });

    let output = '';
    let error = '';

    overviewer.stdout.on('data', (data) => {
      output += data.toString();
    });

    overviewer.stderr.on('data', (data) => {
      error += data.toString();
    });

    overviewer.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Overviewer failed with code ${code}: ${error}`));
      }
    });

    overviewer.on('error', (err) => {
      reject(err);
    });
  });
}

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const healthy = await checkOverviewerHealth();
    res.json({
      success: healthy,
      service: 'overviewer',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'overviewer'
    });
  }
});

// Get all available worlds from all servers
router.get('/worlds', async (req, res) => {
  try {
    const worlds = [];

    for (const [serverName, worldPath] of Object.entries(serverWorldPaths)) {
      try {
        const stats = await fs.stat(worldPath);
        if (stats.isDirectory()) {
          // Check for level.dat (Minecraft world indicator)
          const levelDatPath = path.join(worldPath, 'level.dat');
          try {
            await fs.access(levelDatPath);
            worlds.push({
              server: serverName,
              worldPath: worldPath,
              name: serverName,
              size: stats.size,
              modified: stats.mtime,
              accessible: true
            });
          } catch (levelError) {
            // level.dat not found, skip this world
            worlds.push({
              server: serverName,
              worldPath: worldPath,
              name: serverName,
              size: stats.size,
              modified: stats.mtime,
              accessible: false,
              error: 'No level.dat found'
            });
          }
        }
      } catch (statError) {
        worlds.push({
          server: serverName,
          worldPath: worldPath,
          name: serverName,
          accessible: false,
          error: 'World directory not accessible'
        });
      }
    }

    res.json({
      worlds,
      total: worlds.length,
      accessible: worlds.filter(w => w.accessible).length
    });
  } catch (error) {
    console.error('Error getting worlds:', error);
    res.status(500).json({
      error: 'Failed to get worlds',
      details: error.message
    });
  }
});

// Get worlds for a specific server
router.get('/worlds/:server', validateServer, async (req, res) => {
  try {
    const { server } = req.params;
    const worldPath = serverWorldPaths[server];

    if (!worldPath) {
      return res.status(404).json({
        error: `Server ${server} not found`,
        availableServers: Object.keys(serverWorldPaths)
      });
    }

    const stats = await fs.stat(worldPath);
    if (!stats.isDirectory()) {
      return res.status(404).json({
        error: 'World directory not found',
        path: worldPath
      });
    }

    const levelDatPath = path.join(worldPath, 'level.dat');
    let accessible = false;

    try {
      await fs.access(levelDatPath);
      accessible = true;
    } catch (levelError) {
      // level.dat not found
    }

    res.json({
      server,
      worldPath,
      accessible,
      size: stats.size,
      modified: stats.mtime,
      hasLevelDat: accessible
    });
  } catch (error) {
    console.error(`Error getting world for server ${req.params.server}:`, error);
    res.status(500).json({
      error: 'Failed to get server world',
      details: error.message
    });
  }
});

// Start rendering a world
router.post('/render/:server/:world', validateServer, validateWorld, validateRenderRequest, async (req, res) => {
  try {
    const { server, world } = req.params;
    const { rendermode = 'lighting',forcerender = false } = req.body;

    const worldPath = serverWorldPaths[server];
    if (!worldPath) {
      return res.status(404).json({
        error: `Server ${server} not found`,
        availableServers: Object.keys(serverWorldPaths)
      });
    }

    // Check if world is accessible
    try {
      await fs.access(path.join(worldPath, 'level.dat'));
    } catch (levelError) {
      return res.status(400).json({
        error: 'World not accessible or no level.dat found',
        path: worldPath
      });
    }

    const jobId = `${server}_${world}_${Date.now()}`;
    const outputPath = path.join(RENDER_OUTPUT_DIR, server, world);

    // Create output directory
    await fs.mkdir(outputPath, { recursive: true });

    const renderJob = {
      server,
      world,
      worldPath,
      outputPath,
      rendermode,
      forcerender,
      status: 'pending',
      progress: 0,
      startTime: new Date(),
      estimatedDuration: null
    };

    // Save job using the new service (Redis + WebSocket)
    const savedJob = await overviewerService.saveRenderJob(jobId, renderJob);

    // Start render process in background
    renderWorldAsync(savedJob).catch(error => {
      console.error(`Render job ${jobId} failed:`, error);
      overviewerService.updateRenderJob(jobId, {
        status: 'error',
        error: error.message,
        endTime: new Date()
      }).catch(updateError => {
        console.error(`Failed to update job ${jobId} after error:`, updateError);
      });
    });

    res.json({
      jobId,
      status: 'started',
      message: 'Render job queued',
      job: {
        id: jobId,
        server,
        world,
        rendermode,
        outputPath
      }
    });

  } catch (error) {
    console.error('Error starting render:', error);
    res.status(500).json({
      error: 'Failed to start render',
      details: error.message
    });
  }
});

// Get render job status
router.get('/status/:jobId', validateJobId, async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await overviewerService.getRenderJob(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        jobId
      });
    }

    res.json({
      jobId,
      status: job.status,
      progress: job.progress,
      server: job.server,
      world: job.world,
      startTime: job.startTime,
      endTime: job.endTime,
      estimatedDuration: job.estimatedDuration,
      error: job.error,
      outputPath: job.outputPath
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      error: 'Failed to get job status',
      details: error.message
    });
  }
});

// Cancel render job
router.post('/cancel/:jobId', validateJobId, async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await overviewerService.getRenderJob(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        jobId
      });
    }

    if (job.status === 'completed' || job.status === 'error') {
      return res.status(400).json({
        error: 'Cannot cancel completed or error job',
        status: job.status
      });
    }

    await overviewerService.updateRenderJob(jobId, {
      status: 'cancelled',
      endTime: new Date()
    });

    res.json({
      jobId,
      status: 'cancelled',
      message: 'Render job cancelled'
    });
  } catch (error) {
    console.error('Error cancelling job:', error);
    res.status(500).json({
      error: 'Failed to cancel job',
      details: error.message
    });
  }
});

// Get all render jobs
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await overviewerService.getAllRenderJobs();
    const jobsSummary = jobs.map(job => ({
      id: job.id,
      server: job.server,
      world: job.world,
      status: job.status,
      progress: job.progress,
      startTime: job.startTime,
      endTime: job.endTime,
      outputPath: job.outputPath
    }));

    res.json({
      jobs: jobsSummary,
      total: jobsSummary.length,
      active: jobsSummary.filter(j => ['pending', 'running'].includes(j.status)).length,
      completed: jobsSummary.filter(j => j.status === 'completed').length,
      failed: jobsSummary.filter(j => j.status === 'error').length
    });
  } catch (error) {
    console.error('Error getting jobs:', error);
    res.status(500).json({
      error: 'Failed to get jobs',
      details: error.message
    });
  }
});

// Get rendered maps for a server
router.get('/maps/:server', validateServer, async (req, res) => {
  try {
    const { server } = req.params;
    const serverRenderPath = path.join(RENDER_OUTPUT_DIR, server);

    try {
      const renderDirs = await fs.readdir(serverRenderPath, { withFileTypes: true });
      const maps = [];

      for (const dirent of renderDirs) {
        if (dirent.isDirectory()) {
          const mapPath = path.join(serverRenderPath, dirent.name);
          const indexPath = path.join(mapPath, 'index.html');

          try {
            await fs.access(indexPath);
            const stats = await fs.stat(mapPath);

            maps.push({
              server,
              world: dirent.name,
              mapPath,
              indexUrl: `/overviewer/${server}/${dirent.name}/index.html`,
              publicUrl: `/public/overviewer/${server}/${dirent.name}/index.html`,
              size: stats.size,
              modified: stats.mtime,
              rendered: true,
              public: publicMaps.has(`${server}_${dirent.name}`)
            });
          } catch (indexError) {
            // index.html not found, map not fully rendered
            maps.push({
              server,
              world: dirent.name,
              mapPath,
              rendered: false,
              error: 'Map not fully rendered'
            });
          }
        }
      }

      res.json({
        server,
        maps,
        total: maps.length,
        rendered: maps.filter(m => m.rendered).length
      });

    } catch (dirError) {
      if (dirError.code === 'ENOENT') {
        res.json({
          server,
          maps: [],
          total: 0,
          rendered: 0,
          message: 'No renders found for this server'
        });
      } else {
        throw dirError;
      }
    }
  } catch (error) {
    console.error(`Error getting maps for server ${req.params.server}:`, error);
    res.status(500).json({
      error: 'Failed to get server maps',
      details: error.message
    });
  }
});

// Get public maps
router.get('/public', async (req, res) => {
  try {
    const publicMapsList = await overviewerService.getAllPublicMaps();
    const publicMapsFormatted = publicMapsList.map((map) => ({
      id: map.id,
      server: map.server,
      world: map.world,
      title: map.title || `${map.server} - ${map.world}`,
      description: map.description || 'Minecraft World Map',
      publicUrl: `/public/overviewer/${map.server}/${map.world}/index.html`,
      createdAt: map.createdAt,
      renderJobId: map.renderJobId
    }));

    res.json({
      publicMaps: publicMapsFormatted,
      total: publicMapsFormatted.length
    });
  } catch (error) {
    console.error('Error getting public maps:', error);
    res.status(500).json({
      error: 'Failed to get public maps',
      details: error.message
    });
  }
});

// Make a map public
router.post('/public/:server/:world', validateServer, validateWorld, validatePublicRequest, async (req, res) => {
  try {
    const { server, world } = req.params;
    const { title, description } = req.body;

    const mapKey = `${server}_${world}`;
    const serverRenderPath = path.join(RENDER_OUTPUT_DIR, server, world);
    const indexPath = path.join(serverRenderPath, 'index.html');

    // Check if map exists
    try {
      await fs.access(indexPath);
    } catch (indexError) {
      return res.status(404).json({
        error: 'Map not found or not fully rendered',
        path: serverRenderPath
      });
    }

    // Save using the new service (Redis + WebSocket)
    const publicMapData = await overviewerService.savePublicMap(mapKey, {
      server,
      world,
      title: title || `${server} - ${world}`,
      description: description || 'Minecraft World Map',
      renderJobId: req.body.renderJobId
    });

    // Broadcast update via WebSocket
    overviewerService.broadcastMapUpdate('created', publicMapData);

    res.json({
      id: mapKey,
      server,
      world,
      title: title || `${server} - ${world}`,
      publicUrl: `/public/overviewer/${server}/${world}/index.html`,
      message: 'Map is now public'
    });
  } catch (error) {
    console.error('Error making map public:', error);
    res.status(500).json({
      error: 'Failed to make map public',
      details: error.message
    });
  }
});

// Remove public access
router.delete('/public/:server/:world', validateServer, validateWorld, async (req, res) => {
  try {
    const { server, world } = req.params;
    const mapKey = `${server}_${world}`;

    // Delete using the new service
    await overviewerService.deletePublicMap(mapKey);

    // Broadcast update via WebSocket
    overviewerService.broadcastMapUpdate('deleted', { id: mapKey, server, world });

    res.json({
      server,
      world,
      message: 'Public access removed'
    });
  } catch (error) {
    console.error('Error removing public access:', error);
    res.status(500).json({
      error: 'Failed to remove public access',
      details: error.message
    });
  }
});

// Async function to render world
async function renderWorldAsync(job) {
  job.status = 'running';
  job.progress = 0;

  try {
    // Create overviewer config file
    const configContent = `
import os

worlds['${job.world}'] = '${job.worldPath}'
outputdir = '${job.outputPath}'

renders['${job.world}_lighting'] = {
    'world': '${job.world}',
    'title': '${job.server} - ${job.world} (Day)',
    'rendermode': 'lighting',
}
`;

    const configPath = '/tmp/overviewer_config.py';
    await fs.writeFile(configPath, configContent);

    job.progress = 10;

    // Estimate duration based on world size
    const stats = await fs.stat(job.worldPath);
    const estimatedDuration = Math.max(300, Math.floor(stats.size / 1024 / 1024 / 10)); // 10 seconds per MB, min 5 minutes
    job.estimatedDuration = estimatedDuration;

    // Start overviewer process
    return new Promise((resolve, reject) => {
      const overviewer = spawn('python', ['/app/overviewer.py', '--config', configPath, '--processes', '4']);

      let output = '';
      let error = '';

      overviewer.stdout.on('data', (data) => {
        output += data.toString();
        // Update progress based on output (simplified)
        if (output.includes('Preprocessing')) {
          job.progress = 25;
        } else if (output.includes('rendering')) {
          job.progress = Math.min(job.progress + 10, 90);
        } else if (output.includes('written to')) {
          job.progress = 95;
        }
      });

      overviewer.stderr.on('data', (data) => {
        error += data.toString();
      });

      overviewer.on('close', (code) => {
        if (code === 0) {
          job.status = 'completed';
          job.progress = 100;
          job.endTime = new Date();
          resolve(output);
        } else {
          job.status = 'error';
          job.error = `Overviewer failed with code ${code}: ${error}`;
          job.endTime = new Date();
          reject(new Error(`Overviewer failed with code ${code}: ${error}`));
        }
      });

      overviewer.on('error', (err) => {
        job.status = 'error';
        job.error = err.message;
        job.endTime = new Date();
        reject(err);
      });
    });

  } catch (error) {
    job.status = 'error';
    job.error = error.message;
    job.endTime = new Date();
    throw error;
  }
}

// Overviewer routes disabled
router.use((req, res) => {
  return res.status(503).json({
    error: 'Overviewer integration is currently disabled',
  });
});

module.exports = router;
