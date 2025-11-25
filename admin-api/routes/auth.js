const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../utils/jwtUtils');

// Route to get JWT token using basic auth credentials
router.post('/login', authController.login);

// Route to validate existing JWT token
router.get('/validate', authenticateToken, authController.validateToken);

module.exports = router;