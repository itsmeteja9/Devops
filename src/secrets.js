const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Load secrets from mounted files (Kubernetes secrets)
 * Fallback to environment variables for development
 */
const loadSecret = (secretName, envVarName) => {
  const secretPath = path.join('/var/secrets', secretName);

  try {
    if (fs.existsSync(secretPath)) {
      const value = fs.readFileSync(secretPath, 'utf8').trim();
      logger.info({ msg: `Loaded ${secretName} from mounted secret` });
      return value;
    }
  } catch (err) {
    logger.warn({ msg: `Failed to read secret ${secretName}`, error: err.message });
  }

  // Fallback to environment variable (development)
  const envValue = process.env[envVarName];
  if (envValue) {
    logger.info({ msg: `Using ${envVarName} environment variable` });
    return envValue;
  }

  logger.error({ msg: `Secret ${secretName} not found` });
  return null;
};

module.exports = {
  loadSecret,

  getDatabaseConfig: () => ({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'devops_db',
    user: process.env.DATABASE_USER || 'devops_app',
    password: loadSecret('db-password', 'DATABASE_PASSWORD'),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  }),

  getDatadogConfig: () => ({
    apiKey: loadSecret('dd-api-key', 'DD_API_KEY'),
    site: process.env.DD_SITE || 'datadoghq.com',
    service: process.env.DD_SERVICE || 'devops-app',
    version: process.env.DD_VERSION || 'unknown',
    environment: process.env.NODE_ENV || 'development'
  })
};
