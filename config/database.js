const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  development: {
    username: process.env.DB_USER || 'kusher_shurukn',
    password: process.env.DB_PASSWORD || 'Christina4032',
    database: process.env.DB_NAME_DEV || 'kusher_dev',
    host: process.env.DB_HOST || 'localhost',
    dialect: process.env.DB_DIALECT || 'mariadb',
    port: process.env.DB_PORT || 3306,
    logging: console.log,
    dialectOptions: {
      charset: 'utf8mb4'
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    username: process.env.DB_USER || 'kusher_shurukn',
    password: process.env.DB_PASSWORD || 'Christina4032',
    database: process.env.DB_NAME_TEST || 'kusher_test',
    host: process.env.DB_HOST || 'localhost',
    dialect: process.env.DB_DIALECT || 'mariadb',
    port: process.env.DB_PORT || 3306,
    logging: false,
    dialectOptions: {
      charset: 'utf8mb4'
    }
  },
  production: {
    username: process.env.DB_USER || 'kusher_shurukn',
    password: process.env.DB_PASSWORD || 'Christina4032',
    database: process.env.DB_NAME || 'kusher_prod',
    host: process.env.DB_HOST || 'localhost',
    dialect: process.env.DB_DIALECT || 'mariadb',
    port: process.env.DB_PORT || 3306,
    logging: false,
    dialectOptions: {
      charset: 'utf8mb4'
    },
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  }
};