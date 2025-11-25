const express = require('express');
const router = express.Router();
const { param, validationResult } = require('express-validator');
const serversService = require('../services/serversService');
const historyService = require('../services/historyService');
const datapacksController = require('../controllers/datapacksController');
const logger = require('pino')();

// Validation middleware for server name
const validateServerName = [
  param('server')
    .trim()
    .escape()
    .notEmpty()
    .matches(/^[a-z0-9-]+$/)
    .isLength({ min: 3, max: 50 })
];

// Additional validation to handle validation results
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

router.get('/status/all', async (req, res) => {
    try {
        const status = await serversService.getAllServerStatus();
        res.json(status);
    } catch (error) {
        logger.error({ err: error }, 'Error getting public status');
        res.status(500).json({ error: 'Failed to get status' });
    }
});

router.get('/history/:server', validateServerName, handleValidationErrors, (req, res) => {
    const server = req.params.server;
    try {
        const history = historyService.getHistory(server);
        res.json(history);
    } catch (error) {
        logger.error({ err: error, server }, 'Error getting history');
        res.status(500).json({ error: 'Failed to get history' });
    }
});

router.get('/datapacks/:server', validateServerName, handleValidationErrors, datapacksController.getDatapacks);

module.exports = router;
