/**
 * AI Controller
 * Handles AI-related API endpoints
 */
const aiService = require('../services/ai.service');
const db = require('../models');
const User = db.User;             // Make sure this is correct path to your models
const Task = db.Task;             // Make sure this is correct path to your models


// Get AI-recommended task priorities
exports.getTaskPriorities = async (req, res) => {
  try {
    const priorities = await aiService.getTaskPriorities();
    res.json(priorities);
  } catch (error) {
    console.error('Error getting task priorities:', error);
    res.status(500).json({ 
      message: 'Error getting AI task priorities',
      error: error.message
    });
  }
};

// Get workflow improvement suggestions
exports.getWorkflowImprovements = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'role']
        }
      ]
    });

    if (!tasks || tasks.length === 0) {
      console.log('No tasks found for workflow improvements');
      return res.json([]);
    }

    const improvements = await aiService.getWorkflowImprovements(tasks);
    res.json(improvements);
  } catch (error) {
    console.error('Error getting workflow improvements:', error);
    res.status(500).json({ 
      message: 'Error getting workflow improvement suggestions',
      error: error.message
    });
  }
};

// Get bottleneck analysis
exports.getBottlenecks = async (req, res) => {
  try {
    const bottlenecks = await aiService.getBottlenecks();
    res.json(bottlenecks);
  } catch (error) {
    console.error('Error getting bottlenecks:', error);
    res.status(500).json({ 
      message: 'Error analyzing workflow bottlenecks',
      error: error.message
    });
  }
};

// Get AI predictions
exports.getPredictions = async (req, res) => {
  try {
    const predictions = await aiService.getPredictions();
    res.json(predictions);
  } catch (error) {
    console.error('Error getting predictions:', error);
    res.status(500).json({ 
      message: 'Error generating project predictions',
      error: error.message
    });
  }
};

// Process AI query
exports.processQuery = async (req, res) => {
  try {
    console.log('=== AI QUERY REQUEST RECEIVED ===');
    console.log('Request body:', JSON.stringify(req.body));
    
    const { query, taskId } = req.body;
    
    if (!query) {
      console.log('Error: Query is required');
      return res.status(400).json({ message: 'Query is required' });
    }
    
    console.log(`Processing AI query: "${query}"${taskId ? ` for task ${taskId}` : ''}`);
    
    // Call the AI service to process the query
    const result = await aiService.getLmStudioCustomQuery(query, taskId);
    
    // Log the result for debugging
    console.log('AI response result:', typeof result, JSON.stringify(result).substring(0, 200));
    
    // If result is already an object with a response property, send it directly
    if (result && typeof result === 'object') {
      console.log(`Sending AI response (${typeof result})`);
      res.json(result);
    } else {
      // Fallback for unexpected response format
      console.log('Unexpected response format, wrapping in response object');
      res.json({ 
        response: typeof result === 'string' ? result : JSON.stringify(result) 
      });
    }
    
    console.log('=== AI QUERY RESPONSE SENT ===');
    
  } catch (error) {
    console.error('Error processing AI query:', error);
    res.status(500).json({ 
      message: 'Error processing your query',
      error: error.message
    });
  }
};

// Get AI suggestions for a new task
exports.getTaskSuggestions = async (req, res) => {
  try {
    console.log('=== AI TASK SUGGESTIONS REQUEST RECEIVED ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Destructure the fields we need from request body:
    const {
      title,
      description,
      currentPriority,
      currentCategory,
      currentDeadline,
      currentAssigneeName,
      userList
    } = req.body;

    // 1) Validate input
    if (!title && !description) {
      console.log('Error: Title or description is required');
      return res.status(400).json({ message: 'Title or description is required' });
    }

    // 2) Use provided userList or fetch real users from DB
    let users = userList;
    if (!users || !Array.isArray(users) || users.length === 0) {
      console.log('No userList provided, fetching from database');
      const allUsers = await User.findAll({ attributes: ['id', 'name', 'role', 'skills'] });
      // Convert them to plain objects if needed:
      users = allUsers.map(u => u.get({ plain: true }));
    }
    
    console.log(`=== LLM: Updating suggestions for: "${title}" with real users ===`);

    // 3) Call the LLM function in the service
    const suggestions = await aiService.getLmStudioTaskUpdateSuggestionsWithUsers(
      {
        title,
        description,
        currentPriority: currentPriority || 'medium',
        currentCategory: currentCategory || '',
        currentDeadline: currentDeadline || '',
        currentAssigneeName: currentAssigneeName || ''
      },
      users
    );

    console.log('AI suggestions generated:', JSON.stringify(suggestions, null, 2));

    // 4) If the AI suggests an assignee name that's not in our userList, fallback
    if (suggestions.suggested_assignee) {
      const foundUser = users.find(u => u.name === suggestions.suggested_assignee);
      if (!foundUser) {
        console.log(`Warning: AI suggested "${suggestions.suggested_assignee}", which doesn't match any real user`);
        suggestions.reasoning += `\n(Note: The AI suggested "${suggestions.suggested_assignee}", which doesn't match any real user. Keeping existing assignee.)`;
        suggestions.suggested_assignee = currentAssigneeName || null;
      }
    }

    // 5) Return the suggestions
    return res.status(200).json(suggestions);
  } catch (error) {
    console.error('Error generating AI task suggestions:', error);
    
    // Return a fallback response with the current values
    const fallback = {
      priority: req.body.currentPriority || 'medium',
      category: req.body.currentCategory || '',
      deadline: req.body.currentDeadline || null,
      suggested_assignee: req.body.currentAssigneeName || null,
      reasoning: "Could not generate AI suggestions due to an error. Using current values as fallback."
    };
    
    return res.status(200).json(fallback);
  }
};

// Process AI chat with task data
exports.processChat = async (req, res) => {
  try {
    console.log('=== AI CHAT REQUEST RECEIVED ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2).substring(0, 500) + '...');
    
    const { query, taskData } = req.body;
    
    if (!query) {
      console.log('Error: Query is required');
      return res.status(400).json({ message: 'Query is required' });
    }
    
    if (!taskData) {
      console.log('Error: Task data is required');
      return res.status(400).json({ message: 'Task data is required' });
    }
    
    // Check if this is an assignment recommendation query
    const isAssignmentQuery = /assign|who should|best person|recommend user|who can/i.test(query);
    
    console.log(`Processing AI chat query: "${query}" with task data${isAssignmentQuery ? ' (Assignment recommendation requested)' : ''}`);
    
    // Call the AI service to process the chat query with task data
    const result = await aiService.processTaskChat(query, taskData, isAssignmentQuery);
    
    // Log the result for debugging
    console.log('AI chat response:', typeof result, JSON.stringify(result).substring(0, 200) + '...');
    
    res.json({ 
      response: result 
    });
    
    console.log('=== AI CHAT RESPONSE SENT ===');
    
  } catch (error) {
    console.error('Error processing AI chat:', error);
    res.status(500).json({ 
      response: 'I encountered an error while analyzing your tasks. Please try again or ask a different question.'
    });
  }
};