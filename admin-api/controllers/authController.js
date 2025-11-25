const { generateToken } = require('../utils/jwtUtils');
const logger = require('pino')();

// Login endpoint to generate JWT token
const login = async (req, res) => {
  // The username and password should have already been validated by basic auth middleware
  const { username } = req.user; // This would come from basic auth validation
  
  try {
    // In a real application, you would verify credentials against a database
    // For now, we'll just generate a token for valid users
    const user = { 
      userId: 1, // This would come from your user database
      username: username 
    };
    
    const token = generateToken(user);
    
    res.json({ 
      success: true, 
      token,
      user: { username: user.username }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error during login');
    res.status(500).json({ error: 'Login failed' });
  }
};

// Token validation endpoint
const validateToken = async (req, res) => {
  // If we reach this endpoint, the token has already been validated by middleware
  res.json({ 
    valid: true,
    user: req.user 
  });
};

module.exports = {
  login,
  validateToken
};