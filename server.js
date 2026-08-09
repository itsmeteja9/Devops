// Initialize Datadog APM tracer (must be first)
if (process.env.DD_TRACE_ENABLED === 'true') {
  const tracer = require('dd-trace').init({
    service: process.env.DD_SERVICE || 'devops-app',
    env: process.env.DD_ENV || process.env.NODE_ENV || 'development',
    version: process.env.DD_VERSION || '1.0.0',
    tags: {
      'service.version': process.env.DD_VERSION || '1.0.0',
    },
  });
  tracer.use('express', {
    service: process.env.DD_SERVICE || 'devops-app',
  });
}

const app = require('./app');

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
