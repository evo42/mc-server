const auditLogService = require('../services/auditLogService');

// Middleware to log authentication attempts
const authAuditMiddleware = (req, res, next) => {
  // Store the original send method
  const originalSend = res.send;

  // Override the send method to capture the response
  res.send = function(data) {
    // Call the original send method
    const result = originalSend.call(this, data);

    // Log authentication events based on the status code and endpoint
    if (req.url.includes('/auth') || req.url.includes('/login')) {
      if (res.statusCode === 200 || res.statusCode === 201) {
        auditLogService.logAuthEvent('LOGIN_SUCCESS', req);
      } else if (res.statusCode === 401 || res.statusCode === 403) {
        auditLogService.logAuthEvent('LOGIN_FAILURE', req, { 
          response: data,
          statusCode: res.statusCode
        });
      }
    }

    // Restore the original send method for future use
    res.send = originalSend;

    return result;
  };

  next();
};

// Middleware for logging specific auth events
const logAuthEvent = (event, req, details = {}) => {
  auditLogService.logAuthEvent(event, req, details);
};

module.exports = {
  authAuditMiddleware,
  logAuthEvent
};