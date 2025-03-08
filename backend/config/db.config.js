/**
 * Database configuration
 * Configuration for different environments
 * Reads from the .env file for database connection details
 */
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

module.exports = {
  development: {
    database: process.env.DB_NAME || 'kanban_ai',
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    database: 'kanban_ai_test',
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    database: process.env.DB_NAME || 'kanban_ai',
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    pool: {
      max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 5,
      min: process.env.DB_POOL_MIN ? parseInt(process.env.DB_POOL_MIN, 10) : 0,
      acquire: process.env.DB_POOL_ACQUIRE ? parseInt(process.env.DB_POOL_ACQUIRE, 10) : 30000,
      idle: process.env.DB_POOL_IDLE ? parseInt(process.env.DB_POOL_IDLE, 10) : 10000
    }
  }
};