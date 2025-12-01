/**
 * BlueMap Metrics Service
 * Comprehensive metrics collection and analysis for BlueMap Lazy Server infrastructure
 */

const promClient = require('prom-client');
const redis = require('redis');

class BlueMapMetricsService {
  constructor() {
    this.redisClient = null;
    this.metrics = new Map();
    this.alerts = [];
    this.initializeMetrics();
  }

  /**
   * Initialize Prometheus metrics and Redis connection
   */
  async initializeMetrics() {
    try {
      console.log('📊 Initializing BlueMap Metrics Service...');

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

      // Initialize Prometheus metrics
      this.initializePrometheusMetrics();

      // Start metrics collection
      this.startMetricsCollection();

      console.log('✅ BlueMap Metrics Service initialized successfully');

    } catch (error) {
      console.error('❌ Error initializing BlueMap Metrics Service:', error);
      throw error;
    }
  }

  /**
   * Initialize Prometheus metrics for BlueMap
   */
  initializePrometheusMetrics() {
    // Register default metrics
    promClient.collectDefaultMetrics();

    // BlueMap Server Status Gauge
    this.bluemapServerStatus = new promClient.Gauge({
      name: 'bluemap_server_status',
      help: 'Status of BlueMap servers (1=online, 0=offline)',
      labelNames: ['server_name', 'server_type']
    });

    // BlueMap Memory Usage Gauge
    this.bluemapMemoryUsage = new promClient.Gauge({
      name: 'bluemap_memory_usage_bytes',
      help: 'Memory usage of BlueMap servers in bytes',
      labelNames: ['server_name']
    });

    // BlueMap Render Duration Histogram
    this.bluemapRenderDuration = new promClient.Histogram({
      name: 'bluemap_render_duration_seconds',
      help: 'Time spent rendering areas in seconds',
      labelNames: ['server_name', 'area_size'],
      buckets: [5, 10, 30, 60, 120, 300, 600, 1200]
    });

    // BlueMap Cache Hit Rate Gauge
    this.bluemapCacheHitRate = new promClient.Gauge({
      name: 'bluemap_cache_hit_rate',
      help: 'Cache hit rate percentage',
      labelNames: ['server_name']
    });

    // BlueMap Render Queue Length Gauge
    this.bluemapRenderQueue = new promClient.Gauge({
      name: 'bluemap_render_queue_length',
      help: 'Number of pending render jobs',
      labelNames: ['server_name']
    });

    // BlueMap Active Users Gauge
    this.bluemapActiveUsers = new promClient.Gauge({
      name: 'bluemap_active_users',
      help: 'Number of active users viewing maps',
      labelNames: ['server_name']
    });

    // BlueMap Web Interface Response Time
    this.bluemapResponseTime = new promClient.Histogram({
      name: 'bluemap_web_response_time_seconds',
      help: 'Web interface response time in seconds',
      labelNames: ['server_name', 'endpoint'],
      buckets: [0.1, 0.25, 0.5, 1, 2, 5, 10]
    });

    // BlueMap Errors Counter
    this.bluemapErrors = new promClient.Counter({
      name: 'bluemap_errors_total',
      help: 'Total number of BlueMap errors',
      labelNames: ['server_name', 'error_type']
    });

    // BlueMap 3D Navigation Usage
    this.bluemap3DUsage = new promClient.Counter({
      name: 'bluemap_3d_navigation_total',
      help: 'Total number of 3D navigation sessions',
      labelNames: ['server_name', 'client_type']
    });

    // BlueMap Performance Score
    this.bluemapPerformanceScore = new promClient.Gauge({
      name: 'bluemap_performance_score',
      help: 'Overall performance score for BlueMap servers',
      labelNames: ['server_name']
    });

    console.log('📈 Prometheus metrics initialized');
  }

