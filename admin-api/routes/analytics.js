const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const overviewerService = require('../services/overviewerService');

// Render Analytics Endpoint
router.get('/render', async (req, res) => {
  const startTime = Date.now();
  const timeRange = req.query.timeRange || '24h';

  try {
    const analytics = analyticsService.getRenderAnalytics(timeRange);

    res.json({
      success: true,
      data: analytics,
      metadata: {
        timeRange,
        generatedAt: new Date().toISOString(),
        serverCount: Object.keys(analytics.serverPerformance).length,
        worldCount: Object.keys(analytics.worldStatistics).length
      }
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/analytics/render', 'GET', duration, 200);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      metadata: {
        timeRange,
        generatedAt: new Date().toISOString()
      }
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/analytics/render', 'GET', duration, 500);
  }
});

// Usage Analytics Endpoint
router.get('/usage', async (req, res) => {
  const startTime = Date.now();
  const timeRange = req.query.timeRange || '24h';

  try {
    const analytics = analyticsService.getUsageAnalytics(timeRange);

    res.json({
      success: true,
      data: analytics,
      metadata: {
        timeRange,
        generatedAt: new Date().toISOString(),
        endpointCount: analytics.summary.uniqueEndpoints,
        totalRequests: analytics.summary.totalRequests
      }
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/analytics/usage', 'GET', duration, 200);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      metadata: {
        timeRange,
        generatedAt: new Date().toISOString()
      }
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/analytics/usage', 'GET', duration, 500);
  }
});

// Performance Analytics Endpoint
router.get('/performance', async (req, res) => {
  const startTime = Date.now();
  const timeRange = req.query.timeRange || '7d';

  try {
    const analytics = analyticsService.getPerformanceAnalytics(timeRange);

    res.json({
      success: true,
      data: analytics,
      metadata: {
        timeRange,
        generatedAt: new Date().toISOString(),
        trendAnalysis: analytics.performanceTrends.trend,
        systemStatus: analytics.systemHealth.status
      }
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/analytics/performance', 'GET', duration, 200);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      metadata: {
        timeRange,
        generatedAt: new Date().toISOString()
      }
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/analytics/performance', 'GET', duration, 500);
  }
});

// Business Metrics Endpoint
router.get('/business', async (req, res) => {
  const startTime = Date.now();
  const timeRange = req.query.timeRange || '30d';

  try {
    const analytics = analyticsService.getBusinessMetrics(timeRange);

    res.json({
      success: true,
      data: analytics,
      metadata: {
        timeRange,
        generatedAt: new Date().toISOString(),
        kpiCount: Object.keys(analytics.kpis).length,
        serverCount: Object.keys(analytics.serverUtilization).length
      }
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/analytics/business', 'GET', duration, 200);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      metadata: {
        timeRange,
        generatedAt: new Date().toISOString()
      }
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/analytics/business', 'GET', duration, 500);
  }
});

// Combined Analytics Dashboard Endpoint
router.get('/dashboard', async (req, res) => {
  const startTime = Date.now();
  const timeRange = req.query.timeRange || '24h';

  try {
    // Get all analytics data
    const renderAnalytics = analyticsService.getRenderAnalytics(timeRange);
    const usageAnalytics = analyticsService.getUsageAnalytics(timeRange);
    const performanceAnalytics = analyticsService.getPerformanceAnalytics('7d');
    const businessAnalytics = analyticsService.getBusinessMetrics('30d');

    // Combine all data for dashboard
    const dashboard = {
      overview: {
        renderJobs: {
          total: renderAnalytics.summary.totalJobs,
          completed: renderAnalytics.summary.completedJobs,
          successRate: renderAnalytics.summary.successRate,
          averageDuration: renderAnalytics.summary.averageDurationFormatted
        },
        apiUsage: {
          totalRequests: usageAnalytics.summary.totalRequests,
          uniqueEndpoints: usageAnalytics.summary.uniqueEndpoints,
          peakHour: usageAnalytics.summary.peakHour
        },
        systemHealth: {
          status: performanceAnalytics.systemHealth.status,
          uptime: performanceAnalytics.systemHealth.uptime,
          memoryUsage: performanceAnalytics.systemHealth.memoryUsage.heapUsed
        },
        business: {
          totalPublicMaps: businessAnalytics.publicMapsMetrics.totalPublicMaps,
          efficiencyScore: businessAnalytics.costEfficiency.efficiencyScore,
          userActivity: businessAnalytics.engagementMetrics.userActivity
        }
      },
      charts: {
        renderSuccessRate: {
          data: [
            { name: 'Success', value: renderAnalytics.summary.completedJobs },
            { name: 'Failed', value: renderAnalytics.summary.failedJobs }
          ]
        },
        serverPerformance: Object.keys(renderAnalytics.serverPerformance).map(server => ({
          name: server,
          renderJobs: renderAnalytics.serverPerformance[server].totalJobs,
          successRate: renderAnalytics.serverPerformance[server].successRate,
          averageDuration: Math.round(renderAnalytics.serverPerformance[server].averageDuration / 60000) // Convert to minutes
        })),
        apiUsageByMethod: Object.keys(usageAnalytics.methodDistribution).map(method => ({
          name: method,
          value: usageAnalytics.methodDistribution[method]
        })),
        topEndpoints: usageAnalytics.topEndpoints.slice(0, 10),
        timeOfDayUsage: Object.keys(usageAnalytics.timeOfDayUsage).map(slot => ({
          name: slot,
          value: usageAnalytics.timeOfDayUsage[slot]
        }))
      },
      insights: {
        performance: performanceAnalytics.recommendations,
        trends: renderAnalytics.trends.insights,
        business: businessAnalytics.kpis
      },
      metadata: {
        timeRange,
        generatedAt: new Date().toISOString(),
        dataFreshness: 'real-time',
        lastUpdated: new Date().toISOString()
      }
    };

    res.json({
      success: true,
      data: dashboard
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/analytics/dashboard', 'GET', duration, 200);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      metadata: {
        timeRange,
        generatedAt: new Date().toISOString()
      }
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/analytics/dashboard', 'GET', duration, 500);
  }
});

// Real-time Analytics Endpoint
router.get('/realtime', async (req, res) => {
  const startTime = Date.now();

  try {
    // Get current analytics snapshot
    const currentJobs = Array.from(overviewerService.renderJobs.values());
    const activeJobs = currentJobs.filter(job =>
      job.status === 'rendering' || job.status === 'pending'
    );

    const stats = analyticsService.getStatistics();

    const realtimeData = {
      timestamp: new Date().toISOString(),
      currentStatus: {
        activeRenderJobs: activeJobs.length,
        pendingJobs: currentJobs.filter(job => job.status === 'pending').length,
        totalJobs: currentJobs.length,
        publicMaps: overviewerService.publicMaps.size,
        systemUptime: stats.uptimeFormatted
      },
      activeRenderJobs: activeJobs.map(job => ({
        id: job.id,
        server: job.server,
        world: job.world,
        status: job.status,
        progress: job.progress || 0,
        duration: job.startTime ? Date.now() - job.startTime : 0,
        estimatedTimeRemaining: job.estimatedTimeRemaining || null
      })),
      performance: {
        averageResponseTime: '120ms',
        currentLoad: 'normal',
        memoryUsage: '512MB',
        cpuUsage: '15%'
      },
      alerts: [
        // This could be populated with real-time alerts
      ]
    };

    res.json({
      success: true,
      data: realtimeData
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/analytics/realtime', 'GET', duration, 200);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/analytics/realtime', 'GET', duration, 500);
  }
});

// Historical Analytics Endpoint
router.get('/historical', async (req, res) => {
  const startTime = Date.now();
  const { startDate, endDate, metric } = req.query;

  try {
    // For now, return simulated historical data
    // In a real implementation, this would query historical data from a time-series database
    const historicalData = {
      metric: metric || 'renderJobs',
      timeRange: {
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: endDate || new Date().toISOString()
      },
      data: generateHistoricalData(metric),
      trends: {
        trend: 'improving',
        confidence: 0.85,
        insights: [
          'Performance has improved over the last 30 days',
          'User engagement is increasing steadily',
          'System reliability remains consistently high'
        ]
      }
    };

    res.json({
      success: true,
      data: historicalData,
      metadata: {
        generatedAt: new Date().toISOString(),
        dataPoints: historicalData.data.length
      }
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/analytics/historical', 'GET', duration, 200);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      metadata: {
        generatedAt: new Date().toISOString()
      }
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/analytics/historical', 'GET', duration, 500);
  }
});

// Export Analytics Endpoint
router.get('/export', async (req, res) => {
  const startTime = Date.now();
  const { format, timeRange, types } = req.query;

  try {
    const exportTypes = types ? types.split(',') : ['render', 'usage', 'performance', 'business'];

    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        timeRange: timeRange || '30d',
        format: format || 'json',
        types: exportTypes
      },
      data: {}
    };

    // Collect requested data types
    if (exportTypes.includes('render')) {
      exportData.data.render = analyticsService.getRenderAnalytics(timeRange || '30d');
    }
    if (exportTypes.includes('usage')) {
      exportData.data.usage = analyticsService.getUsageAnalytics(timeRange || '30d');
    }
    if (exportTypes.includes('performance')) {
      exportData.data.performance = analyticsService.getPerformanceAnalytics(timeRange || '30d');
    }
    if (exportTypes.includes('business')) {
      exportData.data.business = analyticsService.getBusinessMetrics(timeRange || '30d');
    }

    // Set appropriate headers
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${Date.now()}.csv"`);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${Date.now()}.json"`);
    }

    res.json(exportData);

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/analytics/export', 'GET', duration, 200);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      metadata: {
        exportedAt: new Date().toISOString()
      }
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/analytics/export', 'GET', duration, 500);
  }
});

// Helper function to generate historical data
function generateHistoricalData(metric) {
  const data = [];
  const now = new Date();

  // Generate 30 days of historical data
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);

    switch (metric) {
      case 'renderJobs':
        data.push({
          date: date.toISOString(),
          value: Math.floor(Math.random() * 50) + 20, // 20-70 jobs per day
          details: {
            successful: Math.floor(Math.random() * 40) + 15,
            failed: Math.floor(Math.random() * 10) + 1
          }
        });
        break;
      case 'apiRequests':
        data.push({
          date: date.toISOString(),
          value: Math.floor(Math.random() * 1000) + 500 // 500-1500 requests per day
        });
        break;
      case 'performance':
        data.push({
          date: date.toISOString(),
          value: Math.floor(Math.random() * 20) + 80 // 80-100% performance score
        });
        break;
      default:
        data.push({
          date: date.toISOString(),
          value: Math.floor(Math.random() * 100) + 50
        });
    }
  }

  return data;
}

module.exports = router;