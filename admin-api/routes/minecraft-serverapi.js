const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Configuration for MinecraftServerAPI endpoints
const getServerApiUrl = (server) => {
    // Map server names to API URLs - assuming plugins run on default port 7000
    const serverApiUrls = {
        'mc-ilias': 'http://mc-ilias:7000',
        'mc-niilo': 'http://mc-niilo:7000',
        'mc-bgstpoelten': 'http://mc-bgstpoelten:7000',
        'mc-htlstp': 'http://mc-htlstp:7000',
        'mc-borgstpoelten': 'http://mc-borgstpoelten:7000',
        'mc-hakstpoelten': 'http://mc-hakstpoelten:7000',
        'mc-basop-bafep-stp': 'http://mc-basop-bafep-stp:7000',
        'mc-play': 'http://mc-play:7000'
    };
    return serverApiUrls[server] || null;
};

// Middleware to validate request
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

// Helper function to make API requests to MinecraftServerAPI
const makeApiRequest = async (server, endpoint, method = 'GET', data = null, params = null) => {
    const baseUrl = getServerApiUrl(server);
    if (!baseUrl) {
        throw new Error(`Server ${server} not configured for MinecraftServerAPI`);
    }

    const config = {
        method,
        url: `${baseUrl}/v1${endpoint}`,
        timeout: 30000,
        headers: {
            'Authorization': process.env.MINECRAFT_SERVERAPI_KEY || 'CHANGE_ME',
            'Content-Type': 'application/json'
        }
    };

    if (data) config.data = data;
    if (params) config.params = params;

    const response = await axios(config);
    return response.data;
};

// Health Check - Check if MinecraftServerAPI is available on server
router.get('/health/:server',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play']),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server } = req.params;
            const healthData = await makeApiRequest(server, '/ping');

            res.json({
                success: true,
                server,
                status: 'healthy',
                minecraftServerAPI: 'available',
                data: healthData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error(`MinecraftServerAPI health check failed for ${req.params.server}:`, error.message);

            if (error.code === 'ECONNREFUSED' || error.response?.status === 502) {
                return res.status(503).json({
                    error: 'MinecraftServerAPI unavailable',
                    message: 'Plugin not responding on server',
                    server: req.params.server,
                    timestamp: new Date().toISOString()
                });
            }

            res.status(500).json({
                error: 'MinecraftServerAPI health check failed',
                message: error.response?.data?.message || error.message,
                server: req.params.server,
                timestamp: new Date().toISOString()
            });
        }
    }
);

// Player Management Endpoints

// Get all online players
router.get('/:server/players',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play']),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server } = req.params;
            const playersData = await makeApiRequest(server, '/players');

            res.json({
                success: true,
                server,
                endpoint: 'players',
                data: playersData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error(`Failed to get players for ${req.params.server}:`, error.message);

            if (error.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    error: 'MinecraftServerAPI unavailable',
                    message: 'Plugin not responding on server',
                    server: req.params.server
                });
            }

            res.status(500).json({
                error: 'Failed to get players',
                message: error.response?.data?.message || error.message,
                server: req.params.server
            });
        }
    }
);

// Get banned players
router.get('/:server/banned-players',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play']),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server } = req.params;
            const bannedPlayers = await makeApiRequest(server, '/banned-players');

            res.json({
                success: true,
                server,
                endpoint: 'banned-players',
                data: bannedPlayers,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error(`Failed to get banned players for ${req.params.server}:`, error.message);

            if (error.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    error: 'MinecraftServerAPI unavailable',
                    message: 'Plugin not responding on server',
                    server: req.params.server
                });
            }

            res.status(500).json({
                error: 'Failed to get banned players',
                message: error.response?.data?.message || error.message,
                server: req.params.server
            });
        }
    }
);

