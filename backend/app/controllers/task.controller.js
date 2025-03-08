/**
 * Task Controller
 * Handles task-related CRUD operations and business logic
 */
const db = require('../models');
const Task = db.Task;
const User = db.User;
const TaskHistory = db.TaskHistory;
const Op = db.Sequelize.Op;

/**
 * Create a new task
 * @param {Object} req - Request object with task data
 * @param {Object} res - Response object
 */
exports.create = async (req, res) => {
  try {
    // Validate request
    if (!req.body.title) {
      return res.status(400).json({
        message: 'Task title is required'
      });
    }

    // Create task object
    const taskData = {
      title: req.body.title,
      description: req.body.description || null,
      status: req.body.status || 'todo',
      priority: req.body.priority || 'medium',
      category: req.body.category || null,
      deadline: req.body.deadline || null,
      assignee_id: req.body.assignee_id || null,
      // In a real app, this would come from authenticated user
      created_by: req.user?.id || 1,
      estimated_hours: req.body.estimated_hours || null,
      tags: req.body.tags || [],
      ai_suggestions: req.body.ai_suggestions || null,
      ai_recommendation: req.body.ai_recommendation || null
    };

    // Save Task in the database
    const task = await Task.create(taskData);
    
    // Record task creation in history
    await TaskHistory.create({
      task_id: task.id,
      field: 'status',
      old_value: null,
      new_value: task.status,
      changed_by: req.user?.id || 1,
      change_type: 'create'
    });

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('task:created', task);
    }

    // Return the created task
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      message: 'Failed to create task',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Find all tasks, with optional filtering
 * @param {Object} req - Request object with query parameters
 * @param {Object} res - Response object
 */
exports.findAll = async (req, res) => {
  try {
    // Build query conditions from request query parameters
    const conditions = {};
    
    // Return all tasks
    const tasks = await Task.findAll({
      where: conditions,
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'role', 'avatar_url']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        }
      ],
      order: [
        ['updated_at', 'DESC']
      ]
    });

    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error finding tasks:', error);
    res.status(500).json({
      message: 'Failed to retrieve tasks',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Find tasks with complex filtering
 * @param {Object} req - Request with filter parameters
 * @param {Object} res - Response object
 */
exports.getFiltered = async (req, res) => {
  try {
    const {
      status,
      priority,
      category,
      assignee_id,
      search,
      deadline_before,
      deadline_after,
      tags
    } = req.query;

    // Build where clause based on filters
    const whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (category) {
      whereClause.category = category;
    }

    if (assignee_id) {
      whereClause.assignee_id = assignee_id;
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (deadline_before) {
      whereClause.deadline = {
        ...whereClause.deadline,
        [Op.lte]: new Date(deadline_before)
      };
    }

    if (deadline_after) {
      whereClause.deadline = {
        ...whereClause.deadline,
        [Op.gte]: new Date(deadline_after)
      };
    }

    if (tags && tags.length) {
      whereClause.tags = {
        [Op.overlap]: Array.isArray(tags) ? tags : [tags]
      };
    }

    // Get filtered tasks
    const tasks = await Task.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'role', 'avatar_url']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        }
      ],
      order: [
        ['updated_at', 'DESC']
      ]
    });

    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error finding filtered tasks:', error);
    res.status(500).json({
      message: 'Failed to retrieve filtered tasks',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Find a single task by ID
 * @param {Object} req - Request with task ID
 * @param {Object} res - Response object
 */
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;

    // Find task by ID
    const task = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'role', 'avatar_url']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        message: `Task with id=${id} not found`
      });
    }

    res.status(200).json(task);
  } catch (error) {
    console.error(`Error retrieving task with id=${req.params.id}:`, error);
    res.status(500).json({
      message: `Error retrieving task with id=${req.params.id}`,
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Update a task
 * @param {Object} req - Request with task ID and updated data
 * @param {Object} res - Response object
 */
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    // Find the task to update
    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({
        message: `Task with id=${id} not found`
      });
    }

    // Record changes for task history
    const changedFields = [];
    for (const [key, value] of Object.entries(req.body)) {
      if (task[key] !== value && key !== 'updated_at') {
        changedFields.push({
          field: key,
          old_value: task[key] != null ? String(task[key]) : null,
          new_value: value != null ? String(value) : null
        });
      }
    }

    // Update the task
    await task.update(req.body);

    // Save task history records
    if (changedFields.length > 0) {
      await Promise.all(changedFields.map(change => {
        return TaskHistory.create({
          task_id: id,
          field: change.field,
          old_value: change.old_value,
          new_value: change.new_value,
          changed_by: req.user?.id || 1,
          change_type: 'update'
        });
      }));
    }

    // Get updated task with associations
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'role', 'avatar_url']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        }
      ]
    });

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('task:updated', updatedTask);
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error(`Error updating task with id=${req.params.id}:`, error);
    res.status(500).json({
      message: `Error updating task with id=${req.params.id}`,
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Update just the status of a task (for drag & drop)
 * @param {Object} req - Request with task ID and new status
 * @param {Object} res - Response object
 */
exports.updateStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: 'Status is required'
      });
    }

    // Find the task
    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({
        message: `Task with id=${id} not found`
      });
    }

    const oldStatus = task.status;

    // Update the status
    await task.update({ status });

    // Record in history
    await TaskHistory.create({
      task_id: id,
      field: 'status',
      old_value: oldStatus,
      new_value: status,
      changed_by: req.user?.id || 1,
      change_type: 'update'
    });

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('task:statusUpdated', { id, status });
    }

    res.status(200).json({
      message: 'Task status updated successfully',
      id,
      status
    });
  } catch (error) {
    console.error(`Error updating task status with id=${req.params.id}:`, error);
    res.status(500).json({
      message: `Error updating task status with id=${req.params.id}`,
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Delete a task
 * @param {Object} req - Request with task ID
 * @param {Object} res - Response object
 */
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    // Find the task
    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({
        message: `Task with id=${id} not found`
      });
    }

    // Delete the task
    await task.destroy();

    // Record in history
    await TaskHistory.create({
      task_id: id,
      field: 'status',
      old_value: task.status,
      new_value: 'deleted',
      changed_by: req.user?.id || 1,
      change_type: 'delete'
    });

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('task:deleted', { id });
    }

    res.status(200).json({
      message: 'Task was deleted successfully',
      id
    });
  } catch (error) {
    console.error(`Error deleting task with id=${req.params.id}:`, error);
    res.status(500).json({
      message: `Error deleting task with id=${req.params.id}`,
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Get task history
 * @param {Object} req - Request with task ID
 * @param {Object} res - Response object
 */
exports.getTaskHistory = async (req, res) => {
  try {
    const id = req.params.id;

    // Verify task exists
    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({
        message: `Task with id=${id} not found`
      });
    }

    // Get task history
    const history = await TaskHistory.findAll({
      where: { task_id: id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json(history);
  } catch (error) {
    console.error(`Error retrieving task history for id=${req.params.id}:`, error);
    res.status(500).json({
      message: `Error retrieving task history for id=${req.params.id}`,
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Get AI suggestions for a task
 * @param {Object} req - Request with task data and optional custom query
 * @param {Object} res - Response object
 */
exports.getAiSuggestions = async (req, res) => {
  try {
    const { title, description, requestType, query, currentTask } = req.body;

    if (!title && !query) {
      return res.status(400).json({
        message: 'Task title or query is required'
      });
    }

    // Get current board state for context if needed
    let boardContext = null;
    if (requestType === 'custom_query') {
      // Get all tasks for board context
      const tasks = await Task.findAll({
        include: [
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'name', 'role']
          }
        ],
        order: [
          ['updated_at', 'DESC']
        ]
      });

      // Calculate task stats
      const statusCounts = tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {});

      // Get user workloads
      const users = await User.findAll({
        attributes: ['id', 'name', 'role']
      });

      const userWorkloads = users.map(user => {
        const userTasks = tasks.filter(t => t.assignee_id === user.id);
        return {
          id: user.id,
          name: user.name,
          role: user.role,
          taskCount: userTasks.length,
          activeTasks: userTasks.filter(t => t.status !== 'done').length
        };
      });

      boardContext = {
        totalTasks: tasks.length,
        statusCounts,
        userWorkloads,
        categories: [...new Set(tasks.filter(t => t.category).map(t => t.category))],
        deadlines: tasks.filter(t => t.deadline).map(t => ({
          id: t.id,
          title: t.title,
          deadline: t.deadline,
          assignee: t.assignee ? t.assignee.name : null
        }))
      };
    }

    // In a real implementation, this would call DeepSeek-R1 API
    // For now, we'll simulate AI responses
    let response;

    if (requestType === 'custom_query') {
      // Handle custom user query
      response = await generateAIResponseForQuery(query, currentTask, boardContext);
    } else {
      // Handle standard suggestions
      response = await generateAISuggestions(title, description);
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting AI suggestions:', error);
    res.status(500).json({
      message: 'Failed to get AI suggestions',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Generate AI suggestions for task properties
 * @param {string} title - Task title
 * @param {string} description - Task description
 * @returns {Object} - AI suggestions
 */
async function generateAISuggestions(title, description) {
  // This function would normally call DeepSeek-R1
  // For now, we'll simulate responses based on keywords in the title/description

  const combinedText = (title + ' ' + (description || '')).toLowerCase();
  
  // Simple keyword matching for demo
  let priority = 'medium';
  if (combinedText.includes('urgent') || combinedText.includes('critical') ||
      combinedText.includes('important') || combinedText.includes('asap')) {
    priority = 'high';
  } else if (combinedText.includes('when possible') || combinedText.includes('low priority') ||
             combinedText.includes('eventually')) {
    priority = 'low';
  }

  // Category detection
  let category = null;
  if (combinedText.includes('design') || combinedText.includes('ui') || combinedText.includes('ux')) {
    category = 'Design';
  } else if (combinedText.includes('develop') || combinedText.includes('code') ||
             combinedText.includes('implement') || combinedText.includes('programming')) {
    category = 'Development';
  } else if (combinedText.includes('test') || combinedText.includes('qa') ||
             combinedText.includes('quality')) {
    category = 'Testing';
  } else if (combinedText.includes('document') || combinedText.includes('docs')) {
    category = 'Documentation';
  } else if (combinedText.includes('regulatory') || combinedText.includes('compliance') ||
             combinedText.includes('legal')) {
    category = 'Regulatory';
  }

  // Deadline estimation (between 3 days to 3 weeks from now)
  const today = new Date();
  let daysToAdd = 7; // default 1 week
  
  if (priority === 'high') {
    daysToAdd = Math.floor(Math.random() * 3) + 3; // 3-5 days
  } else if (priority === 'low') {
    daysToAdd = Math.floor(Math.random() * 7) + 14; // 2-3 weeks
  } else {
    daysToAdd = Math.floor(Math.random() * 7) + 7; // 1-2 weeks
  }
  
  const deadline = new Date(today);
  deadline.setDate(deadline.getDate() + daysToAdd);

  // Recommendation based on detected properties
  let recommendation = `Based on the task description, I'd recommend treating this as a ${priority} priority task`;
  if (category) {
    recommendation += ` in the ${category} category`;
  }
  recommendation += `. The estimated completion time is approximately ${daysToAdd} days.`;

  // In a real implementation, you would get assignee suggestions based on user skills and workload

  return {
    priority,
    category,
    deadline: deadline.toISOString().split('T')[0],
    recommendation,
    confidence: 0.85
  };
}

/**
 * Generate AI response for a custom query
 * @param {string} query - User's query
 * @param {Object} currentTask - Current task data
 * @param {Object} boardContext - Current board state, including userWorkloads and statusCounts
 * @returns {Object} - AI response
 */
async function generateAIResponseForQuery(query, currentTask, boardContext) {
  // Ensure boardContext and its key properties are defined
  if (!boardContext) {
    boardContext = {};
  }
  if (!boardContext.statusCounts) {
    boardContext.statusCounts = {};
  }
  if (!boardContext.userWorkloads) {
    boardContext.userWorkloads = [];
  }
  if (!currentTask) {
    currentTask = { title: '', description: '', priority: 'medium' };
  }

  const queryLower = query.toLowerCase();

  // The response object we'll return
  const response = {
    response: null,
    priority: null,
    category: null,
    assignee_id: null,
    deadline: null
  };

  // -- 1) Handle "deadline" queries --
  if (
    queryLower.includes('deadline') ||
    queryLower.includes('when') ||
    queryLower.includes('by when') ||
    queryLower.includes('due date')
  ) {
    // Make sure we have user workload info
    if (boardContext.userWorkloads.length === 0) {
      response.response = 'No user workload data available to estimate a realistic deadline.';
      return response;
    }

    // Sort users by activeTasks (least loaded first)
    const availableUsers = [...boardContext.userWorkloads].sort(
      (a, b) => a.activeTasks - b.activeTasks
    );
    const leastLoadedUser = availableUsers[0];

    // Calculate realistic deadline based on team load
    const totalActiveTasks =
      (boardContext.statusCounts['todo'] || 0) +
      (boardContext.statusCounts['in_progress'] || 0);

    // Base deadline: 3-14 days, influenced by workload
    const workloadFactor = Math.min(1, totalActiveTasks / 20); // Normalized workload (0-1)
    const daysToAdd = Math.floor(3 + workloadFactor * 11); // 3-14 days

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + daysToAdd);

    response.response = `Based on the current team workload (${totalActiveTasks} active tasks) and complexity of this task, I recommend a deadline of ${deadline.toLocaleDateString(
      'en-US'
    )}. This allows sufficient time for completion while considering other priorities.`;

    response.deadline = deadline.toISOString().split('T')[0];
  }

  // -- 2) Handle "assignee" queries --
  else if (
    queryLower.includes('who') ||
    queryLower.includes('assign') ||
    queryLower.includes('assignee') ||
    queryLower.includes('who should')
  ) {
    // Make sure we have user workload data
    if (boardContext.userWorkloads.length === 0) {
      response.response = 'No user workload data available to suggest an assignee.';
      return response;
    }

    let relevantUsers = [...boardContext.userWorkloads];
    const taskDescription = (
      (currentTask.title || '') + ' ' + (currentTask.description || '')
    ).toLowerCase();

    // Basic role matching (design, development, testing/QA)
    if (taskDescription.includes('design') || taskDescription.includes('ui')) {
      relevantUsers = relevantUsers.filter((u) =>
        u.role.toLowerCase().includes('design')
      );
    } else if (
      taskDescription.includes('develop') ||
      taskDescription.includes('code')
    ) {
      relevantUsers = relevantUsers.filter(
        (u) =>
          u.role.toLowerCase().includes('develop') ||
          u.role.toLowerCase().includes('engineer')
      );
    } else if (
      taskDescription.includes('test') ||
      taskDescription.includes('qa')
    ) {
      relevantUsers = relevantUsers.filter((u) =>
        u.role.toLowerCase().includes('qa')
      );
    }

    // If no relevant users found, revert to the full list
    if (relevantUsers.length === 0) {
      relevantUsers = [...boardContext.userWorkloads];
    }

    // Still empty? Return a fallback
    if (relevantUsers.length === 0) {
      response.response = 'No users found to assign this task.';
      return response;
    }

    // Sort by workload (least busy first)
    relevantUsers.sort((a, b) => a.activeTasks - b.activeTasks);
    const suggestedUser = relevantUsers[0];

    response.response = `I recommend assigning this task to ${suggestedUser.name} (${suggestedUser.role}) who currently has ${
      suggestedUser.activeTasks
    } active tasks, which is ${
      suggestedUser.activeTasks === 0 ? 'optimal' : 'manageable'
    } for taking on new work. Their expertise aligns well with this task's requirements.`;

    response.assignee_id = suggestedUser.id.toString();
  }

  // -- 3) Handle "priority" queries --
  else if (
    queryLower.includes('priority') ||
    queryLower.includes('important') ||
    queryLower.includes('urgency') ||
    queryLower.includes('how important')
  ) {
    const highPriorityTasks = boardContext.statusCounts['high'] || 0;
    const totalTasks = boardContext.totalTasks || 1;
    const highPriorityRatio = highPriorityTasks / totalTasks;

    let priority;
    let explanation;

    const taskText = (
      (currentTask.title || '') + ' ' + (currentTask.description || '')
    ).toLowerCase();
    const hasUrgentTerms =
      taskText.includes('urgent') ||
      taskText.includes('critical') ||
      taskText.includes('asap') ||
      taskText.includes('immediately');

    if (hasUrgentTerms) {
      priority = 'high';
      explanation = 'The task contains terms indicating urgency.';
    } else if (highPriorityRatio > 0.3) {
      // Already many high priority tasks
      priority = 'medium';
      explanation = `There are already ${highPriorityTasks} high priority tasks (${Math.round(
        highPriorityRatio * 100
      )}% of all tasks), so consider this as medium priority to avoid priority inflation.`;
    } else {
      // Simple text classification
      if (taskText.includes('feature') || taskText.includes('enhance')) {
        priority = 'medium';
        explanation = 'This appears to be a feature enhancement.';
      } else if (
        taskText.includes('bug') ||
        taskText.includes('fix') ||
        taskText.includes('issue')
      ) {
        priority = 'high';
        explanation = 'This appears to be a bug fix which generally warrants higher priority.';
      } else {
        priority = 'medium';
        explanation = 'Based on the task description, this seems to be a standard task.';
      }
    }

    response.response = `I recommend setting this task to ${priority} priority. ${explanation} Consider the impact on project timelines and current team workload when finalizing priority.`;
    response.priority = priority;
  }

  // -- 4) Handle "category" queries --
  else if (
    queryLower.includes('category') ||
    queryLower.includes('type') ||
    queryLower.includes('what kind')
  ) {
    const taskText = (
      (currentTask.title || '') + ' ' + (currentTask.description || '')
    ).toLowerCase();
    let category;

    // Simple keyword classification
    if (
      taskText.includes('design') ||
      taskText.includes('ui') ||
      taskText.includes('interface')
    ) {
      category = 'Design';
    } else if (
      taskText.includes('code') ||
      taskText.includes('implement') ||
      taskText.includes('develop') ||
      taskText.includes('programming')
    ) {
      category = 'Development';
    } else if (
      taskText.includes('test') ||
      taskText.includes('qa') ||
      taskText.includes('verify') ||
      taskText.includes('validate')
    ) {
      category = 'Testing';
    } else if (
      taskText.includes('document') ||
      taskText.includes('doc')
    ) {
      category = 'Documentation';
    } else if (
      taskText.includes('review') ||
      taskText.includes('check')
    ) {
      category = 'Review';
    } else if (
      taskText.includes('regulatory') ||
      taskText.includes('compliance')
    ) {
      category = 'Regulatory';
    } else {
      // Fallback: pick from existing categories if available
      const existingCategories = boardContext.categories || [];
      if (existingCategories.length > 0) {
        category = existingCategories[0];
      } else {
        category = 'Development';
      }
    }

    response.response = `Based on the task description, I recommend categorizing this as "${category}". This categorization helps with filtering and organizing related tasks.`;
    response.category = category;
  }

  // -- 5) General advice about the task --
  else {
    // If we’re missing statusCounts, fallback to 0
    const todoCount = boardContext.statusCounts['todo'] || 0;
    const taskPriority = currentTask.priority || 'medium';

    response.response = `This task appears to be a ${taskPriority} priority item that should be addressed within the next sprint. Consider breaking it down into smaller subtasks if it seems complex. Based on the current board state with ${todoCount} items in the backlog, careful prioritization is important.`;
  }

  return response;
}
