/**
 * Secrets Validation Middleware
 * Ensures that all required secrets are properly configured before starting the application
 */

const { secretsManager } = require('../services/secretsService');

const secretsValidationMiddleware = async (req, res, next) => {
  try {
    // Ensure secrets manager is initialized before processing requests
    if (!secretsManager.initialized) {
      console.log('Initializing secrets manager...');
      await secretsManager.initialize();
    }

    // Add secrets to request object for handlers that need them
    req.secrets = secretsManager;

    next();
  } catch (error) {
    console.error('SECRET_VALIDATION_ERROR:', error.message);
    
    // Return a generic error to avoid exposing security details
    res.status(500).json({
      error: 'Service temporarily unavailable',
      message: 'Configuration error - contact administrator'
    });
  }
};

/**
 * Pre-start validation to check secrets before server starts
 */
const validateSecretsBeforeStart = async () => {
  try {
    console.log('Validating secrets configuration...');
    await secretsManager.initialize();
    
    console.log('Secrets validation completed successfully');
    
    // Check for weak passwords and warn
    const adminPass = secretsManager.getSecret('ADMIN_PASS');
    if (adminPass && adminPass === 'admin123') {
      console.warn('\n⚠️  SECURITY WARNING: Using default ADMIN_PASS. Please change this for production! ⚠️\n');
    }
    
    const grafanaPass = secretsManager.getSecret('GRAFANA_PASSWORD');
    if (grafanaPass && grafanaPass === 'admin123') {
      console.warn('\n⚠️  SECURITY WARNING: Using default GRAFANA_PASSWORD. Please change this for production! ⚠️\n');
    }
    
    return true;
  } catch (error) {
    console.error('❌ SECRETS VALIDATION FAILED:', error.message);
    console.error('Please ensure all required secrets are configured before starting the service.');
    process.exit(1);
  }
};

module.exports = {
  secretsValidationMiddleware,
  validateSecretsBeforeStart
};