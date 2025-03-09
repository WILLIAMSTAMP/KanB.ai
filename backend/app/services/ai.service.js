// ai.service.js
// Production version with real calls to LM Studio and no mock logic.

const axios = require('axios');
const db = require('../models');
const Task = db.Task;
const User = db.User;

// Environment variables for LM Studio
const LM_STUDIO_ENDPOINT = process.env.LM_STUDIO_ENDPOINT || 'http://localhost:1234/v1';
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || 'deepseek-r1-distill-qwen-14b';
const TEMPERATURE = parseFloat(process.env.LM_STUDIO_TEMPERATURE || '0.7');
const MAX_TOKENS = parseInt(process.env.LM_STUDIO_MAX_TOKENS || '-1');

// Create axios instance for LM Studio API
const lmStudioApi = axios.create({
  baseURL: LM_STUDIO_ENDPOINT,
  headers: { 'Content-Type': 'application/json' }
});

/**
 * Initialize the AI model by testing a simple prompt
 */
exports.initializeModel = async () => {
  try {
    console.log('=== INITIALIZING AI MODEL ===');
    console.log(`LM Studio Endpoint: ${LM_STUDIO_ENDPOINT}`);
    console.log(`Model: ${LM_STUDIO_MODEL}`);
    console.log(`Temperature: ${TEMPERATURE}`);
    console.log(`Max Tokens: ${MAX_TOKENS}`);

    console.log('Testing connection to LM Studio...');
    const response = await lmStudioApi.post('/chat/completions', {
      model: LM_STUDIO_MODEL,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Respond with the word "Connected" if you can hear me.' }
      ],
      temperature: TEMPERATURE,
      max_tokens: 50,
      stream: false
    });

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const content = response.data.choices[0].message.content;
      console.log('Test response received:', content);
      console.log('Connection to LM Studio successful');
      console.log('=== AI MODEL INITIALIZED ===');
      return true;
    } else {
      console.error('Unexpected response format from LM Studio:', response.data);
      return false;
    }
  } catch (error) {
    console.error('Error initializing AI model:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Is LM Studio running?');
    }
    return false;
  }
};

/**
 * queryLmStudio
 * 
 * This function sends a request to LM Studio and returns the response.
 * It handles cleaning up the response and removing <think> tags.
 */
async function queryLmStudio(messages, maxTokens = MAX_TOKENS) {
  try {
    console.log('Sending request to LM Studio...');
    console.log('Messages:', JSON.stringify(messages));

    const response = await axios.post(`${LM_STUDIO_ENDPOINT}/chat/completions`, {
      model: LM_STUDIO_MODEL,
      messages,
      temperature: TEMPERATURE,
      max_tokens: maxTokens,
      stream: false
    });

    // Extract the response content
    const aiResponse = response.data.choices[0].message.content;
    console.log('Response received from LM Studio');
    
    // Clean up the response by removing <think> tags and their content
    let cleanedResponse = aiResponse;
    if (aiResponse.includes('<think>')) {
      console.log('Response contains <think> tags, cleaning up...');
      cleanedResponse = aiResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    }
    
    return cleanedResponse;
  } catch (error) {
    console.error('Error querying LM Studio:', error.message);
    if (error.response) {
      console.error('LM Studio response error:', error.response.data);
    }
    throw new Error(`Failed to query LM Studio: ${error.message}`);
  }
}

/**
 * getLmStudioTaskSuggestions
 * Calls LM Studio to generate suggestions for a single task (title + description).
 * For example, might suggest a priority, category, deadline, or an assignee, etc.
 * 
 * @param {string} title - The task title
 * @param {string} description - The task description
 * @returns {Promise<Object>} - An object with fields like { priority, category, deadline, suggested_assignee, reasoning }
 */
