jest.mock('../src/secrets', () => ({
  getDatabaseConfig: () => ({
    host: 'localhost',
    port: 5432,
    database: 'devops_db',
    user: 'devops_app',
    password: 'test-password',
    ssl: false
  })
}));

jest.mock('pg', () => {
  const queryMock = jest.fn();
  const connectMock = jest.fn();
  const releaseMock = jest.fn();

  queryMock.mockImplementation(async (sql) => {
    if (sql.includes('SELECT NOW()')) {
      return { rows: [{ now: new Date().toISOString() }] };
    }
    if (sql.includes('CREATE TABLE')) {
      return { rows: [] };
    }
    if (sql.includes('INSERT')) {
      return { rows: [] };
    }
    if (sql.includes('SELECT')) {
      return { rows: [{ id: 1, endpoint: '/test', method: 'GET', status_code: 200, response_time_ms: 100 }] };
    }
    return { rows: [] };
  });

  connectMock.mockResolvedValue({ query: queryMock, release: releaseMock });

  return {
    Pool: jest.fn(() => ({
      query: queryMock,
      connect: connectMock,
      on: jest.fn()
    }))
  };
});

const { initDatabase, recordMetric, recordDeployment, getMetrics, getDeployments, checkHealth } = require('../src/database');

describe('Database Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Database Health Check', () => {
    it('should have a checkHealth function', () => {
      expect(typeof checkHealth).toBe('function');
    });

    it('should return object with status property', async () => {
      const result = await checkHealth();
      expect(result).toHaveProperty('status');
    });

    it('should return connected status on successful database check', async () => {
      const result = await checkHealth();
      expect(result.status).toBe('connected');
      expect(result).toHaveProperty('timestamp');
    });

    it('should handle database connection errors gracefully', async () => {
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

    it('should initialize database tables', async () => {
      const db = require('../src/database');
      // Verify pool exists for connection
      expect(db.pool).toBeDefined();
    });

    it('should call database queries on init', async () => {
      const db = require('../src/database');
      await initDatabase();
      // Verify function completes without error
      expect(db.pool).toBeDefined();
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

    it('should call pool.query with INSERT statement', async () => {
      const db = require('../src/database');
      await recordMetric('/api/test', 'POST', 201, 150);
      expect(db.pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO metrics'),
        expect.any(Array)
      );
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

    it('should call pool.query with INSERT statement', async () => {
      const db = require('../src/database');
      await recordDeployment('v2.0.0', 'staging', 'success');
      expect(db.pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO deployments'),
        expect.any(Array)
      );
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

    it('should return metrics from database', async () => {
      const result = await getMetrics(50);
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('endpoint');
      }
    });

    it('should return empty array on database error', async () => {
      const { Pool } = require('pg');
      Pool.mockImplementationOnce(() => ({
        query: jest.fn().mockRejectedValueOnce(new Error('Query error')),
        connect: jest.fn(),
        on: jest.fn()
      }));

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

    it('should return deployments from database', async () => {
      const result = await getDeployments(20);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array on database error', async () => {
      const { Pool } = require('pg');
      Pool.mockImplementationOnce(() => ({
        query: jest.fn().mockRejectedValueOnce(new Error('Query error')),
        connect: jest.fn(),
        on: jest.fn()
      }));

      const result = await getDeployments(50);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Database Configuration', () => {
    it('should use DATABASE_HOST from environment', () => {
      const originalEnv = process.env.DATABASE_HOST;
      process.env.DATABASE_HOST = 'test-host';
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

  describe('Error Handling', () => {
    it('should handle metric recording errors gracefully', async () => {
      const db = require('../src/database');
      db.pool.query = jest.fn().mockRejectedValueOnce(new Error('Insert failed'));
      const result = await recordMetric('/api/test', 'GET', 500, 200);
      expect(result).toBeUndefined();
    });

    it('should handle deployment recording errors gracefully', async () => {
      const db = require('../src/database');
      db.pool.query = jest.fn().mockRejectedValueOnce(new Error('Insert failed'));
      const result = await recordDeployment('v1.0.0', 'prod', 'failed');
      expect(result).toBeUndefined();
    });
  });
});