// Get player information
router.get('/:server/players/:username',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play']),
    body('username').isLength({ min: 1, max: 16 }),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server, username } = req.params;
            const playerData = await makeApiRequest(server, `/players/${username}`);

            res.json({
                success: true,
                server,
                endpoint: 'player-info',
                username,
                data: playerData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error(`Failed to get player info for ${req.params.username} on ${req.params.server}:`, error.message);

            if (error.response?.status === 404) {
                return res.status(404).json({
                    error: 'Player not found',
                    message: 'Player not found or never played on server',
                    server: req.params.server,
                    username: req.params.username
                });
            }

            if (error.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    error: 'MinecraftServerAPI unavailable',
                    message: 'Plugin not responding on server',
                    server: req.params.server
                });
            }

            res.status(500).json({
                error: 'Failed to get player information',
                message: error.response?.data?.message || error.message,
                server: req.params.server,
                username: req.params.username
            });
        }
    }
);

// Kick player
router.post('/:server/players/:username/kick',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelen', 'mc-basop-bafep-stp', 'mc-play']),
    body('username').isLength({ min: 1, max: 16 }),
    body('reason').optional().isLength({ max: 256 }),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server, username } = req.params;
            const { reason } = req.body;

            const params = {};
            if (reason) params.reason = reason;

            await makeApiRequest(server, `/players/${username}/kick`, 'POST', null, params);

            res.json({
                success: true,
                server,
                action: 'kick-player',
                username,
                reason: reason || 'No reason provided',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error(`Failed to kick player ${req.params.username} on ${req.params.server}:`, error.message);

            if (error.response?.status === 404) {
                return res.status(404).json({
                    error: 'Player not found',
                    message: 'Player not found or not online',
                    server: req.params.server,
                    username: req.params.username
                });
            }

            if (error.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    error: 'MinecraftServerAPI unavailable',
                    message: 'Plugin not responding on server',
                    server: req.params.server
                });
            }

            res.status(500).json({
                error: 'Failed to kick player',
                message: error.response?.data?.message || error.message,
                server: req.params.server,
                username: req.params.username
            });
        }
    }
);

// Ban player
router.post('/:server/players/:username/ban',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play']),
    body('username').isLength({ min: 1, max: 16 }),
    body('reason').optional().isLength({ max: 256 }),
    body('duration').optional().isInt({ min: 1 }),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server, username } = req.params;
            const { reason, duration } = req.body;

            const params = {};
            if (reason) params.reason = reason;
            if (duration) params.duration = duration;

            await makeApiRequest(server, `/players/${username}/ban`, 'POST', null, params);

            res.json({
                success: true,
                server,
                action: 'ban-player',
                username,
                reason: reason || 'No reason provided',
                duration: duration ? `${duration} seconds` : 'permanent',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error(`Failed to ban player ${req.params.username} on ${req.params.server}:`, error.message);

            if (error.response?.status === 404) {
                return res.status(404).json({
                    error: 'Player not found',
                    message: 'Player not found',
                    server: req.params.server,
                    username: req.params.username
                });
            }

            if (error.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    error: 'MinecraftServerAPI unavailable',
                    message: 'Plugin not responding on server',
                    server: req.params.server
                });
            }

            res.status(500).json({
                error: 'Failed to ban player',
                message: error.response?.data?.message || error.message,
                server: req.params.server,
                username: req.params.username
            });
        }
    }
);

// Unban player
router.post('/:server/players/:username/pardon',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play']),
    body('username').isLength({ min: 1, max: 16 }),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server, username } = req.params;

            await makeApiRequest(server, `/players/${username}/pardon`, 'POST');

            res.json({
                success: true,
                server,
                action: 'unban-player',
                username,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error(`Failed to unban player ${req.params.username} on ${req.params.server}:`, error.message);

            if (error.response?.status === 404) {
                return res.status(404).json({
                    error: 'Player not found',
                    message: 'Player not found in ban list',
                    server: req.params.server,
                    username: req.params.username
                });
            }

            if (error.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    error: 'MinecraftServerAPI unavailable',
                    message: 'Plugin not responding on server',
                    server: req.params.server
                });
            }

            res.status(500).json({
                error: 'Failed to unban player',
                message: error.response?.data?.message || error.message,
                server: req.params.server,
                username: req.params.username
            });
        }
    }
);

// Server Management Endpoints

