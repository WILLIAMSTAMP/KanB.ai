/**
 * AI Controller
 * Handles AI-related API endpoints
 */
const aiService = require('../services/ai.service');
const db = require('../models');
const User = db.User;             // Make sure this is correct path to your models


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
    const improvements = await aiService.getWorkflowImprovements();
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
    console.log('Headers:', JSON.stringify(req.headers));
    
    const { query, taskId } = req.body;
    
    if (!query) {
      console.log('Error: Query is required');
      return res.status(400).json({ message: 'Query is required' });
    }
    
    console.log(`Processing AI query: "${query}"${taskId ? ` for task ${taskId}` : ''}`);
    
    // This would normally call an AI model like DeepSeek-R1
    // For simulation, we'll generate some responses based on the query
    
    // let response = '';
    // const queryLower = query.toLowerCase();
    
    // if (queryLower.includes('priority')) {
    //   response = 'Based on the task description and current project timeline, I recommend setting this as a high priority task. It appears to be on the critical path for several dependent tasks.';
    // } else if (queryLower.includes('assign') || queryLower.includes('who')) {
    //   response = 'Looking at the team workload and skills, Sarah Johnson would be the best fit for this task given her experience with similar tasks and current availability.';
    // } else if (queryLower.includes('deadline') || queryLower.includes('how long') || queryLower.includes('time')) {
    //   response = 'Based on historical data from similar tasks, this should take approximately 3-5 days to complete. I recommend setting a deadline for next Friday to allow sufficient time for testing and review.';
    // } else if (queryLower.includes('break down') || queryLower.includes('subtask')) {
    //   response = 'Yes, this task would benefit from being broken down. I suggest dividing it into: 1) Initial research (1 day), 2) Design phase (2 days), 3) Implementation (2-3 days), and 4) Testing & documentation (1-2 days).';
    // } else {
    //   response = 'I\'ve analyzed this task in the context of your project. It appears to be of medium complexity and should be assigned to a team member with UI/UX experience. The task is related to other design tasks in the pipeline, so coordination will be important for maintaining design consistency.';
    // }
    
    // Add a simulated delay before responding
    setTimeout(() => {
      console.log(`Sending AI response: "${response.substring(0, 100)}${response.length > 100 ? '...' : ''}"`);
      res.json({ response });
      console.log('=== AI QUERY RESPONSE SENT ===');
    }, 1000);
    
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
    console.log('=== AI TASK SUGGESTIONS (with real users) ===');
    
    // Destructure the fields we need from request body:
    const {
      title,
      description,
      currentPriority,
      currentCategory,
      currentDeadline,
      currentAssigneeName
    } = req.body;

    // 1) Validate input
    if (!title && !description) {
      return res.status(400).json({ message: 'Title or description is required' });
    }

    // 2) Fetch real users from DB
    const allUsers = await User.findAll({ attributes: ['id', 'name', 'role', 'skills'] });
    // Convert them to plain objects if needed:
    const userList = allUsers.map(u => u.get({ plain: true }));

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
      userList
    );

    // 4) If the AI suggests an assignee name that’s not in our userList, fallback
    const foundUser = userList.find(u => u.name === suggestions.suggested_assignee);
    if (!foundUser) {
      suggestions.reasoning += `\n(Note: The AI suggested "${suggestions.suggested_assignee}", which doesn't match any real user. Keeping existing assignee.)`;
      suggestions.suggested_assignee = currentAssigneeName || null;
    }

    // 5) Return final suggestions
    return res.json(suggestions);

  } catch (error) {
    console.error('Error generating AI suggestions for task:', error);
    return res.status(500).json({
      message: 'Error generating AI suggestions for task',
      error: error.message
    });
  }
};