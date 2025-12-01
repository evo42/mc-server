// Prometheus Metrics Service für Admin API
// Sammelt Application Performance Metrics für Monitoring

const promClient = require('prom-client');
const { v4: uuidv4 } = require('uuid');

// Register für alle Metriken
const register = new promClient.Registry();

// Standard Metriken hinzufügen
promClient.collectDefaultMetrics({ register });

// ================================
// CUSTOM METRICS DEFINITIONEN
// ================================

// HTTP Request Metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'user_type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'user_type']
});

// Server Operations Metrics
const serverOperationsTotal = new promClient.Counter({
  name: 'server_operations_total',
  help: 'Total number of server operations',
  labelNames: ['operation', 'server', 'status']
});

const serverOperationDuration = new promClient.Histogram({
  name: 'server_operation_duration_seconds',
  help: 'Duration of server operations in seconds',
  labelNames: ['operation', 'server', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
});

// Minecraft Server Metrics
const minecraftServersOnline = new promClient.Gauge({
  name: 'minecraft_servers_online',
  help: 'Number of online Minecraft servers'
});

const minecraftPlayersOnline = new promClient.Gauge({
  name: 'minecraft_players_online_total',
  help: 'Total number of players online across all servers'
});

const minecraftServerStatus = new promClient.Gauge({
  name: 'minecraft_server_status',
  help: 'Status of Minecraft servers (1 = online, 0 = offline)',
  labelNames: ['server']
});

// Cache Metrics
const cacheHits = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type', 'result']
});

const cacheOperationDuration = new promClient.Histogram({
  name: 'cache_operation_duration_seconds',
  help: 'Duration of cache operations in seconds',
  labelNames: ['operation', 'cache_type'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1]
});

// Docker Container Metrics
const dockerContainerStatus = new promClient.Gauge({
  name: 'docker_container_status',
  help: 'Status of Docker containers (1 = running, 0 = stopped)',
  labelNames: ['container_name', 'service']
});

const dockerContainerCpuUsage = new promClient.Gauge({
  name: 'docker_container_cpu_usage_percent',
  help: 'CPU usage percentage of Docker containers',
  labelNames: ['container_name', 'service']
});

const dockerContainerMemoryUsage = new promClient.Gauge({
  name: 'docker_container_memory_usage_bytes',
  help: 'Memory usage in bytes of Docker containers',
  labelNames: ['container_name', 'service']
});

// WebSocket Metrics
const websocketConnectionsActive = new promClient.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections'
});

const websocketMessagesTotal = new promClient.Counter({
  name: 'websocket_messages_total',
  help: 'Total number of WebSocket messages',
  labelNames: ['direction', 'type']
});

// Error Metrics
const applicationErrorsTotal = new promClient.Counter({
  name: 'application_errors_total',
  help: 'Total number of application errors',
  labelNames: ['error_type', 'component', 'severity']
});

// Authentication Metrics
const authenticationAttempts = new promClient.Counter({
  name: 'authentication_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['result', 'method']
});