// Get server information
router.get('/:server/info',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play']),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server } = req.params;
            const serverData = await makeApiRequest(server, '/server');

            res.json({
                success: true,
                server,
                endpoint: 'server-info',
                data: serverData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error(`Failed to get server info for ${req.params.server}:`, error.message);

            if (error.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    error: 'MinecraftServerAPI unavailable',
                    message: 'Plugin not responding on server',
                    server: req.params.server
                });
            }

            res.status(500).json({
                error: 'Failed to get server information',
                message: error.response?.data?.message || error.message,
                server: req.params.server
            });
        }
    }
);

// Get server health
router.get('/:server/health',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play']),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server } = req.params;
            const healthData = await makeApiRequest(server, '/server/health');

            res.json({
                success: true,
                server,
                endpoint: 'server-health',
                data: healthData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error(`Failed to get server health for ${req.params.server}:`, error.message);

            if (error.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    error: 'MinecraftServerAPI unavailable',
                    message: 'Plugin not responding on server',
                    server: req.params.server
                });
            }

            res.status(500).json({
                error: 'Failed to get server health',
                message: error.response?.data?.message || error.message,
                server: req.params.server
            });
        }
    }
);

// Execute command on server
router.post('/:server/exec',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play']),
    body('command').isLength({ min: 1, max: 256 }),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server } = req.params;
            const { command } = req.body;

            const result = await makeApiRequest(server, '/server/exec', 'POST', null, { command });

            res.json({
                success: true,
                server,
                action: 'execute-command',
                command,
                result: result.output || 'Command executed',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error(`Failed to execute command on ${req.params.server}:`, error.message);

            if (error.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    error: 'MinecraftServerAPI unavailable',
                    message: 'Plugin not responding on server',
                    server: req.params.server
                });
            }

            res.status(500).json({
                error: 'Failed to execute command',
                message: error.response?.data?.message || error.message,
                server: req.params.server,
                command: req.body.command
            });
        }
    }
);

// Get server chat
router.get('/:server/chat',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play']),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server } = req.params;
            const chatData = await makeApiRequest(server, '/server/chat');

            res.json({
                success: true,
                server,
                endpoint: 'server-chat',
                data: chatData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error(`Failed to get server chat for ${req.params.server}:`, error.message);

            if (error.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    error: 'MinecraftServerAPI unavailable',
                    message: 'Plugin not responding on server',
                    server: req.params.server
                });
            }

            res.status(500).json({
                error: 'Failed to get server chat',
                message: error.response?.data?.message || error.message,
                server: req.params.server
            });
        }
    }
);

// Whitelist Management

// Get whitelist
router.get('/:server/whitelist',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play']),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server } = req.params;
            const whitelistData = await makeApiRequest(server, '/whitelist');

            res.json({
                success: true,
                server,
                endpoint: 'whitelist',
                data: whitelistData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error(`Failed to get whitelist for ${req.params.server}:`, error.message);

            if (error.response?.status === 400) {
                return res.status(400).json({
                    error: 'Whitelist not enabled',
                    message: 'Whitelist is not enabled on this server',
                    server: req.params.server
                });
            }

            if (error.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    error: 'MinecraftServerAPI unavailable',
                    message: 'Plugin not responding on server',
                    server: req.params.server
                });
            }

            res.status(500).json({
                error: 'Failed to get whitelist',
                message: error.response?.data?.message || error.message,
                server: req.params.server
            });
        }
    }
);

// Add to whitelist
router.post('/:server/whitelist',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play']),
    body('username').isLength({ min: 1, max: 16 }),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server } = req.params;
            const { username } = req.body;

            await makeApiRequest(server, '/whitelist', 'POST', null, { username });

            res.json({
                success: true,
                server,
                action: 'add-to-whitelist',
                username,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error(`Failed to add ${req.body.username} to whitelist on ${req.params.server}:`, error.message);

            if (error.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    error: 'MinecraftServerAPI unavailable',
                    message: 'Plugin not responding on server',
                    server: req.params.server
                });
            }

            res.status(500).json({
                error: 'Failed to add to whitelist',
                message: error.response?.data?.message || error.message,
                server: req.params.server,
                username: req.body.username
            });
        }
    }
);

