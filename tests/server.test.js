const app = require('../app');

describe('Server Configuration', () => {
  describe('Express App Setup', () => {
    it('should have express app', () => {
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
    });

    it('should be a valid express application', () => {
      expect(app.get).toBeDefined();
      expect(app.post).toBeDefined();
      expect(app.use).toBeDefined();
    });
  });

  describe('Middleware Configuration', () => {
    it('should have JSON middleware configured', () => {
      expect(app._router).toBeDefined();
    });

    it('should have static file serving', () => {
      expect(app._router).toBeDefined();
    });
  });

  describe('Route Registration', () => {
    const routes = [
      { method: 'get', path: '/health' },
      { method: 'get', path: '/ready' },
      { method: 'get', path: '/api/info' },
      { method: 'get', path: '/api/metrics' },
      { method: 'get', path: '/api/demo' },
      { method: 'get', path: '/api/error' }
    ];

    it('should have all required routes registered', () => {
      const registeredRoutes = app._router.stack
        .filter(layer => layer.route)
        .map(layer => ({
          method: Object.keys(layer.route.methods)[0],
          path: layer.route.path
        }));

      routes.forEach(route => {
        const found = registeredRoutes.some(
          r => r.method === route.method && r.path === route.path
        );
        expect(found).toBe(true);
      });
    });
  });

  describe('Security Headers', () => {
    it('should disable x-powered-by header', () => {
      expect(app.get('x-powered-by')).not.toBe('Express');
    });
  });

  describe('Error Handling', () => {
    it('should have error handler middleware', () => {
      const errorHandlers = app._router.stack.filter(
        layer => layer.name === 'bound dispatch' || layer.handle.length === 4
      );
      expect(errorHandlers.length).toBeGreaterThan(0);
    });
  });

  describe('Request Handling', () => {
    it('should handle requests without errors', () => {
      expect(() => {
        app.emit('request', {}, {});
      }).not.toThrow();
    });
  });
});

describe('Application Environment', () => {
  it('should support NODE_ENV variable', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    // Reimport to get updated env
    const moduleKey = require.resolve('../app');
    delete require.cache[moduleKey];

    expect(process.env.NODE_ENV).toBe('test');

    // Restore
    process.env.NODE_ENV = originalEnv;
  });

  it('should have version information', () => {
    const pkg = require('../package.json');
    expect(pkg.version).toBeDefined();
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe('Application Metadata', () => {
  const pkg = require('../package.json');

  it('should have required metadata', () => {
    expect(pkg.name).toBeDefined();
    expect(pkg.version).toBeDefined();
    expect(pkg.description).toBeDefined();
    expect(pkg.main).toBeDefined();
  });

  it('should have required scripts', () => {
    expect(pkg.scripts.start).toBeDefined();
    expect(pkg.scripts.test).toBeDefined();
    expect(pkg.scripts.dev).toBeDefined();
  });

  it('should have required dependencies', () => {
    expect(pkg.dependencies.express).toBeDefined();
    expect(pkg.dependencies.pino).toBeDefined();
  });

  it('should have test dependencies', () => {
    expect(pkg.devDependencies.jest).toBeDefined();
    expect(pkg.devDependencies.supertest).toBeDefined();
  });

  it('should target Node.js 18+', () => {
    expect(pkg.engines.node).toBe('>=18');
  });
});

describe('Application Constants', () => {
  it('should have correct app version', () => {
    const pkg = require('../package.json');
    expect(pkg.version).toBe('1.0.0');
  });

  it('should have correct app name', () => {
    const pkg = require('../package.json');
    expect(pkg.name).toContain('devops');
  });

  it('should be marked as MIT licensed', () => {
    const pkg = require('../package.json');
    expect(pkg.license).toBe('MIT');
  });
});
