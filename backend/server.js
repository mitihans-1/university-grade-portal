const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./config/db');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:5173", "http://127.0.0.1:5173"],
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
const authLimiter = (req, res, next) => {
  next();
};

// Other middleware
app.use(cors());
app.use(express.json());

// Connect to MySQL database
const seedAdmin = require('./utils/seedAdmin');

// Connect to DB and seed admin
connectDB().then(() => {
  seedAdmin();
});



// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/parents', require('./routes/parents'));
app.use('/api/teachers', require('./routes/teachers'));
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
app.use('/uploads/announcements', express.static('uploads/announcements'));
app.use('/uploads/fees', express.static('uploads/fees'));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'University Grade Portal API' });
});

// Check email configuration
if (process.env.GMAIL_USER && process.env.APP_PASSWORD) {
  console.log('Email service configured with: ' + process.env.GMAIL_USER);
} else {
  console.log('WARNING: Email credentials missing in .env');
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with Socket.io`);
});