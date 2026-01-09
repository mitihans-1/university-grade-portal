const { Sequelize } = require('sequelize');

// Database configuration from environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME || 'gradeportal',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    port: 3306,
    logging: false, // Set to false in production
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test the connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL database connected successfully');
    
    // Simple sync without altering to avoid constraint issues
    await sequelize.sync({ force: false });
    console.log('Database tables synchronized');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };

module.exports = { sequelize, connectDB };