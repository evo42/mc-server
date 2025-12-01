const express = require('express');
const router = express.Router();
const { monitoringService } = require('../services/monitoringService');
const { register } = require('../services/monitoringService');
const overviewerService = require('../services/overviewerService');

// Prometheus metrics endpoint
router.get('/metrics', async (req, res) => {
  const startTime = Date.now();

  try {
    res.set('Content-Type', register.contentType);
    const metrics = await monitoringService.getMetrics();
    res.end(metrics);

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/metrics', 'GET', duration, 200);

  } catch (error) {
    res.status(500).end();

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/metrics', 'GET', duration, 500);
  }
});

// Health check endpoint with detailed monitoring
router.get('/health', async (req, res) => {
  const startTime = Date.now();

  try {
    const healthStatus = await monitoringService.healthCheck();
    const systemMetrics = monitoringService.getSystemMetrics();

    res.json({
      status: healthStatus.status,
      timestamp: new Date().toISOString(),
      service: 'minecraft-overviewer-monitoring',
      overviewer: overviewerService.getHealthStatus(),
      monitoring: healthStatus,
      system: systemMetrics
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/health', 'GET', duration, 200);

  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/health', 'GET', duration, 500);
  }
});

// Statistics endpoint
router.get('/stats', (req, res) => {
  const startTime = Date.now();

  try {
    const stats = monitoringService.getStatistics();
    const renderJobs = Array.from(overviewerService.renderJobs.values());

    res.json({
      timestamp: new Date().toISOString(),
      service: 'minecraft-overviewer-monitoring',
      statistics: stats,
      activeRenderJobs: renderJobs.filter(job => job.status === 'rendering').length,
      pendingRenderJobs: renderJobs.filter(job => job.status === 'pending').length,
      totalRenderJobs: renderJobs.length,
      publicMaps: overviewerService.publicMaps.size
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/stats', 'GET', duration, 200);

  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/stats', 'GET', duration, 500);
  }
});

// Performance metrics endpoint
router.get('/performance', (req, res) => {
  const startTime = Date.now();

  try {
    const topEndpoints = monitoringService.getTopApiEndpoints(20);
    const systemMetrics = monitoringService.getSystemMetrics();
    const cacheStats = overviewerService.getHealthStatus();

    res.json({
      timestamp: new Date().toISOString(),
      service: 'minecraft-overviewer-performance',
      apiUsage: topEndpoints,
      system: systemMetrics,
      cache: cacheStats,
      uptime: process.uptime()
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/performance', 'GET', duration, 200);

  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/performance', 'GET', duration, 500);
  }
});

// Overviewer-specific monitoring
router.get('/overviewer-status', (req, res) => {
  const startTime = Date.now();

  try {
    const healthStatus = overviewerService.getHealthStatus();
    const allJobs = Array.from(overviewerService.renderJobs.values());
    const publicMaps = Array.from(overviewerService.publicMaps.values());

    res.json({
      timestamp: new Date().toISOString(),
      service: 'minecraft-overviewer-service',
      health: healthStatus,
      renderJobs: {
        total: allJobs.length,
        active: allJobs.filter(job => job.status === 'rendering').length,
        pending: allJobs.filter(job => job.status === 'pending').length,
        completed: allJobs.filter(job => job.status === 'completed').length,
        failed: allJobs.filter(job => job.status === 'failed').length
      },
      publicMaps: {
        total: publicMaps.length,
        maps: publicMaps.map(map => ({
          id: map.id,
          server: map.server,
          world: map.world,
          createdAt: map.createdAt,
          publicAccess: map.publicAccess || false
        }))
      }
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/overviewer-status', 'GET', duration, 200);

  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/overviewer-status', 'GET', duration, 500);
  }
});

// Real-time monitoring WebSocket endpoint (for live updates)
router.get('/realtime', (req, res) => {
  const startTime = Date.now();

  try {
    const stats = monitoringService.getStatistics();
    const healthStatus = overviewerService.getHealthStatus();
    const allJobs = Array.from(overviewerService.renderJobs.values());

    // Get active jobs with live progress
    const activeJobs = allJobs
      .filter(job => job.status === 'rendering' || job.status === 'pending')
      .map(job => {
        const now = Date.now();
        const startTimeMs = job.startTime || now;
        const duration = now - startTimeMs;

        return {
          id: job.id,
          server: job.server,
          world: job.world,
          status: job.status,
          progress: job.progress || 0,
          duration: duration,
          estimatedTimeRemaining: job.estimatedTimeRemaining || null,
          startTime: startTimeMs
        };
      });

    res.json({
      timestamp: new Date().toISOString(),
      service: 'minecraft-overviewer-realtime',
      statistics: stats,
      health: healthStatus,
      activeJobs: activeJobs,
      totalJobs: allJobs.length,
      publicMaps: overviewerService.publicMaps.size
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/realtime', 'GET', duration, 200);

  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/realtime', 'GET', duration, 500);
  }
});

// Prometheus registry info
router.get('/registry-info', (req, res) => {
  const startTime = Date.now();

  try {
    const metricNames = register.getSingleMetricNames();
    const defaultMetrics = register.getMetricsAsJSON();

    res.json({
      timestamp: new Date().toISOString(),
      service: 'minecraft-overviewer-registry',
      metrics: {
        count: metricNames.length,
        names: metricNames,
        defaultMetrics: Object.keys(defaultMetrics)
      },
      registry: {
        contentType: register.contentType,
        timestamp: new Date().toISOString()
      }
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/registry-info', 'GET', duration, 200);

  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/registry-info', 'GET', duration, 500);
  }
});

module.exports = router;