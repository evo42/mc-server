const WebSocket = require('ws');
const logger = require('pino')();
const serversService = require('../services/serversService');
const bluemapLazyService = require('./bluemapLazyService');

// Singleton instance to make WebSocket service globally accessible
let instance = null;

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Set();
    this.blueMapClients = new Map(); // BlueMap-specific clients
    this.renderProgressJobs = new Map(); // Active render jobs

    this.wss.on('connection', (ws, req) => {
      this.clients.add(ws);
      logger.info('New WebSocket client connected');

      // Send initial server status when client connects
      this.sendCurrentStatus(ws);

      // Handle different namespace connections
      this.setupClientHandlers(ws, req);

      ws.on('close', () => {
        this.handleClientDisconnection(ws);
      });

      ws.on('error', (error) => {
        logger.error({ err: error }, 'WebSocket error');
        this.handleClientDisconnection(ws);
      });
    });

    // Start broadcasting server status periodically
    this.startStatusBroadcasting();

    // Start BlueMap-specific broadcasting
    this.startBlueMapBroadcasting();
  }

  // Setup client-specific handlers based on connection type
  setupClientHandlers(ws, req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const namespace = url.pathname;

    if (namespace.includes('bluemap')) {
      // BlueMap namespace client
      this.blueMapClients.set(ws, {
        connectedAt: Date.now(),
        subscriptions: new Set(),
        serverPreferences: new Map()
      });

      ws.on('message', (data) => {
        this.handleBlueMapMessage(ws, data);
      });

      logger.info('BlueMap WebSocket client connected');

      // Send initial BlueMap status
      this.sendBlueMapInitialStatus(ws);
    }
  }

  // Handle client disconnection and cleanup
  handleClientDisconnection(ws) {
    this.clients.delete(ws);

    if (this.blueMapClients.has(ws)) {
      this.blueMapClients.delete(ws);
      logger.info('BlueMap WebSocket client disconnected');
    }

    logger.info('WebSocket client disconnected');
  }

  // Handle BlueMap-specific WebSocket messages
  handleBlueMapMessage(ws, data) {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'subscribe_server':
          this.subscribeToServer(ws, message.serverName);
          break;

        case 'unsubscribe_server':
          this.unsubscribeFromServer(ws, message.serverName);
          break;

        case 'subscribe_render_jobs':
          this.subscribeToRenderJobs(ws, message.serverName);
          break;

        case 'update_preferences':
          this.updateClientPreferences(ws, message.preferences);
          break;

        case 'request_server_status':
          this.sendSpecificServerStatus(ws, message.serverName);
          break;

        default:
          logger.warn({ message }, 'Unknown BlueMap message type');
      }
    } catch (error) {
      logger.error({ err: error }, 'Error handling BlueMap message');
    }
  }

  // Send current server status to a specific client
  async sendCurrentStatus(ws) {
    try {
      const status = await serversService.getAllServerStatus();
      ws.send(JSON.stringify({
        type: 'server_status_update',
        data: status,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      logger.error({ err: error }, 'Error sending current status to client');
    }
  }

  // Broadcast status updates to all clients
  async broadcastStatusUpdate() {
    try {
      const status = await serversService.getAllServerStatus();
      const message = JSON.stringify({
        type: 'server_status_update',
        data: status,
        timestamp: new Date().toISOString()
      });

      // Only send to clients that are ready
      for (const client of this.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      }
    } catch (error) {
      logger.error({ err: error }, 'Error broadcasting server status');
    }
  }

  // Broadcast specific server status
  async broadcastSpecificServerUpdate(serverName) {
    try {
      const status = await serversService.getServerStatus(serverName);
      const message = JSON.stringify({
        type: 'server_status_update',
        data: { [serverName]: status },
        timestamp: new Date().toISOString()
      });

      for (const client of this.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      }
    } catch (error) {
      logger.error({ err: error, serverName }, 'Error broadcasting specific server status');
    }
  }

  // Start broadcasting server status periodically
  startStatusBroadcasting() {
    // Broadcast full status every 10 seconds
    setInterval(() => {
      this.broadcastStatusUpdate();
    }, 10000);
  }

  // Send a notification to all connected clients
  broadcastNotification(message, type = 'info') {
    const notification = JSON.stringify({
      type: 'notification',
      data: { message, type },
      timestamp: new Date().toISOString()
    });

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(notification);
      }
    }
  }

  // Close the WebSocket server
  close() {
    this.wss.close();
  }

  // =============================================================================
  // BlueMap-specific WebSocket methods
  // =============================================================================

  // Send initial BlueMap status to a client
  async sendBlueMapInitialStatus(ws) {
    try {
      const status = await bluemapLazyService.getAllServerMetrics();
      ws.send(JSON.stringify({
        type: 'bluemap_initial_status',
        data: {
          servers: status,
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      logger.error({ err: error }, 'Error sending initial BlueMap status');
    }
  }

  // Subscribe a client to server-specific updates
  subscribeToServer(ws, serverName) {
    const clientInfo = this.blueMapClients.get(ws);
    if (clientInfo) {
      clientInfo.subscriptions.add(serverName);
      ws.send(JSON.stringify({
        type: 'subscription_confirmed',
        data: { serverName, action: 'subscribed' }
      }));
      logger.info(`Client subscribed to ${serverName} updates`);
    }
  }

  // Unsubscribe a client from server updates
  unsubscribeFromServer(ws, serverName) {
    const clientInfo = this.blueMapClients.get(ws);
    if (clientInfo) {
      clientInfo.subscriptions.delete(serverName);
      ws.send(JSON.stringify({
        type: 'subscription_confirmed',
        data: { serverName, action: 'unsubscribed' }
      }));
      logger.info(`Client unsubscribed from ${serverName} updates`);
    }
  }

  // Subscribe to render job updates
  subscribeToRenderJobs(ws, serverName) {
    const clientInfo = this.blueMapClients.get(ws);
    if (clientInfo) {
      clientInfo.subscriptions.add(`render_jobs_${serverName}`);
      ws.send(JSON.stringify({
        type: 'render_subscription_confirmed',
        data: { serverName }
      }));
    }
  }

  // Update client preferences
  updateClientPreferences(ws, preferences) {
    const clientInfo = this.blueMapClients.get(ws);
    if (clientInfo) {
      Object.entries(preferences).forEach(([key, value]) => {
        clientInfo.serverPreferences.set(key, value);
      });
    }
  }

  // Send specific server status to client
  async sendSpecificServerStatus(ws, serverName) {
    try {
      const status = await bluemapLazyService.getServerStatus(serverName);
      ws.send(JSON.stringify({
        type: 'server_status',
        data: { serverName, status }
      }));
    } catch (error) {
      logger.error({ err: error, serverName }, 'Error sending specific server status');
    }
  }

  // Broadcast BlueMap server update
  async broadcastServerUpdate(serverName, updateData) {
    const message = JSON.stringify({
      type: 'server_update',
      data: {
        serverName,
        ...updateData,
        timestamp: new Date().toISOString()
      }
    });

    // Send to all BlueMap clients subscribed to this server
    for (const [ws, clientInfo] of this.blueMapClients) {
      if (clientInfo.subscriptions.has(serverName) && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }

  // Broadcast render job progress
  broadcastRenderProgress(jobId, progressData) {
    const message = JSON.stringify({
      type: 'render_progress',
      data: {
        jobId,
        ...progressData,
        timestamp: new Date().toISOString()
      }
    });

    // Send to all clients subscribed to render jobs
    for (const [ws, clientInfo] of this.blueMapClients) {
      const hasRenderSubscription = Array.from(clientInfo.subscriptions)
        .some(sub => sub.startsWith('render_jobs_'));

      if (hasRenderSubscription && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }

  // Broadcast system health update
  broadcastSystemHealth(healthData) {
    const message = JSON.stringify({
      type: 'system_health',
      data: {
        ...healthData,
        timestamp: new Date().toISOString()
      }
    });

    for (const ws of this.blueMapClients.keys()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }

  // Broadcast alert to relevant clients
  broadcastAlert(alert) {
    const message = JSON.stringify({
      type: 'alert',
      data: {
        id: alert.id || `alert_${Date.now()}`,
        ...alert,
        timestamp: new Date().toISOString()
      }
    });

    for (const [ws, clientInfo] of this.blueMapClients) {
      // Send alert if client is subscribed to the affected server
      if (alert.serverName && clientInfo.subscriptions.has(alert.serverName)) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      } else if (!alert.serverName) {
        // System-wide alert
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      }
    }
  }

  // Start BlueMap-specific broadcasting
  startBlueMapBroadcasting() {
    // Broadcast BlueMap metrics every 30 seconds
    setInterval(async () => {
      try {
        const metrics = await bluemapLazyService.getAllServerMetrics();

        const message = JSON.stringify({
          type: 'bluemap_metrics_update',
          data: {
            servers: metrics,
            timestamp: new Date().toISOString()
          }
        });

        for (const ws of this.blueMapClients.keys()) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
          }
        }
      } catch (error) {
        logger.error({ err: error }, 'Error broadcasting BlueMap metrics');
      }
    }, 30000);

    // Broadcast system health every 60 seconds
    setInterval(async () => {
      try {
        const healthData = await this.getSystemHealth();
        this.broadcastSystemHealth(healthData);
      } catch (error) {
        logger.error({ err: error }, 'Error broadcasting system health');
      }
    }, 60000);
  }

  // Get system health data
  async getSystemHealth() {
    try {
      const servers = await bluemapLazyService.getAllServerMetrics();
      const healthyServers = servers.filter(s => s.isActive).length;
      const totalServers = servers.length;

      const systemHealth = {
        overall: Math.round((healthyServers / totalServers) * 100),
        servers: {
          total: totalServers,
          healthy: healthyServers,
          unhealthy: totalServers - healthyServers
        },
        averageMemoryUsage: Math.round(
          servers.reduce((sum, s) => sum + (s.memoryUsage || 0), 0) / servers.length
        ),
        averageCacheHitRate: Math.round(
          servers.reduce((sum, s) => sum + (s.cacheHitRate || 0), 0) / servers.length
        )
      };

      return systemHealth;
    } catch (error) {
      logger.error({ err: error }, 'Error calculating system health');
      return {
        overall: 0,
        servers: { total: 7, healthy: 0, unhealthy: 7 },
        averageMemoryUsage: 0,
        averageCacheHitRate: 0
      };
    }
  }
}

// Singleton pattern to make WebSocket service accessible globally
WebSocketService.init = (server) => {
  if (!instance) {
    instance = new WebSocketService(server);
  }
  return instance;
};

WebSocketService.getInstance = () => {
  return instance;
};

module.exports = WebSocketService;