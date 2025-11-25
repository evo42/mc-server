const logger = require('pino')();

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error({ 
    err, 
    req: { method: req.method, url: req.url, ip: req.ip }, 
    body: req.body,
    params: req.params,
    query: req.query
  }, 'Unhandled application error');

  // Determine status code
  const statusCode = err.statusCode || 500;
  
  // Prepare error response
  const errorResponse = {
    error: statusCode === 500 ? 'Internal Server Error' : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// Not Found middleware
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// Validation error handler
const validationErrorHandler = (req, res, next) => {
  const errors = require('express-validator').validationResult(req);
  
  if (!errors.isEmpty()) {
    const error = new Error('Validation Error');
    error.statusCode = 400;
    error.details = errors.array();
    return next(error);
  }
  
  next();
};

// Async handler wrapper to catch errors in async routes
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Graceful degradation for service dependencies
const withFallback = (primaryFn, fallbackFn, serviceName = 'service') => {
  return async (req, res, next) => {
    try {
      // Try the primary function
      return await primaryFn(req, res, next);
    } catch (error) {
      logger.warn({ err: error }, `Primary ${serviceName} failed, using fallback`);
      
      // If a fallback is provided, try that
      if (fallbackFn) {
        try {
          return await fallbackFn(req, res, next);
        } catch (fallbackError) {
          logger.error({ err: fallbackError }, `Fallback ${serviceName} also failed`);
          // If fallback also fails, send a graceful error
          return res.status(503).json({
            error: `Service temporarily unavailable: ${serviceName}`,
            message: 'We are experiencing issues with our services, please try again later.'
          });
        }
      } else {
        // If no fallback provided, send error response
        return res.status(503).json({
          error: `${serviceName} unavailable`,
          message: 'Service temporarily unavailable'
        });
      }
    }
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  validationErrorHandler,
  asyncHandler,
  withFallback
};