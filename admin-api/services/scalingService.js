const Docker = require('dockerode');
const { monitoringService } = require('./monitoringService');
const { v4: uuidv4 } = require('uuid');

class ScalingService {
  constructor() {
    this.docker = new Docker();
    this.workerContainers = new Map();
    this.loadBalancer = new LoadBalancer();
    this.healthChecker = new HealthChecker();
    this.autoScaler = new AutoScaler();

    this.initializeScaling();
  }

  initializeScaling() {
    console.log('🚀 Initializing Scaling Service...');

    // Start health checking every 30 seconds
    setInterval(() => {
      this.performHealthChecks();
    }, 30000);

    // Start auto-scaling every 60 seconds
    setInterval(() => {
      this.autoScaler.evaluateScaling();
    }, 60000);

    console.log('✅ Scaling Service initialized');
  }

  // Worker Container Management
  async createWorkerContainer(config) {
    try {
      const workerId = config.id || uuidv4();
      const workerConfig = {
        Image: 'overviewer:production',
        name: `overviewer-worker-${workerId}`,
        Env: [
          `WORKER_ID=${workerId}`,
          `WORKER_CAPACITY=${config.capacity || 2}`,
          `REDIS_HOST=${process.env.REDIS_HOST || 'redis'}`,
          `REDIS_PORT=${process.env.REDIS_PORT || 6379}`,
          `REDIS_PASSWORD=${process.env.REDIS_PASSWORD || 'redissecure123'}`
        ],
        HostConfig: {
          Memory: config.memoryLimit || 1073741824, // 1GB default
          CpuShares: config.cpuShares || 512,
          ReadonlyRootfs: false,
          Binds: [
            '/data/output:/data/output:rw',
            '/tmp/overviewer:/tmp/overviewer:rw'
          ]
        },
        Networks: {
          'minecraft-net': {}
        },
        Healthcheck: {
          Test: ['CMD', 'curl', '-f', 'http://localhost:3003/health'],
          Interval: 30000,
          Timeout: 10000,
          Retries: 3,
          StartPeriod: 60000
        }
      };

      const container = await this.docker.createContainer(workerConfig);
      await container.start();

      const workerInfo = {
        id: workerId,
        containerId: container.id,
        status: 'starting',
        capacity: config.capacity || 2,
        currentJobs: 0,
        memoryLimit: config.memoryLimit || 1073741824,
        cpuShares: config.cpuShares || 512,
        createdAt: new Date(),
        lastHealthCheck: null,
        healthStatus: 'unknown'
      };

      this.workerContainers.set(workerId, workerInfo);

      console.log(`✅ Created worker container: ${workerId}`);

      // Track new worker creation
      monitoringService.recordScalingEvent('worker_created', {
        workerId,
        capacity: workerInfo.capacity
      });

      return workerInfo;
    } catch (error) {
      console.error('Failed to create worker container:', error);
      throw error;
    }
  }

  async removeWorkerContainer(workerId) {
    try {
      const worker = this.workerContainers.get(workerId);
      if (!worker) {
        throw new Error(`Worker ${workerId} not found`);
      }

      const container = this.docker.getContainer(worker.containerId);

      // Graceful shutdown - wait for current jobs to complete
      await this.gracefulShutdown(workerId);

      await container.stop({ t: 30 }); // 30 second grace period
      await container.remove();

      this.workerContainers.delete(workerId);

      console.log(`✅ Removed worker container: ${workerId}`);

      // Track worker removal
      monitoringService.recordScalingEvent('worker_removed', {
        workerId,
        finalJobCount: worker.currentJobs
      });

      return true;
    } catch (error) {
      console.error(`Failed to remove worker ${workerId}:`, error);
      throw error;
    }
  }

