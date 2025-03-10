const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');

// Get LLM URL
router.get('/llm-url', settingsController.getLlmUrl);

// Update LLM URL
router.post('/llm-url', settingsController.updateLlmUrl);

module.exports = router; 