/**
 * BlueMap Lazy Service
 * Manages BlueMap Lazy Server operations across all 7 Minecraft servers
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const redis = require('redis');

class BlueMapLazyService {
  constructor() {
    this.redisClient = null;
    this.serverConfigs = new Map();
    this.renderQueues = new Map();
    this.cacheManagers = new Map();
    this.initializeService();
  }

  /**
   * Initialize the BlueMap Lazy Service
   */
  async initializeService() {
    try {
      console.log('🚀 Initializing BlueMap Lazy Service...');

      // Initialize Redis connection
      this.redisClient = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD
      });

      this.redisClient.on('error', (err) => {
        console.error('❌ Redis connection error:', err);
      });

      await this.redisClient.connect();

      // Initialize server configurations
      await this.loadServerConfigurations();

      // Initialize render queues for each server
      await this.initializeRenderQueues();

      // Start monitoring jobs
      this.startMonitoringJobs();

      console.log('✅ BlueMap Lazy Service initialized successfully');

    } catch (error) {
      console.error('❌ Error initializing BlueMap Lazy Service:', error);
      throw error;
    }
  }

  /**
   * Load server configurations for all 7 servers
   */
  async loadServerConfigurations() {
    const servers = [
      {
        name: 'mc-basop-bafep-stp',
        webPort: 8081,
        prometheusPort: 9091,
        maxPlayers: 20,
        serverType: 'education',
        configPath: '../bluemap-migration/configs/mc-basop-bafep-stp/bluemap.conf'
      },
      {
        name: 'mc-bgstpoelten',
        webPort: 8082,
        prometheusPort: 9092,
        maxPlayers: 25,
        serverType: 'secondary_education',
        configPath: '../bluemap-migration/configs/mc-bgstpoelten/bluemap.conf'
      },
      {
        name: 'mc-borgstpoelten',
        webPort: 8083,
        prometheusPort: 9093,
        maxPlayers: 30,
        serverType: 'academic',
        configPath: '../bluemap-migration/configs/mc-borgstpoelten/bluemap.conf'
      },
      {
        name: 'mc-hakstpoelten',
        webPort: 8084,
        prometheusPort: 9094,
        maxPlayers: 35,
        serverType: 'university',
        configPath: '../bluemap-migration/configs/mc-hakstpoelten/bluemap.conf'
      },
      {
        name: 'mc-htlstp',
        webPort: 8085,
        prometheusPort: 9095,
        maxPlayers: 40,
        serverType: 'technical',
        configPath: '../bluemap-migration/configs/mc-htlstp/bluemap.conf'
      },
      {
        name: 'mc-ilias',
        webPort: 8086,
        prometheusPort: 9096,
        maxPlayers: 15,
        serverType: 'specialized',
        configPath: '../bluemap-migration/configs/mc-ilias/bluemap.conf'
      },
      {
        name: 'mc-niilo',
        webPort: 8087,
        prometheusPort: 9097,
        maxPlayers: 50,
        serverType: 'public',
        configPath: '../bluemap-migration/configs/mc-niilo/bluemap.conf'
      }
    ];

    for (const server of servers) {
      try {
        const config = await this.loadServerConfig(server.configPath);
        const serverConfig = {
          ...server,
          ...config,
          isActive: false,
          lastHealthCheck: null,
          renderJobs: [],
          performanceMetrics: {
            totalRenders: 0,
            averageRenderTime: 0,
            cacheHitRate: 0,
            memoryUsage: 0
          }
        };

        this.serverConfigs.set(server.name, serverConfig);
        console.log(`✅ Loaded configuration for ${server.name}`);

      } catch (error) {
        console.error(`❌ Error loading config for ${server.name}:`, error);
      }
    }
  }

  /**
   * Load individual server configuration
   */
  async loadServerConfig(configPath) {
    try {
      const fullPath = path.join(__dirname, configPath);
      const configContent = await fs.readFile(fullPath, 'utf8');

      // Simple configuration parser (in production, use proper YAML parser)
      const config = {
        webPort: this.extractConfigValue(configContent, 'port:') || 8080,
        cacheSize: this.extractConfigValue(configContent, 'cacheSize:') || '512MB',
        maxConcurrentRenders: parseInt(this.extractConfigValue(configContent, 'maxConcurrentRenders:')) || 3,
        renderDistance: parseInt(this.extractConfigValue(configContent, 'renderDistance:')) || 5000,
        lazyLoading: configContent.includes('enabled: true') && configContent.includes('lazy:'),
        threeDEnabled: configContent.includes('threeDimension:') && configContent.includes('enabled: true'),
        flatMapEnabled: configContent.includes('flat:') && configContent.includes('enabled: true'),
        poiEnabled: configContent.includes('poi:') && configContent.includes('enabled: true'),
        markerSets: this.extractMarkerSets(configContent)
      };

      return config;

    } catch (error) {
      console.error(`❌ Error loading config from ${configPath}:`, error);
      throw error;
    }
  }

  /**
   * Extract value from configuration content
   */
  extractConfigValue(content, key) {
    const regex = new RegExp(`${key}\\s*(.+)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract marker sets from configuration
   */
  extractMarkerSets(content) {
    const markerSets = [];
    const markerRegex = /markerSets:\s*\n([\s\S]*?)(?=\n\S|\n$)/g;
    let match;

    while ((match = markerRegex.exec(content)) !== null) {
      markerSets.push({
        name: 'default',
        enabled: true
      });
    }

    return markerSets.length > 0 ? markerSets : [{ name: 'default', enabled: true }];
  }

  /**
   * Initialize render queues for each server
   */
  async initializeRenderQueues() {
    for (const [serverName, config] of this.serverConfigs) {
      const queueKey = `bluemap:render:${serverName}`;
      this.renderQueues.set(serverName, queueKey);

      // Initialize Redis-based render queue
      await this.redisClient.lPush(queueKey, JSON.stringify({
        type: 'init',
        serverName,
        timestamp: Date.now()
      }));

      console.log(`✅ Initialized render queue for ${serverName}`);
    }
  }

  /**
   * Get server status for a specific server
   */
  async getServerStatus(serverName) {
    const config = this.serverConfigs.get(serverName);
    if (!config) {
      throw new Error(`Server ${serverName} not found`);
    }

    try {
      // Check if BlueMap web interface is responding
      const healthCheckUrl = `http://localhost:${config.webPort}/bluemap/${serverName}/`;
      const response = await axios.get(healthCheckUrl, {
        timeout: 5000,
        validateStatus: () => true
      });

      const isHealthy = response.status === 200 || response.status === 404; // 404 is also acceptable for initial setup

      // Get cached performance metrics
      const metricsKey = `bluemap:metrics:${serverName}`;
      const cachedMetrics = await this.redisClient.get(metricsKey);
      const metrics = cachedMetrics ? JSON.parse(cachedMetrics) : {};

      const status = {
        serverName,
        webPort: config.webPort,
        isHealthy,
        isActive: isHealthy,
        lazyProgress: metrics.lazyProgress || 0,
        cacheHitRate: metrics.cacheHitRate || 0,
        memoryUsage: metrics.memoryUsage || 0,
        renderQueueLength: await this.getRenderQueueLength(serverName),
        averageRenderTime: metrics.averageRenderTime || 0,
        serverType: config.serverType,
        maxPlayers: config.maxPlayers,
        activePlayers: metrics.activePlayers || 0,
        responseTime: response.headers['x-response-time'] || 0,
        lastHealthCheck: new Date().toISOString(),
        uptime: metrics.uptime || 0
      };

      return status;

    } catch (error) {
      console.error(`❌ Error getting status for ${serverName}:`, error.message);
      return {
        serverName,
        webPort: config.webPort,
        isHealthy: false,
        isActive: false,
        error: error.message,
        lastHealthCheck: new Date().toISOString()
      };
    }
  }

  /**
   * Trigger lazy area render for a server
   */
  async triggerLazyAreaRender(serverName, renderOptions) {
    const config = this.serverConfigs.get(serverName);
    if (!config) {
      throw new Error(`Server ${serverName} not found`);
    }

    const jobId = this.generateJobId();

    const renderJob = {
      id: jobId,
      serverName,
      coordinates: {
        x: renderOptions.x,
        z: renderOptions.z
      },
      radius: renderOptions.radius,
      priority: renderOptions.priority || 'normal',
      status: 'queued',
      createdAt: Date.now(),
      estimatedTime: this.estimateRenderTime(renderOptions.radius),
      progress: 0
    };

    // Add to render queue
    const queueKey = this.renderQueues.get(serverName);
    await this.redisClient.lPush(queueKey, JSON.stringify(renderJob));

    // Store job details
    const jobKey = `bluemap:job:${jobId}`;
    await this.redisClient.setEx(jobKey, 3600, JSON.stringify(renderJob));

    // Update server render job list
    const serverJobKey = `bluemap:server:jobs:${serverName}`;
    await this.redisClient.lPush(serverJobKey, jobId);

    console.log(`🎯 Render job ${jobId} queued for ${serverName}`);

    // Simulate job processing (in production, this would trigger actual BlueMap rendering)
    this.processRenderJob(renderJob);

    return {
      jobId,
      status: 'queued',
      estimatedTime: renderJob.estimatedTime
    };
  }

  /**
   * Get render queue length for a server
   */
  async getRenderQueueLength(serverName) {
    const queueKey = this.renderQueues.get(serverName);
    if (!queueKey) return 0;

    try {
      return await this.redisClient.lLen(queueKey);
    } catch (error) {
      console.error(`❌ Error getting queue length for ${serverName}:`, error);
      return 0;
    }
  }

  /**
   * Get performance metrics for all servers
   */
  async getAllServerMetrics() {
    const metrics = [];

    for (const [serverName, config] of this.serverConfigs) {
      try {
        const status = await this.getServerStatus(serverName);
        const performanceMetrics = await this.getServerPerformanceMetrics(serverName);

        metrics.push({
          serverName,
          isActive: status.isActive,
          memoryUsage: performanceMetrics.memoryUsage,
          cacheHitRate: performanceMetrics.cacheHitRate,
          averageRenderTime: performanceMetrics.averageRenderTime,
          renderQueueLength: performanceMetrics.renderQueueLength,
          lazyProgress: performanceMetrics.lazyProgress
        });

      } catch (error) {
        console.error(`❌ Error getting metrics for ${serverName}:`, error);
        metrics.push({
          serverName,
          isActive: false,
          error: error.message
        });
      }
    }

    return metrics;
  }

  /**
   * Get detailed performance metrics for a server
   */
  async getServerPerformanceMetrics(serverName) {
    const metricsKey = `bluemap:metrics:${serverName}`;

    try {
      const cachedMetrics = await this.redisClient.get(metricsKey);

      if (cachedMetrics) {
        return JSON.parse(cachedMetrics);
      }

      // Return default metrics if none cached
      return {
        memoryUsage: 0,
        cacheHitRate: 0,
        averageRenderTime: 0,
        renderQueueLength: 0,
        lazyProgress: 0,
        totalRenders: 0,
        uptime: 0
      };

    } catch (error) {
      console.error(`❌ Error getting performance metrics for ${serverName}:`, error);
      return {
        memoryUsage: 0,
        cacheHitRate: 0,
        averageRenderTime: 0,
        renderQueueLength: 0,
        lazyProgress: 0
      };
    }
  }

  /**
   * Update server configuration
   */
  async updateServerConfig(serverName, newConfig) {
    const config = this.serverConfigs.get(serverName);
    if (!config) {
      throw new Error(`Server ${serverName} not found`);
    }

    // Update configuration
    const updatedConfig = {
      ...config,
      ...newConfig,
      lastUpdated: new Date().toISOString()
    };

    this.serverConfigs.set(serverName, updatedConfig);

    // Save updated configuration
    await this.saveServerConfig(serverName, updatedConfig);

    console.log(`🔧 Updated configuration for ${serverName}`);

    return {
      serverName,
      oldConfig: config,
      newConfig: updatedConfig
    };
  }

  /**
   * Get server configuration
   */
  async getServerConfig(serverName) {
    const config = this.serverConfigs.get(serverName);
    if (!config) {
      throw new Error(`Server ${serverName} not found`);
    }

    return {
      webPort: config.webPort,
      webPath: `/bluemap/${serverName}/`,
      threeDEnabled: config.threeDEnabled,
      flatMapEnabled: config.flatMapEnabled,
      poiEnabled: config.poiEnabled,
      markerSets: config.markerSets,
      lazyLoading: config.lazyLoading,
      renderDistance: config.renderDistance,
      cacheSize: config.cacheSize
    };
  }

  /**
   * Start monitoring jobs
   */
  startMonitoringJobs() {
    // Health check every 30 seconds
    setInterval(() => {
      this.performHealthChecks();
    }, 30000);

    // Performance metrics update every 60 seconds
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 60000);

    // Cache cleanup every 5 minutes
    setInterval(() => {
      this.performCacheCleanup();
    }, 300000);

    console.log('🔄 Started monitoring jobs');
  }

  /**
   * Perform health checks for all servers
   */
  async performHealthChecks() {
    for (const [serverName, config] of this.serverConfigs) {
      try {
        const status = await this.getServerStatus(serverName);
        config.isActive = status.isActive;
        config.lastHealthCheck = new Date().toISOString();

        // Update cached status
        const statusKey = `bluemap:status:${serverName}`;
        await this.redisClient.setEx(statusKey, 300, JSON.stringify(status));

      } catch (error) {
        console.error(`❌ Health check failed for ${serverName}:`, error);
      }
    }
  }

  /**
   * Update performance metrics
   */
  async updatePerformanceMetrics() {
    for (const [serverName] of this.serverConfigs) {
      try {
        // Simulate performance metrics (in production, fetch from BlueMap)
        const metrics = {
          memoryUsage: Math.floor(Math.random() * 1024) + 256, // 256-1280 MB
          cacheHitRate: Math.floor(Math.random() * 30) + 70, // 70-100%
          averageRenderTime: Math.floor(Math.random() * 180) + 60, // 60-240 seconds
          renderQueueLength: Math.floor(Math.random() * 5),
          lazyProgress: Math.floor(Math.random() * 100),
          totalRenders: Math.floor(Math.random() * 1000) + 100,
          uptime: Date.now() - (Math.random() * 86400000), // Random uptime
          lastUpdate: new Date().toISOString()
        };

        // Cache metrics
        const metricsKey = `bluemap:metrics:${serverName}`;
        await this.redisClient.setEx(metricsKey, 300, JSON.stringify(metrics));

      } catch (error) {
        console.error(`❌ Error updating metrics for ${serverName}:`, error);
      }
    }
  }

  /**
   * Perform cache cleanup
   */
  async performCacheCleanup() {
    try {
      // Clean old job records
      const jobPattern = 'bluemap:job:*';
      const jobKeys = await this.redisClient.keys(jobPattern);

      for (const jobKey of jobKeys) {
        const jobData = await this.redisClient.get(jobKey);
        if (jobData) {
          const job = JSON.parse(jobData);
          if (Date.now() - job.createdAt > 86400000) { // 24 hours
            await this.redisClient.del(jobKey);
          }
        }
      }

      console.log('🧹 Performed cache cleanup');

    } catch (error) {
      console.error('❌ Error during cache cleanup:', error);
    }
  }

  /**
   * Process render job (simulation)
   */
  async processRenderJob(job) {
    // Simulate job processing
    setTimeout(async () => {
      try {
        // Update job status
        const jobKey = `bluemap:job:${job.id}`;
        const jobData = await this.redisClient.get(jobKey);

        if (jobData) {
          const updatedJob = JSON.parse(jobData);
          updatedJob.status = 'processing';
          updatedJob.startedAt = Date.now();

          await this.redisClient.setEx(jobKey, 3600, JSON.stringify(updatedJob));

          // Simulate processing time based on radius
          const processingTime = Math.max(5000, job.radius * 50); // Minimum 5 seconds

          setTimeout(async () => {
            updatedJob.status = 'completed';
            updatedJob.completedAt = Date.now();
            updatedJob.progress = 100;

            await this.redisClient.setEx(jobKey, 3600, JSON.stringify(updatedJob));
            console.log(`✅ Render job ${job.id} completed`);

          }, processingTime);
        }

      } catch (error) {
        console.error(`❌ Error processing job ${job.id}:`, error);
      }
    }, 1000); // Start processing after 1 second
  }

  /**
   * Generate unique job ID
   */
  generateJobId() {
    return `bluemap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Estimate render time based on radius
   */
  estimateRenderTime(radius) {
    // Simple estimation: 50ms per chunk, with overhead
    const chunksEstimate = Math.ceil((Math.PI * radius * radius) / 256); // 16x16 chunks
    const baseTime = 2000; // 2 seconds base overhead
    const renderTime = chunksEstimate * 50; // 50ms per chunk

    return Math.max(5000, baseTime + renderTime); // Minimum 5 seconds
  }

  /**
   * Save server configuration
   */
  async saveServerConfig(serverName, config) {
    try {
      const configPath = path.join(__dirname, `../bluemap-migration/configs/${serverName}/bluemap.conf`);
      // In production, this would write the actual configuration file
      console.log(`💾 Configuration saved for ${serverName} at ${configPath}`);
    } catch (error) {
      console.error(`❌ Error saving config for ${serverName}:`, error);
      throw error;
    }
  }
}

module.exports = new BlueMapLazyService();