// Remove from whitelist
router.delete('/:server/whitelist',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play']),
    body('username').isLength({ min: 1, max: 16 }),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server } = req.params;
            const { username } = req.body;

            await makeApiRequest(server, '/whitelist', 'DELETE', null, { username });

            res.json({
                success: true,
                server,
                action: 'remove-from-whitelist',
                username,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error(`Failed to remove ${req.body.username} from whitelist on ${req.params.server}:`, error.message);

            if (error.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    error: 'MinecraftServerAPI unavailable',
                    message: 'Plugin not responding on server',
                    server: req.params.server
                });
            }

            res.status(500).json({
                error: 'Failed to remove from whitelist',
                message: error.response?.data?.message || error.message,
                server: req.params.server,
                username: req.body.username
            });
        }
    }
);

// Plugin Management

// Get plugins list
router.get('/:server/plugins',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play']),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server } = req.params;
            const pluginsData = await makeApiRequest(server, '/plugins');

            res.json({
                success: true,
                server,
                endpoint: 'plugins',
                data: pluginsData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error(`Failed to get plugins for ${req.params.server}:`, error.message);

            if (error.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    error: 'MinecraftServerAPI unavailable',
                    message: 'Plugin not responding on server',
                    server: req.params.server
                });
            }

            res.status(500).json({
                error: 'Failed to get plugins',
                message: error.response?.data?.message || error.message,
                server: req.params.server
            });
        }
    }
);

// World Management

// Get worlds list
router.get('/:server/worlds',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play']),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server } = req.params;
            const worldsData = await makeApiRequest(server, '/worlds');

            res.json({
                success: true,
                server,
                endpoint: 'worlds',
                data: worldsData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error(`Failed to get worlds for ${req.params.server}:`, error.message);

            if (error.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    error: 'MinecraftServerAPI unavailable',
                    message: 'Plugin not responding on server',
                    server: req.params.server
                });
            }

            res.status(500).json({
                error: 'Failed to get worlds',
                message: error.response?.data?.message || error.message,
                server: req.params.server
            });
        }
    }
);

// Backup Management

// Get backups list
router.get('/:server/backups',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play']),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server } = req.params;
            const backupsData = await makeApiRequest(server, '/backups');

            res.json({
                success: true,
                server,
                endpoint: 'backups',
                data: backupsData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error(`Failed to get backups for ${req.params.server}:`, error.message);

            if (error.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    error: 'MinecraftServerAPI unavailable',
                    message: 'Plugin not responding on server',
                    server: req.params.server
                });
            }

            res.status(500).json({
                error: 'Failed to get backups',
                message: error.response?.data?.message || error.message,
                server: req.params.server
            });
        }
    }
);

// Create backup
router.post('/:server/backups',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play']),
    body('name').isLength({ min: 1, max: 64 }),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server } = req.params;
            const { name } = req.body;

            await makeApiRequest(server, '/backups', 'POST', null, { name });

            res.json({
                success: true,
                server,
                action: 'create-backup',
                backupName: name,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error(`Failed to create backup ${req.body.name} on ${req.params.server}:`, error.message);

            if (error.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    error: 'MinecraftServerAPI unavailable',
                    message: 'Plugin not responding on server',
                    server: req.params.server
                });
            }

            res.status(500).json({
                error: 'Failed to create backup',
                message: error.response?.data?.message || error.message,
                server: req.params.server,
                backupName: req.body.name
            });
        }
    }
);

// Global health check for all servers with MinecraftServerAPI
router.get('/health/all', async (req, res) => {
    const servers = ['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play'];
    const results = {};

    const healthChecks = servers.map(async (server) => {
        try {
            const healthData = await makeApiRequest(server, '/ping');
            return { server, status: 'healthy', data: healthData };
        } catch (error) {
            return {
                server,
                status: 'unhealthy',
                error: error.code === 'ECONNREFUSED' ? 'Plugin not available' : 'API error'
            };
        }
    });

    const healthResults = await Promise.all(healthChecks);

    healthResults.forEach(result => {
        results[result.server] = result;
    });

    const healthyCount = healthResults.filter(r => r.status === 'healthy').length;

    res.json({
        success: true,
        totalServers: servers.length,
        healthyServers: healthyCount,
        unhealthyServers: servers.length - healthyCount,
        servers: results,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;