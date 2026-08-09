const express = require('express');
const path = require('path');
const logger = require('./src/logger');
const { metricsMiddleware } = require('./src/metrics');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(metricsMiddleware);

// Disable powered-by header
app.disable('x-powered-by');

// Health check endpoint
app.get('/health', (req, res) => {
  logger.info('Health check called');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
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
app.get('/api/metrics', (req, res) => {
  logger.info('Metrics endpoint called');
  res.json({
    timestamp: new Date().toISOString(),
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    },
    uptime: Math.round(process.uptime())
  });
});

// Demo endpoint for testing
app.get('/api/demo', (req, res) => {
  logger.info('Demo endpoint called');
  const delay = Math.random() * 100;

  setTimeout(() => {
    res.json({
      message: 'Demo response',
      delay: Math.round(delay),
      timestamp: new Date().toISOString()
    });
  }, delay);
});

// Error endpoint for testing error tracking
app.get('/api/error', (req, res) => {
  logger.error('Error endpoint called - simulating error');
  const err = new Error('This is a test error');
  res.status(500).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
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
