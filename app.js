const express = require('express');
const path = require('path');

function createApp() {
  const app = express();

  app.disable('x-powered-by');

  // Serve static files from public folder
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'devops-demo'
    });
  });

  return app;
}

module.exports = { createApp };
