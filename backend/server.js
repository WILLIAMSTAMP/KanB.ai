/**
 * Main server file for AI-Enabled Kanban Board
 * This file sets up the Express server, connects to the database,
 * configures middleware, and starts the server.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');

// Import database
const db = require('./app/models');

// Import routes
const routes = require('./app/routes');

const aiRoutes = require('./app/routes/ai.routes');
// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Set up Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io available to route handlers
app.set('io', io);

// Set port
const PORT = process.env.PORT || 5000; // Ensure it reads from environment variable

// Configure middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // Request logging

// API routes
app.use('/api', routes);
app.use('/api/ai', aiRoutes);
// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Handle client disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
  
  // Handle client joining a task (for collaborative editing)
  socket.on('join:task', (taskId) => {
    socket.join(`task:${taskId}`);
    console.log(`User ${socket.id} joined task ${taskId}`);
  });
  
  // Handle client leaving a task
  socket.on('leave:task', (taskId) => {
    socket.leave(`task:${taskId}`);
    console.log(`User ${socket.id} left task ${taskId}`);
  });
});

// Sync database and start server
const syncOptions = {
  force: process.env.DB_SYNC_FORCE === 'true'
};

// Initialize AI service
const aiService = require('./app/services/ai.service');

// Database connection and server startup
db.sequelize.sync(syncOptions)
  .then(async () => {
    console.log('Database synced successfully');
    
    // Initialize AI model if enabled
    if (process.env.ENABLE_AI === 'true') {
      try {
        console.log('Initializing AI model...');
        const initialized = await aiService.initializeModel();
        console.log(initialized 
          ? 'AI model initialized successfully' 
          : 'AI model initialization failed, falling back to mock data');
      } catch (error) {
        console.error('Error initializing AI model:', error);
        console.log('Falling back to mock data');
      }
    } else {
      console.log('AI features disabled, using mock data');
    }
    
    // Start server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API URL: http://localhost:${PORT}/api`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch(err => {
    console.error('Failed to sync database:', err);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
