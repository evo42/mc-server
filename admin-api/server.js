const express = require('express');
const basicAuth = require('express-basic-auth');
const serversRouter = require('./routes/servers');
const datapacksRouter = require('./routes/datapacks');

const app = express();
const port = process.env.PORT || 3000;

// Security: Use environment variables for credentials or default values
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

// Middleware
app.use(express.json());

// Middleware for authentication
const authMiddleware = basicAuth({
    users: { [ADMIN_USER]: ADMIN_PASS },
    challenge: true,
    realm: 'Minecraft Admin Area'
});

// Apply authentication to all routes
app.use('/api', authMiddleware);

// Routes
app.use('/api/servers', serversRouter);
app.use('/api/datapacks', datapacksRouter);

app.listen(port, '0.0.0.0', () => {
    console.log(`Admin API server running at http://localhost:${port}`);
});
