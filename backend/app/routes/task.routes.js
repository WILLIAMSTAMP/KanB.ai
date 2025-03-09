/**
 * Task Routes
 * Defines API endpoints for task-related operations
 */
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { authJwt } = require('../middleware');
const upload = require('../services/upload.service');

/**
 * @route POST /api/tasks
 * @description Create a new task with file upload support
 * @access Private
 */
router.post('/', 
  [authJwt.verifyToken], 
  upload.array('files', 5), // Allow up to 5 files
  taskController.create
);

/**
 * @route GET /api/tasks
 * @description Get all tasks
 * @access Private
 */
router.get('/', taskController.findAll);

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
router.get('/:id', taskController.findOne);

/**
 * @route PUT /api/tasks/:id
 * @description Update a task with file upload support
 * @access Private
 */
router.put('/:id', 
  [authJwt.verifyToken], 
  upload.array('files', 5), // Allow up to 5 files
  taskController.update
);

/**
 * @route PATCH /api/tasks/:id/status
 * @description Update just the status of a task (for drag & drop)
 * @access Private
 */
router.patch('/:id/status', 
  [authJwt.verifyToken], 
  taskController.updateStatus
);

/**
 * @route DELETE /api/tasks/:id
 * @description Delete a task
 * @access Private
 */
router.delete('/:id', 
  [authJwt.verifyToken], 
  taskController.delete
);

/**
 * @route DELETE /api/tasks/:id/files/:filename
 * @description Delete a file attachment
 * @access Private
 */
router.delete('/:id/files/:filename', 
  [authJwt.verifyToken], 
  taskController.deleteFileAttachment
);

/**
 * @route GET /api/tasks/:id/history
 * @description Get task history
 * @access Private
 */
router.get('/:id/history', 
  [authJwt.verifyToken], 
  taskController.getTaskHistory
);

/**
 * @route GET /api/tasks/:id/ai-suggestions
 * @description Get AI suggestions for a task
 * @access Private
 */
router.get('/:id/ai-suggestions', 
  [authJwt.verifyToken], 
  taskController.getAiSuggestions
);

/**
 * @route POST /api/tasks/:id/ai-query
 * @description Ask AI about a task
 * @access Private
 */
// Commenting out this route as the askAi method doesn't exist in the task controller
// router.post('/:id/ai-query', 
//   [authJwt.verifyToken], 
//   taskController.askAi
// );

module.exports = router;