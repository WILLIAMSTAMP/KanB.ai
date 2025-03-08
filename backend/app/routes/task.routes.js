/**
 * Task Routes
 * Routes for task management operations
 */
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { authJwt } = require('../middleware');

/**
 * @route POST /api/tasks
 * @description Create a new task
 * @access Private
 */
router.post('/', authJwt.verifyToken, taskController.create);

/**
 * @route GET /api/tasks
 * @description Get all tasks
 * @access Private
 */
router.get('/', authJwt.verifyToken, taskController.findAll);

/**
 * @route GET /api/tasks/filtered
 * @description Get filtered tasks
 * @access Private
 */
router.get('/filtered', authJwt.verifyToken, taskController.getFiltered);

/**
 * @route GET /api/tasks/:id
 * @description Get a single task by ID
 * @access Private
 */
router.get('/:id', authJwt.verifyToken, taskController.findOne);

/**
 * @route PUT /api/tasks/:id
 * @description Update a task
 * @access Private
 */
router.put('/:id', authJwt.verifyToken, taskController.update);

/**
 * @route PATCH /api/tasks/:id/status
 * @description Update just the status of a task (for drag & drop)
 * @access Private
 */
router.patch('/:id/status', authJwt.verifyToken, taskController.updateStatus);

/**
 * @route DELETE /api/tasks/:id
 * @description Delete a task
 * @access Private
 */
router.delete('/:id', authJwt.verifyToken, taskController.delete);

/**
 * @route GET /api/tasks/:id/history
 * @description Get task history
 * @access Private
 */
router.get('/:id/history', authJwt.verifyToken, taskController.getTaskHistory);

/**
 * @route POST /api/tasks/ai-suggestions
 * @description Get AI suggestions for a task
 * @access Private
 */
router.post('/ai-suggestions', authJwt.verifyToken, taskController.getAiSuggestions);

module.exports = router;