exports.getLmStudioTaskSuggestions = async (title, description) => {
  console.log(`=== AI TASK SUGGESTIONS for: "${title}" ===`);

  // 1) Construct system + user prompts:
  const systemPrompt = `
    You are an AI assistant providing suggestions for a new task in a kanban board.
    Respond ONLY with valid JSON in this format:
    {
      "priority": "low|medium|high|critical",
      "category": "string category if relevant",
      "deadline": "YYYY-MM-DD or null",
      "suggested_assignee": "string or null",
      "reasoning": "short explanation of why these suggestions"
    }
    
    Note: "critical" priority should only be used for extremely urgent tasks that require immediate attention and have significant impact on the project. These tasks should stand out visually on the board.
  `;

  const userPrompt = `
    Title: ${title}
    Description: ${description || 'No description provided'}

    Please suggest a priority (low, medium, high, or critical), possible category, a recommended deadline, and optionally an assignee.
    Use "critical" priority only for extremely urgent and important tasks that require immediate attention.
    Return ONLY JSON:
    {
      "priority": "...",
      "category": "...",
      "deadline": "...",
      "suggested_assignee": "...",
      "reasoning": "..."
    }
  `;

  try {
    // 2) Actually call your queryLmStudio function:
    const aiResponse = await queryLmStudio([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    // 3) Attempt to parse the AI's JSON:
    let parsed;
    try {
      parsed = JSON.parse(aiResponse.trim());
    } catch (err) {
      console.error('Error parsing AI suggestions as JSON:', err);
      console.log('Raw response:', aiResponse);
      // Minimal fallback
      parsed = {
        priority: 'medium',
        category: null,
        deadline: null,
        suggested_assignee: null,
        reasoning: 'Could not parse AI response.'
      };
    }

    // Return the object in a consistent shape
    return {
      priority: parsed.priority || 'medium',
      category: parsed.category || null,
      deadline: parsed.deadline || null,
      suggested_assignee: parsed.suggested_assignee || null,
      reasoning: parsed.reasoning || 'No reasoning provided'
    };

  } catch (error) {
    console.error('Error generating task suggestions:', error);
    throw error; // Let the caller handle
  }
};

/**
 * getLmStudioCustomQuery
 * 
 * This function handles custom queries from users and returns AI responses.
 * It's used for the general AI query endpoint.
 */
exports.getLmStudioCustomQuery = async (query, taskId = null) => {
  console.log('Processing AI query:', JSON.stringify(query));

  // 1) Construct a system prompt that explains the desired response format
  const systemPrompt = `
    You are an AI assistant analyzing tasks and answering user queries about them.
    The user will ask you questions about tasks and project management.
    Provide helpful, concise answers based on your knowledge.
  `;

  // 2) Construct a user prompt with the query
  const userPrompt = `
    The user asked: "${query}"
    Task ID (if any): ${taskId || 'none'}

    Please respond with a helpful answer.
  `;

  try {
    // 3) Call LM Studio
    const aiResponse = await queryLmStudio([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    // 4) Return the cleaned response
    return { 
      response: aiResponse 
    };
  } catch (error) {
    console.error('Error in getLmStudioCustomQuery:', error);
    
    // Fallback for complete failure
    return { 
      response: "I'm sorry, I couldn't process your query at this time. Please try again later." 
    };
  }
};

// Export if other modules need it
exports.queryLmStudio = queryLmStudio;

/**
 * getTaskPriorities
 * Fetch tasks, call LM Studio to get a suggested priority and reason for each.
 */
exports.getTaskPriorities = async () => {
  console.log('=== GETTING AI TASK PRIORITIES (PRODUCTION) ===');
  try {
    const tasks = await Task.findAll({
      limit: 5,
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'role']
        }
      ]
    });

    if (!tasks || tasks.length === 0) {
      console.log('No tasks found for priority analysis');
      return [];
    }

    console.log(`Found ${tasks.length} tasks to analyze with LM Studio`);

    const priorityPromises = tasks.map(async (task) => {
      const currentPriority = task.priority || 'medium';

      // System prompt
      const systemPrompt = `
        You are an AI assistant analyzing kanban board tasks and providing priority recommendations.
        For the task I will provide, analyze if its current priority is appropriate or should be changed.
        Respond in JSON format only, with this structure:
        {
          "suggested_priority": "low|medium|high",
          "reason": "Brief explanation of why this priority is appropriate"
        }
      `;

      // User prompt with details
      const userPrompt = `
        Task: ${task.title}
        Description: ${task.description || 'No description provided'}
        Current Priority: ${currentPriority}
        Deadline: ${task.deadline || 'Not specified'}
        Assignee: ${task.assignee ? task.assignee.name : 'Unassigned'}

        Based on this information, analyze if the current priority is appropriate or needs to be changed.
        Provide your suggested priority and reasoning, in valid JSON only.
      `;

      try {
        const aiResponse = await queryLmStudio([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]);

        let parsedResponse;
        try {
          parsedResponse = JSON.parse(aiResponse.trim());
        } catch (parseError) {
          console.error('Error parsing LM Studio response as JSON:', parseError);
          console.log('Raw response:', aiResponse);
          // Minimal fallback: keep the same priority, provide an error reason
          parsedResponse = {
            suggested_priority: currentPriority,
            reason: 'Could not parse AI response.'
          };
        }

        return {
          id: task.id,
          title: task.title,
          current_priority: currentPriority,
          suggested_priority: parsedResponse.suggested_priority || currentPriority,
          reason: parsedResponse.reason || 'No reasoning provided'
        };
      } catch (taskError) {
        console.error(`Error analyzing priority for task ${task.id}:`, taskError);
        return {
          id: task.id,
          title: task.title,
          current_priority: currentPriority,
          suggested_priority: currentPriority,
          reason: 'Error calling LM Studio for this task.'
        };
      }
    });

    const priorities = await Promise.all(priorityPromises);
    console.log('All task priorities analyzed via LM Studio');
    return priorities;

  } catch (error) {
    console.error('Error in getTaskPriorities (production):', error);
    throw error;
  }
};

/**
 * getWorkflowImprovements
 * Calls LM Studio with a summary of tasks to get improvement suggestions
 */
exports.getWorkflowImprovements = async (tasks) => {
  console.log('=== GETTING WORKFLOW IMPROVEMENTS (PRODUCTION) ===');
  console.log(`Analyzing ${tasks.length} tasks for workflow improvements`);

  // Create a system prompt that explains what we want
  const systemPrompt = `
      You are an AI assistant analyzing a kanban board workflow. Based on the task data provided,
      identify workflow improvement opportunities.
      Respond in JSON format only, with exactly 4 suggestions in this structure:
      [
        {
          "title": "Short descriptive title of the improvement",
          "description": "Detailed explanation of the workflow improvement",
          "impact": "A number from 1-5"
        }
      ]
    `;

  // Simplify the task data for the prompt
  const simplifiedTasks = tasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assignee: task.assignee ? task.assignee.name : 'Unassigned',
    deadline: task.deadline ? new Date(task.deadline).toISOString() : 'Not specified',
    created_at: task.created_at
  }));

  const userPrompt = `
      Here is the current task data from the kanban board:
      ${JSON.stringify(simplifiedTasks, null, 2)}

      Based on this data, identify 4 workflow improvement suggestions that would help the team work more
      efficiently. Consider patterns in task management, bottlenecks, priority distribution, and resource allocation.
      Focus on process improvements rather than specific task content.
    `;

  try {
    const aiResponse = await queryLmStudio([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    console.log('Raw response from LM Studio:', aiResponse);

    // Clean up the response - remove <think> tags and any text before/after JSON
    let cleanedResponse = aiResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
    // Try to extract JSON array from the response
    let jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
    let jsonStr = jsonMatch ? jsonMatch[0] : cleanedResponse;
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(jsonStr);
      console.log('Successfully parsed JSON from LLM response:', parsedResponse);
      
      const improvementsWithIds = parsedResponse.map((imp, index) => ({
        id: index + 1,
        title: imp.title,
        description: imp.description,
        impact: parseInt(imp.impact, 10) || 3
      }));
      return improvementsWithIds;
    } catch (parseError) {
      console.error('Error parsing workflow improvements JSON:', parseError);
      console.log('Cleaned response was:', cleanedResponse);
      
      // Try to extract improvements manually using regex
      const improvements = [];
      
      // Look for title patterns
      const titleMatches = cleanedResponse.match(/"title":\s*"([^"]*)"/g);
      const descMatches = cleanedResponse.match(/"description":\s*"([^"]*)"/g);
      const impactMatches = cleanedResponse.match(/"impact":\s*"?(\d)"?/g);
      
      if (titleMatches && titleMatches.length > 0) {
        for (let i = 0; i < Math.min(4, titleMatches.length); i++) {
          const title = titleMatches[i].match(/"title":\s*"([^"]*)"/)[1];
          const description = descMatches && descMatches[i] ? 
            descMatches[i].match(/"description":\s*"([^"]*)"/)[1] : 
            "No description available";
          const impactMatch = impactMatches && impactMatches[i] ? 
            impactMatches[i].match(/"impact":\s*"?(\d)"?/)[1] : "3";
          
          improvements.push({
            id: i + 1,
            title,
            description,
            impact: parseInt(impactMatch, 10) || 3
          });
        }
        
        if (improvements.length > 0) {
          return improvements;
        }
      }
      
      // If we couldn't extract improvements, create fallback suggestions
      return [
        {
          id: 1,
          title: "Assign owners to all tasks",
          description: "Ensure every task has a clearly assigned owner to prevent unassigned work from stalling.",
          impact: 5
        },
        {
          id: 2,
          title: "Standardize deadlines for all tasks",
          description: "Require explicit deadlines for every task to avoid neglect and improve time management.",
          impact: 4
        },
        {
          id: 3,
          title: "Implement regular review cadence",
          description: "Create a scheduled review process to prevent tasks from getting stuck in the review status.",
          impact: 4
        },
        {
          id: 4,
          title: "Balance workload between team members",
          description: "Ensure resources aren't overburdened while ensuring all tasks receive attention.",
          impact: 3
        }
      ];
    }
  } catch (error) {
    console.error('Error getting workflow improvements:', error);
    return [];
  }
};

