/**
 * API Routes Index
 * Combines all route modules into a single router
 */
const express = require('express');
const router = express.Router();

// Import route modules
const taskRoutes = require('./task.routes');
const aiRoutes = require('./ai.routes');
const userRoutes = require('./user.routes');
const authRoutes = require('./auth.routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API server is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Mount routes
router.use('/tasks', taskRoutes);
router.use('/ai', aiRoutes);
router.use('/users', userRoutes);
router.use('/auth', authRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `API endpoint not found: ${req.originalUrl}`
  });
});

module.exports = router;