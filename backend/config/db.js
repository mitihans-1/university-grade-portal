const { Sequelize } = require('sequelize');

// Database configuration from environment variables
// Database configuration
let sequelize;

if (process.env.DATABASE_URL) {
  // Production: Use connection string (Aiven, Railway, Render, etc.)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Required for some managed databases
      }
    }
  });
} else {
  // Development: Use separate variables
  sequelize = new Sequelize(
    process.env.DB_NAME || 'gradeportal',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'mysql',
      port: 3306,
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

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