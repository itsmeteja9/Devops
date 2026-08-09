// Initialize Datadog APM tracer (must be first)
if (process.env.DD_TRACE_ENABLED === 'true') {
  const serviceName = process.env.DD_SERVICE || 'devops-app';
  const tracer = require('dd-trace').init({
    service: serviceName,
    env: process.env.DD_ENV || process.env.NODE_ENV || 'development',
    version: process.env.DD_VERSION || '1.0.0',
    tags: {
      'service.version': process.env.DD_VERSION || '1.0.0',
    },
  });
  tracer.use('express', {
    service: serviceName,
  });
}

const app = require('./app');
const logger = require('./src/logger');

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Graceful shutdown
const handleShutdown = (signal) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
