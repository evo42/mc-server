const express = require('express');
const router = express.Router();
const { param, body, validationResult } = require('express-validator');
const datapacksController = require('../controllers/datapacksController');

// Validation middleware for server name
const validateServerName = [
  param('server')
    .trim()
    .escape()
    .notEmpty()
    .matches(/^[a-z0-9-]+$/)
    .isLength({ min: 3, max: 50 })
];

// Validation middleware for datapack installation
const validateInstallRequest = [
  body('datapackName')
    .trim()
    .escape()
    .notEmpty()
    .isLength({ min: 1, max: 100 }),
  body('version')
    .trim()
    .escape()
    .notEmpty()
    .isLength({ min: 1, max: 20 })
];

// Validation middleware for datapack uninstallation
const validateUninstallRequest = [
  body('datapackDir')
    .trim()
    .escape()
    .notEmpty()
    .isLength({ min: 1, max: 200 })
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

// Validation middleware for pagination parameters
const validatePagination = [
  (req, res, next) => {
    // Parse query parameters
    const page = parseInt(req.query.page, 10);
    const limit = parseInt(req.query.limit, 10);

    // Set defaults if not provided or invalid
    if (isNaN(page) || page < 1) {
      req.query.page = 1;
    } else {
      req.query.page = page;
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      req.query.limit = 20;
    } else {
      req.query.limit = limit;
    }

    next();
  }
];

// Specific routes first
router.get('/search',
  // Validate query parameters for search
  (req, res, next) => {
    const page = parseInt(req.query.page, 10);
    const limit = parseInt(req.query.limit, 10);

    // Validate page number
    if (req.query.page && (isNaN(page) || page < 1)) {
      return res.status(400).json({ error: 'Invalid page number' });
    }

    // Validate limit
    if (req.query.limit && (isNaN(limit) || limit < 1 || limit > 100)) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }

    next();
  },
  datapacksController.searchDatapacks
);

// General routes last
router.get('/:server', validateServerName, validatePagination, handleValidationErrors, datapacksController.getDatapacks);
router.post('/install/:server', validateServerName, validateInstallRequest, handleValidationErrors, datapacksController.installDatapack);
router.post('/uninstall/:server', validateServerName, validateUninstallRequest, handleValidationErrors, datapacksController.uninstallDatapack);

module.exports = router;
