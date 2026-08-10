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
const { initDatabase, recordDeployment } = require('./src/database');

const PORT = process.env.PORT || 8080;

// Initialize database on startup
const startServer = async () => {
  try {
    // Initialize database tables
    await initDatabase();

    // Record deployment
    await recordDeployment(
      process.env.DD_VERSION || 'unknown',
      process.env.NODE_ENV || 'production',
      'started'
    );

    const server = app.listen(PORT, () => {
      logger.info({
        msg: 'Server started',
        port: PORT,
        environment: process.env.NODE_ENV || 'production',
        database: process.env.DATABASE_HOST || 'localhost'
      });
    });

    // Graceful shutdown
    const handleShutdown = (signal) => {
      logger.info({ msg: `${signal} signal received, shutting down gracefully` });
      server.close(() => {
        logger.info({ msg: 'HTTP server closed' });
        process.exit(0);
      });
      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error({ msg: 'Forced shutdown after timeout' });
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (err) {
    logger.error({ msg: 'Failed to start server', error: err.message });
    process.exit(1);
  }
};

startServer();
