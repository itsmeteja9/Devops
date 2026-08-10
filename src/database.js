const { Pool } = require('pg');
const logger = require('./logger');
const secrets = require('./secrets');

const dbConfig = secrets.getDatabaseConfig();

const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password,
  ssl: dbConfig.ssl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error({ msg: 'Unexpected error on idle client', error: err.message });
});

/**
 * Initialize database tables on startup
 */
const initDatabase = async () => {
  const client = await pool.connect();
  try {
    logger.info({ msg: 'Initializing database...' });

    // Create metrics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS metrics (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        endpoint VARCHAR(255),
        method VARCHAR(10),
        status_code INTEGER,
        response_time_ms INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create deployments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS deployments (
        id SERIAL PRIMARY KEY,
        version VARCHAR(255),
        deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        environment VARCHAR(50),
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_metrics_timestamp
      ON metrics(timestamp DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_deployments_version
      ON deployments(version);
    `);

    logger.info({ msg: 'Database initialized successfully' });
  } catch (err) {
    logger.error({ msg: 'Database initialization failed', error: err.message });
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Record a metric
 */
const recordMetric = async (endpoint, method, statusCode, responseTime) => {
  try {
    await pool.query(
      `INSERT INTO metrics (endpoint, method, status_code, response_time_ms)
       VALUES ($1, $2, $3, $4)`,
      [endpoint, method, statusCode, responseTime]
    );
  } catch (err) {
    logger.error({ msg: 'Failed to record metric', error: err.message });
  }
};

/**
 * Record a deployment
 */
const recordDeployment = async (version, environment, status) => {
  try {
    await pool.query(
      `INSERT INTO deployments (version, environment, status)
       VALUES ($1, $2, $3)`,
      [version, environment, status]
    );
    logger.info({ msg: 'Deployment recorded', version, environment, status });
  } catch (err) {
    logger.error({ msg: 'Failed to record deployment', error: err.message });
  }
};

/**
 * Get metrics from database
 */
const getMetrics = async (limit = 100) => {
  try {
    const result = await pool.query(
      `SELECT * FROM metrics ORDER BY timestamp DESC LIMIT $1`,
      [limit]
    );
    return result.rows;
  } catch (err) {
    logger.error({ msg: 'Failed to get metrics', error: err.message });
    return [];
  }
};

/**
 * Get recent deployments
 */
const getDeployments = async (limit = 10) => {
  try {
    const result = await pool.query(
      `SELECT * FROM deployments ORDER BY deployed_at DESC LIMIT $1`,
      [limit]
    );
    return result.rows;
  } catch (err) {
    logger.error({ msg: 'Failed to get deployments', error: err.message });
    return [];
  }
};

/**
 * Check database health
 */
const checkHealth = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    return { status: 'connected', timestamp: result.rows[0].now };
  } catch (err) {
    return { status: 'disconnected', error: err.message };
  }
};

module.exports = {
  pool,
  initDatabase,
  recordMetric,
  recordDeployment,
  getMetrics,
  getDeployments,
  checkHealth
};
