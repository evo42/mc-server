/**
 * BlueMap API Routes
 * Integration für BlueMap Lazy Server Management über alle 7 Minecraft Server
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const Joi = require('joi');

// Import BlueMap services
const bluemapLazyService = require('../services/bluemapLazyService');
const bluemapMetricsService = require('../services/bluemapMetricsService');
const websocketService = require('../services/websocketService');

// =============================================================================
// BlueMap Server Management Endpoints
// =============================================================================

/**
 * GET /api/bluemap/servers/status
 * Get status of all BlueMap servers (7 servers)
 */
router.get('/servers/status', async (req, res) => {
  try {
    console.log('🔍 Fetching BlueMap server statuses...');

    const servers = [
      'mc-basop-bafep-stp',
      'mc-bgstpoelten',
      'mc-borgstpoelten',
      'mc-hakstpoelten',
      'mc-htlstp',
      'mc-ilias',
      'mc-niilo'
    ];

    const serverStatuses = await Promise.all(
      servers.map(async (serverName) => {
        try {
          const status = await bluemapLazyService.getServerStatus(serverName);
          return {
            name: serverName,
            status: 'online',
            webPort: status.webPort,
            lazyProgress: status.lazyProgress || 0,
            cacheHitRate: status.cacheHitRate || 0,
            memoryUsage: status.memoryUsage || 0,
            renderQueueLength: status.renderQueueLength || 0,
            averageRenderTime: status.averageRenderTime || 0,
            isHealthy: status.isHealthy !== false,
            lastUpdate: new Date().toISOString(),
            serverType: status.serverType || 'unknown',
            maxPlayers: status.maxPlayers || 0,
            activePlayers: status.activePlayers || 0
          };
        } catch (error) {
          console.error(`❌ Error fetching status for ${serverName}:`, error.message);
          return {
            name: serverName,
            status: 'offline',
            error: error.message,
            lastUpdate: new Date().toISOString(),
            isHealthy: false
          };
        }
      })
    );

    const summary = {
      totalServers: 7,
      onlineServers: serverStatuses.filter(s => s.status === 'online').length,
      healthyServers: serverStatuses.filter(s => s.isHealthy).length,
      averageMemoryUsage: serverStatuses.reduce((sum, s) => sum + (s.memoryUsage || 0), 0) / 7,
      totalCacheHits: serverStatuses.reduce((sum, s) => sum + (s.cacheHitRate || 0), 0),
      totalActivePlayers: serverStatuses.reduce((sum, s) => sum + (s.activePlayers || 0), 0)
    };

    const response = {
      servers: serverStatuses,
      summary,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Server status fetched: ${summary.onlineServers}/7 online`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error in /servers/status:', error);
    res.status(500).json({
      error: 'Failed to fetch server statuses',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/bluemap/servers/:serverName/render-area
 * Trigger lazy area render for specific server
 */
router.post('/servers/:serverName/render-area', async (req, res) => {
  try {
    const { serverName } = req.params;
    const { x, z, radius, priority = 'normal' } = req.body;

    // Validation schema
    const schema = Joi.object({
      x: Joi.number().required(),
      z: Joi.number().required(),
      radius: Joi.number().min(10).max(1000).default(100),
      priority: Joi.string().valid('low', 'normal', 'high').default('normal')
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    // Verify server exists
    const validServers = [
      'mc-basop-bafep-stp',
      'mc-bgstpoelten',
      'mc-borgstpoelten',
      'mc-hakstpoelten',
      'mc-htlstp',
      'mc-ilias',
      'mc-niilo'
    ];

    if (!validServers.includes(serverName)) {
      return res.status(400).json({
        error: 'Invalid server name',
        validServers
      });
    }

    console.log(`🎯 Triggering render area for ${serverName}:`, value);

    // Trigger lazy area render
    const renderJob = await bluemapLazyService.triggerLazyAreaRender(serverName, {
      x: value.x,
      z: value.z,
      radius: value.radius,
      priority: value.priority
    });

    // Broadcast to WebSocket clients
    websocketService.broadcastServerUpdate(serverName, {
      type: 'render_job_created',
      jobId: renderJob.jobId,
      coordinates: { x: value.x, z: value.z },
      radius: value.radius,
      priority: value.priority
    });

    res.json({
      success: true,
      jobId: renderJob.jobId,
      status: renderJob.status,
      estimatedTime: renderJob.estimatedTime,
      serverName,
      coordinates: { x: value.x, z: value.z },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Error triggering render area for ${req.params.serverName}:`, error);
    res.status(500).json({
      error: 'Failed to trigger render area',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/bluemap/performance/metrics
 * Get comprehensive performance metrics for all servers
 */
router.get('/performance/metrics', async (req, res) => {
  try {
    console.log('📊 Fetching BlueMap performance metrics...');

    const metrics = await bluemapLazyService.getAllServerMetrics();

    const performanceReport = {
      overview: {
        totalServers: 7,
        activeServers: metrics.filter(m => m.isActive).length,
        averageMemoryUsage: metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length,
        totalCacheHits: metrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / metrics.length,
        averageRenderTime: metrics.reduce((sum, m) => sum + m.averageRenderTime, 0) / metrics.length
      },

      servers: metrics.map(metric => ({
        name: metric.serverName,
        isActive: metric.isActive,
        memoryUsage: metric.memoryUsage,
        cacheHitRate: metric.cacheHitRate,
        averageRenderTime: metric.averageRenderTime,
        renderQueueLength: metric.renderQueueLength,
        lazyProgress: metric.lazyProgress,
        performance: {
          score: calculatePerformanceScore(metric),
          rating: getPerformanceRating(metric),
          recommendations: getPerformanceRecommendations(metric)
        }
      })),

      trends: await bluemapMetricsService.getPerformanceTrends(),
      alerts: await bluemapMetricsService.getActiveAlerts(),

      timestamp: new Date().toISOString()
    };

    res.json(performanceReport);

  } catch (error) {
    console.error('❌ Error fetching performance metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch performance metrics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/bluemap/lazy-server/config
 * Configure lazy server settings
 */
router.post('/lazy-server/config', async (req, res) => {
  try {
    const { serverName, config } = req.body;

    // Validation schema
    const schema = Joi.object({
      serverName: Joi.string().required(),
      config: Joi.object({
        cacheSize: Joi.string().optional(),
        maxConcurrentRenders: Joi.number().min(1).max(10).optional(),
        renderDistance: Joi.number().min(1000).max(10000).optional(),
        chunkLoadingRadius: Joi.number().min(16).max(64).optional()
      }).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const result = await bluemapLazyService.updateServerConfig(value.serverName, value.config);

    res.json({
      success: true,
      serverName: value.serverName,
      updatedConfig: result.newConfig,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error updating lazy server config:', error);
    res.status(500).json({
      error: 'Failed to update server configuration',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// =============================================================================
// BlueMap Web Interface Integration Endpoints
// =============================================================================

/**
 * GET /api/bluemap/web-interface/:serverName
 * Get BlueMap web interface URL and configuration
 */
router.get('/web-interface/:serverName', async (req, res) => {
  try {
    const { serverName } = req.params;

    const validServers = [
      'mc-basop-bafep-stp',
      'mc-bgstpoelten',
      'mc-borgstpoelten',
      'mc-hakstpoelten',
      'mc-htlstp',
      'mc-ilias',
      'mc-niilo'
    ];

    if (!validServers.includes(serverName)) {
      return res.status(404).json({
        error: 'Server not found',
        validServers
      });
    }

    const serverConfig = await bluemapLazyService.getServerConfig(serverName);

    const webInterface = {
      serverName,
      baseUrl: `http://localhost:${serverConfig.webPort}`,
      webPath: serverConfig.webPath,
      threeDAvailable: serverConfig.threeDEnabled,
      flatMapAvailable: serverConfig.flatMapEnabled,
      poiEnabled: serverConfig.poiEnabled,
      markerSets: serverConfig.markerSets || [],
      features: {
        lazyLoading: true,
        webGL: true,
        realTimeUpdates: true,
        mobileSupport: true
      },
      timestamp: new Date().toISOString()
    };

    res.json(webInterface);

  } catch (error) {
    console.error(`❌ Error getting web interface for ${req.params.serverName}:`, error);
    res.status(500).json({
      error: 'Failed to get web interface configuration',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// =============================================================================
// BlueMap Health Check Endpoints
// =============================================================================

/**
 * GET /api/bluemap/health
 * Overall BlueMap system health check
 */
router.get('/health', async (req, res) => {
  try {
    const healthCheck = await performSystemHealthCheck();

    res.json({
      status: healthCheck.overallStatus,
      uptime: healthCheck.uptime,
      servers: healthCheck.serverHealth,
      performance: healthCheck.performance,
      issues: healthCheck.issues,
      recommendations: healthCheck.recommendations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in health check:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// =============================================================================
// BlueMap Statistics Endpoints
// =============================================================================

/**
 * GET /api/bluemap/statistics/usage
 * Get usage statistics for BlueMap across all servers
 */
router.get('/statistics/usage', async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;

    const usageStats = await bluemapMetricsService.getUsageStatistics(timeframe);

    res.json({
      timeframe,
      servers: usageStats.serverStats,
      totalUsers: usageStats.totalUsers,
      totalSessions: usageStats.totalSessions,
      averageSessionTime: usageStats.averageSessionTime,
      popularWorlds: usageStats.popularWorlds,
      featureUsage: usageStats.featureUsage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching usage statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch usage statistics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate performance score for a server
 */
function calculatePerformanceScore(metric) {
  let score = 100;

  // Memory usage penalty
  if (metric.memoryUsage > 1024) score -= 20;
  else if (metric.memoryUsage > 512) score -= 10;

  // Cache hit rate bonus/penalty
  if (metric.cacheHitRate < 70) score -= 15;
  else if (metric.cacheHitRate > 90) score += 10;

  // Render time penalty
  if (metric.averageRenderTime > 300) score -= 15;
  else if (metric.averageRenderTime > 180) score -= 5;

  // Queue length penalty
  if (metric.renderQueueLength > 5) score -= 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * Get performance rating based on score
 */
function getPerformanceRating(metric) {
  const score = calculatePerformanceScore(metric);
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
}

/**
 * Get performance recommendations
 */
function getPerformanceRecommendations(metric) {
  const recommendations = [];

  if (metric.memoryUsage > 1024) {
    recommendations.push('Consider increasing server memory or optimizing cache settings');
  }

  if (metric.cacheHitRate < 70) {
    recommendations.push('Increase cache size or optimize cache strategy');
  }

  if (metric.averageRenderTime > 300) {
    recommendations.push('Reduce render distance or increase concurrent render capacity');
  }

  if (metric.renderQueueLength > 5) {
    recommendations.push('Consider adding more render workers or optimizing render priority');
  }

  return recommendations;
}

/**
 * Perform comprehensive system health check
 */
async function performSystemHealthCheck() {
  const servers = [
    'mc-basop-bafep-stp',
    'mc-bgstpoelten',
    'mc-borgstpoelten',
    'mc-hakstpoelten',
    'mc-htlstp',
    'mc-ilias',
    'mc-niilo'
  ];

  const serverHealth = [];
  const issues = [];
  const recommendations = [];

  for (const serverName of servers) {
    try {
      const status = await bluemapLazyService.getServerStatus(serverName);
      const health = {
        name: serverName,
        status: status.isHealthy ? 'healthy' : 'unhealthy',
        responseTime: status.responseTime || 0,
        issues: []
      };

      if (!status.isHealthy) {
        health.issues.push('Server is not responding properly');
        issues.push(`${serverName}: Server health check failed`);
      }

      if (status.memoryUsage > 1024) {
        health.issues.push('High memory usage');
        issues.push(`${serverName}: Memory usage exceeds 1GB`);
      }

      if (status.cacheHitRate < 70) {
        health.issues.push('Low cache hit rate');
        issues.push(`${serverName}: Cache hit rate below 70%`);
      }

      serverHealth.push(health);
    } catch (error) {
      serverHealth.push({
        name: serverName,
        status: 'error',
        error: error.message,
        issues: ['Server unreachable']
      });
      issues.push(`${serverName}: ${error.message}`);
    }
  }

  const healthyServers = serverHealth.filter(s => s.status === 'healthy').length;
  const overallStatus = healthyServers === 7 ? 'healthy' :
                       healthyServers >= 5 ? 'degraded' : 'unhealthy';

  if (healthyServers < 7) {
    recommendations.push('Check network connectivity and server status');
  }

  if (issues.length > 0) {
    recommendations.push('Review server health issues and performance metrics');
  }

  return {
    overallStatus,
    uptime: process.uptime(),
    serverHealth,
    performance: {
      averageMemoryUsage: serverHealth.reduce((sum, s) => sum + (s.memoryUsage || 0), 0) / servers.length,
      healthyServerRatio: healthyServers / servers.length
    },
    issues,
    recommendations
  };
}

module.exports = router;