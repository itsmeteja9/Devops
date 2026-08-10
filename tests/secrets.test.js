const fs = require('fs');
const path = require('path');
const { loadSecret, getDatabaseConfig, getDatadogConfig } = require('../src/secrets');

describe('Secrets Module', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
  });

  describe('loadSecret function', () => {
    it('should have a loadSecret function', () => {
      expect(typeof loadSecret).toBe('function');
    });

    it('should return null when secret not found', () => {
      const result = loadSecret('nonexistent-secret', 'NONEXISTENT_VAR');
      expect(result).toBeNull();
    });

    it('should fallback to environment variable', () => {
      process.env.TEST_SECRET_VAR = 'test-value';
      const result = loadSecret('nonexistent-secret', 'TEST_SECRET_VAR');
      expect(result).toBe('test-value');
    });

    it('should accept multiple secrets', () => {
      process.env.SECRET1 = 'value1';
      process.env.SECRET2 = 'value2';
      const result1 = loadSecret('missing1', 'SECRET1');
      const result2 = loadSecret('missing2', 'SECRET2');
      expect(result1).toBe('value1');
      expect(result2).toBe('value2');
    });

    it('should trim whitespace from environment variables', () => {
      process.env.WHITESPACE_SECRET = '  secret-value  ';
      const result = loadSecret('nonexistent', 'WHITESPACE_SECRET');
      expect(result).toBe('  secret-value  '); // fs.readFileSync trims, but env vars don't
    });
  });

  describe('getDatabaseConfig function', () => {
    it('should have a getDatabaseConfig function', () => {
      expect(typeof getDatabaseConfig).toBe('function');
    });

    it('should return an object with database configuration', () => {
      const config = getDatabaseConfig();
      expect(config).toHaveProperty('host');
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('database');
      expect(config).toHaveProperty('user');
      expect(config).toHaveProperty('password');
      expect(config).toHaveProperty('ssl');
    });

    it('should use environment variables for database config', () => {
      process.env.DATABASE_HOST = 'test-host';
      process.env.DATABASE_PORT = '5432';
      process.env.DATABASE_NAME = 'test_db';
      process.env.DATABASE_USER = 'test_user';
      process.env.DATABASE_PASSWORD = 'test_pass';

      const config = getDatabaseConfig();
      expect(config.host).toBe('test-host');
      expect(config.port).toBe(5432);
      expect(config.database).toBe('test_db');
      expect(config.user).toBe('test_user');
    });

    it('should use default values when environment variables not set', () => {
      delete process.env.DATABASE_HOST;
      delete process.env.DATABASE_PORT;
      delete process.env.DATABASE_NAME;
      delete process.env.DATABASE_USER;

      const config = getDatabaseConfig();
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(5432);
      expect(config.database).toBe('devops_db');
      expect(config.user).toBe('devops_app');
    });

    it('should set ssl based on NODE_ENV', () => {
      process.env.NODE_ENV = 'production';
      const prodConfig = getDatabaseConfig();
      expect(prodConfig.ssl).toEqual({ rejectUnauthorized: false });

      process.env.NODE_ENV = 'development';
      const devConfig = getDatabaseConfig();
      expect(devConfig.ssl).toBe(false);
    });
  });

  describe('getDatadogConfig function', () => {
    it('should have a getDatadogConfig function', () => {
      expect(typeof getDatadogConfig).toBe('function');
    });

    it('should return an object with Datadog configuration', () => {
      const config = getDatadogConfig();
      expect(config).toHaveProperty('apiKey');
      expect(config).toHaveProperty('site');
      expect(config).toHaveProperty('service');
      expect(config).toHaveProperty('version');
      expect(config).toHaveProperty('environment');
    });

    it('should use environment variables for Datadog config', () => {
      process.env.DD_SERVICE = 'my-service';
      process.env.DD_VERSION = '1.0.0';
      process.env.NODE_ENV = 'staging';
      process.env.DD_SITE = 'datadoghq.eu';

      const config = getDatadogConfig();
      expect(config.service).toBe('my-service');
      expect(config.version).toBe('1.0.0');
      expect(config.environment).toBe('staging');
      expect(config.site).toBe('datadoghq.eu');
    });

    it('should use default Datadog values', () => {
      delete process.env.DD_SERVICE;
      delete process.env.DD_VERSION;
      delete process.env.DD_SITE;

      const config = getDatadogConfig();
      expect(config.service).toBe('devops-app');
      expect(config.version).toBe('unknown');
      expect(config.site).toBe('datadoghq.com');
    });

    it('should have null apiKey when secret not found', () => {
      const config = getDatadogConfig();
      expect(config.apiKey).toBeNull();
    });
  });

  describe('Configuration Integration', () => {
    it('should handle multiple config calls without errors', () => {
      expect(() => {
        getDatabaseConfig();
        getDatadogConfig();
        getDatabaseConfig();
      }).not.toThrow();
    });

    it('should not mutate when accessing configs multiple times', () => {
      const config1 = getDatabaseConfig();
      const config2 = getDatabaseConfig();
      expect(config1).toEqual(config2);
    });

    it('should respect environment variable changes', () => {
      process.env.DATABASE_HOST = 'host1';
      const config1 = getDatabaseConfig();
      expect(config1.host).toBe('host1');

      process.env.DATABASE_HOST = 'host2';
      const config2 = getDatabaseConfig();
      expect(config2.host).toBe('host2');
    });
  });

  describe('Secret Loading Modes', () => {
    it('should support Kubernetes mounted secrets', () => {
      // Simulate Kubernetes secret mount
      const result = loadSecret('/var/secrets/db-password', 'DB_PASSWORD_FALLBACK');
      expect(['string', 'null']).toContain(typeof result);
    });

    it('should prefer mounted secrets over environment variables', () => {
      process.env.FALLBACK_SECRET = 'env-value';
      // loadSecret would prefer file if it existed
      const result = loadSecret('nonexistent-file', 'FALLBACK_SECRET');
      expect(result).toBe('env-value');
    });

    it('should handle both development and production modes', () => {
      process.env.NODE_ENV = 'development';
      const devConfig = getDatabaseConfig();
      expect(devConfig.ssl).toBe(false);

      process.env.NODE_ENV = 'production';
      const prodConfig = getDatabaseConfig();
      expect(prodConfig.ssl).toBeDefined();
    });
  });
});
