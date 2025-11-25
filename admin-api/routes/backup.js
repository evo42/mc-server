const express = require('express');
const router = express.Router();
const { param, body, validationResult } = require('express-validator');
const backupController = require('../controllers/backupController');

// Validation middleware for server name
const validateServerName = [
  param('server')
    .trim()
    .escape()
    .notEmpty()
    .matches(/^[a-z0-9-]+$/)
    .isLength({ min: 3, max: 50 })
];

// Validation middleware for backup operations
const validateBackupOperation = [
  body('backupName')
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

// Routes
router.post('/create/:server', validateServerName, handleValidationErrors, backupController.createBackup);
router.get('/list/:server', validateServerName, handleValidationErrors, backupController.listBackups);
router.post('/restore/:server', validateServerName, validateBackupOperation, handleValidationErrors, backupController.restoreBackup);
router.post('/delete/:server', validateServerName, validateBackupOperation, handleValidationErrors, backupController.deleteBackup);

module.exports = router;