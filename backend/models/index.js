const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Import all models
const models = {};

// Dynamically import all model files
const modelFiles = fs.readdirSync(__dirname).filter(file => {
  return (file.indexOf('.') !== 0) && (file !== path.basename(__filename)) && (file.slice(-3) === '.js');
});

modelFiles.forEach(file => {
  const model = require(path.join(__dirname, file));
  const modelName = file.split('.')[0];
  models[modelName] = model;
});

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Export sequelize instance along with models
models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;