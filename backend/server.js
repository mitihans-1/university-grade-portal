const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const xss = require('xss-clean');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./config/db');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // More flexible for development
    methods: ["GET", "POST"]
  }
});

// Socket.io connection handler
const Message = require('./models/Message');

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join_user_room', (userData) => {
    const room = `user_${userData.role}_${userData.id}`;
    socket.join(room);
    console.log(`User ${userData.role} ${userData.id} joined room: ${room}`);
  });

  socket.on('send_private_message', async (data) => {
    try {
      const { senderId, senderRole, receiverId, receiverRole, content } = data;

      // Save to database
      const newMessage = await Message.create({
        senderId,
        senderRole,
        receiverId,
        receiverRole,
        content
      });

      // Emit to receiver's room
      const receiverRoom = `user_${receiverRole}_${receiverId}`;
      io.to(receiverRoom).emit('receive_private_message', newMessage);

      // Emit back to sender (for multi-device sync)
      const senderRoom = `user_${senderRole}_${senderId}`;
      io.to(senderRoom).emit('message_sent', newMessage);

    } catch (err) {
      console.error('Socket Message Error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for Vite dev server
})); // Sets security headers

// Rate limiting - only apply to non-authenticated routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { msg: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiter to all routes except auth routes
app.use(/^\/api\/(?!auth\/)/, generalLimiter);

// Rate limiter disabled for testing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { msg: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Other middleware
// CORS Configuration - More permissive for mobile testing on same Wi-Fi
const corsOptions = {
  origin: true, // Reflects the request origin, allowing any local IP to connect
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// HTTPS Enforcement in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Data Sanitization against XSS
app.use(xss());

// Prevent Parameter Pollution
app.use(hpp());

// Connect to MySQL database
const seedAdmin = require('./utils/seedAdmin');

// Connect to DB and seed admin
// Connect to DB and seed admin
connectDB().then(() => {
  seedAdmin();
});

// Swagger Documentation
const swaggerUi = require('swagger-ui-express');
const specs = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/students', require('./routes/students'));
app.use('/api/parents', require('./routes/parents'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/admins', require('./routes/admins'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/links', require('./routes/links'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/admin', require('./routes/adminPreferences'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/appeals', require('./routes/appeals'));
app.use('/api/calendar', require('./routes/calendar'));

app.use('/api/fees', require('./routes/fees'));

app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/ids', require('./routes/ids'));
app.use('/api/teacher-assignments', require('./routes/teacherAssignments'));
app.use('/uploads/announcements', express.static('uploads/announcements'));
app.use('/uploads/fees', express.static('uploads/fees'));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'University Grade Portal API' });
});

// Production Setup Route (ONLY for initial deployment repair)
app.get('/api/admin/setup-db', async (req, res) => {
  try {
    const { sequelize } = require('./config/db');
    const models = require('./models');

    console.log('Manual Setup: Disabling foreign key checks...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    console.log('Manual Setup: Syncing core tables in order...');

    // Core tables first
    const coreModels = ['Admin', 'UniversityID', 'TeacherID', 'Student', 'Teacher', 'Parent'];
    for (const modelName of coreModels) {
      if (models[modelName]) {
        console.log(`Syncing ${modelName}...`);
        await models[modelName].sync({ alter: true });
      }
    }

    console.log('Manual Setup: Syncing all remaining models...');
    await sequelize.sync({ alter: true });

    console.log('Manual Setup: Re-enabling foreign key checks...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // Seed system settings if empty
    if (models.SystemSetting) {
      const settingsCount = await models.SystemSetting.count();
      if (settingsCount === 0) {
        await models.SystemSetting.bulkCreate([
          { key: 'current_year', value: '2024', description: 'Current academic year' },
          { key: 'current_semester', value: 'Spring', description: 'Current semester' }
        ]);
      }
    }

    // Seed admin
    console.log('Manual Setup: Seeding admin...');
    const seedAdmin = require('./utils/seedAdmin');
    await seedAdmin();

    res.send('<h1>Success!</h1><p>Database fully initialized! Core tables (Admin, Student, Teacher, Parent) created first, then all other tables synchronized. The system is ready.</p><p><a href="/">Return Home</a> or go to your Vercel site to login.</p>');
  } catch (error) {
    console.error('Manual Setup Error:', error);
    try {
      const { sequelize } = require('./config/db');
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (e) { }
    res.status(500).send(`<h1>Manual Setup Failed</h1><p>Error: ${error.message}</p><p>Please check Render logs for details.</p>`);
  }
});

// Check email configuration
if (process.env.GMAIL_USER && process.env.EMAIL_PASS) {
  console.log('Email service configured with: ' + process.env.GMAIL_USER);
} else {
  console.log('WARNING: Email credentials missing in .env');
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with Socket.io (Updated with CORS for 5175)`);
});