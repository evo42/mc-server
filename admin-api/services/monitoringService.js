const promClient = require('prom-client');
const winston = require('winston');

// Configure Prometheus metrics
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// Custom Overviewer metrics
const overviewerRenderDuration = new promClient.Histogram({
  name: 'overviewer_render_duration_seconds',
  help: 'Duration of overviewer render jobs in seconds',
  labelNames: ['server', 'world', 'status'],
  buckets: [60, 300, 600, 1800, 3600, 7200] // 1min, 5min, 10min, 30min, 1hr, 2hr
});

const overviewerActiveJobs = new promClient.Gauge({
  name: 'overviewer_active_jobs',
  help: 'Number of currently active render jobs',
  labelNames: ['server']
});

const overviewerJobQueue = new promClient.Gauge({
  name: 'overviewer_job_queue_size',
  help: 'Number of jobs in the queue',
  labelNames: ['server']
});

const overviewerSuccessRate = new promClient.Counter({
  name: 'overviewer_jobs_total',
  help: 'Total number of render jobs',
  labelNames: ['server', 'world', 'status']
});

const overviewerApiDuration = new promClient.Histogram({
  name: 'overviewer_api_request_duration_seconds',
  help: 'Duration of overviewer API requests',
  labelNames: ['endpoint', 'method', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const overviewerRedisOperations = new promClient.Counter({
  name: 'overviewer_redis_operations_total',
  help: 'Total number of Redis operations',
  labelNames: ['operation', 'status']
});

// Register metrics
register.registerMetric(overviewerRenderDuration);
register.registerMetric(overviewerActiveJobs);
register.registerMetric(overviewerJobQueue);
register.registerMetric(overviewerSuccessRate);
register.registerMetric(overviewerApiDuration);
register.registerMetric(overviewerRedisOperations);

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/overviewer.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Ensure logs directory exists
const fs = require('fs');
const path = require('path');
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

class MonitoringService {
  constructor() {
    this.startTime = Date.now();
    this.renderJobs = new Map(); // Track active render jobs
    this.apiCallCounts = new Map(); // Track API usage
  }

  /**
   * Record render job duration
   */
  recordRenderJob(server, world, status, duration) {
    const labels = { server, world, status };
    overviewerRenderDuration.observe(labels, duration / 1000); // Convert to seconds
    overviewerSuccessRate.inc(labels);

    logger.info('Render job completed', {
      server,
      world,
      status,
      duration,
      ...labels
    });
  }

  /**
   * Update active jobs count
   */
  updateActiveJobs(server, count) {
    overviewerActiveJobs.set({ server }, count);
    logger.debug('Active jobs updated', { server, count });
  }

  /**
   * Update job queue size
   */
  updateJobQueueSize(server, size) {
    overviewerJobQueue.set({ server }, size);
    logger.debug('Job queue size updated', { server, size });
  }

  /**
   * Record API request duration
   */
  recordApiRequest(endpoint, method, statusCode, duration) {
    const labels = { endpoint, method, status_code: statusCode.toString() };
    overviewerApiDuration.observe(labels, duration / 1000); // Convert to seconds

    // Track API usage
    const key = `${method}:${endpoint}`;
    const current = this.apiCallCounts.get(key) || 0;
    this.apiCallCounts.set(key, current + 1);

    logger.info('API request recorded', {
      endpoint,
      method,
      statusCode,
      duration,
      ...labels
    });
  }

  /**
   * Record Redis operation
   */
  recordRedisOperation(operation, status) {
    overviewerRedisOperations.inc({ operation, status });
    logger.debug('Redis operation recorded', { operation, status });
  }

  /**
   * Get metrics for Prometheus scraping
   */
  async getMetrics() {
    try {
      return await register.metrics();
    } catch (error) {
      logger.error('Failed to get metrics', { error: error.message });
      throw error;
    }
  }

  /**
   * Get monitoring statistics
   */
  getStatistics() {
    const uptime = Date.now() - this.startTime;
    const activeJobs = this.renderJobs.size;
    const totalApiCalls = Array.from(this.apiCallCounts.values()).reduce((sum, count) => sum + count, 0);

    return {
      uptime: uptime,
      uptimeFormatted: this.formatUptime(uptime),
      activeJobs,
      totalApiCalls,
      topApiEndpoints: this.getTopApiEndpoints(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get top API endpoints by usage
   */
  getTopApiEndpoints(limit = 10) {
    const entries = Array.from(this.apiCallCounts.entries())
      .map(([key, count]) => {
        const [method, endpoint] = key.split(':');
        return { method, endpoint, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return entries;
  }

  /**
   * Format uptime in human readable format
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Track render job start
   */
  startRenderJob(jobId, server, world) {
    this.renderJobs.set(jobId, {
      server,
      world,
      startTime: Date.now(),
      status: 'running'
    });
    this.updateActiveJobs(server, this.getActiveJobsByServer(server));
  }

  /**
   * Track render job completion
   */
  completeRenderJob(jobId, status = 'completed') {
    const job = this.renderJobs.get(jobId);
    if (job) {
      const duration = Date.now() - job.startTime;
      job.status = status;
      job.endTime = Date.now();

      this.recordRenderJob(job.server, job.world, status, duration);
      this.renderJobs.delete(jobId);
      this.updateActiveJobs(job.server, this.getActiveJobsByServer(job.server));

      return job;
    }
    return null;
  }

  /**
   * Get active jobs count for a specific server
   */
  getActiveJobsByServer(server) {
    let count = 0;
    for (const [jobId, job] of this.renderJobs) {
      if (job.server === server && job.status === 'running') {
        count++;
      }
    }
    return count;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const stats = this.getStatistics();
      const memoryUsage = process.memoryUsage();

      // Check if memory usage is reasonable (< 1GB)
      const isMemoryHealthy = memoryUsage.heapUsed < 1024 * 1024 * 1024;

      // Check if service uptime is reasonable
      const isUptimeHealthy = stats.uptime > 60000; // At least 1 minute

      return {
        status: isMemoryHealthy && isUptimeHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: stats.uptimeFormatted,
        memoryUsage: {
          used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
        },
        activeJobs: stats.activeJobs,
        totalApiCalls: stats.totalApiCalls
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Get system metrics
   */
  getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };
  }
}

// Create singleton instance
const monitoringService = new MonitoringService();

module.exports = { monitoringService, register };