  /**
   * Start continuous metrics collection
   */
  startMetricsCollection() {
    // Collect metrics every 30 seconds
    setInterval(() => {
      this.collectServerMetrics();
    }, 30000);

    // Collect user analytics every 60 seconds
    setInterval(() => {
      this.collectUserAnalytics();
    }, 60000);

    // Update performance trends every 5 minutes
    setInterval(() => {
      this.updatePerformanceTrends();
    }, 300000);

    // Check alerts every 15 seconds
    setInterval(() => {
      this.checkAlerts();
    }, 15000);

    console.log('🔄 Started metrics collection');
  }

  /**
   * Collect metrics from all BlueMap servers
   */
  async collectServerMetrics() {
    const servers = [
      'mc-basop-bafep-stp',
      'mc-bgstpoelten',
      'mc-borgstpoelten',
      'mc-hakstpoelten',
      'mc-htlstp',
      'mc-ilias',
      'mc-niilo'
    ];

    for (const serverName of servers) {
      try {
        await this.collectServerMetrics(serverName);
      } catch (error) {
        console.error(`❌ Error collecting metrics for ${serverName}:`, error);

        // Record error metric
        this.bluemapErrors.inc({
          server_name: serverName,
          error_type: 'metrics_collection'
        });
      }
    }
  }

  /**
   * Collect metrics from a specific server
   */
  async collectServerMetrics(serverName) {
    try {
      // Get server status
      const status = await this.getServerStatus(serverName);

      // Update Prometheus metrics
      this.bluemapServerStatus.set({
        server_name: serverName,
        server_type: status.serverType
      }, status.isActive ? 1 : 0);

      this.bluemapMemoryUsage.set({
        server_name: serverName
      }, status.memoryUsage * 1024 * 1024); // Convert MB to bytes

      this.bluemapCacheHitRate.set({
        server_name: serverName
      }, status.cacheHitRate);

      this.bluemapRenderQueue.set({
        server_name: serverName
      }, status.renderQueueLength);

      this.bluemapActiveUsers.set({
        server_name: serverName
      }, status.activePlayers || 0);

      // Calculate and record performance score
      const performanceScore = this.calculatePerformanceScore(status);
      this.bluemapPerformanceScore.set({
        server_name: serverName
      }, performanceScore);

      // Store metrics in Redis for historical analysis
      await this.storeMetricsInRedis(serverName, status, performanceScore);

    } catch (error) {
      console.error(`❌ Error collecting metrics for ${serverName}:`, error);
      throw error;
    }
  }

  /**
   * Store metrics in Redis for historical analysis
   */
  async storeMetricsInRedis(serverName, status, performanceScore) {
    try {
      const metricsData = {
        timestamp: Date.now(),
        status,
        performanceScore,
        memoryUsage: status.memoryUsage,
        cacheHitRate: status.cacheHitRate,
        activePlayers: status.activePlayers || 0,
        renderQueueLength: status.renderQueueLength
      };

      // Store in time-series format
      const timeSeriesKey = `bluemap:timeseries:${serverName}`;
      await this.redisClient.lPush(timeSeriesKey, JSON.stringify(metricsData));

      // Keep only last 1000 entries
      await this.redisClient.lTrim(timeSeriesKey, 0, 999);

      // Set expiration for time series data (7 days)
      await this.redisClient.expire(timeSeriesKey, 604800);

    } catch (error) {
      console.error(`❌ Error storing metrics for ${serverName}:`, error);
    }
  }

