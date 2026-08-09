const logger = require('./logger');

const metrics = {
  totalRequests: 0,
  totalErrors: 0,
  responseTimes: []
};

const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Track request
  metrics.totalRequests++;

  // Log request
  logger.info({
    msg: 'Incoming request',
    method: req.method,
    path: req.path,
    ip: req.ip
  });

  // Capture response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    metrics.responseTimes.push(duration);

    // Log response
    logger.info({
      msg: 'Request completed',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`
    });

    // Call original json
    return originalJson.call(this, data);
  };

  // Track errors
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode >= 400) {
      metrics.totalErrors++;
    }
    return originalSend.call(this, data);
  };

  next();
};

const getMetrics = () => {
  const avgResponseTime = metrics.responseTimes.length > 0
    ? Math.round(metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length)
    : 0;

  return {
    totalRequests: metrics.totalRequests,
    totalErrors: metrics.totalErrors,
    errorRate: metrics.totalRequests > 0 ? ((metrics.totalErrors / metrics.totalRequests) * 100).toFixed(2) : 0,
    avgResponseTime: `${avgResponseTime}ms`,
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  metricsMiddleware,
  getMetrics,
  metrics
};
