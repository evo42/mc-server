const Redis = require('redis');
const NodeCache = require('node-cache');
const { Server } = require('socket.io');
const { monitoringService } = require('./monitoringService');
const scalingService = require('./scalingService');

// Redis Client für Persistence
const redisClient = Redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('Redis server is down');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return new Error('Maximum retry attempts reached');
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

// In-Memory Cache für Performance
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false
});

// Socket.IO Server Instance (wird vom main server bereitgestellt)
let ioInstance = null;

class OverviewerService {
  constructor() {
    this.renderJobs = new Map();
    this.publicMaps = new Map();
    this.isRedisConnected = false;

    this.initializeRedis();

    // Initialize monitoring
    this.initializeMonitoring();
  }

  // Initialize monitoring integration
  initializeMonitoring() {
    // Set up monitoring for active jobs and queue size updates
    setInterval(() => {
      // Update active jobs count
      for (const [jobId, job] of this.renderJobs) {
        if (job.status === 'rendering' || job.status === 'pending') {
          monitoringService.updateActiveJobs(job.server, this.getActiveJobsByServer(job.server));
          break; // Only need to update for each server once
        }
      }

      // Update job queue size
      const queueSize = Array.from(this.renderJobs.values()).filter(job => job.status === 'pending').length;
      monitoringService.updateJobQueueSize('all', queueSize);
    }, 30000); // Update every 30 seconds
  }

  // Helper method to get active jobs by server
  getActiveJobsByServer(server) {
    let count = 0;
    for (const [jobId, job] of this.renderJobs) {
      if (job.server === server && (job.status === 'rendering' || job.status === 'pending')) {
        count++;
      }
    }
    return count;
  }

  // Redis Verbindung initialisieren
  async initializeRedis() {
    try {
      await redisClient.connect();
      this.isRedisConnected = true;
      console.log('✅ Redis connected for Overviewer persistence');

      // Lade bestehende Jobs aus Redis
      await this.loadJobsFromRedis();
    } catch (error) {
      console.warn('⚠️  Redis not available, using in-memory storage:', error.message);
      this.isRedisConnected = false;
    }
  }

  // Socket.IO Server setzen
  setSocketIO(io) {
    ioInstance = io;
    this.setupSocketHandlers();
  }

  // Socket.IO Event Handlers
  setupSocketHandlers() {
    if (!ioInstance) return;

    ioInstance.on('connection', (socket) => {
      console.log(`🔌 Client connected to Overviewer WebSocket: ${socket.id}`);

      socket.on('join-overviewer', () => {
        socket.join('overviewer-updates');
        console.log(`📡 Client ${socket.id} joined overviewer updates`);
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });
    });
  }

  // Redis-basiertes Job-Management
  async saveRenderJob(jobId, jobData) {
    const jobWithMetadata = {
      ...jobData,
      id: jobId,
      createdAt: jobData.startTime || new Date(),
      updatedAt: new Date()
    };

    // In Memory
    this.renderJobs.set(jobId, jobWithMetadata);

    // Redis Persistenz (falls verfügbar)
    if (this.isRedisConnected) {
      try {
        await redisClient.setEx(`overviewer:job:${jobId}`, 86400, JSON.stringify(jobWithMetadata));
        monitoringService.recordRedisOperation('set', 'success');
        console.log(`💾 Job ${jobId} saved to Redis`);
      } catch (error) {
        monitoringService.recordRedisOperation('set', 'error');
        console.warn(`⚠️  Failed to save job ${jobId} to Redis:`, error.message);
      }
    }

    // Broadcast via WebSocket
    this.broadcastJobUpdate(jobWithMetadata);

    return jobWithMetadata;
  }

  // Render Job Lifecycle Management with Monitoring and Scaling
  startRenderJob(jobId, server, world) {
    monitoringService.startRenderJob(jobId, server, world);

    // Assign job to a worker using load balancer
    let assignedWorkerId;
    try {
      assignedWorkerId = scalingService.assignJobToWorker({
        id: jobId,
        server,
        world,
        priority: 'normal'
      });
      console.log(`📋 Job ${jobId} assigned to worker ${assignedWorkerId}`);
    } catch (error) {
      console.warn(`⚠️  No available workers for job ${jobId}, continuing with single-worker mode:`, error.message);
      assignedWorkerId = 'default-worker';
    }

    // Start tracking job with monitoring service
    const jobData = {
      server,
      world,
      status: 'rendering',
      startTime: Date.now(),
      assignedWorkerId // Track which worker is handling this job
    };

    return this.saveRenderJob(jobId, jobData);
  }

  completeRenderJob(jobId, status = 'completed') {
    const job = monitoringService.completeRenderJob(jobId, status);

    // Update job status in our storage
    if (job) {
      // Notify scaling service about job completion
      if (job.assignedWorkerId && job.assignedWorkerId !== 'default-worker') {
        scalingService.completeJob(job.assignedWorkerId, jobId);
      }

      return this.updateRenderJob(jobId, {
        status,
        endTime: Date.now(),
        updatedAt: new Date(),
        assignedWorkerId: job.assignedWorkerId
      });
    }

    return null;
  }

  // API Performance Tracking
  trackApiCall(endpoint, method, duration, statusCode) {
    monitoringService.recordApiRequest(endpoint, method, statusCode, duration);
  }