  /**
   * Calculate performance score for a server
   */
  calculatePerformanceScore(status) {
    let score = 100;

    // Memory usage impact (25% weight)
    if (status.memoryUsage > 1024) score -= 25;
    else if (status.memoryUsage > 768) score -= 15;
    else if (status.memoryUsage > 512) score -= 5;

    // Cache hit rate impact (25% weight)
    if (status.cacheHitRate < 60) score -= 25;
    else if (status.cacheHitRate < 75) score -= 15;
    else if (status.cacheHitRate < 90) score -= 5;

    // Server availability impact (30% weight)
    if (!status.isActive) score -= 30;

    // Render queue impact (20% weight)
    if (status.renderQueueLength > 10) score -= 20;
    else if (status.renderQueueLength > 5) score -= 10;
    else if (status.renderQueueLength > 2) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Collect user analytics
   */
  async collectUserAnalytics() {
    try {
      // Simulate user analytics (in production, this would come from BlueMap web interface)
      const userAnalytics = {
        totalUsers: Math.floor(Math.random() * 100) + 50,
        activeSessions: Math.floor(Math.random() * 30) + 10,
        averageSessionTime: Math.floor(Math.random() * 1800) + 300, // 5-30 minutes
        featureUsage: {
          '3d_navigation': Math.floor(Math.random() * 40) + 30,
          'flat_map': Math.floor(Math.random() * 50) + 20,
          'poi_markers': Math.floor(Math.random() * 60) + 25,
          'search_function': Math.floor(Math.random() * 35) + 15
        },
        deviceTypes: {
          'desktop': Math.floor(Math.random() * 30) + 40,
          'mobile': Math.floor(Math.random() * 40) + 30,
          'tablet': Math.floor(Math.random() * 20) + 10
        }
      };

      // Store analytics in Redis
      const analyticsKey = 'bluemap:user_analytics';
      await this.redisClient.setEx(analyticsKey, 3600, JSON.stringify(userAnalytics));

      // Update 3D usage counter
      const servers = ['mc-basop-bafep-stp', 'mc-bgstpoelten', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-htlstp', 'mc-ilias', 'mc-niilo'];
      for (const serverName of servers) {
        this.bluemap3DUsage.inc({
          server_name: serverName,
          client_type: userAnalytics.deviceTypes.desktop > userAnalytics.deviceTypes.mobile ? 'desktop' : 'mobile'
        });
      }

    } catch (error) {
      console.error('❌ Error collecting user analytics:', error);
    }
  }

  /**
   * Get usage statistics for a specific timeframe
   */
  async getUsageStatistics(timeframe = '24h') {
    try {
      const timeframeMs = this.parseTimeframe(timeframe);
      const cutoffTime = Date.now() - timeframeMs;

      const analyticsKey = 'bluemap:user_analytics';
      const analyticsData = await this.redisClient.get(analyticsKey);

      if (!analyticsData) {
        return this.generateDefaultUsageStats(timeframe);
      }

      const analytics = JSON.parse(analyticsData);

      return {
        timeframe,
        totalUsers: analytics.totalUsers,
        totalSessions: analytics.activeSessions,
        averageSessionTime: analytics.averageSessionTime,
        popularWorlds: await this.getPopularWorlds(timeframeMs),
        featureUsage: analytics.featureUsage,
        deviceBreakdown: analytics.deviceTypes,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error getting usage statistics:', error);
      return this.generateDefaultUsageStats(timeframe);
    }
  }

  /**
   * Parse timeframe string to milliseconds
   */
  parseTimeframe(timeframe) {
    const units = {
      's': 1000,
      'm': 60000,
      'h': 3600000,
      'd': 86400000
    };

    const match = timeframe.match(/^(\d+)([smhd])$/);
    if (!match) return 86400000; // Default to 24 hours

    const value = parseInt(match[1]);
    const unit = match[2];

    return value * units[unit];
  }

  /**
   * Generate default usage statistics
   */
  generateDefaultUsageStats(timeframe) {
    return {
      timeframe,
      totalUsers: 0,
      totalSessions: 0,
      averageSessionTime: 0,
      popularWorlds: [],
      featureUsage: {
        '3d_navigation': 0,
        'flat_map': 0,
        'poi_markers': 0,
        'search_function': 0
      },
      deviceBreakdown: {
        'desktop': 0,
        'mobile': 0,
        'tablet': 0
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get popular worlds based on usage
   */
  async getPopularWorlds(timeframeMs) {
    const servers = [
      { name: 'mc-basop-bafep-stp', visits: Math.floor(Math.random() * 200) + 50 },
      { name: 'mc-bgstpoelten', visits: Math.floor(Math.random() * 180) + 40 },
      { name: 'mc-borgstpoelten', visits: Math.floor(Math.random() * 220) + 60 },
      { name: 'mc-hakstpoelten', visits: Math.floor(Math.random() * 250) + 80 },
      { name: 'mc-htlstp', visits: Math.floor(Math.random() * 200) + 70 },
      { name: 'mc-ilias', visits: Math.floor(Math.random() * 150) + 30 },
      { name: 'mc-niilo', visits: Math.floor(Math.random() * 300) + 100 }
    ];

    return servers
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5)
      .map(server => ({
        world: server.name,
        visits: server.visits,
        percentage: Math.round((server.visits / servers.reduce((sum, s) => sum + s.visits, 0)) * 100)
      }));
  }

  /**
   * Get performance trends
   */
  async getPerformanceTrends() {
    try {
      const trends = [];
      const servers = [
        'mc-basop-bafep-stp',
        'mc-bgstpoelten',
        'mc-borgstpoelten',
        'mc-hakstpoelten',
        'mc-htlstp',
        'mc-ilias',
        'mc-niilo'
      ];

      for (const serverName of servers) {
        const timeSeriesKey = `bluemap:timeseries:${serverName}`;
        const timeSeriesData = await this.redisClient.lRange(timeSeriesKey, 0, 23); // Last 24 entries

        if (timeSeriesData.length > 1) {
          const parsedData = timeSeriesData.map(entry => JSON.parse(entry));
          const trend = this.calculateTrend(parsedData);

          trends.push({
            serverName,
            trend: trend.direction,
            changeRate: trend.changeRate,
            currentScore: trend.currentScore,
            averageScore: trend.averageScore,
            recommendation: this.getTrendRecommendation(trend)
          });
        }
      }

      return trends;

    } catch (error) {
      console.error('❌ Error calculating performance trends:', error);
      return [];
    }
  }

  /**
   * Calculate trend from time series data
   */
  calculateTrend(data) {
    if (data.length < 2) {
      return { direction: 'stable', changeRate: 0, currentScore: 0, averageScore: 0 };
    }

    const recent = data.slice(-6); // Last 6 data points
    const older = data.slice(0, 6); // First 6 data points

    const recentAvg = recent.reduce((sum, d) => sum + d.performanceScore, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.performanceScore, 0) / older.length;

    const changeRate = ((recentAvg - olderAvg) / olderAvg) * 100;
    const direction = changeRate > 5 ? 'improving' : changeRate < -5 ? 'declining' : 'stable';

    return {
      direction,
      changeRate: Math.round(changeRate * 100) / 100,
      currentScore: recentAvg,
      averageScore: (recentAvg + olderAvg) / 2
    };
  }

  /**
   * Get trend recommendation
   */
  getTrendRecommendation(trend) {
    if (trend.direction === 'declining' && trend.changeRate < -10) {
      return 'Performance is declining rapidly. Immediate attention required.';
    } else if (trend.direction === 'improving' && trend.changeRate > 10) {
      return 'Performance is improving well. Continue current optimizations.';
    } else if (trend.direction === 'stable') {
      return 'Performance is stable. Consider minor optimizations.';
    }
    return 'Monitor performance trends closely.';
  }

  /**
   * Check for alerts
   */
  async checkAlerts() {
    try {
      const alerts = [];
      const servers = [
        'mc-basop-bafep-stp',
        'mc-bgstpoelten',
        'mc-borgstpoelten',
        'mc-hakstpoelten',
        'mc-htlstp',
        'mc-ilias',
        'mc-niilo'
      ];

      for (const serverName of servers) {
        try {
          const status = await this.getServerStatus(serverName);

          // Check for critical alerts
          if (!status.isActive) {
            alerts.push({
              severity: 'critical',
              serverName,
              message: `${serverName} is offline`,
              timestamp: Date.now()
            });
          }

          if (status.memoryUsage > 1024) {
            alerts.push({
              severity: 'warning',
              serverName,
              message: `${serverName} memory usage is high (${status.memoryUsage}MB)`,
              timestamp: Date.now()
            });
          }

          if (status.cacheHitRate < 60) {
            alerts.push({
              severity: 'warning',
              serverName,
              message: `${serverName} cache hit rate is low (${status.cacheHitRate}%)`,
              timestamp: Date.now()
            });
          }

          if (status.renderQueueLength > 10) {
            alerts.push({
              severity: 'warning',
              serverName,
              message: `${serverName} render queue is overloaded (${status.renderQueueLength} jobs)`,
              timestamp: Date.now()
            });
          }

        } catch (error) {
          alerts.push({
            severity: 'critical',
            serverName,
            message: `Failed to check ${serverName} status: ${error.message}`,
            timestamp: Date.now()
          });
        }
      }

      this.alerts = alerts;

      // Store alerts in Redis
      const alertsKey = 'bluemap:alerts';
      await this.redisClient.setEx(alertsKey, 3600, JSON.stringify(alerts));

    } catch (error) {
      console.error('❌ Error checking alerts:', error);
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts() {
    try {
      const alertsKey = 'bluemap:alerts';
      const alertsData = await this.redisClient.get(alertsKey);

      if (alertsData) {
        return JSON.parse(alertsData);
      }

      return this.alerts;

    } catch (error) {
      console.error('❌ Error getting active alerts:', error);
      return this.alerts;
    }
  }

  /**
   * Update performance trends
   */
  async updatePerformanceTrends() {
    try {
      const trends = await this.getPerformanceTrends();

      // Store trends in Redis
      const trendsKey = 'bluemap:performance_trends';
      await this.redisClient.setEx(trendsKey, 3600, JSON.stringify(trends));

      console.log('📈 Updated performance trends');

    } catch (error) {
      console.error('❌ Error updating performance trends:', error);
    }
  }

  /**
   * Get Prometheus metrics in text format
   */
  async getPrometheusMetrics() {
    try {
      return await promClient.register.metrics();
    } catch (error) {
      console.error('❌ Error getting Prometheus metrics:', error);
      return '';
    }
  }

  /**
   * Record render job metrics
   */
  async recordRenderJobMetrics(serverName, duration, areaSize) {
    try {
      this.bluemapRenderDuration.observe({
        server_name: serverName,
        area_size: this.categorizeAreaSize(areaSize)
      }, duration);

      console.log(`📏 Recorded render job metrics for ${serverName}: ${duration}s, ${areaSize} chunks`);

    } catch (error) {
      console.error(`❌ Error recording render job metrics for ${serverName}:`, error);
    }
  }

  /**
   * Categorize area size for metrics
   */
  categorizeAreaSize(areaSize) {
    if (areaSize < 100) return 'small';
    if (areaSize < 500) return 'medium';
    if (areaSize < 1000) return 'large';
    return 'xlarge';
  }

  /**
   * Get server status (helper method)
   */
  async getServerStatus(serverName) {
    // This would integrate with the BlueMapLazyService
    // For now, return mock data
    return {
      serverName,
      isActive: Math.random() > 0.1, // 90% chance of being active
      memoryUsage: Math.floor(Math.random() * 1024) + 256,
      cacheHitRate: Math.floor(Math.random() * 40) + 60,
      renderQueueLength: Math.floor(Math.random() * 8),
      activePlayers: Math.floor(Math.random() * 20),
      serverType: this.getServerType(serverName),
      responseTime: Math.floor(Math.random() * 500) + 100
    };
  }

  /**
   * Get server type for a server name
   */
  getServerType(serverName) {
    const types = {
      'mc-basop-bafep-stp': 'education',
      'mc-bgstpoelten': 'secondary_education',
      'mc-borgstpoelten': 'academic',
      'mc-hakstpoelten': 'university',
      'mc-htlstp': 'technical',
      'mc-ilias': 'specialized',
      'mc-niilo': 'public'
    };

    return types[serverName] || 'unknown';
  }
}

module.exports = new BlueMapMetricsService();