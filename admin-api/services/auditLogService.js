const logger = require('pino')({
  name: 'audit-logger',
  level: 'info',
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.get('User-Agent'),
        'x-forwarded-for': req.get('X-Forwarded-For'),
        'x-real-ip': req.get('X-Real-IP')
      }
    }),
    res: (res) => ({
      statusCode: res.statusCode
    }),
    err: require('pino').stdSerializers.err
  }
});

class AuditLogService {
  constructor() {
    this.logger = logger;
  }

  // Log admin actions
  logAction(action, req, details = {}) {
    const auditLog = {
      timestamp: new Date().toISOString(),
      action,
      userId: req.user ? req.user.userId : 'unknown',
      username: req.user ? req.user.username : 'unknown',
      ip: this.getClientIP(req),
      userAgent: req.get('User-Agent') || 'unknown',
      correlationId: req.correlationId || req.headers['x-correlation-id'] || req.id,
      details,
      url: req.originalUrl,
      method: req.method
    };

    this.logger.info(auditLog, `AUDIT: ${action}`);
  }

  // Log authentication events
  logAuthEvent(event, req, details = {}) {
    const auditLog = {
      timestamp: new Date().toISOString(),
      event,
      ip: this.getClientIP(req),
      userAgent: req.get('User-Agent') || 'unknown',
      correlationId: req.correlationId || req.headers['x-correlation-id'] || req.id,
      details
    };

    this.logger.info(auditLog, `AUDIT_AUTH: ${event}`);
  }

  // Get client IP considering proxies
  getClientIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.headers['x-client-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           'unknown';
  }

  // Log server management actions
  logServerAction(action, req, serverName, additionalDetails = {}) {
    const details = {
      serverName,
      ...additionalDetails
    };

    this.logAction(`SERVER_${action.toUpperCase()}`, req, details);
  }

  // Log datapack management actions
  logDatapackAction(action, req, datapackName, serverName, additionalDetails = {}) {
    const details = {
      datapackName,
      serverName,
      ...additionalDetails
    };

    this.logAction(`DATAPACK_${action.toUpperCase()}`, req, details);
  }
}

// Create and export a singleton instance
const auditLogService = new AuditLogService();
module.exports = auditLogService;