const request = require('supertest');
const app = require('../app');

describe('DevOps POC Application', () => {
  describe('GET /health', () => {
    it('should return 200 with healthy status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'healthy');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('version');
    });

    it('should return timestamp in ISO format', async () => {
      const res = await request(app).get('/health');

      expect(res.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('GET /ready', () => {
    it('should return 200 with ready status', async () => {
      const res = await request(app).get('/ready');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ready', true);
      expect(res.body).toHaveProperty('database');
      expect(res.body).toHaveProperty('cache');
    });
  });

  describe('GET /api/info', () => {
    it('should return application information', async () => {
      const res = await request(app).get('/api/info');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('environment');
      expect(res.body).toHaveProperty('features');
      expect(Array.isArray(res.body.features)).toBe(true);
      expect(res.body.features.length).toBeGreaterThan(0);
    });

    it('should contain DevOps features', async () => {
      const res = await request(app).get('/api/info');

      expect(res.body.features).toContain('SonarQube Code Quality Analysis');
      expect(res.body.features).toContain('Datadog APM & Monitoring');
      expect(res.body.features).toContain('Kubernetes Deployment');
    });
  });

  describe('GET /api/metrics', () => {
    it('should return system metrics', async () => {
      const res = await request(app).get('/api/metrics');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('memory');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body.memory).toHaveProperty('heapUsed');
      expect(res.body.memory).toHaveProperty('heapTotal');
    });

    it('should return positive memory values', async () => {
      const res = await request(app).get('/api/metrics');

      expect(res.body.memory.heapUsed).toBeGreaterThan(0);
      expect(res.body.memory.heapTotal).toBeGreaterThan(0);
      expect(res.body.uptime).toBeGreaterThan(0);
    });
  });

  describe('GET /api/demo', () => {
    it('should return demo response', async () => {
      const res = await request(app).get('/api/demo');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Demo response');
      expect(res.body).toHaveProperty('delay');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should complete within reasonable time', async () => {
      const start = Date.now();
      const res = await request(app).get('/api/demo');
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('GET /api/error', () => {
    it('should return error response', async () => {
      const res = await request(app).get('/api/error');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404 for nonexistent routes', async () => {
      const res = await request(app).get('/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Not found');
    });
  });

  describe('HTTP Methods', () => {
    it('should handle GET requests', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
    });

    it('should handle POST requests with JSON', async () => {
      const res = await request(app)
        .post('/api/info')
        .send({ test: 'data' });

      expect(res.status).toBe(404);
    });
  });

  describe('Response Headers', () => {
    it('should not expose server header', async () => {
      const res = await request(app).get('/health');

      expect(res.headers['x-powered-by']).toBeUndefined();
    });

    it('should return JSON content type', async () => {
      const res = await request(app).get('/health');

      expect(res.type).toMatch('application/json');
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        request(app).get('/health')
      );

      const responses = await Promise.all(requests);

      responses.forEach(res => {
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'healthy');
      });
    });
  });

  describe('Performance', () => {
    it('should respond to health check in under 100ms', async () => {
      const start = Date.now();
      const res = await request(app).get('/health');
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(100);
    });
  });
});
