const pino = require('pino');
const pinoHttp = require('pino-http');

const path = require('path');
const express = require('express');
const basicAuth = require('express-basic-auth');
const serversRouter = require('./routes/servers');
const datapacksRouter = require('./routes/datapacks');

const app = express(); // Create the express app
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino/file',
    options: { destination: `${__dirname}/admin-api.log` }
  }
});
const httpLogger = pinoHttp({ logger });
const port = process.env.PORT || 3000;

// Security: Use environment variables for credentials or default values
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

// Middleware
app.use(httpLogger);
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(__dirname));

// Middleware for authentication
const authMiddleware = basicAuth({
    users: { [ADMIN_USER]: ADMIN_PASS },
    challenge: true,
    realm: 'Minecraft Admin Area'
});

// Apply authentication to admin routes
app.use('/api', authMiddleware);

// Routes
app.use('/api/servers', serversRouter);
app.use('/api/datapacks', datapacksRouter);

// Route for the admin page, with authentication
app.get('/mc-admin', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Route for the stats page, without authentication
app.get('/stats', (req, res) => {
    res.sendFile(path.join(__dirname, 'stats.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'stats.html'));
});

// Only start the server if this file is run directly (not imported)
if (require.main === module) {
    app.listen(port, '0.0.0.0', () => {
logger.info(`Admin API server running at http://localhost:${port}`);
    });
}

module.exports = app; // For testing
