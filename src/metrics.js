const logger = require('./logger');

const MAX_RESPONSE_TIMES = 1000;

const metrics = {
  totalRequests: 0,
  totalErrors: 0,
  responseTimes: []
};

const recordResponseTime = (duration) => {
  metrics.responseTimes.push(duration);
  // Keep only last 1000 response times to prevent memory leak
  if (metrics.responseTimes.length > MAX_RESPONSE_TIMES) {
    metrics.responseTimes.shift();
  }
};

const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  metrics.totalRequests += 1;

  // Capture response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    recordResponseTime(duration);

    // Log only errors or slow requests
    if (res.statusCode >= 400 || duration > 1000) {
      logger.warn({
        msg: 'Request issue',
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`
      });
    }

    if (res.statusCode >= 400) {
      metrics.totalErrors += 1;
    }

    return originalJson.call(this, data);
  };

  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode >= 400) {
      metrics.totalErrors += 1;
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
