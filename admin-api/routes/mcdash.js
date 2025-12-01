const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// MCDash service URL (Docker service name)
const MCDASH_BASE_URL = process.env.MCDASH_URL || 'http://mcdash:8080';

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

// File Browser Bridge - Get files for a server
router.get('/files/:server',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play']),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server } = req.params;
            const { path = '' } = req.query;

            const response = await axios.get(`${MCDASH_BASE_URL}/api/files/${server}`, {
                params: { path },
                timeout: 10000
            });

            res.json({
                success: true,
                server,
                path,
                files: response.data.files || [],
                directories: response.data.directories || []
            });
        } catch (error) {
            console.error('MCDash file browser error:', error.message);

            if (error.code === 'ECONNREFUSED' || error.response?.status === 502) {
                return res.status(503).json({
                    error: 'MCDash service unavailable',
                    message: 'File browser service is currently offline'
                });
            }

            res.status(500).json({
                error: 'MCDash file service error',
                message: error.response?.data?.message || error.message
            });
        }
    }
);

// Console Bridge - Get console output for a server
router.get('/console/:server',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play']),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server } = req.params;
            const { lines = 100 } = req.query;

            const response = await axios.get(`${MCDASH_BASE_URL}/api/console/${server}`, {
                params: { lines },
                timeout: 10000
            });

            res.json({
                success: true,
                server,
                console: response.data.console || [],
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('MCDash console error:', error.message);

            if (error.code === 'ECONNREFUSED' || error.response?.status === 502) {
                return res.status(503).json({
                    error: 'MCDash service unavailable',
                    message: 'Console service is currently offline'
                });
            }

            res.status(500).json({
                error: 'MCDash console service error',
                message: error.response?.data?.message || error.message
            });
        }
    }
);

// Console Command Execution - Send command to server
router.post('/console/:server/command',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play']),
    body('command').isLength({ min: 1, max: 500 }).trim(),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server } = req.params;
            const { command } = req.body;

            const response = await axios.post(`${MCDASH_BASE_URL}/api/console/${server}/command`, {
                command
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            res.json({
                success: true,
                server,
                command,
                result: response.data.result || 'Command executed'
            });
        } catch (error) {
            console.error('MCDash command execution error:', error.message);

            if (error.code === 'ECONNREFUSED' || error.response?.status === 502) {
                return res.status(503).json({
                    error: 'MCDash service unavailable',
                    message: 'Command execution service is currently offline'
                });
            }

            res.status(500).json({
                error: 'MCDash command execution error',
                message: error.response?.data?.message || error.message
            });
        }
    }
);

// Plugin Store Bridge - Get available plugins
router.get('/plugins/store', async (req, res) => {
    try {
        const { category, search } = req.query;

        const response = await axios.get(`${MCDASH_BASE_URL}/api/plugins/store`, {
            params: { category, search },
            timeout: 15000
        });

        res.json({
            success: true,
            plugins: response.data.plugins || [],
            categories: response.data.categories || [],
            search,
            category
        });
    } catch (error) {
        console.error('MCDash plugin store error:', error.message);

        if (error.code === 'ECONNREFUSED' || error.response?.status === 502) {
            return res.status(503).json({
                error: 'MCDash service unavailable',
                message: 'Plugin store service is currently offline'
            });
        }

        res.status(500).json({
            error: 'MCDash plugin store error',
            message: error.response?.data?.message || error.message
        });
    }
});

// Plugin Installation
router.post('/plugins/:server/install',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play']),
    body('pluginId').isLength({ min: 1 }),
    body('version').optional().isLength({ min: 1 }),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server } = req.params;
            const { pluginId, version } = req.body;

            const response = await axios.post(`${MCDASH_BASE_URL}/api/plugins/${server}/install`, {
                pluginId,
                version
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // Longer timeout for plugin installation
            });

            res.json({
                success: true,
                server,
                pluginId,
                version,
                result: response.data.result || 'Plugin installed successfully'
            });
        } catch (error) {
            console.error('MCDash plugin installation error:', error.message);

            if (error.code === 'ECONNREFUSED' || error.response?.status === 502) {
                return res.status(503).json({
                    error: 'MCDash service unavailable',
                    message: 'Plugin installation service is currently offline'
                });
            }

            res.status(500).json({
                error: 'MCDash plugin installation error',
                message: error.response?.data?.message || error.message
            });
        }
    }
);

// Enhanced Backup Management
router.get('/backups/:server',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play']),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server } = req.params;

            const response = await axios.get(`${MCDASH_BASE_URL}/api/backups/${server}`, {
                timeout: 15000
            });

            res.json({
                success: true,
                server,
                backups: response.data.backups || [],
                totalSize: response.data.totalSize || 0,
                lastBackup: response.data.lastBackup
            });
        } catch (error) {
            console.error('MCDash backup listing error:', error.message);

            if (error.code === 'ECONNREFUSED' || error.response?.status === 502) {
                return res.status(503).json({
                    error: 'MCDash service unavailable',
                    message: 'Backup service is currently offline'
                });
            }

            res.status(500).json({
                error: 'MCDash backup service error',
                message: error.response?.data?.message || error.message
            });
        }
    }
);

// Create Backup
router.post('/backups/:server/create',
    body('server').isIn(['mc-ilias', 'mc-niilo', 'mc-bgstpoelten', 'mc-htlstp', 'mc-borgstpoelten', 'mc-hakstpoelten', 'mc-basop-bafep-stp', 'mc-play']),
    body('name').optional().isLength({ min: 1, max: 100 }),
    body('type').optional().isIn(['full', 'incremental', 'world_only']),
    handleValidationErrors,
    async (req, res) => {
        try {
            const { server } = req.params;
            const { name, type = 'full' } = req.body;

            const response = await axios.post(`${MCDASH_BASE_URL}/api/backups/${server}/create`, {
                name,
                type,
                timestamp: new Date().toISOString()
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 60000 // Backup creation can take time
            });

            res.json({
                success: true,
                server,
                backup: response.data.backup || {
                    name,
                    type,
                    timestamp: new Date().toISOString(),
                    status: 'created'
                }
            });
        } catch (error) {
            console.error('MCDash backup creation error:', error.message);

            if (error.code === 'ECONNREFUSED' || error.response?.status === 502) {
                return res.status(503).json({
                    error: 'MCDash service unavailable',
                    message: 'Backup creation service is currently offline'
                });
            }

            res.status(500).json({
                error: 'MCDash backup creation error',
                message: error.response?.data?.message || error.message
            });
        }
    }
);

// Health Check for MCDash Service
router.get('/health', async (req, res) => {
    try {
        const response = await axios.get(`${MCDASH_BASE_URL}/api/health`, {
            timeout: 5000
        });

        res.json({
            success: true,
            status: 'healthy',
            mcdashStatus: response.data.status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: 'MCDash service unavailable',
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;