/**
 * getBottlenecks
 * Calls LM Studio to identify top 3 bottlenecks
 */
exports.getBottlenecks = async () => {
  console.log('=== ANALYZING WORKFLOW BOTTLENECKS (PRODUCTION) ===');
  try {
    const tasks = await Task.findAll({
      attributes: ['id', 'title', 'description', 'status', 'priority', 'deadline', 'created_at', 'updated_at'],
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'role']
        }
      ]
    });

    if (!tasks || tasks.length === 0) {
      console.log('No tasks found for bottleneck analysis');
      return [];
    }

    console.log(`Analyzing ${tasks.length} tasks for bottlenecks`);

    // Group tasks by status to build stats
    const statusGroups = {};
    tasks.forEach(task => {
      const st = task.status || 'todo';
      if (!statusGroups[st]) statusGroups[st] = [];
      statusGroups[st].push(task);
    });

    const statusStats = {};
    Object.keys(statusGroups).forEach(st => {
      const tasksInSt = statusGroups[st];
      if (!tasksInSt.length) return;
      const avgDays = tasksInSt.reduce((sum, t) => {
        const daysInStatus = Math.ceil((new Date() - new Date(t.updated_at)) / (1000 * 60 * 60 * 24));
        return sum + daysInStatus;
      }, 0) / tasksInSt.length;

      statusStats[st] = {
        count: tasksInSt.length,
        avg_days: avgDays
      };
    });

    const systemPrompt = `
      You are an AI assistant analyzing a kanban board for workflow bottlenecks.
      Based on the task data and status statistics provided, identify the top 3 bottlenecks.
      Respond in JSON format only, with this structure:
      [
        {
          "area": "Name of the bottleneck area",
          "severity": "high|medium|low",
          "description": "Detailed description",
          "affected_tasks": Number,
          "avg_delay": Number,
          "solution": "Proposed solution"
        }
      ]
    `;

    const taskAnalysisData = {
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status || 'todo',
        priority: t.priority || 'medium',
        assignee: t.assignee ? t.assignee.name : 'Unassigned',
        days_since_created: Math.ceil((new Date() - new Date(t.created_at)) / (1000 * 60 * 60 * 24)),
        days_since_updated: Math.ceil((new Date() - new Date(t.updated_at)) / (1000 * 60 * 60 * 24))
      })),
      status_statistics: statusStats
    };

    const userPrompt = `
      Here is the current task data and status statistics from the kanban board:
      ${JSON.stringify(taskAnalysisData, null, 2)}

      Analyze this data to identify the top 3 bottlenecks in the workflow.
      For each bottleneck, provide:
      - area
      - severity (high|medium|low)
      - description
      - affected_tasks (an estimate)
      - avg_delay
      - solution
    `;

    try {
      const aiResponse = await queryLmStudio([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(aiResponse.trim());
        const bottlenecks = parsedResponse.map((bn, index) => ({
          id: index + 1,
          area: bn.area,
          severity: bn.severity || 'medium',
          description: bn.description,
          affected_tasks: parseInt(bn.affected_tasks, 10) || 0,
          avg_delay: parseFloat(bn.avg_delay) || 0,
          solution: bn.solution
        }));
        return bottlenecks;
      } catch (parseError) {
        console.error('Error parsing bottleneck JSON:', parseError);
        console.log('Raw response:', aiResponse);
        return [];
      }

    } catch (error) {
      console.error('Error analyzing bottlenecks with LM Studio:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error in getBottlenecks (production):', error);
    throw error;
  }
};

