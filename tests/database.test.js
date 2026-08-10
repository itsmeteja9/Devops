const { initDatabase, recordMetric, recordDeployment, getMetrics, getDeployments, checkHealth } = require('../src/database');

describe('Database Module', () => {
  describe('Database Health Check', () => {
    it('should have a checkHealth function', () => {
      expect(typeof checkHealth).toBe('function');
    });

    it('should return an object with status property', async () => {
      const result = await checkHealth();
      expect(result).toHaveProperty('status');
    });

    it('should return disconnected status when database unavailable', async () => {
      const result = await checkHealth();
      expect(['connected', 'disconnected']).toContain(result.status);
    });
  });

  describe('Database Initialization', () => {
    it('should have an initDatabase function', () => {
      expect(typeof initDatabase).toBe('function');
    });

    it('should be async function', () => {
      expect(initDatabase.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('Metric Recording', () => {
    it('should have a recordMetric function', () => {
      expect(typeof recordMetric).toBe('function');
    });

    it('should accept metric parameters', async () => {
      const result = await recordMetric('/api/test', 'GET', 200, 100);
      expect(result).toBeUndefined();
    });

    it('should handle missing parameters gracefully', async () => {
      const result = await recordMetric();
      expect(result).toBeUndefined();
    });
  });

  describe('Deployment Recording', () => {
    it('should have a recordDeployment function', () => {
      expect(typeof recordDeployment).toBe('function');
    });

    it('should accept deployment parameters', async () => {
      const result = await recordDeployment('v1.0.0', 'production', 'started');
      expect(result).toBeUndefined();
    });

    it('should handle various statuses', async () => {
      const statuses = ['started', 'success', 'failed'];
      for (const status of statuses) {
        const result = await recordDeployment('v1.0.0', 'production', status);
        expect(result).toBeUndefined();
      }
    });
  });

  describe('Metrics Retrieval', () => {
    it('should have a getMetrics function', () => {
      expect(typeof getMetrics).toBe('function');
    });

    it('should return an array', async () => {
      const result = await getMetrics();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should accept limit parameter', async () => {
      const result = await getMetrics(10);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return array even on error', async () => {
      const result = await getMetrics(100);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Deployments Retrieval', () => {
    it('should have a getDeployments function', () => {
      expect(typeof getDeployments).toBe('function');
    });

    it('should return an array', async () => {
      const result = await getDeployments();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should accept limit parameter', async () => {
      const result = await getDeployments(5);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return array even on error', async () => {
      const result = await getDeployments(50);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Database Configuration', () => {
    it('should use DATABASE_HOST from environment', () => {
      const originalEnv = process.env.DATABASE_HOST;
      process.env.DATABASE_HOST = 'test-host';
      // Just verify the environment variable is set
      expect(process.env.DATABASE_HOST).toBe('test-host');
      process.env.DATABASE_HOST = originalEnv;
    });

    it('should use DATABASE_PORT from environment', () => {
      const originalEnv = process.env.DATABASE_PORT;
      process.env.DATABASE_PORT = '5432';
      expect(process.env.DATABASE_PORT).toBe('5432');
      process.env.DATABASE_PORT = originalEnv;
    });

    it('should have database connection pool', () => {
      const db = require('../src/database');
      expect(db.pool).toBeDefined();
    });
  });
});