  async getRenderJob(jobId) {
    // Erst Memory checken
    let job = this.renderJobs.get(jobId);

    if (!job && this.isRedisConnected) {
      try {
        const jobData = await redisClient.get(`overviewer:job:${jobId}`);
        if (jobData) {
          job = JSON.parse(jobData);
          this.renderJobs.set(jobId, job); // Cache in memory
        }
      } catch (error) {
        console.warn(`⚠️  Failed to get job ${jobId} from Redis:`, error.message);
      }
    }

    return job;
  }

  async getAllRenderJobs() {
    const allJobs = Array.from(this.renderJobs.values());

    if (allJobs.length === 0 && this.isRedisConnected) {
      try {
        const keys = await redisClient.keys('overviewer:job:*');
        for (const key of keys) {
          const jobData = await redisClient.get(key);
          if (jobData) {
            const job = JSON.parse(jobData);
            this.renderJobs.set(job.id, job);
          }
        }
        return Array.from(this.renderJobs.values());
      } catch (error) {
        console.warn('⚠️  Failed to load jobs from Redis:', error.message);
      }
    }

    return allJobs;
  }

  async updateRenderJob(jobId, updates) {
    const existingJob = await this.getRenderJob(jobId);
    if (!existingJob) {
      throw new Error(`Job ${jobId} not found`);
    }

    const updatedJob = {
      ...existingJob,
      ...updates,
      updatedAt: new Date()
    };

    return await this.saveRenderJob(jobId, updatedJob);
  }

  // Public Maps Management
  async savePublicMap(mapKey, mapData) {
    const mapWithMetadata = {
      ...mapData,
      id: mapKey,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.publicMaps.set(mapKey, mapWithMetadata);

    if (this.isRedisConnected) {
      try {
        await redisClient.hSet('overviewer:public-maps', mapKey, JSON.stringify(mapWithMetadata));
        console.log(`🗺️  Public map ${mapKey} saved to Redis`);
      } catch (error) {
        console.warn(`⚠️  Failed to save public map ${mapKey} to Redis:`, error.message);
      }
    }

    return mapWithMetadata;
  }

  async getAllPublicMaps() {
    let maps = Array.from(this.publicMaps.values());

    if (maps.length === 0 && this.isRedisConnected) {
      try {
        const redisMaps = await redisClient.hGetAll('overviewer:public-maps');
        for (const [key, value] of Object.entries(redisMaps)) {
          const map = JSON.parse(value);
          this.publicMaps.set(key, map);
        }
        maps = Array.from(this.publicMaps.values());
      } catch (error) {
        console.warn('⚠️  Failed to load public maps from Redis:', error.message);
      }
    }

    return maps;
  }

  async deletePublicMap(mapKey) {
    this.publicMaps.delete(mapKey);

    if (this.isRedisConnected) {
      try {
        await redisClient.hDel('overviewer:public-maps', mapKey);
        console.log(`🗺️  Public map ${mapKey} deleted from Redis`);
      } catch (error) {
        console.warn(`⚠️  Failed to delete public map ${mapKey} from Redis:`, error.message);
      }
    }

    return true;
  }

  // Caching für API Responses
  getCached(key) {
    return cache.get(key);
  }

  setCached(key, data, ttl = 300) {
    cache.set(key, data, ttl);
  }

  invalidateCache(pattern) {
    const keys = cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    matchingKeys.forEach(key => cache.del(key));
    console.log(`🧹 Cache invalidated: ${matchingKeys.length} keys for pattern "${pattern}"`);
  }

  // WebSocket Broadcasting
  broadcastJobUpdate(job) {
    if (ioInstance) {
      ioInstance.to('overviewer-updates').emit('job-update', job);
      console.log(`📡 Broadcasted job update: ${job.id} - ${job.status}`);
    }
  }

  broadcastMapUpdate(mapAction, mapData) {
    if (ioInstance) {
      ioInstance.to('overviewer-updates').emit('map-update', {
        action: mapAction,
        map: mapData
      });
      console.log(`📡 Broadcasted map update: ${mapAction} - ${mapData.id}`);
    }
  }

  // Hilfsmethoden
  async loadJobsFromRedis() {
    if (!this.isRedisConnected) return;

    try {
      const keys = await redisClient.keys('overviewer:job:*');
      for (const key of keys) {
        const jobData = await redisClient.get(key);
        if (jobData) {
          const job = JSON.parse(jobData);
          this.renderJobs.set(job.id, job);
        }
      }
      console.log(`📥 Loaded ${this.renderJobs.size} jobs from Redis`);
    } catch (error) {
      console.warn('⚠️  Failed to load jobs from Redis:', error.message);
    }
  }

  // Health Check
  getHealthStatus() {
    return {
      service: 'overviewer-service',
      redis: this.isRedisConnected ? 'connected' : 'disconnected',
      memoryJobs: this.renderJobs.size,
      publicMaps: this.publicMaps.size,
      cacheStats: cache.getStats()
    };
  }
}

// Singleton Instance
// NOTE: OverviewerService is currently disabled. Importing code still works,
// but overviewer routes return 503 and no jobs are processed.
const overviewerService = new OverviewerService();

module.exports = overviewerService;