/**
 * getPredictions
 * Calls LM Studio for project-level predictions
 */
exports.getPredictions = async () => {
  console.log('=== GENERATING PROJECT PREDICTIONS (PRODUCTION) ===');
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
      console.log('No tasks found for predictions');
      return null;
    }

    console.log(`Analyzing ${tasks.length} tasks for project predictions`);

    let completedTasks = 0;
    let pastDueTasks = 0;
    const statusCounts = {};
    const currentDate = new Date();
    const roleAssignments = {};

    tasks.forEach(task => {
      const st = task.status || 'todo';
      statusCounts[st] = (statusCounts[st] || 0) + 1;

      if (st.toLowerCase() === 'done') {
        completedTasks++;
      }

      if (task.deadline && new Date(task.deadline) < currentDate && st !== 'done') {
        pastDueTasks++;
      }

      if (task.assignee) {
        const role = task.assignee.role || 'Unspecified';
        if (!roleAssignments[role]) {
          roleAssignments[role] = { assigned: 0, by_status: {} };
        }
        roleAssignments[role].assigned++;
        roleAssignments[role].by_status[st] = (roleAssignments[role].by_status[st] || 0) + 1;
      }
    });

    const totalTasks = tasks.length;
    const completionPercentage = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    const projectData = {
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      completion_percentage: completionPercentage,
      past_due_tasks: pastDueTasks,
      status_distribution: statusCounts,
      role_assignments: roleAssignments,
      target_end_date: new Date(currentDate.setMonth(currentDate.getMonth() + 3))
        .toISOString()
        .split('T')[0]
    };

    const systemPrompt = `
      You are an AI assistant analyzing kanban board data to generate project predictions and insights.
      Based on the project statistics provided, generate predictions about project timeline, resource allocation,
      and identify potential risk factors.
      Respond in JSON format only, with this structure:
      {
        "completion_percentage": <integer>,
        "projected_end_date": "YYYY-MM-DD",
        "on_schedule": true|false,
        "resource_alerts": [
          {
            "title": "Brief title",
            "description": "Detailed explanation",
            "severity": "high|medium|low"
          }
        ],
        "risk_factors": [
          {
            "factor": "Name of risk",
            "level": "high|medium|low",
            "description": "Detailed explanation"
          }
        ]
      }
    `;

    const userPrompt = `
      Here are the current project statistics from the kanban board:
      ${JSON.stringify(projectData, null, 2)}

      Based on this data, generate project predictions that include:
      1. The current completion percentage
      2. A projected end date (YYYY-MM-DD)
      3. Whether the project is on schedule
      4. 2-3 resource alerts
      5. 3 risk factors
    `;

    try {
      const aiResponse = await queryLmStudio([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(aiResponse.trim());
        return {
          completion_percentage:
            parseInt(parsedResponse.completion_percentage, 10) || completionPercentage,
          projected_end_date: parsedResponse.projected_end_date || projectData.target_end_date,
          on_schedule:
            parsedResponse.on_schedule !== undefined ? parsedResponse.on_schedule : false,
          resource_alerts: Array.isArray(parsedResponse.resource_alerts)
            ? parsedResponse.resource_alerts
            : [],
          risk_factors: Array.isArray(parsedResponse.risk_factors)
            ? parsedResponse.risk_factors
            : []
        };
      } catch (parseError) {
        console.error('Error parsing predictions JSON:', parseError);
        console.log('Raw response:', aiResponse);

        // Minimal fallback
        return {
          completion_percentage: completionPercentage,
          projected_end_date: projectData.target_end_date,
          on_schedule: pastDueTasks === 0,
          resource_alerts: [],
          risk_factors: []
        };
      }
    } catch (error) {
      console.error('Error generating project predictions via LM Studio:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in getPredictions (production):', error);
    throw error;
  }
};

