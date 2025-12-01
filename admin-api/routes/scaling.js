const express = require('express');
const router = express.Router();
const scalingService = require('../services/scalingService');
const overviewerService = require('../services/overviewerService');

// Get scaling status
router.get('/status', async (req, res) => {
  const startTime = Date.now();

  try {
    const scalingStatus = scalingService.getScalingStatus();

    res.json({
      success: true,
      data: scalingStatus
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/scaling/status', 'GET', duration, 200);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/scaling/status', 'GET', duration, 500);
  }
});

// Create worker container
router.post('/workers', async (req, res) => {
  const startTime = Date.now();

  try {
    const { capacity, memoryLimit, cpuShares } = req.body;

    const config = {
      capacity: capacity || 2,
      memoryLimit: memoryLimit || 1073741824, // 1GB
      cpuShares: cpuShares || 512
    };

    const worker = await scalingService.createWorkerContainer(config);

    res.status(201).json({
      success: true,
      data: worker
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/scaling/workers', 'POST', duration, 201);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/scaling/workers', 'POST', duration, 500);
  }
});

// Remove worker container
router.delete('/workers/:workerId', async (req, res) => {
  const startTime = Date.now();
  const { workerId } = req.params;

  try {
    await scalingService.removeWorkerContainer(workerId);

    res.json({
      success: true,
      message: `Worker ${workerId} removed successfully`
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/scaling/workers/:workerId', 'DELETE', duration, 200);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/scaling/workers/:workerId', 'DELETE', duration, 500);
  }
});

// Manual scale up
router.post('/scale-up', async (req, res) => {
  const startTime = Date.now();

  try {
    const { count } = req.body;
    const workersToAdd = count || 1;

    await scalingService.scaleUp(workersToAdd);

    res.json({
      success: true,
      message: `Scaled up by ${workersToAdd} workers`
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/scaling/scale-up', 'POST', duration, 200);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/scaling/scale-up', 'POST', duration, 500);
  }
});

// Manual scale down
router.post('/scale-down', async (req, res) => {
  const startTime = Date.now();

  try {
    const { count } = req.body;
    const workersToRemove = count || 1;

    await scalingService.scaleDown(workersToRemove);

    res.json({
      success: true,
      message: `Scaled down by ${workersToRemove} workers`
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/scaling/scale-down', 'POST', duration, 200);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/scaling/scale-down', 'POST', duration, 500);
  }
});

// Force auto-scaling evaluation
router.post('/evaluate-scaling', async (req, res) => {
  const startTime = Date.now();

  try {
    const scalingDecision = await scalingService.evaluateAutoScaling();

    res.json({
      success: true,
      data: scalingDecision
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/scaling/evaluate-scaling', 'POST', duration, 200);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/scaling/evaluate-scaling', 'POST', duration, 500);
  }
});

// Get worker details
router.get('/workers/:workerId', async (req, res) => {
  const startTime = Date.now();
  const { workerId } = req.params;

  try {
    const scalingStatus = scalingService.getScalingStatus();
    const worker = scalingStatus.workers.find(w => w.id === workerId);

    if (!worker) {
      return res.status(404).json({
        success: false,
        error: `Worker ${workerId} not found`
      });
    }

    res.json({
      success: true,
      data: worker
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/scaling/workers/:workerId', 'GET', duration, 200);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/scaling/workers/:workerId', 'GET', duration, 500);
  }
});

// Get load balancer statistics
router.get('/load-balancer/stats', async (req, res) => {
  const startTime = Date.now();

  try {
    const scalingStatus = scalingService.getScalingStatus();

    // Calculate load balancer statistics
    const stats = {
      totalWorkers: scalingStatus.totalWorkers,
      healthyWorkers: scalingStatus.healthStatus.healthy,
      averageUtilization: scalingStatus.utilization,
      totalCapacity: scalingStatus.totalCapacity,
      currentLoad: scalingStatus.currentLoad,
      loadDistribution: scalingStatus.workers.map(w => ({
        workerId: w.id,
        utilization: w.utilization,
        capacity: w.capacity,
        currentJobs: w.currentJobs,
        healthStatus: w.healthStatus
      })),
      recommendations: generateLoadBalancerRecommendations(scalingStatus)
    };

    res.json({
      success: true,
      data: stats
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/scaling/load-balancer/stats', 'GET', duration, 200);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/scaling/load-balancer/stats', 'GET', duration, 500);
  }
});

// Health check endpoint for workers
router.get('/health', async (req, res) => {
  const startTime = Date.now();

  try {
    const scalingStatus = scalingService.getScalingStatus();

    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      totalWorkers: scalingStatus.totalWorkers,
      healthyWorkers: scalingStatus.healthStatus.healthy,
      degradedWorkers: scalingStatus.healthStatus.degraded,
      unhealthyWorkers: scalingStatus.healthStatus.unhealthy,
      overallHealth: calculateOverallHealth(scalingStatus.healthStatus),
      recommendations: [
        ...(scalingStatus.healthStatus.unhealthy > 0 ? ['Consider removing unhealthy workers'] : []),
        ...(scalingStatus.utilization > 80 ? ['Consider scaling up due to high utilization'] : []),
        ...(scalingStatus.utilization < 20 && scalingStatus.totalWorkers > 2 ? ['Consider scaling down due to low utilization'] : [])
      ]
    };

    res.json({
      success: true,
      data: healthCheck
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/scaling/health', 'GET', duration, 200);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/scaling/health', 'GET', duration, 500);
  }
});

// Configure auto-scaling policies
router.post('/auto-scaling/config', async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      minWorkers,
      maxWorkers,
      scaleUpUtilization,
      scaleDownUtilization,
      scaleUpCooldown,
      scaleDownCooldown
    } = req.body;

    // Store configuration (in a real implementation, this would be stored in Redis or database)
    const config = {
      minWorkers: minWorkers || 1,
      maxWorkers: maxWorkers || 10,
      scaleUpUtilization: scaleUpUtilization || 80,
      scaleDownUtilization: scaleDownUtilization || 30,
      scaleUpCooldown: scaleUpCooldown || 300, // 5 minutes
      scaleDownCooldown: scaleDownCooldown || 600, // 10 minutes
      updatedAt: new Date().toISOString()
    };

    // TODO: Store in Redis or configuration file
    // scalingService.autoScaler.updateConfig(config);

    res.json({
      success: true,
      data: config,
      message: 'Auto-scaling configuration updated'
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/scaling/auto-scaling/config', 'POST', duration, 200);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/scaling/auto-scaling/config', 'POST', duration, 500);
  }
});

// Get auto-scaling configuration
router.get('/auto-scaling/config', async (req, res) => {
  const startTime = Date.now();

  try {
    // TODO: Retrieve from Redis or configuration file
    const config = {
      minWorkers: 1,
      maxWorkers: 10,
      scaleUpUtilization: 80,
      scaleDownUtilization: 30,
      scaleUpCooldown: 300,
      scaleDownCooldown: 600
    };

    res.json({
      success: true,
      data: config
    });

    // Track API performance
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/scaling/auto-scaling/config', 'GET', duration, 200);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });

    // Track API performance for errors
    const duration = Date.now() - startTime;
    overviewerService.trackApiCall('/scaling/auto-scaling/config', 'GET', duration, 500);
  }
});

// Helper functions
function generateLoadBalancerRecommendations(scalingStatus) {
  const recommendations = [];

  if (scalingStatus.utilization > 80) {
    recommendations.push('High utilization detected. Consider scaling up.');
  }

  if (scalingStatus.utilization < 20 && scalingStatus.totalWorkers > 2) {
    recommendations.push('Low utilization detected. Consider scaling down.');
  }

  if (scalingStatus.healthStatus.unhealthy > 0) {
    recommendations.push(`${scalingStatus.healthStatus.unhealthy} unhealthy workers detected. Consider replacement.`);
  }

  if (scalingStatus.healthStatus.degraded > 0) {
    recommendations.push(`${scalingStatus.healthStatus.degraded} degraded workers detected. Monitor closely.`);
  }

  return recommendations;
}

function calculateOverallHealth(healthStatus) {
  const total = healthStatus.healthy + healthStatus.degraded + healthStatus.unhealthy;
  if (total === 0) return 'no-workers';

  const healthScore = (healthStatus.healthy * 1 + healthStatus.degraded * 0.5) / total;

  if (healthScore >= 0.9) return 'excellent';
  if (healthScore >= 0.7) return 'good';
  if (healthScore >= 0.5) return 'fair';
  return 'poor';
}

module.exports = router;