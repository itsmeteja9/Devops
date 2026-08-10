const express = require('express');
const path = require('path');
const logger = require('./src/logger');
const { metricsMiddleware } = require('./src/metrics');
const { checkHealth, getDeployments, getMetrics } = require('./src/database');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(metricsMiddleware);

// Disable powered-by header
app.disable('x-powered-by');

// Health check endpoint
app.get('/health', async (req, res) => {
  logger.info('Health check called');
  const dbHealth = await checkHealth();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    database: dbHealth.status
  });
});

// Readiness check
app.get('/ready', (req, res) => {
  logger.info('Readiness check called');
  res.json({
    ready: true,
    database: 'connected',
    cache: 'connected'
  });
});

// API endpoints
app.get('/api/info', (req, res) => {
  logger.info('Info endpoint called');
  res.json({
    name: 'DevOps POC Application',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: [
      'SonarQube Code Quality Analysis',
      'Datadog APM & Monitoring',
      'Kubernetes Deployment',
      'Terraform Infrastructure',
      'GitHub Actions CI/CD'
    ]
  });
});

// Metrics endpoint
app.get('/api/metrics', async (req, res) => {
  logger.info('Metrics endpoint called');
  const memUsage = process.memoryUsage();
  const dbMetrics = await getMetrics(10);

  res.json({
    timestamp: new Date().toISOString(),
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    },
    uptime: Math.round(process.uptime()),
    database: {
      recordsStored: dbMetrics.length,
      averageResponseTime: dbMetrics.length > 0
        ? Math.round(dbMetrics.reduce((a, b) => a + b.response_time_ms, 0) / dbMetrics.length)
        : 0
    }
  });
});

// Deployments endpoint
app.get('/api/deployments', async (req, res) => {
  logger.info('Deployments endpoint called');
  const deployments = await getDeployments(10);
  res.json({
    deployments,
    count: deployments.length
  });
});

// Demo endpoint for testing
app.get('/api/demo', (req, res) => {
  logger.info('Demo endpoint called');
  // Use fixed delay for demo endpoint - not a security context
  const delay = 50;

  const timeoutId = setTimeout(() => {
    res.json({
      message: 'Demo response',
      delay,
      timestamp: new Date().toISOString()
    });
  }, delay);

  req.on('close', () => {
    clearTimeout(timeoutId);
  });
});

// Error endpoint for testing error tracking
app.get('/api/error', (req, res) => {
  logger.error('Error endpoint called - simulating error');
  const errorMessage = 'This is a test error';
  const err = new Error(errorMessage);
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.status(500).json({
    error: err.message,
    stack: isDevelopment ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`404 - Path not found: ${req.path}`);
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error({
    msg: 'Unhandled error',
    error: err.message,
    stack: err.stack
  });

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
