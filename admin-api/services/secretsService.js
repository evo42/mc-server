/**
 * Secure Secrets Management Service
 * Implements secure handling of sensitive credentials following security best practices
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecretsManager {
  constructor() {
    this.secrets = new Map();
    this.encryptionKey = this.getEncryptionKey();
    this.initialized = false;
  }

  /**
   * Initialize the secrets manager by loading and validating secrets
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Load secrets from environment variables first
      this.loadEnvironmentSecrets();
      
      // Try loading secrets from secure file
      await this.loadSecureSecretsFile();
      
      // Validate critical secrets exist
      await this.validateCriticalSecrets();
      
      this.initialized = true;
      console.log('Secrets manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize secrets manager:', error.message);
      throw new Error(`Secrets initialization failed: ${error.message}`);
    }
  }

  /**
   * Get encryption key for secret encryption/decryption
   */
  getEncryptionKey() {
    // Use environment variable if available, otherwise generate one (for development)
    const envKey = process.env.SECRET_ENCRYPTION_KEY;
    if (envKey) {
      return Buffer.from(envKey, 'hex');
    }
    
    // Generate a random key for development (should be set in production)
    console.warn('Generating temporary encryption key for development. Set SECRET_ENCRYPTION_KEY in production.');
    return crypto.randomBytes(32); // 256-bit key
  }

  /**
   * Load secrets from environment variables
   */
  loadEnvironmentSecrets() {
    const envVars = [
      'ADMIN_PASS',
      'GRAFANA_PASSWORD',
      'REDIS_PASSWORD',
      'SMTP_PASSWORD',
      'PAGERDUTY_SERVICE_KEY',
      'SLACK_WEBHOOK_URL',
      'DOCKER_PROXY_TOKEN',
      'JWT_SECRET',
      'MINECRAFT_SERVERAPI_KEY',
      'BASIC_AUTH_PASSWORD'
    ];

    envVars.forEach(varName => {
      if (process.env[varName]) {
        this.secrets.set(varName, process.env[varName]);
      }
    });
  }

  /**
   * Load secrets from secure file with encryption
   */
  async loadSecureSecretsFile() {
    const secretsPath = process.env.SECRETS_FILE_PATH || './.encrypted-secrets';
    
    if (!fs.existsSync(secretsPath)) {
      console.log('No encrypted secrets file found, continuing with environment variables only');
      return;
    }

    try {
      const encryptedData = fs.readFileSync(secretsPath, 'utf8');
      const decryptedData = this.decrypt(encryptedData);
      const secrets = JSON.parse(decryptedData);
      
      Object.keys(secrets).forEach(key => {
        this.secrets.set(key, secrets[key]);
      });
      
      console.log('Encrypted secrets loaded from file');
    } catch (error) {
      console.error('Failed to load encrypted secrets file:', error.message);
      throw error;
    }
  }

  /**
   * Validate that critical secrets are present
   */
  async validateCriticalSecrets() {
    const criticalSecrets = [
      'ADMIN_PASS',
      'JWT_SECRET'
    ];

    const missing = criticalSecrets.filter(secret => !this.secrets.has(secret));
    
    if (missing.length > 0) {
      throw new Error(`Missing critical secrets: ${missing.join(', ')}. Please set them in environment variables or encrypted secrets file.`);
    }

    // Additional validation for secret quality
    const adminPass = this.secrets.get('ADMIN_PASS');
    if (adminPass && (adminPass === 'admin123' || adminPass.length < 8)) {
      console.warn('WARNING: Weak admin password detected. Please use a stronger password.');
    }
  }

  /**
   * Get a secret by name
   */
  getSecret(name) {
    if (!this.initialized) {
      throw new Error('Secrets manager not initialized. Call initialize() first.');
    }
    
    return this.secrets.get(name);
  }

  /**
   * Check if a secret exists
   */
  hasSecret(name) {
    if (!this.initialized) {
      return false;
    }
    
    return this.secrets.has(name);
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encrypt(text) {
    const iv = crypto.randomBytes(12); // 96 bits for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return IV + AuthTag + EncryptedData
    return iv.toString('hex') + authTag.toString('hex') + encrypted;
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decrypt(encryptedData) {
    // Extract IV, AuthTag, and EncryptedText
    const iv = Buffer.from(encryptedData.substring(0, 24), 'hex'); // 12 bytes * 2 for hex
    const authTag = Buffer.from(encryptedData.substring(24, 56), 'hex'); // 16 bytes * 2 for hex
    const encryptedText = encryptedData.substring(56);
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Create a new encrypted secrets file
   */
  async createEncryptedSecretsFile(secrets, filePath = './.encrypted-secrets') {
    if (!this.initialized) {
      throw new Error('Secrets manager not initialized. Call initialize() first.');
    }

    try {
      const secretsJson = JSON.stringify(secrets);
      const encrypted = this.encrypt(secretsJson);
      
      fs.writeFileSync(filePath, encrypted, 'utf8');
      console.log(`Encrypted secrets file created at ${filePath}`);
      
      // Update internal secrets map
      Object.keys(secrets).forEach(key => {
        this.secrets.set(key, secrets[key]);
      });
    } catch (error) {
      console.error('Failed to create encrypted secrets file:', error.message);
      throw error;
    }
  }

  /**
   * Generate a secure random password
   */
  generateSecurePassword(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Rotate JWT secret
   */
  async rotateJwtSecret() {
    const newSecret = this.generateSecurePassword(64);
    this.secrets.set('JWT_SECRET', newSecret);
    console.log('JWT secret rotated successfully');
    
    return newSecret;
  }
}

// Create a singleton instance
const secretsManager = new SecretsManager();

// Export the singleton and the class
module.exports = {
  secretsManager,
  SecretsManager
};