const authenticationDuration = new promClient.Histogram({
  name: 'authentication_duration_seconds',
  help: 'Duration of authentication attempts in seconds',
  labelNames: ['result', 'method'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Business Metrics
const datapacksProcessed = new promClient.Counter({
  name: 'datapacks_processed_total',
  help: 'Total number of processed datapacks',
  labelNames: ['server', 'operation']
});

// Register alle Metriken
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(serverOperationsTotal);
register.registerMetric(serverOperationDuration);
register.registerMetric(minecraftServersOnline);
register.registerMetric(minecraftPlayersOnline);
register.registerMetric(minecraftServerStatus);
register.registerMetric(cacheHits);
register.registerMetric(cacheOperationDuration);
register.registerMetric(dockerContainerStatus);
register.registerMetric(dockerContainerCpuUsage);
register.registerMetric(dockerContainerMemoryUsage);
register.registerMetric(websocketConnectionsActive);
register.registerMetric(websocketMessagesTotal);
register.registerMetric(applicationErrorsTotal);
register.registerMetric(authenticationAttempts);
register.registerMetric(authenticationDuration);
register.registerMetric(datapacksProcessed);

// ================================
// MIDDLEWARE FUNKTIONEN
// ================================

// HTTP Request Tracking Middleware
const trackHttpRequests = (req, res, next) => {
  const startTime = Date.now();
  const route = req.route ? req.route.path : req.path;
  const userType = req.user ? 'authenticated' : 'public';

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const statusCode = res.statusCode.toString();

    httpRequestDuration
      .labels(req.method, route, statusCode, userType)
      .observe(duration);

    httpRequestsTotal
      .labels(req.method, route, statusCode, userType)
      .inc();
  });

  next();
};

// Server Operation Tracking
const trackServerOperation = async (operation, server, operationFn) => {
  const startTime = Date.now();
  const correlationId = uuidv4();

  try {
    const result = await operationFn();
    const duration = (Date.now() - startTime) / 1000;

    serverOperationsTotal
      .labels(operation, server, 'success')
      .inc();

    serverOperationDuration
      .labels(operation, server, 'success')
      .observe(duration);

    logger.info('Server operation completed', {
      correlationId,
      operation,
      server,
      duration,
      status: 'success'
    });

    return result;
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;

    serverOperationsTotal
      .labels(operation, server, 'error')
      .inc();

    serverOperationDuration
      .labels(operation, server, 'error')
      .observe(duration);

    applicationErrorsTotal
      .labels(error.constructor.name, 'server-operation', 'error')
      .inc();

    logger.error('Server operation failed', {
      correlationId,
      operation,
      server,
      duration,
      error: error.message,
      status: 'error'
    });

    throw error;
  }
};

// Cache Operation Tracking
const trackCacheOperation = async (operation, cacheType, operationFn) => {
  const startTime = Date.now();

  try {
    const result = await operationFn();
    const duration = (Date.now() - startTime) / 1000;

    cacheOperationDuration
      .labels(operation, cacheType)
      .observe(duration);

    return result;
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;

    cacheOperationDuration
      .labels(operation, cacheType)
      .observe(duration);

    applicationErrorsTotal
      .labels(error.constructor.name, 'cache-operation', 'error')
      .inc();

    throw error;
  }
};

// Authentication Tracking
const trackAuthentication = async (method, operationFn) => {
  const startTime = Date.now();

  try {
    const result = await operationFn();
    const duration = (Date.now() - startTime) / 1000;

    authenticationAttempts
      .labels('success', method)
      .inc();

    authenticationDuration
      .labels('success', method)
      .observe(duration);

    return result;
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;

    authenticationAttempts
      .labels('failure', method)
      .inc();

    authenticationDuration
      .labels('failure', method)
      .observe(duration);

    throw error;
  }
};

// ================================
// METRIC UPDATE FUNKTIONEN
// ================================

// Minecraft Server Status aktualisieren
const updateMinecraftServerStatus = (serverStatus) => {
  const onlineServers = Object.values(serverStatus).filter(s => s.status === 'running').length;
  const totalPlayers = Object.values(serverStatus).reduce((sum, s) => sum + (s.playerCount || 0), 0);

  minecraftServersOnline.set(onlineServers);
  minecraftPlayersOnline.set(totalPlayers);

  // Individual server status
  Object.entries(serverStatus).forEach(([server, status]) => {
    minecraftServerStatus.labels(server).set(status.status === 'running' ? 1 : 0);
  });
};

// Docker Container Metriken aktualisieren
const updateDockerContainerMetrics = (containers) => {
  containers.forEach(container => {
    dockerContainerStatus.labels(container.name, container.service).set(container.state === 'running' ? 1 : 0);
    dockerContainerCpuUsage.labels(container.name, container.service).set(container.cpuPercent || 0);
    dockerContainerMemoryUsage.labels(container.name, container.service).set(container.memoryUsage || 0);
  });
};

// WebSocket Connection Tracking
const updateWebSocketMetrics = (connectionsCount) => {
  websocketConnectionsActive.set(connectionsCount);
};

// ================================
// EXPORTS
// ================================

module.exports = {
  register,
  trackHttpRequests,
  trackServerOperation,
  trackCacheOperation,
  trackAuthentication,
  updateMinecraftServerStatus,
  updateDockerContainerMetrics,
  updateWebSocketMetrics,

  // Exposed für direkten Zugriff auf Metriken
  metrics: {
    httpRequestDuration,
    httpRequestsTotal,
    serverOperationsTotal,
    serverOperationDuration,
    minecraftServersOnline,
    minecraftPlayersOnline,
    minecraftServerStatus,
    cacheHits,
    cacheOperationDuration,
    dockerContainerStatus,
    dockerContainerCpuUsage,
    dockerContainerMemoryUsage,
    websocketConnectionsActive,
    websocketMessagesTotal,
    applicationErrorsTotal,
    authenticationAttempts,
    authenticationDuration,
    datapacksProcessed
  }
};