  async gracefulShutdown(workerId, timeout = 30000) {
    const worker = this.workerContainers.get(workerId);
    if (!worker) return;

    console.log(`🔄 Starting graceful shutdown of worker ${workerId}`);

    worker.status = 'draining';

    // Wait for current jobs to complete
    const startTime = Date.now();
    while (worker.currentJobs > 0 && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Force shutdown if jobs are still running
    if (worker.currentJobs > 0) {
      console.warn(`⚠️  Force stopping worker ${workerId} with ${worker.currentJobs} running jobs`);
    }

    worker.status = 'stopped';
  }

  // Load Balancing
  assignJobToWorker(jobData) {
    const availableWorkers = Array.from(this.workerContainers.values())
      .filter(worker =>
        worker.status === 'ready' &&
        worker.currentJobs < worker.capacity &&
        worker.healthStatus === 'healthy'
      );

    if (availableWorkers.length === 0) {
      throw new Error('No available workers for job assignment');
    }

    const selectedWorker = this.loadBalancer.selectWorker(availableWorkers, jobData);
    selectedWorker.currentJobs++;

    console.log(`📋 Assigned job to worker ${selectedWorker.id}`);

    // Track job assignment
    monitoringService.recordScalingEvent('job_assigned', {
      jobId: jobData.id,
      workerId: selectedWorker.id,
      workerLoad: selectedWorker.currentJobs / selectedWorker.capacity
    });

    return selectedWorker.id;
  }

  async completeJob(workerId, jobId) {
    const worker = this.workerContainers.get(workerId);
    if (worker) {
      worker.currentJobs = Math.max(0, worker.currentJobs - 1);

      // Track job completion
      monitoringService.recordScalingEvent('job_completed', {
        jobId,
        workerId,
        remainingJobs: worker.currentJobs
      });
    }
  }

  // Health Checking
  async performHealthChecks() {
    const promises = Array.from(this.workerContainers.entries())
      .map(async ([workerId, worker]) => {
        try {
          const healthStatus = await this.healthChecker.checkWorkerHealth(worker);
          worker.healthStatus = healthStatus.status;
          worker.lastHealthCheck = new Date();

          if (healthStatus.status === 'unhealthy' && worker.status === 'ready') {
            console.warn(`⚠️  Worker ${workerId} is unhealthy, marking as unhealthy`);
            worker.status = 'unhealthy';

            // Track health issue
            monitoringService.recordScalingEvent('worker_unhealthy', {
              workerId,
              reason: healthStatus.reason
            });
          }
        } catch (error) {
          console.error(`Health check failed for worker ${workerId}:`, error);
          worker.healthStatus = 'error';
        }
      });

    await Promise.all(promises);
  }

  // Auto-scaling
  async evaluateAutoScaling() {
    const scalingMetrics = this.autoScaler.collectMetrics();
    const scalingDecision = this.autoScaler.evaluateScaling(scalingMetrics);

    if (scalingDecision.shouldScaleUp) {
      await this.scaleUp(scalingDecision.workersToAdd);
    } else if (scalingDecision.shouldScaleDown) {
      await this.scaleDown(scalingDecision.workersToRemove);
    }

    return scalingDecision;
  }

  async scaleUp(count) {
    console.log(`📈 Scaling up: adding ${count} workers`);

    for (let i = 0; i < count; i++) {
      try {
        const workerConfig = {
          capacity: 2,
          memoryLimit: 1073741824, // 1GB
          cpuShares: 512
        };

        await this.createWorkerContainer(workerConfig);

        // Track scaling event
        monitoringService.recordScalingEvent('scaled_up', {
          workersAdded: i + 1,
          totalWorkers: this.workerContainers.size
        });

        // Small delay between worker creation
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to scale up worker ${i + 1}:`, error);
      }
    }
  }

  async scaleDown(count) {
    console.log(`📉 Scaling down: removing ${count} workers`);

    // Get workers sorted by load (lowest first) and health (worst first)
    const workersToRemove = Array.from(this.workerContainers.values())
      .filter(worker => worker.status === 'ready' && worker.currentJobs === 0)
      .sort((a, b) => {
        // Prefer removing workers with worse health status
        if (a.healthStatus !== b.healthStatus) {
          const healthPriority = { 'healthy': 0, 'degraded': 1, 'unhealthy': 2 };
          return healthPriority[b.healthStatus] - healthPriority[a.healthStatus];
        }
        // Then prefer older workers
        return a.createdAt - b.createdAt;
      })
      .slice(0, count);

    for (const worker of workersToRemove) {
      try {
        await this.removeWorkerContainer(worker.id);

        // Track scaling event
        monitoringService.recordScalingEvent('scaled_down', {
          workerId: worker.id,
          remainingWorkers: this.workerContainers.size
        });
      } catch (error) {
        console.error(`Failed to scale down worker ${worker.id}:`, error);
      }
    }
  }

  // Get scaling status
  getScalingStatus() {
    const workers = Array.from(this.workerContainers.values());
    const totalCapacity = workers.reduce((sum, worker) => sum + worker.capacity, 0);
    const currentLoad = workers.reduce((sum, worker) => sum + worker.currentJobs, 0);
    const utilization = totalCapacity > 0 ? (currentLoad / totalCapacity) * 100 : 0;

    const healthStatus = {
      healthy: workers.filter(w => w.healthStatus === 'healthy').length,
      degraded: workers.filter(w => w.healthStatus === 'degraded').length,
      unhealthy: workers.filter(w => w.healthStatus === 'unhealthy').length
    };

    return {
      timestamp: new Date().toISOString(),
      totalWorkers: workers.length,
      totalCapacity,
      currentLoad,
      utilization: Math.round(utilization * 100) / 100,
      status: utilization > 80 ? 'high_load' : utilization < 20 ? 'low_load' : 'normal',
      healthStatus,
      workers: workers.map(worker => ({
        id: worker.id,
        status: worker.status,
        capacity: worker.capacity,
        currentJobs: worker.currentJobs,
        utilization: Math.round((worker.currentJobs / worker.capacity) * 100),
        healthStatus: worker.healthStatus,
        createdAt: worker.createdAt
      }))
    };
  }
}

// Load Balancer Class
class LoadBalancer {
  selectWorker(availableWorkers, jobData) {
    // Use round-robin with least connections
    const sortedWorkers = availableWorkers
      .sort((a, b) => {
        // Primary: utilization (jobs/capacity)
        const utilA = a.currentJobs / a.capacity;
        const utilB = b.currentJobs / b.capacity;
        return utilA - utilB;
      });

    return sortedWorkers[0];
  }
}

// Health Checker Class
class HealthChecker {
  async checkWorkerHealth(worker) {
    try {
      const container = require('dockerode').prototype.getContainer(worker.containerId);
      const inspection = await container.inspect();

      const state = inspection.State;

      if (!state.Running) {
        return { status: 'unhealthy', reason: 'Container not running' };
      }

      if (state.Health && state.Health.Status !== 'healthy') {
        return { status: 'unhealthy', reason: 'Health check failed' };
      }

      // Check resource usage
      const stats = await container.stats({ stream: false });
      const memoryUsage = stats.memory_stats.usage || 0;
      const memoryLimit = stats.memory_stats.limit || 1;
      const memoryPercent = (memoryUsage / memoryLimit) * 100;

      if (memoryPercent > 90) {
        return { status: 'degraded', reason: 'High memory usage' };
      }

      return { status: 'healthy', reason: 'All checks passed' };
    } catch (error) {
      return { status: 'error', reason: error.message };
    }
  }
}

// Auto Scaler Class
class AutoScaler {
  collectMetrics() {
    // This would collect metrics from monitoring service
    return {
      averageUtilization: 65,
      jobQueueSize: 3,
      responseTime: 150,
      errorRate: 0.02
    };
  }

  evaluateScaling(metrics) {
    const decision = {
      shouldScaleUp: false,
      shouldScaleDown: false,
      workersToAdd: 0,
      workersToRemove: 0,
      reason: ''
    };

    // Scale up conditions
    if (metrics.averageUtilization > 80 || metrics.jobQueueSize > 5) {
      decision.shouldScaleUp = true;
      decision.workersToAdd = metrics.averageUtilization > 90 ? 2 : 1;
      decision.reason = 'High utilization or large job queue';
    }
    // Scale down conditions
    else if (metrics.averageUtilization < 30 && metrics.jobQueueSize === 0) {
      decision.shouldScaleDown = true;
      decision.workersToRemove = 1;
      decision.reason = 'Low utilization and no job queue';
    }

    return decision;
  }
}

// Create singleton instance
const scalingService = new ScalingService();

module.exports = scalingService;