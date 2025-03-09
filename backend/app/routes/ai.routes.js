/**
 * AI Routes
 * Routes for AI-related functionality
 */
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authJwt } = require('../middleware');

// Apply middleware to protect routes
router.use(authJwt.verifyToken);

// Get AI task priorities
router.get('/priorities', aiController.getTaskPriorities);

// Get workflow improvements
router.get('/workflow-improvements', aiController.getWorkflowImprovements);

// Get bottleneck analysis
router.get('/bottlenecks', aiController.getBottlenecks);

// Get predictions
router.get('/predictions', aiController.getPredictions);

// Process AI query
router.post('/query', aiController.processQuery);

// Get AI suggestions for a new task
router.post('/task-suggestions', aiController.getTaskSuggestions);

// Process AI chat with task data
router.post('/chat', aiController.processChat);

module.exports = router;