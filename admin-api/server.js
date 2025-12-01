const pino = require('pino');
const pinoHttp = require('pino-http');
const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const WebSocketService = require('./services/websocketService');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { correlationIdMiddleware } = require('./middleware/correlationId');
const prometheusMetrics = require('./services/prometheusMetrics');
const { secretsValidationMiddleware, validateSecretsBeforeStart } = require('./middleware/secretsValidation');

const path = require('path');
const express = require('express');
const fileUpload = require('express-fileupload');
const basicAuth = require('express-basic-auth');
const serversRouter = require('./routes/servers');
const datapacksRouter = require('./routes/datapacks');
const publicRouter = require('./routes/public');
const mcdashRouter = require('./routes/mcdash');
const minecraftServerApiRouter = require('./routes/minecraft-serverapi');
const overviewerRouter = require('./routes/overviewer');
const overviewerService = require('./services/overviewerService');
const monitoringRouter = require('./routes/monitoring');
const analyticsRouter = require('./routes/analytics');
const scalingRouter = require('./routes/scaling');
const bluemapRouter = require('./routes/bluemap');
const historyService = require('./services/historyService');

// Start history collection
historyService.startCollection();

const app = express(); // Create the express app
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  /*transport: {
    target: 'pino/file',
    options: { destination: `${__dirname}/admin-api.log` }
  }*/
});
const httpLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/health' // Optionally ignore health checks
  },
  // Custom serializers to include correlation IDs
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} - ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`;
  },
  customProps: (req, res) => {
    return {
      // Include correlation ID in logs
      correlationId: req.headers['x-correlation-id'] || req.id,
      userId: req.user ? req.user.userId : undefined,
      username: req.user ? req.user.username : undefined
    };
  }
});
const port = process.env.PORT || 3000;

// Security: Use environment variables for credentials or default values
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all requests
// app.use(limiter); //_rate_limit_disabled_

// Middleware
app.use(correlationIdMiddleware); // Add correlation ID middleware first
app.use(httpLogger);
app.use(express.json());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));
app.use(prometheusMetrics.trackHttpRequests); // Track HTTP requests for Prometheus

// Validation result handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Serve static files from the root directory
app.use(express.static(__dirname));

// Rate limiter for public routes
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes (no auth required)
app.use('/api/public', publicRouter); //_rate_limit_disabled_

// Overviewer public maps static serving
app.use('/public/overviewer', express.static('/data/output'));

// Prometheus Metrics Endpoint
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', prometheusMetrics.register.contentType);
        const metrics = await prometheusMetrics.register.metrics();
        res.end(metrics);
    } catch (error) {
        logger.error('Error generating Prometheus metrics', { error: error.message });
        res.status(500).end('Error generating metrics');
    }
});

// Rate limiting for authentication attempts to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 failed authentication attempts per windowMs
  message: 'Too many authentication attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Create users object for basic auth - will be validated by secrets service
// Reuse the ADMIN_USER and ADMIN_PASS constants defined above.
const users = { [ADMIN_USER]: ADMIN_PASS };

// Custom basic auth middleware that also sets user info for JWT generation
const basicAuthMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Minecraft Admin Area"');
    return res.status(401).json({ error: 'Missing basic authentication credentials' });
  }

  const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString();
  const [username, password] = credentials.split(':');

  if (!username || !password) {
    res.set('WWW-Authenticate', 'Basic realm="Minecraft Admin Area"');
    return res.status(401).json({ error: 'Invalid basic authentication format' });
  }

  // Check credentials against environment or secrets manager
  const adminPass = req.secrets ? req.secrets.getSecret('ADMIN_PASS') : process.env.ADMIN_PASS || 'admin123';
  const adminUser = process.env.ADMIN_USER || 'admin';

  if (username === adminUser && password === adminPass) {
    // Set user info for potential JWT generation
    req.user = { userId: 1, username: username };
    next();
  } else {
    res.set('WWW-Authenticate', 'Basic realm="Minecraft Admin Area"');
    return res.status(401).json({ error: 'Invalid credentials' });
  }
};

// Public/unauthed routes that the public site uses
app.use('/api/datapacks', datapacksRouter); // unauthenticated for public stats page

// Apply authentication to remaining admin API routes
app.use('/api', basicAuthMiddleware); //_rate_limit_disabled_

// Authenticated routes
app.use('/api/auth', require('./routes/auth')); // Authentication routes for JWT
app.use('/api/servers', serversRouter);
app.use('/api/backup', require('./routes/backup')); // Backup and restore functionality
app.use('/api/mcdash', mcdashRouter); // MCDash integration routes
app.use('/api/minecraft-serverapi', minecraftServerApiRouter); // MinecraftServerAPI integration routes
app.use('/api/overviewer', overviewerRouter); // Minecraft Overviewer integration routes
app.use('/api/monitoring', monitoringRouter); // Monitoring & Observability routes
app.use('/api/analytics', analyticsRouter); // Analytics & Insights routes
app.use('/api/scaling', scalingRouter); // Multi-Container Scaling routes
app.use('/api/bluemap', bluemapRouter); // BlueMap Migration Integration routes

// Route for the admin page, with authentication
app.get('/mc-admin', basicAuthMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/w11-admin', basicAuthMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'windows11.html'));
});


// Route for the stats page, without authentication
app.get('/mc-stats', (req, res) => {
    res.sendFile(path.join(__dirname, 'stats.html'));
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index-admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'index-admin.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'stats.html'));
});

// Documentation endpoint
app.get('/docs', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs.html'));
});

// Advanced API test page
app.get('/advanced-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'advanced-api-test.html'));
});

// Error handling middleware - should be last
app.use(notFoundHandler);
app.use(errorHandler);

// Only start the server if this file is run directly (not imported)
let server;
if (require.main === module) {
    // Validate secrets before starting the server
    validateSecretsBeforeStart()
        .then(() => {
            app.use(secretsValidationMiddleware); // Add secrets validation middleware after other middlewares

            server = app.listen(port, '0.0.0.0', () => {
                logger.info(`Admin API server running at http://localhost:${port}`);
            });

            // Initialize WebSocket service after the server is listening
            server.on('listening', () => {
                WebSocketService.init(server);
                logger.info('WebSocket service initialized');

                // Initialize Overviewer service WebSocket integration
                overviewerService.setSocketIO(WebSocketService.io);
                logger.info('Overviewer WebSocket integration initialized');

                // Log Overviewer service health status
                const healthStatus = overviewerService.getHealthStatus();
                logger.info('Overviewer service status', healthStatus);
            });
        })
        .catch(error => {
            logger.error(`Failed to start server due to secrets validation error: ${error.message}`);
            process.exit(1);
        });
}

module.exports = app; // For testing
