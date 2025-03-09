import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import './KanbanBoard.css';

/**
 * KanbanBoard Component
 * Displays tasks organized in columns by status with drag-and-drop functionality,
 * plus a slide-out AI Insights panel from the right edge of the window below the navbar.
 *
 * Props:
 * - tasks: Array of tasks
 * - onStatusChange: Function(id, newStatus) => void
 * - onEditTask: Function(task) => void
 * - onDeleteTask: Function(id) => void
 * - showAiInsights: boolean to toggle the AI panel
 * - onToggleInsights: function to open/close the panel
 * - aiWorkflowImprovements: array of improvements
 */
const KanbanBoard = ({
  tasks,
  onStatusChange,
  onEditTask,
  onDeleteTask,
  showAiInsights,
  onToggleInsights,
  aiWorkflowImprovements
}) => {
  // State for navigation panel
  const [navExpanded, setNavExpanded] = useState(false);
  
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
  
  // Toggle navigation panel expansion
  const toggleNav = () => {
    setNavExpanded(!navExpanded);
  };

  // Handle DnD
  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }
    const newStatus = destination.droppableId;
    try {
      const idPart = draggableId.split('-')[1];
      const task = tasks.find(t => String(t.id) === String(idPart));
      if (!task) {
        console.error(`Could not find task with ID: ${idPart}`);
        return;
      }
      onStatusChange(task.id, newStatus);
    } catch (error) {
      console.error('Error handling drag end:', error);
    }
  };

  // Group tasks by status
  const getTasksByStatus = () => {
    const statusMap = { todo: [], in_progress: [], review: [], done: [] };
    const normalizeStatus = (s) => {
      if (!s) return 'todo';
      const lower = s.toLowerCase();
      if (lower === 'to do' || lower === 'todo') return 'todo';
      if (lower === 'in progress' || lower === 'inprogress') return 'in_progress';
      return lower; // fallback for 'review', 'done', etc.
    };
    tasks.forEach(task => {
      const norm = normalizeStatus(task.status);
      if (statusMap[norm]) statusMap[norm].push(task);
      else statusMap.todo.push(task);
    });
    return statusMap;
  };
  const tasksByStatus = getTasksByStatus();

  // Define columns
  const columns = [
    { id: 'todo',         title: 'To Do',       color: '#3498db', tasks: tasksByStatus.todo },
    { id: 'in_progress',  title: 'In Progress', color: '#f39c12', tasks: tasksByStatus.in_progress },
    { id: 'review',       title: 'Review',      color: '#9b59b6', tasks: tasksByStatus.review },
    { id: 'done',         title: 'Done',        color: '#2ecc71', tasks: tasksByStatus.done }
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
    { id: 'board', icon: '📋', label: 'Board', active: true },
    { id: 'backlog', icon: '📝', label: 'Backlog' },
    { id: 'sprints', icon: '🏃', label: 'Sprints' },
    { id: 'reports', icon: '📊', label: 'Reports' },
    { id: 'divider1', type: 'divider' },
    { id: 'time', icon: '⏱️', label: 'Time Tracking' },
    { id: 'calendar', icon: '📅', label: 'Calendar' },
    { id: 'team', icon: '👥', label: 'Team' },
    { id: 'divider2', type: 'divider' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
    { id: 'help', icon: '❓', label: 'Help & Support' },
  ];

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
              <div key={item.id} className={`nav-item ${item.active ? 'active' : ''}`}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                <span className="nav-tooltip">{item.label}</span>
              </div>
            )
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        {/* The main board container. If the panel is open, we add a class to shift it left. */}
        <div className={`kanban-board ${showAiInsights ? 'panel-open' : ''} ${navExpanded ? 'nav-expanded' : ''}`}>
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
                    ref={provided.innerRef}
                    className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                    {...provided.droppableProps}
                  >
                    {col.tasks.length > 0 ? (
                      col.tasks.map((task, index) => (
                        <Draggable
                          key={`task-${task.id}`}
                          draggableId={`task-${task.id}`}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              className={`task-item ${snapshot.isDragging ? 'dragging' : ''}`}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <TaskCard
                                task={task}
                                onEdit={() => onEditTask(task)}
                                onDelete={() => onDeleteTask(task.id)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))
                    ) : (
                      <div className="empty-column">
                        <p>No tasks yet</p>
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Slide-out AI Insights Panel (fixed to right edge, top=60px so it's below the navbar) */}
      <div className={`ai-insight-panel ${showAiInsights ? 'open' : ''}`}>
        <div className="insight-header">
          <h3>
            <span role="img" aria-label="AI">🤖</span> AI Workflow Insights
          </h3>
          {/* A small close button to hide the panel */}
          <button className="close-insights-btn" onClick={onToggleInsights}>
            ✕
          </button>
        </div>

        <div className="insight-content">
          {/* Example progress bar */}
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${completionRate}%` }}
            />
            <span className="progress-bar-label">
              {completionRate}% Complete
            </span>
          </div>

          <div className="insight-metrics">
            <div className="metric">
              <span className="metric-value">{completionRate}%</span>
              <span className="metric-label">Completion Rate</span>
            </div>
            <div className="metric">
              <span className="metric-value">{overdue}</span>
              <span className="metric-label">Overdue Tasks</span>
            </div>
            <div className="metric">
              <span className="metric-value">{highPriority}</span>
              <span className="metric-label">High Priority</span>
            </div>
            <div className="metric">
              <span className="metric-value">{total}</span>
              <span className="metric-label">Total Tasks</span>
            </div>
          </div>

          {aiWorkflowImprovements && aiWorkflowImprovements.length > 0 && (
            <div className="workflow-suggestions">
              <h4>Suggested Improvements:</h4>
              <div className="suggestions-container">
                {aiWorkflowImprovements.map(imp => (
                  <div key={imp.id} className="suggestion-card">
                    <h3>{imp.title}</h3>
                    <p>{imp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Chat Button */}
      <button className="ai-chat-button" onClick={() => setShowChat(!showChat)}>
        🤖
      </button>

      {/* AI Chat Container */}
      <div className={`ai-chat-container ${!showChat ? 'hidden' : ''}`}>
        <div className="ai-chat-header">
          <h3><span>🤖</span> AI Assistant</h3>
          <button className="ai-chat-close" onClick={() => setShowChat(false)}>✕</button>
        </div>
        
        <div className="ai-chat-messages">
          {chatMessages.map((message, index) => (
            <div 
              key={index} 
              className={`ai-chat-message ${message.type === 'ai' ? 'ai-message' : 'user-message'}`}
            >
              {message.text}
            </div>
          ))}
          
          {isTyping && (
            <div className="ai-chat-typing">
              <div className="ai-chat-typing-dot"></div>
              <div className="ai-chat-typing-dot"></div>
              <div className="ai-chat-typing-dot"></div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="ai-chat-input-container">
          <input
            type="text"
            className="ai-chat-input"
            placeholder="Ask about your tasks..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isTyping}
          />
          <button 
            className="ai-chat-send" 
            onClick={handleSendMessage}
            disabled={isTyping || !inputMessage.trim()}
          >
            ➤
          </button>
        </div>
      </div>

      {/* Celebration animation when all tasks are complete */}
      {showCelebration && (
        <div className="celebration-container">
          {/* Confetti animation */}
          {confetti.map(piece => (
            <div
              key={piece.id}
              className={`confetti confetti-${piece.color} confetti-${piece.shape}`}
              style={{
                left: `${piece.left}%`,
                width: piece.shape === 'rectangle' ? '8px' : `${piece.size}px`,
                height: piece.shape === 'rectangle' ? '16px' : `${piece.size}px`,
                animation: `confettiFall ${piece.duration}s ease-in ${piece.delay}s forwards`
              }}
            />
          ))}
          
          {/* Celebration message */}
          <div className="celebration-message">
            <h2>🎉 All Tasks Complete! 🎉</h2>
            <p>Congratulations! You've completed all tasks on your board.</p>
            <button onClick={dismissCelebration}>Awesome!</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
