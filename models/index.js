'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'production';
const config = require(path.join(__dirname, '..', 'config', 'database.js'))[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    pool: config.pool,
    dialectOptions: config.dialectOptions,
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true
    }
  }
);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
}

const db = {
  sequelize,
  Sequelize,
  testConnection
};

const SKIP_FILES = new Set([
  'create-super-admin.js',
  'create_super_admin.js'
]);

fs
  .readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      !SKIP_FILES.has(file)
    );
  })
  .forEach((file) => {
    const factory = require(path.join(__dirname, file));
    if (typeof factory !== 'function') {
      console.warn(`⚠️ Skipping ${file}: module does not export a model factory.`);
      return;
    }

    const model = factory(sequelize, DataTypes);
    if (!model || !model.name) {
      console.warn(`⚠️ Skipping ${file}: factory did not return a Sequelize model.`);
      return;
    }

    db[model.name] = model;
    console.log(`✅ Loaded ${model.name} model`);
  });

console.log('Setting up associations...');
Object.keys(db).forEach((modelName) => {
  const model = db[modelName];
  if (model && typeof model.associate === 'function') {
    try {
      model.associate(db);
      console.log(`✅ Associated: ${modelName}`);
    } catch (error) {
      console.error(`❌ Failed to associate ${modelName}:`, error.message);
    }
  }
});

console.log('✅ All models loaded and associated!');

module.exports = db;