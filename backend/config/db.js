const { Sequelize } = require('sequelize');

// Database configuration from environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME || 'gradeportal',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',

  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: process.env.NODE_ENV === 'production' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      connectTimeout: 60000 // 60 seconds
    } : {
      connectTimeout: 10000
    }
  }
);

// Test the connection
const connectDB = async () => {
  try {
    console.log(`Attempting to connect to DB at: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    await sequelize.authenticate();
    console.log('MySQL database connected successfully');

    // Try to sync tables, but don't fail if there are constraint issues
    try {
      await sequelize.sync({ force: false });
      console.log('Database tables synchronized');
    } catch (syncError) {
      console.warn('Table sync warning (tables may already exist):', syncError.message);
      // Continue anyway - tables might already exist
    }
  } catch (error) {
    console.error('CRITICAL DATABASE ERROR:', error.message);
    console.error('The server will continue to run but database features will fail.');
  }
};

module.exports = { sequelize, connectDB };

module.exports = { sequelize, connectDB };