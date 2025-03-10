import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import './KanbanBoard.css';
import Settings from './Settings';

/**
 * KanbanBoard Component
 * Displays tasks organized in columns by status with drag-and-drop functionality,
 * with a project summary panel that includes AI insights.
 *
 * Props:
 * - tasks: Array of tasks
 * - onStatusChange: Function(id, newStatus) => void
 * - onEditTask: Function(task) => void
 * - onDeleteTask: Function(id) => void
 * - aiWorkflowImprovements: array of improvements
 */
const KanbanBoard = ({
  tasks,
  onStatusChange,
  onEditTask,
  onDeleteTask,
  aiWorkflowImprovements
}) => {
  // State for navigation panel
  const [navExpanded, setNavExpanded] = useState(false);
  
  // State for project summary on mobile
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  
  // State for desktop project summary panel
  const [showDesktopSummary, setShowDesktopSummary] = useState(true);
  
  // State for mobile view
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  
  // State for celebration
  const [showCelebration, setShowCelebration] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const celebrationTimeout = useRef(null);
  
  // State for AI chat
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'ai', text: 'Hello! I\'m your AI assistant. How can I help you with your tasks today?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  // State for randomized workflow improvements
  const [randomSuggestions, setRandomSuggestions] = useState([]);
  const [isRefreshingSuggestions, setIsRefreshingSuggestions] = useState(false);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('board');
  
  // Toggle navigation panel expansion
  const toggleNav = () => {
    setNavExpanded(!navExpanded);
  };
  
  // Toggle mobile project summary
  const toggleMobileSummary = () => {
    setShowMobileSummary(!showMobileSummary);
  };
  
  // Toggle desktop project summary
  const toggleDesktopSummary = () => {
    setShowDesktopSummary(!showDesktopSummary);
  };

  // Group tasks by status
  const tasksByStatus = {
    backlog: tasks.filter(task => task.status === 'backlog'),
    todo: tasks.filter(task => task.status === 'todo'),
    in_progress: tasks.filter(task => task.status === 'in_progress'),
    review: tasks.filter(task => task.status === 'review'),
    done: tasks.filter(task => task.status === 'done')
  };

  // Define columns
  const columns = [
    {
      id: 'backlog',
      title: 'Backlog',
      color: '#95a5a6', // Gray color for backlog
      tasks: tasksByStatus.backlog
    },
    {
      id: 'todo',
      title: 'To Do',
      color: '#3498db', // Blue
      tasks: tasksByStatus.todo
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      color: '#f39c12', // Orange
      tasks: tasksByStatus.in_progress
    },
    {
      id: 'review',
      title: 'Review',
      color: '#9b59b6', // Purple
      tasks: tasksByStatus.review
    },
    {
      id: 'done',
      title: 'Done',
      color: '#2ecc71', // Green
      tasks: tasksByStatus.done
    }
  ];

  // Compute metrics
  const computeMetrics = () => {
    const total = tasks.length;
    const doneCount = tasksByStatus.done.length;
    const completionRate = total ? Math.round((doneCount / total) * 100) : 0;
    const tasksWithDeadlines = tasks.filter(t => t.deadline);
    const overdue = tasksWithDeadlines.filter(t => new Date(t.deadline) < new Date() && t.status !== 'done').length;
    const highPriority = tasks.filter(t => t.priority === 'high').length;
    return { total, doneCount, completionRate, overdue, highPriority };
  };
  const { total, doneCount, completionRate, overdue, highPriority } = computeMetrics();

  // Check if all tasks are in the Done column
  const allTasksComplete = total > 0 && doneCount === total;

  // Create confetti
  const createConfetti = () => {
    const confettiCount = 150;
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    const shapes = ['circle', 'rectangle', 'square'];
    
    const newConfetti = [];
    
    for (let i = 0; i < confettiCount; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const left = Math.random() * 100; // percent
      const size = Math.random() * 10 + 5; // 5-15px
      const duration = Math.random() * 3 + 2; // 2-5s
      const delay = Math.random() * 0.5; // 0-0.5s
      
      newConfetti.push({
        id: i,
        color,
        shape,
        left,
        size,
        duration,
        delay
      });
    }
    
    setConfetti(newConfetti);
  };

  // Handle celebration dismissal
  const dismissCelebration = () => {
    setShowCelebration(false);
    if (celebrationTimeout.current) {
      clearTimeout(celebrationTimeout.current);
    }
  };

  // Effect to trigger celebration when all tasks are complete
  useEffect(() => {
    if (allTasksComplete && !showCelebration && tasks.length > 0) {
      setShowCelebration(true);
      createConfetti();
      
      // Auto-dismiss after 10 seconds
      celebrationTimeout.current = setTimeout(() => {
        setShowCelebration(false);
      }, 10000);
    }
    
    return () => {
      if (celebrationTimeout.current) {
        clearTimeout(celebrationTimeout.current);
      }
    };
  }, [allTasksComplete, tasks.length]);

  // Scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Handle sending a message in the chat
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    setChatMessages(prev => [...prev, { type: 'user', text: inputMessage }]);
    setInputMessage('');
    setIsTyping(true);
    
    // Prepare task data for the LLM
    const taskData = {
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        category: task.category || '',
        deadline: task.deadline ? new Date(task.deadline).toLocaleDateString() : '',
        assignee: task.assignee ? task.assignee.name : 'Unassigned',
        requirements: task.requirements || '',
        skills_needed: task.skills_needed || '',
        estimated_hours: task.estimated_hours || 0,
        complexity: task.complexity || 'medium'
      })),
      columns: {
        todo: tasksByStatus.todo.length,
        in_progress: tasksByStatus.in_progress.length,
        review: tasksByStatus.review.length,
        done: tasksByStatus.done.length
      },
      metrics: {
        total: total,
        completed: doneCount,
        completionRate: completionRate,
        overdue: overdue,
        highPriority: highPriority
      },
      // Add user workload analysis
      userWorkload: tasks.reduce((acc, task) => {
        if (task.assignee) {
          const name = task.assignee.name;
          if (!acc[name]) {
            acc[name] = { total: 0, todo: 0, in_progress: 0, review: 0, done: 0 };
          }
          acc[name].total++;
          
          // Use the normalizeStatus function from getTasksByStatus
          const normalizedStatus = (() => {
            const status = task.status.toLowerCase();
            if (status === 'to do' || status === 'todo' || status === 'backlog') return 'todo';
            if (status === 'in progress' || status === 'in-progress' || status === 'doing') return 'in_progress';
            if (status === 'review' || status === 'testing' || status === 'qa') return 'review';
            if (status === 'done' || status === 'completed' || status === 'finished') return 'done';
            return 'todo'; // Default fallback
          })();
          
          acc[name][normalizedStatus]++;
        }
        return acc;
      }, {})
    };
    
    // Call the AI service with the task data and user query
    callAiService(inputMessage, taskData)
      .then(response => {
        setChatMessages(prev => [...prev, { type: 'ai', text: response }]);
        setIsTyping(false);
      })
      .catch(error => {
        console.error('Error calling AI service:', error);
        // Fallback to local response generation
        const localResponse = generateAIResponse(inputMessage, tasks, tasksByStatus);
        setChatMessages(prev => [...prev, { 
          type: 'ai', 
          text: `I'm having trouble connecting to the AI service. Here's what I can tell you based on your board:\n\n${localResponse}` 
        }]);
        setIsTyping(false);
      });
  };
  
  // Call the AI service with task data and user query
  const callAiService = async (query, taskData) => {
    try {
      // Call your backend API that interfaces with the LLM
      const response = await fetch('http://localhost:5004/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          taskData: taskData
        })
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error calling AI service:', error);
      throw error;
    }
  };

  // Generate AI response based on user query and board state
  const generateAIResponse = (query, tasks, tasksByStatus) => {
    const lowerQuery = query.toLowerCase();
    
    // If no tasks exist
    if (tasks.length === 0) {
      return "Your board is currently empty. Try adding some tasks to get started!";
    }
    
    // Task count information
    if (lowerQuery.includes('how many') && lowerQuery.includes('task')) {
      const todoCount = tasksByStatus.todo.length;
      const inProgressCount = tasksByStatus.in_progress.length;
      const reviewCount = tasksByStatus.review.length;
      const doneCount = tasksByStatus.done.length;
      
      return `You have ${tasks.length} tasks in total: ${todoCount} in To Do, ${inProgressCount} in In Progress, ${reviewCount} in Review, and ${doneCount} in Done.`;
    }
    
    // Specific column query
    if (lowerQuery.includes('todo') || lowerQuery.includes('to do')) {
      if (tasksByStatus.todo.length === 0) {
        return "You don't have any tasks in the To Do column.";
      }
      const taskList = tasksByStatus.todo.map(t => `"${t.title}" (${t.priority} priority${t.deadline ? `, due ${new Date(t.deadline).toLocaleDateString()}` : ''})`).join('\n- ');
      return `You have ${tasksByStatus.todo.length} tasks in To Do:\n- ${taskList}`;
    }
    
    if (lowerQuery.includes('in progress')) {
      if (tasksByStatus.in_progress.length === 0) {
        return "You don't have any tasks in the In Progress column.";
      }
      const taskList = tasksByStatus.in_progress.map(t => `"${t.title}" (${t.priority} priority${t.deadline ? `, due ${new Date(t.deadline).toLocaleDateString()}` : ''})`).join('\n- ');
      return `You have ${tasksByStatus.in_progress.length} tasks In Progress:\n- ${taskList}`;
    }
    
    if (lowerQuery.includes('review')) {
      if (tasksByStatus.review.length === 0) {
        return "You don't have any tasks in the Review column.";
      }
      const taskList = tasksByStatus.review.map(t => `"${t.title}" (${t.priority} priority${t.deadline ? `, due ${new Date(t.deadline).toLocaleDateString()}` : ''})`).join('\n- ');
      return `You have ${tasksByStatus.review.length} tasks in Review:\n- ${taskList}`;
    }
    
    if (lowerQuery.includes('done') || lowerQuery.includes('complete')) {
      if (tasksByStatus.done.length === 0) {
        return "You don't have any completed tasks yet.";
      }
      const taskList = tasksByStatus.done.map(t => `"${t.title}" (${t.priority} priority)`).join('\n- ');
      return `You have completed ${tasksByStatus.done.length} tasks:\n- ${taskList}`;
    }
    
    // Search for specific task
    if (lowerQuery.includes('find') || lowerQuery.includes('search') || lowerQuery.includes('where is')) {
      // Extract potential task name from query
      const queryWords = lowerQuery.split(' ');
      const potentialTaskTerms = queryWords.filter(word => word.length > 3 && !['find', 'search', 'task', 'where', 'about', 'tell', 'what', 'which', 'column'].includes(word));
      
      if (potentialTaskTerms.length > 0) {
        // Search for tasks containing these terms
        const matchingTasks = tasks.filter(task => 
          potentialTaskTerms.some(term => 
            task.title.toLowerCase().includes(term) || 
            (task.description && task.description.toLowerCase().includes(term))
          )
        );
        
        if (matchingTasks.length > 0) {
          const taskDetails = matchingTasks.map(task => {
            const statusMap = {
              'todo': 'To Do',
              'in_progress': 'In Progress',
              'review': 'Review',
              'done': 'Done'
            };
            const status = statusMap[task.status] || task.status;
            return `"${task.title}" is in the ${status} column (${task.priority} priority${task.deadline ? `, due ${new Date(task.deadline).toLocaleDateString()}` : ''})`;
          }).join('\n- ');
          
          return `I found ${matchingTasks.length} matching task(s):\n- ${taskDetails}`;
        } else {
          return "I couldn't find any tasks matching those terms. Try using different keywords.";
        }
      }
    }
    
    // Task details query
    if (lowerQuery.includes('details') || lowerQuery.includes('describe')) {
      // Extract potential task name from query
      const queryWords = lowerQuery.split(' ');
      const potentialTaskTerms = queryWords.filter(word => word.length > 3 && !['details', 'describe', 'task', 'about', 'tell', 'what'].includes(word));
      
      if (potentialTaskTerms.length > 0) {
        // Search for tasks containing these terms
        const matchingTasks = tasks.filter(task => 
          potentialTaskTerms.some(term => 
            task.title.toLowerCase().includes(term) || 
            (task.description && task.description.toLowerCase().includes(term))
          )
        );
        
        if (matchingTasks.length > 0) {
          const task = matchingTasks[0]; // Get the first matching task
          let details = `Title: ${task.title}\n`;
          details += `Status: ${task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}\n`;
          details += `Priority: ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}\n`;
          
          if (task.description) {
            details += `Description: ${task.description}\n`;
          }
          
          if (task.deadline) {
            details += `Deadline: ${new Date(task.deadline).toLocaleDateString()}\n`;
          }
          
          if (task.assignee && task.assignee.name) {
            details += `Assigned to: ${task.assignee.name}\n`;
          }
          
          if (task.category) {
            details += `Category: ${task.category}\n`;
          }
          
          return `Here are the details for "${task.title}":\n${details}`;
        } else {
          return "I couldn't find a task matching those terms. Try using different keywords.";
        }
      }
    }
    
    // Progress information
    if (lowerQuery.includes('progress') || lowerQuery.includes('status') || lowerQuery.includes('overview')) {
      const todoCount = tasksByStatus.todo.length;
      const inProgressCount = tasksByStatus.in_progress.length;
      const reviewCount = tasksByStatus.review.length;
      const doneCount = tasksByStatus.done.length;
      
      let response = `Your project is ${completionRate}% complete. You have ${doneCount} completed tasks out of ${total}.\n\n`;
      
      if (todoCount > 0) {
        response += `To Do: ${todoCount} tasks\n`;
      }
      
      if (inProgressCount > 0) {
        response += `In Progress: ${inProgressCount} tasks\n`;
      }
      
      if (reviewCount > 0) {
        response += `Review: ${reviewCount} tasks\n`;
      }
      
      if (doneCount > 0) {
        response += `Done: ${doneCount} tasks\n`;
      }
      
      if (overdue > 0) {
        response += `\nWarning: You have ${overdue} overdue tasks that need attention.`;
      }
      
      return response;
    }
    
    // Priority information
    if (lowerQuery.includes('priority') || lowerQuery.includes('important')) {
      const highPriorityTasks = tasks.filter(t => t.priority === 'high');
      const mediumPriorityTasks = tasks.filter(t => t.priority === 'medium');
      const lowPriorityTasks = tasks.filter(t => t.priority === 'low');
      
      let response = '';
      
      if (highPriorityTasks.length > 0) {
        const taskList = highPriorityTasks.map(t => {
          const statusMap = {
            'todo': 'To Do',
            'in_progress': 'In Progress',
            'review': 'Review',
            'done': 'Done'
          };
          const status = statusMap[t.status] || t.status;
          return `"${t.title}" (${status}${t.deadline ? `, due ${new Date(t.deadline).toLocaleDateString()}` : ''})`;
        }).join('\n- ');
        
        response += `You have ${highPriorityTasks.length} high priority tasks:\n- ${taskList}\n\n`;
      } else {
        response += "You don't have any high priority tasks at the moment.\n\n";
      }
      
      if (mediumPriorityTasks.length > 0) {
        response += `Medium priority tasks: ${mediumPriorityTasks.length}\n`;
      }
      
      if (lowPriorityTasks.length > 0) {
        response += `Low priority tasks: ${lowPriorityTasks.length}\n`;
      }
      
      return response.trim();
    }
    
    // Deadline information
    if (lowerQuery.includes('deadline') || lowerQuery.includes('due') || lowerQuery.includes('overdue')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const overdueTasks = tasks.filter(t => t.deadline && new Date(t.deadline) < today && t.status !== 'done');
      const dueTodayTasks = tasks.filter(t => {
        if (!t.deadline) return false;
        const dueDate = new Date(t.deadline);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime() && t.status !== 'done';
      });
      
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      const dueThisWeekTasks = tasks.filter(t => {
        if (!t.deadline) return false;
        const dueDate = new Date(t.deadline);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate > today && dueDate <= nextWeek && t.status !== 'done';
      });
      
      let response = '';
      
      if (overdueTasks.length > 0) {
        const taskList = overdueTasks.map(t => {
          const statusMap = {
            'todo': 'To Do',
            'in_progress': 'In Progress',
            'review': 'Review',
            'done': 'Done'
          };
          const status = statusMap[t.status] || t.status;
          return `"${t.title}" (${status}, due ${new Date(t.deadline).toLocaleDateString()})`;
        }).join('\n- ');
        
        response += `You have ${overdueTasks.length} overdue tasks:\n- ${taskList}\n\n`;
      } else {
        response += "You don't have any overdue tasks. Great job staying on schedule!\n\n";
      }
      
      if (dueTodayTasks.length > 0) {
        const taskList = dueTodayTasks.map(t => `"${t.title}" (${t.priority} priority)`).join('\n- ');
        response += `Tasks due today:\n- ${taskList}\n\n`;
      }
      
      if (dueThisWeekTasks.length > 0) {
        const taskList = dueThisWeekTasks.map(t => `"${t.title}" (due ${new Date(t.deadline).toLocaleDateString()})`).join('\n- ');
        response += `Tasks due this week:\n- ${taskList}`;
      }
      
      return response.trim();
    }
    
    // Recommendations
    if (lowerQuery.includes('recommend') || lowerQuery.includes('suggest') || lowerQuery.includes('what should') || lowerQuery.includes('next')) {
      let response = '';
      
      // Check for overdue tasks first
      const overdueTasks = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done');
      if (overdueTasks.length > 0) {
        const highPriorityOverdue = overdueTasks.filter(t => t.priority === 'high');
        if (highPriorityOverdue.length > 0) {
          response += `I recommend focusing on your overdue high priority task "${highPriorityOverdue[0].title}" first.\n\n`;
        } else {
          response += `I recommend addressing your overdue task "${overdueTasks[0].title}" first.\n\n`;
        }
      }
      
      // Then check for high priority tasks in To Do
      else if (tasksByStatus.todo.length > 0) {
        const highPriorityTodo = tasksByStatus.todo.filter(t => t.priority === 'high');
        if (highPriorityTodo.length > 0) {
          response += `I recommend starting with your high priority To Do task "${highPriorityTodo[0].title}".\n\n`;
        } else {
          response += `I recommend starting with "${tasksByStatus.todo[0].title}" from your To Do list.\n\n`;
        }
      }
      
      // Then check for tasks in progress
      else if (tasksByStatus.in_progress.length > 0) {
        response += `You should focus on completing "${tasksByStatus.in_progress[0].title}" which is already in progress.\n\n`;
      }
      
      // General project status
      response += `Your project is ${completionRate}% complete with ${tasks.length} total tasks.`;
      
      if (overdue > 0) {
        response += ` You have ${overdue} overdue tasks that need attention.`;
      }
      
      return response;
    }
    
    // General help
    if (lowerQuery.includes('help') || lowerQuery.includes('how to') || lowerQuery.includes('what can you')) {
      return `I can help you manage your tasks and provide insights about your Kanban board. Here are some things you can ask me:

1. Task counts: "How many tasks do I have?" or "What's in my To Do column?"
2. Project status: "What's my project progress?" or "Give me an overview"
3. Task details: "Tell me about task X" or "Find task about Y"
4. Priority information: "What are my high priority tasks?"
5. Deadline information: "Do I have any overdue tasks?" or "What's due this week?"
6. Recommendations: "What should I work on next?"

I can see all your tasks, their descriptions, priorities, deadlines, and which column they're in.`;
    }
    
    // Default response
    return `I'm here to help with your tasks. You can ask me about task counts, project progress, task details, priorities, deadlines, or recommendations on what to work on next.`;
  };

  // Handle key press in chat input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Navigation items
  const navItems = [
    { id: 'board', icon: '📋', label: 'Board', active: activeTab === 'board' },
    { id: 'backlog', icon: '📝', label: 'Backlog' },
    { id: 'sprints', icon: '🏃', label: 'Sprints' },
    { id: 'reports', icon: '📊', label: 'Reports' },
    { id: 'divider1', type: 'divider' },
    { id: 'time', icon: '⏱️', label: 'Time Tracking' },
    { id: 'calendar', icon: '📅', label: 'Calendar' },
    { id: 'team', icon: '👥', label: 'Team' },
    { id: 'divider2', type: 'divider' },
    { id: 'settings', icon: '⚙️', label: 'Settings', active: activeTab === 'settings' },
    { id: 'help', icon: '❓', label: 'Help & Support' },
  ];

  // Handle nav item click
  const handleNavClick = (id) => {
    setActiveTab(id);
  };

  // Handle drag end
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    
    // If there's no destination or the item is dropped back to its original position, do nothing
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }
    
    // Get the task that was dragged
    const task = tasks.find(t => t.id.toString() === draggableId);
    
    // Map droppableId to status
    const statusMap = {
      'backlog': 'backlog',
      'todo': 'todo',
      'in_progress': 'in_progress',
      'review': 'review',
      'done': 'done'
    };
    
    // Get the new status
    const newStatus = statusMap[destination.droppableId];
    
    // If the status has changed, update it
    if (task.status !== newStatus) {
      // Remove individual task celebration trigger - only keep the celebration for when all tasks are complete
      // This is handled by the useEffect that checks allTasksComplete
      
      // Call the onStatusChange callback
      onStatusChange(task.id, newStatus);
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 992);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate randomized workflow improvement suggestions
  const generateRandomSuggestions = () => {
    const suggestionTemplates = [
      {
        title: "Implement task time tracking",
        description: "Add time tracking to better understand how long tasks take and improve future estimations.",
        impact: 0.7
      },
      {
        title: "Add task dependencies",
        description: "Identify and mark dependencies between tasks to better visualize workflow bottlenecks.",
        impact: 0.8
      },
      {
        title: "Create task templates",
        description: "Develop templates for common task types to speed up task creation and ensure consistency.",
        impact: 0.6
      },
      {
        title: "Implement daily standups",
        description: "Schedule brief daily meetings to discuss progress and blockers, improving team coordination.",
        impact: 0.9
      },
      {
        title: "Add priority auto-sorting",
        description: "Automatically sort tasks by priority within each column to focus on what matters most.",
        impact: 0.75
      },
      {
        title: "Set up automated reminders",
        description: "Configure notifications for approaching deadlines to prevent tasks from becoming overdue.",
        impact: 0.85
      },
      {
        title: "Implement workload balancing",
        description: "Distribute tasks more evenly among team members to prevent burnout and improve efficiency.",
        impact: 0.95
      },
      {
        title: "Add progress tracking",
        description: "Implement percentage-based progress tracking for complex tasks to better visualize completion.",
        impact: 0.7
      },
      {
        title: "Create recurring tasks",
        description: "Set up automation for recurring tasks to reduce manual creation and ensure consistency.",
        impact: 0.65
      },
      {
        title: "Implement task tagging",
        description: "Add tags to tasks for better categorization and filtering capabilities.",
        impact: 0.6
      },
      {
        title: "Set up workflow automation",
        description: "Automate status changes based on certain triggers to reduce manual updates.",
        impact: 0.85
      },
      {
        title: "Add time estimates",
        description: "Include time estimates for each task to improve sprint planning and resource allocation.",
        impact: 0.75
      }
    ];
    
    // Shuffle the array and take 3-5 random suggestions
    const shuffled = [...suggestionTemplates].sort(() => 0.5 - Math.random());
    const count = Math.floor(Math.random() * 3) + 3; // 3-5 suggestions
    return shuffled.slice(0, count);
  };
  
  // Generate new random suggestions when refreshing
  const refreshSuggestions = () => {
    setIsRefreshingSuggestions(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setRandomSuggestions(generateRandomSuggestions());
      setIsRefreshingSuggestions(false);
    }, 800);
  };
  
  // Initialize random suggestions on component mount
  useEffect(() => {
    setRandomSuggestions(generateRandomSuggestions());
    
    // Refresh suggestions every 5 minutes
    const intervalId = setInterval(refreshSuggestions, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="kanban-wrapper">
      {/* Left Navigation Panel */}
      <div className={`nav-panel ${navExpanded ? 'expanded' : ''}`}>
        <button className="nav-toggle" onClick={toggleNav}>
          {navExpanded ? '◀' : '▶'}
        </button>
        <div className="nav-items">
          {navItems.map(item => 
            item.type === 'divider' ? (
              <div key={item.id} className="nav-divider"></div>
            ) : (
              <div 
                key={item.id} 
                className={`nav-item ${item.active ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                <span className="nav-tooltip">{item.label}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`main-content ${navExpanded ? 'nav-expanded' : ''}`}>
        {activeTab === 'board' ? (
      <DragDropContext onDragEnd={handleDragEnd}>
            {/* The main board container */}
            <div className={`kanban-board ${navExpanded ? 'nav-expanded' : ''}`}>
          {columns.map(col => (
                <div 
                  key={col.id} 
                  className={`kanban-column ${col.id} ${col.id === 'done' && allTasksComplete ? 'all-complete' : ''}`}
                >
              <div className="column-header" style={{ backgroundColor: col.color }}>
                <h2>{col.title}</h2>
                <div className="task-count">{col.tasks.length}</div>
              </div>
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                        className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                        {col.tasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                          {(provided, snapshot) => (
                              <TaskCard
                                task={task}
                                provided={provided}
                                snapshot={snapshot}
                                onEdit={onEditTask}
                                onDelete={onDeleteTask}
                              />
                          )}
                        </Draggable>
                        ))}
                        {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
        ) : activeTab === 'settings' ? (
          <Settings />
        ) : (
          <div className="coming-soon">
            <h2>{navItems.find(item => item.id === activeTab)?.label} - Coming Soon</h2>
            <p>This feature is under development.</p>
          </div>
        )}
      </div>

      {/* Project Summary Widget with integrated AI Insights */}
      <div className={`project-summary-widget ${!showDesktopSummary ? 'closed' : ''} ${showMobileSummary ? 'mobile-open' : ''}`}>
        <div className="widget-header">
          <h3>Project Summary & AI Insights</h3>
        </div>
        <div className="widget-content">
          <div className="summary-section">
            <h4>Progress</h4>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${completionRate}%` }}
              ></div>
              <span className="progress-bar-label">{completionRate}%</span>
            </div>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-value">{total}</span>
                <span className="stat-label">Total Tasks</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{doneCount}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{overdue}</span>
                <span className="stat-label">Overdue</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{highPriority}</span>
                <span className="stat-label">High Priority</span>
              </div>
            </div>
          </div>
          
          <div className="summary-section">
            <h4>Task Distribution</h4>
            <div className="distribution-chart">
              {columns.map(col => (
                <div key={col.id} className="chart-bar">
                  <div 
                    className="bar-fill" 
                    style={{ 
                      height: `${total ? (col.tasks.length / total) * 100 : 0}%`,
                      backgroundColor: col.color 
                    }}
                  ></div>
                  <span className="bar-label">{col.title}</span>
                  <span className="bar-value">{col.tasks.length}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="summary-section">
            <h4>Priority Breakdown</h4>
            <div className="priority-list">
              <div className="priority-item critical">
                <span className="priority-label">Critical</span>
                <span className="priority-value">{tasks.filter(t => t.priority === 'critical').length}</span>
              </div>
              <div className="priority-item high">
                <span className="priority-label">High</span>
                <span className="priority-value">{tasks.filter(t => t.priority === 'high').length}</span>
              </div>
              <div className="priority-item medium">
                <span className="priority-label">Medium</span>
                <span className="priority-value">{tasks.filter(t => t.priority === 'medium').length}</span>
              </div>
              <div className="priority-item low">
                <span className="priority-label">Low</span>
                <span className="priority-value">{tasks.filter(t => t.priority === 'low').length}</span>
              </div>
            </div>
          </div>

          {/* Integrated AI Workflow Suggestions */}
          <div className="summary-section">
            <h4>
              AI Workflow Improvements
              <button 
                className={`refresh-suggestions ${isRefreshingSuggestions ? 'loading' : ''}`} 
                onClick={refreshSuggestions} 
                title="Generate new suggestions"
                disabled={isRefreshingSuggestions}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6"></path>
                  <path d="M1 20v-6h6"></path>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
                  <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
                </svg>
                {isRefreshingSuggestions ? 'Generating...' : 'Refresh'}
              </button>
            </h4>
              <div className="suggestions-container">
              {randomSuggestions.length > 0 ? (
                randomSuggestions.map((improvement, index) => (
                  <div key={index} className="suggestion-card">
                    <h3>{improvement.title}</h3>
                    <p>{improvement.description}</p>
                    <div className="impact-indicator">
                      <div className="impact-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span 
                            key={star} 
                            className={`impact-star ${star <= Math.round(improvement.impact * 5) ? '' : 'empty'}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="impact-label">Impact Rating</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-suggestions">
                  <p>Generating AI workflow suggestions...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop toggle button for project summary */}
      <div className="project-summary-toggle-desktop" onClick={toggleDesktopSummary}>
        {showDesktopSummary ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        )}
      </div>

      {/* Mobile toggle button for project summary */}
      {isMobile && (
        <div className="project-summary-toggle" onClick={toggleMobileSummary}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12H3M12 3v18"></path>
          </svg>
        </div>
      )}

      {/* AI Chat Button with Label */}
      <div className="ai-chat-wrapper">
        <div className="ai-chat-label">Chat Assistant</div>
        <button 
          className="ai-chat-button" 
          onClick={() => setShowChat(!showChat)}
          aria-label="Open AI Chat"
        >
          <span className="ai-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <line x1="8" y1="16" x2="8" y2="16" />
              <line x1="16" y1="16" x2="16" y2="16" />
              <path d="M9 20l3 2 3-2" />
            </svg>
          </span>
          <span className="ai-label">AI Assistant</span>
        </button>
      </div>

      {/* AI Chat Container */}
      <div className={`ai-chat-container ${!showChat ? 'hidden' : ''}`}>
        <div className="ai-chat-header">
          <h3>AI Assistant</h3>
          <button 
            className="ai-chat-close" 
            onClick={() => setShowChat(false)}
            aria-label="Close AI Chat"
          >×</button>
        </div>
        <div className="ai-chat-messages" ref={messagesEndRef}>
          {chatMessages.map((msg, index) => (
            <div key={index} className={`ai-chat-message ${msg.type}-message`}>
              {msg.text}
                  </div>
                ))}
          {isTyping && (
            <div className="ai-chat-typing">
              <div className="ai-chat-typing-dot"></div>
              <div className="ai-chat-typing-dot"></div>
              <div className="ai-chat-typing-dot"></div>
            </div>
          )}
        </div>
        <div className="ai-chat-input-container">
          <input
            type="text"
            className="ai-chat-input"
            placeholder="Ask about your tasks..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button 
            className="ai-chat-send" 
            onClick={handleSendMessage}
            aria-label="Send Message"
          >
            <span>↑</span>
          </button>
        </div>
      </div>

      {/* Celebration overlay */}
      {showCelebration && (
        <div className="celebration-container">
          {confetti.map(conf => (
            <div
              key={conf.id}
              className={`confetti confetti-${conf.color} confetti-${conf.shape}`}
              style={{
                left: `${conf.left}%`,
                width: `${conf.size}px`,
                height: `${conf.size}px`,
                animationDuration: `${conf.duration}s`,
                animationDelay: `${conf.delay}s`
              }}
            ></div>
          ))}
          <div className="celebration-message">
            <h2>Task Completed! 🎉</h2>
            <p>Great job moving a task to completion!</p>
            <button onClick={dismissCelebration}>Continue</button>
          </div>
        </div>
      )}

      {/* Update the mobile class for the project summary widget */}
      <style jsx>{`
        @media (max-width: 992px) {
          .project-summary-widget {
            transform: translateY(100%);
          }
          .project-summary-widget.mobile-open {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default KanbanBoard;
