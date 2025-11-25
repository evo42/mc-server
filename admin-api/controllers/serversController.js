const logger = require('pino')();
const serversService = require('../services/serversService');
const { asyncHandler } = require('../middleware/errorHandler');
const { logWithCorrelationId } = require('../middleware/correlationId');
const auditLogService = require('../services/auditLogService');

const startServer = async (req, res, next) => {
    const server = req.params.server;
    try {
        await serversService.startServer(server);

        // Broadcast status update through WebSocket service if available
        try {
          const WebSocketService = require('../services/websocketService');
          const wsService = WebSocketService.getInstance();
          if (wsService) {
            await wsService.broadcastSpecificServerUpdate(server);
          }
        } catch (wsError) {
          logWithCorrelationId(logger, req, 'warn', 'WebSocket service not available for broadcast');
        }

        logWithCorrelationId(logger, req, 'info', `Server ${server} started successfully`);

        // Audit log the action
        auditLogService.logServerAction('START', req, server);

        res.json({ success: true, message: `${server} started` });
    } catch (error) {
        logWithCorrelationId(logger, req, 'error', `Error starting ${server}`, { server, error: error.message });
        // Pass error to the error handling middleware
        next(error);
    }
};

const stopServer = async (req, res, next) => {
    const server = req.params.server;
    try {
        await serversService.stopServer(server);

        // Broadcast status update through WebSocket service if available
        try {
          const WebSocketService = require('../services/websocketService');
          const wsService = WebSocketService.getInstance();
          if (wsService) {
            await wsService.broadcastSpecificServerUpdate(server);
          }
        } catch (wsError) {
          logWithCorrelationId(logger, req, 'warn', 'WebSocket service not available for broadcast');
        }

        logWithCorrelationId(logger, req, 'info', `Server ${server} stopped successfully`);

        // Audit log the action
        auditLogService.logServerAction('STOP', req, server);

        res.json({ success: true, message: `${server} stopped` });
    } catch (error) {
        logWithCorrelationId(logger, req, 'error', `Error stopping ${server}`, { server, error: error.message });
        // Pass error to the error handling middleware
        next(error);
    }
};

const restartServer = async (req, res, next) => {
    const server = req.params.server;
    try {
        await serversService.restartServer(server);

        // Broadcast status update through WebSocket service if available
        try {
          const WebSocketService = require('../services/websocketService');
          const wsService = WebSocketService.getInstance();
          if (wsService) {
            await wsService.broadcastSpecificServerUpdate(server);
          }
        } catch (wsError) {
          logWithCorrelationId(logger, req, 'warn', 'WebSocket service not available for broadcast');
        }

        logWithCorrelationId(logger, req, 'info', `Server ${server} restarted successfully`);

        // Audit log the action
        auditLogService.logServerAction('RESTART', req, server);

        res.json({ success: true, message: `${server} restarted` });
    } catch (error) {
        logWithCorrelationId(logger, req, 'error', `Error restarting ${server}`, { server, error: error.message });
        // Pass error to the error handling middleware
        next(error);
    }
};

const getServerStatus = async (req, res, next) => {
    const server = req.params.server;
    try {
        logWithCorrelationId(logger, req, 'debug', `Getting status for server ${server}`);
        const status = await serversService.getServerStatus(server);
        res.json(status);
    } catch (error) {
        logWithCorrelationId(logger, req, 'error', `Error getting status for ${server}`, { server, error: error.message });
        // Pass error to the error handling middleware
        next(error);
    }
};

const getAllServerStatus = async (req, res, next) => {
    try {
        logWithCorrelationId(logger, req, 'debug', 'Getting status for all servers');
        const status = await serversService.getAllServerStatus();
        res.json(status);
    } catch (error) {
        logWithCorrelationId(logger, req, 'error', 'Error getting status for all servers', { error: error.message });
        // Pass error to the error handling middleware
        next(error);
    }
};

// Get server configuration
const getServerConfig = async (req, res, next) => {
    const server = req.params.server;
    try {
        // In a real implementation, this would fetch configuration from a database or config file
        // For now, return default values based on environment variables or server name
        const config = {
            minMemory: process.env[`${server.toUpperCase()}_MIN_MEMORY`] || process.env.MC_MIN_MEMORY || '1G',
            maxMemory: process.env[`${server.toUpperCase()}_MEMORY`] || process.env.MC_MEMORY || '4G',
            motd: process.env[`${server.toUpperCase()}_MOTD`] || `Welcome to ${server} server!`,
            onlineMode: process.env[`${server.toUpperCase()}_ONLINE_MODE`] !== 'false',
            maxPlayers: parseInt(process.env[`${server.toUpperCase()}_MAX_PLAYERS`] || '20', 10),
            viewDistance: parseInt(process.env[`${server.toUpperCase()}_VIEW_DISTANCE`] || '10', 10),
            levelName: process.env[`${server.toUpperCase()}_LEVEL_NAME`] || 'world',
            levelSeed: process.env[`${server.toUpperCase()}_LEVEL_SEED`] || '',
            levelType: process.env[`${server.toUpperCase()}_LEVEL_TYPE`] || 'DEFAULT',
            gameMode: process.env[`${server.toUpperCase()}_GAME_MODE`] || 'survival',
            difficulty: process.env[`${server.toUpperCase()}_DIFFICULTY`] || 'normal'
        };

        res.json(config);
    } catch (error) {
        logWithCorrelationId(logger, req, 'error', `Error getting config for ${server}`, { server, error: error.message });
        next(error);
    }
};

// Update server configuration
const updateServerConfig = async (req, res, next) => {
    const server = req.params.server;
    const config = req.body;

    try {
        // In a real implementation, this would save configuration to a database or config file
        // For now, we'll just return success
        // Note: In a real app, you'd want to validate the configuration values

        // TODO: Actually update the server configuration (this would involve updating docker-compose files,
        // restarting containers, etc. which requires careful implementation)

        res.json({
            success: true,
            message: `Configuration for ${server} updated successfully`,
            config: config
        });
    } catch (error) {
        logWithCorrelationId(logger, req, 'error', `Error updating config for ${server}`, { server, error: error.message });
        next(error);
    }
};

module.exports = {
    startServer,
    stopServer,
    restartServer,
    getServerStatus,
    getAllServerStatus,
    getServerConfig,
    updateServerConfig
};
