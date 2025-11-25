const express = require('express');
const router = express.Router();
const serversService = require('../services/serversService');
const historyService = require('../services/historyService');
const datapacksController = require('../controllers/datapacksController');
const logger = require('pino')();

router.get('/status/all', async (req, res) => {
    try {
        const status = await serversService.getAllServerStatus();
        res.json(status);
    } catch (error) {
        logger.error({ err: error }, 'Error getting public status');
        res.status(500).json({ error: 'Failed to get status' });
    }
});

router.get('/history/:server', (req, res) => {
    const server = req.params.server;
    try {
        const history = historyService.getHistory(server);
        res.json(history);
    } catch (error) {
        logger.error({ err: error, server }, 'Error getting history');
        res.status(500).json({ error: 'Failed to get history' });
    }
});

router.get('/datapacks/:server', datapacksController.getDatapacks);

module.exports = router;
