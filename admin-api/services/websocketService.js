const WebSocket = require('ws');
const logger = require('pino')();
const serversService = require('../services/serversService');

// Singleton instance to make WebSocket service globally accessible
let instance = null;

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Set();
    
    this.wss.on('connection', (ws, req) => {
      this.clients.add(ws);
      logger.info('New WebSocket client connected');
      
      // Send initial server status when client connects
      this.sendCurrentStatus(ws);
      
      ws.on('close', () => {
        this.clients.delete(ws);
        logger.info('WebSocket client disconnected');
      });
      
      ws.on('error', (error) => {
        logger.error({ err: error }, 'WebSocket error');
        this.clients.delete(ws);
      });
    });
    
    // Start broadcasting server status periodically
    this.startStatusBroadcasting();
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