/**
 * getLmStudioTaskUpdateSuggestionsWithUsers
 * 
 * This calls LM Studio to propose new or updated fields for a task.
 * We also pass a real user list from the DB (or from the caller) so the LLM
 * can pick an actual user if it wants to reassign the task.
 *
 * @param {object} taskData - The current task data (title, description, priority, etc.)
 * @param {Array} userList - The array of real users, e.g. [{ id, name, role, skills }, ...]
 */
exports.getLmStudioTaskUpdateSuggestionsWithUsers = async (taskData, userList) => {
  const {
    title,
    description,
    currentPriority,
    currentCategory,
    currentDeadline,
    currentAssigneeName,
  } = taskData;

  console.log(`=== LLM: Updating suggestions for: "${title}" with real users ===`);

  // Convert userList to a simpler structure for the LLM, e.g. name, role, skills
  // (If you want to preserve the user ID for final assignment, pass it along.)
  const userSummary = userList.map(u => ({
    id: u.id,
    name: u.name,
    role: u.role,
    skills: u.skills || []
  }));

  // 1) Construct a system prompt that explains the desired response format
  const systemPrompt = `
    You are an AI assistant that suggests possible updates to a task's fields.
    The user already has:
      - priority: ${currentPriority || 'medium'}
      - category: ${currentCategory || '(none)'}
      - deadline: ${currentDeadline || '(none)'}
      - assignee: ${currentAssigneeName || '(unassigned)'}

    You have a list of possible assignees you can choose from. 
    If you want to change the assignee, pick only from this list. 
    (If you do not want to change assignee, you can keep the same name.)

    The user wants to see if they should keep or change these fields,
    given the task's title & description, and the real user list. 
    Return ONLY valid JSON, exactly:

    {
      "priority": "low|medium|high|critical",
      "category": "string category or empty string",
      "deadline": "YYYY-MM-DD or null",
      "suggested_assignee": "string or null (must match one of the user names if you want to reassign)",
      "reasoning": "short explanation"
    }
    
    Note: "critical" priority should only be used for extremely urgent tasks that require immediate attention and have significant impact on the project. These tasks will stand out visually on the board with a glowing effect.
  `;

  // 2) Construct a user prompt with the task details and user list
  const userPrompt = `
    Title: "${title}"
    Description: "${description}"

    Current fields:
    - priority: ${currentPriority || 'medium'}
    - category: ${currentCategory || '(none)'}
    - deadline: ${currentDeadline || '(none)'}
    - assignee: ${currentAssigneeName || '(unassigned)'}

    Possible users for assignment:
    ${JSON.stringify(userSummary, null, 2)}

    If you want to change the assignee, pick the name from that user list.
    For priority, you can choose from: low, medium, high, or critical.
    Use "critical" priority only for extremely urgent and important tasks that require immediate attention.
    
    Return ONLY the JSON object with "priority", "category", "deadline",
    "suggested_assignee", and "reasoning".
  `;

  try {
    // 3) Call LM Studio
    const aiResponse = await queryLmStudio([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    // 4) Try to parse the response as JSON
    try {
      // Log the raw response for debugging
      console.log('Raw response from LM Studio:', aiResponse);
      
      // Try to extract JSON from the response
      let jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      let jsonStr = jsonMatch ? jsonMatch[0] : aiResponse;
      
      // Try to parse as JSON
      const parsed = JSON.parse(jsonStr);
      console.log('Successfully parsed JSON from LLM response:', parsed);
      
      // Return the parsed response
      return {
        priority: parsed.priority || currentPriority || 'medium',
        category: parsed.category || currentCategory || '',
        deadline: parsed.deadline || currentDeadline || null,
        suggested_assignee: parsed.suggested_assignee || null,
        reasoning: parsed.reasoning || '(No reasoning provided)'
      };
    } catch (parseError) {
      console.error('Error parsing JSON from LLM:', parseError);
      console.log('Raw LLM response was:', aiResponse);
      
      // Fallback: Return a default response
      return {
        priority: currentPriority || 'medium',
        category: currentCategory || '',
        deadline: currentDeadline || null,
        suggested_assignee: null,
        reasoning: "Could not parse AI response. Using default values."
      };
    }
  } catch (error) {
    console.error('Error in getLmStudioTaskUpdateSuggestionsWithUsers:', error);
    
    // Fallback for complete failure
    return {
      priority: currentPriority || 'medium',
      category: currentCategory || '',
      deadline: currentDeadline || null,
      suggested_assignee: null,
      reasoning: "AI service unavailable. Using default values."
    };
  }
};

/**
 * processTaskChat
 * 
 * This function processes chat queries with task data and returns AI responses.
 * It's used for the AI chat feature in the Kanban board.
 */
exports.processTaskChat = async (query, taskData, isAssignmentQuery = false) => {
  console.log('Processing task chat query:', query);

  try {
    // Fetch all users with their skills
    const users = await User.findAll({
      attributes: ['id', 'name', 'role', 'skills']
    });
    
    // Format user data for the prompt
    const userSummary = users.map(user => {
      const userData = user.get({ plain: true });
      return `
      User ID: ${userData.id}
      Name: ${userData.name}
      Role: ${userData.role || 'Not specified'}
      Skills: ${userData.skills || 'Not specified'}
      Current Workload: ${taskData.userWorkload[userData.name] ? 
        `Total: ${taskData.userWorkload[userData.name].total}, 
         In Progress: ${taskData.userWorkload[userData.name].in_progress}` : 
        'No current tasks'}
      `;
    }).join('\n');

    // 1) Construct a system prompt that explains the context and desired response format
    const systemPrompt = `
      You are an AI assistant analyzing tasks on a Kanban board and answering user queries about them.
      You have access to the current state of tasks on the board, including their titles, descriptions,
      statuses, priorities, deadlines, and assignees.
      
      You also have access to user data including their roles and skills, which you should use when
      recommending task assignments. Match task requirements with user skills for optimal assignments.
      
      Provide helpful, concise, and specific answers based on the task data provided.
      Format your responses with clear structure, using bullet points for lists and line breaks for readability.
      
      The Kanban board has the following columns:
      - To Do: Tasks that have not been started
      - In Progress: Tasks that are currently being worked on
      - Review: Tasks that are completed but need review
      - Done: Tasks that are completed and approved
      
      The priority levels are:
      - Low: Regular tasks with normal importance
      - Medium: Important tasks that should be addressed in a timely manner
      - High: Urgent tasks that require prompt attention
      - Critical: Extremely urgent tasks that require immediate attention and have significant impact
      
      ${isAssignmentQuery ? `
      For assignment recommendations:
      1. Analyze the skills required for each task
      2. Compare with the skills of available users
      3. Consider current workload of each user
      4. Prioritize users with matching skills and lower workload
      5. Provide reasoning for your recommendations
      ` : ''}
    `;

    // 2) Prepare task data for the prompt
    const taskSummary = `
      TASK DATA SUMMARY:
      Total Tasks: ${taskData.metrics.total}
      Completion Rate: ${taskData.metrics.completionRate}%
      Tasks by Status:
      - To Do: ${taskData.columns.todo}
      - In Progress: ${taskData.columns.in_progress}
      - Review: ${taskData.columns.review}
      - Done: ${taskData.columns.done}
      
      High Priority Tasks: ${taskData.metrics.highPriority}
      Overdue Tasks: ${taskData.metrics.overdue}
      
      DETAILED TASK LIST:
      ${taskData.tasks.map(task => `
      ID: ${task.id}
      Title: ${task.title}
      Description: ${task.description}
      Status: ${task.status}
      Priority: ${task.priority}
      Category: ${task.category}
      Deadline: ${task.deadline}
      Assignee: ${task.assignee}
      ${task.skills_needed ? `Skills Needed: ${task.skills_needed}` : ''}
      ${task.requirements ? `Requirements: ${task.requirements}` : ''}
      ${task.complexity ? `Complexity: ${task.complexity}` : ''}
      ${task.estimated_hours ? `Estimated Hours: ${task.estimated_hours}` : ''}
      `).join('\n')}
      
      USER DATA:
      ${userSummary}
      
      USER WORKLOAD SUMMARY:
      ${Object.entries(taskData.userWorkload || {}).map(([name, load]) => 
        `${name}: ${load.total} total tasks (${load.todo} todo, ${load.in_progress} in progress, ${load.review} in review, ${load.done} done)`
      ).join('\n')}
    `;

    // 3) Construct a user prompt with the query and task data
    const userPrompt = `
      The user asked: "${query}"
      
      ${taskSummary}
      
      Please analyze the task data and respond to the user's query with specific insights.
      Focus on providing actionable information based on the current state of the Kanban board.
      
      ${isAssignmentQuery ? `
      Since this is an assignment recommendation query:
      1. Identify which task(s) need assignment
      2. Match task requirements with user skills
      3. Consider user workload (users with fewer tasks should be prioritized)
      4. Recommend specific users for each task with clear reasoning
      5. If a task has specific skill requirements, prioritize users with those skills
      ` : `
      When recommending task assignments, match task requirements with user skills and consider:
      1. User's current workload (how many tasks they're already assigned)
      2. User's skills and how they match the task requirements
      3. User's role and how appropriate it is for the task
      4. Task priority and deadline
      `}
    `;

    // 4) Call LM Studio
    const aiResponse = await queryLmStudio([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    // 5) Return the cleaned response
    return aiResponse;
  } catch (error) {
    console.error('Error in processTaskChat:', error);
    
    // Fallback for complete failure
    return "I'm sorry, I couldn't analyze your tasks at this time. Please try again later.";
  }
};

