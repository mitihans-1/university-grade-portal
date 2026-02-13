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

// Health check route (before DB connection)
app.get('/health', (req, res) => res.status(200).json({ status: 'up', timestamp: new Date() }));

// Other middleware
// CORS Configuration - More permissive for mobile testing and explicit for Vercel
const allowedOrigins = [
  'https://university-grade-portal.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175'
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes
app.use(express.json());

// Debug middleware to log raw body if parsing fails
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Bad JSON structure:', err.body);
    return res.status(400).send({ msg: 'Invalid JSON' });
  }
  next();
});

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
// app.use(xss());

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
app.use('/api/qr', require('./routes/qrAttendance'));
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

    console.log('Manual Setup: HARD RESET for ALL participating tables...');
    // Drop all tables to ensure clean slate and correct casing
    const tablesToDrop = [
      'attendance',
      'teacher_assignments',
      'parent_student_links',
      'grades',
      'schedules',
      'system_settings',
      'admin_preferences',
      'notifications',
      'alerts',
      'exams',
      'questions',
      'exam_attempts',
      'exam_results',
      'messages',
      'student_ids',
      'teacher_ids'
    ];

    for (const table of tablesToDrop) {
      await sequelize.query(`DROP TABLE IF EXISTS ${table}`).catch(e => console.log(`Table ${table} might not exist yet`));
    }

    console.log('Manual Setup: Syncing core tables in order...');
    const coreOrder = ['Admin', 'UniversityID', 'TeacherID', 'Student', 'Teacher', 'Parent'];
    for (const modelName of coreOrder) {
      if (models[modelName]) {
        console.log(`Syncing ${modelName}...`);
        await models[modelName].sync({ force: true });
      }
    }

    console.log('Manual Setup: Syncing ALL remaining models...');
    await sequelize.sync({ force: true });

    console.log('Manual Setup: Re-enabling foreign key checks...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // Seed system settings
    if (models.SystemSetting) {
      await models.SystemSetting.bulkCreate([
        { key: 'current_year', value: '2024', description: 'Current academic year' },
        { key: 'current_semester', value: '1', description: 'Current semester' },
        { key: 'university_name', value: 'Modern University', description: 'University name' }
      ]);
    }

    // Seed default admin
    const seedAdmin = require('./utils/seedAdmin');
    await seedAdmin();

    // Diagnostics
    const [tableList] = await sequelize.query("SHOW TABLES");

    res.send(`
      <div style="font-family: sans-serif; padding: 40px; line-height: 1.6;">
        <h1 style="color: #2e7d32;">✅ Database Fully Rebuilt!</h1>
        <p>I have performed a <strong>FORCE RESET</strong> on all tables. This resolved case-sensitivity issues and ensured all columns are correctly typed.</p>
        <p><strong>Tables currently in database:</strong></p>
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${JSON.stringify(tableList, null, 2)}</pre>
        <p>You can now log in with the default admin credentials or your newly created account.</p>
        <p><a href="/" style="display: inline-block; padding: 10px 20px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px;">Return Home</a></p>
      </div>
    `);
  } catch (error) {
    console.error('Manual Setup Error:', error);
    try {
      const { sequelize } = require('./config/db');
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (e) { }
    res.status(500).send(`<h1 style="color: #c62828;">❌ Manual Setup Failed</h1><p>Error: ${error.message}</p>`);
  }
});

// DEBUG ROUTE: List all admins (Temporary)
app.get('/api/admin/list-debug', async (req, res) => {
  try {
    const models = require('./models');
    if (!models.Admin) return res.status(404).send('Admin model not found');
    const admins = await models.Admin.findAll({ attributes: ['id', 'name', 'email', 'role'] });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
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