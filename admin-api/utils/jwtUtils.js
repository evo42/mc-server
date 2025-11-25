const jwt = require('jsonwebtoken');

// Secret key for JWT signing - should be set as environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.userId,
      username: user.username 
    },
    JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
    }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  JWT_SECRET
};