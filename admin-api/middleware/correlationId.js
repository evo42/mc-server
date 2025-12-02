const { v4: uuidv4 } = require('uuid');

// Middleware to generate and set correlation ID for each request
const correlationIdMiddleware = (req, res, next) => {
  // Generate a new UUID if no correlation ID is provided in the request header
  const correlationId = req.headers['x-correlation-id'] || uuidv4();

  // Add the correlation ID to the request object so other parts of the application can use it
  req.correlationId = correlationId;

  // Add the correlation ID to the response header for client tracking
  res.set('X-Correlation-ID', correlationId);

  next();
};

// Function to log with correlation ID
const logWithCorrelationId = (logger, req, level = 'info', message, meta = {}) => {
  const correlationId = req.correlationId || req.headers['x-correlation-id'] || req.id;

  const logData = {
    correlationId,
    ...meta
  };

  logger[level](logData, message);
};

module.exports = {
  correlationIdMiddleware,
  logWithCorrelationId
};