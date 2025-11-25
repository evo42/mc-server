const express = require('express');
const router = express.Router();
const { param, validationResult } = require('express-validator');
const serversController = require('../controllers/serversController');

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

router.post('/start/:server', validateServerName, handleValidationErrors, serversController.startServer);
router.post('/stop/:server', validateServerName, handleValidationErrors, serversController.stopServer);
router.post('/restart/:server', validateServerName, handleValidationErrors, serversController.restartServer);
router.get('/status/:server', validateServerName, handleValidationErrors, serversController.getServerStatus);
router.get('/status', serversController.getAllServerStatus);

// Server configuration routes
router.get('/config/:server', validateServerName, handleValidationErrors, serversController.getServerConfig);
router.post('/config/:server', validateServerName, handleValidationErrors, serversController.updateServerConfig);

module.exports = router;
