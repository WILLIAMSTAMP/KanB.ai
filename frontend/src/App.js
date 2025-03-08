import React, { useState, useEffect } from 'react';
import KanbanBoard from './components/KanbanBoard';
import TaskModal from './components/TaskModal';
import AIDashboard from './components/AIDashboard';
import apiService from './services/api.service';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  // This will hold AI-generated workflow improvements from the LLM
  const [aiWorkflowImprovements, setAiWorkflowImprovements] = useState([]);

  const [showAiInsights, setShowAiInsights] = useState(false);
  const [showAiDashboard, setShowAiDashboard] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    const socket = apiService.socket.initialize();
    
    // Listen for real-time task updates
    socket.on('task:created', (newTask) => {
      setTasks(prevTasks => [...prevTasks, newTask]);
    });
    
    socket.on('task:updated', (updatedTask) => {
      setTasks(prevTasks => 
        prevTasks.map(task => task.id === updatedTask.id ? updatedTask : task)
      );
    });
    
    socket.on('task:statusUpdated', ({ id, status }) => {
      setTasks(prevTasks => 
        prevTasks.map(task => task.id === id ? { ...task, status } : task)
      );
    });
    
    socket.on('task:deleted', ({ id }) => {
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    });
    
    // Cleanup socket listeners on component unmount
    return () => {
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:statusUpdated');
      socket.off('task:deleted');
    };
  }, []);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Check if the API is available
        const isApiAvailable = await apiService.checkConnection();
        
        if (!isApiAvailable) {
          // If we do NOT want to generate mock data, just show an error:
          setError('Backend API is unavailable. Please try again later.');
          setLoading(false);
          return;
        }

        // If the API is available, fetch real data:
        console.log('API is available, fetching real data');
        
        // Fetch tasks
        const fetchedTasks = await apiService.tasks.getAll();
        setTasks(fetchedTasks);
        
        // Fetch users
        const fetchedUsers = await apiService.users.getAllUsers();
        setUsers(fetchedUsers);
        
        // Get AI workflow improvements from the LLM
        const improvements = await apiService.ai.getWorkflowImprovements();
        setAiWorkflowImprovements(improvements);

        setLoading(false);
      } catch (error) {
        console.error('Error initializing application:', error);
        setError('Failed to load tasks from backend.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Create a new task
  const handleCreateTask = async (taskData) => {
    try {
      const isApiAvailable = await apiService.checkConnection();
      
      if (!isApiAvailable) {
        setError('Cannot create task. Backend API is unavailable.');
        return false;
      }

      // Attempt real creation
      const createdTask = await apiService.tasks.createTask(taskData);
      setTasks(prevTasks => [...prevTasks, createdTask]);
      setShowTaskModal(false);
      setError(null);
      return true;

    } catch (error) {
      console.error('Error creating task:', error);
      setError('Failed to create task on the server.');
      return false;
    }
  };
  
  // Update an existing task
  const handleUpdateTask = async (id, taskData) => {
    try {
      const updatedTask = await apiService.tasks.updateTask(id, taskData);
      setTasks(prevTasks =>
        prevTasks.map(task => (task.id === id ? updatedTask : task))
      );
      
      setShowTaskModal(false);
      setTaskToEdit(null);
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task. Please try again.');
      return false;
    }
  };

  // Delete a task
  const handleDeleteTask = async (id) => {
    try {
      await apiService.tasks.deleteTask(id);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task. Please try again.');
      return false;
    }
  };

  // Update task status (for drag & drop)
  const handleStatusChange = async (id, newStatus) => {
    try {
      await apiService.tasks.moveTask(id, newStatus);
      setTasks(prevTasks => 
        prevTasks.map(task => (task.id === id ? { ...task, status: newStatus } : task))
      );
      return true;
    } catch (error) {
      console.error('Error updating task status:', error);
      setError('Failed to update task status. Please try again.');
      return false;
    }
  };

  // Open task modal for editing
  const handleEditTask = (task) => {
    setTaskToEdit(task);
    setShowTaskModal(true);
  };

  // Get AI suggestions for a task
  const getAiSuggestions = async (taskData) => {
    try {
      return await apiService.tasks.getAiSuggestions(taskData);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      setError('Failed to get AI suggestions. Please try again.');
      return null;
    }
  };

  // Close error message
  const handleDismissError = () => {
    setError(null);
  };

  if (loading) {
    return (
      <div className="loading">
<svg width="480" height="240" viewBox="0 0 480 240" xmlns="http://www.w3.org/2000/svg">

  <rect width="480" height="240" fill="#ffffff" />


  <rect x="40"  y="70" width="80" height="90" rx="8" fill="#007ACC" opacity="0.15" />
  <rect x="140" y="70" width="80" height="90" rx="8" fill="#FFA500" opacity="0.15" />
  <rect x="240" y="70" width="80" height="90" rx="8" fill="#800080" opacity="0.15" />
  <rect x="340" y="70" width="80" height="90" rx="8" fill="#008000" opacity="0.15" />


  <rect x="45" y="80" width="70" height="15" fill="#007ACC" rx="3">
    <animate
      attributeName="x"
      values="45;145;245;345;45"
      keyTimes="0;0.25;0.5;0.75;1"
      dur="8s"
      repeatCount="indefinite"
    />
  </rect>


  <rect x="45" y="100" width="70" height="15" fill="#FFA500" rx="3">
    <animate
      attributeName="x"
      values="45;145;245;345;45"
      keyTimes="0;0.25;0.5;0.75;1"
      dur="8s"
      begin="2s"
      repeatCount="indefinite"
    />
  </rect>


  <rect x="45" y="120" width="70" height="15" fill="#800080" rx="3">
    <animate
      attributeName="x"
      values="45;145;245;345;45"
      keyTimes="0;0.25;0.5;0.75;1"
      dur="8s"
      begin="4s"
      repeatCount="indefinite"
    />
  </rect>


  <rect x="45" y="140" width="70" height="15" fill="#008000" rx="3">
    <animate
      attributeName="x"
      values="45;145;245;345;45"
      keyTimes="0;0.25;0.5;0.75;1"
      dur="8s"
      begin="6s"
      repeatCount="indefinite"
    />
  </rect>


  <text
    x="240"
    y="225"
    text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif"
    font-size="28"
    fill="#333333"
    font-weight="bold"
  >
    Kanb.AI
  </text>
</svg>

<div>

      </div>
      </div>
      
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI-Enabled Kanban Board</h1>
        <div className="header-actions">
          <button
            className="btn-primary"
            onClick={() => {
              setTaskToEdit(null);
              setShowTaskModal(true);
            }}
          >
            Create Task
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowAiDashboard(!showAiDashboard)}
          >
            {showAiDashboard ? 'Hide AI Dashboard' : 'Show AI Dashboard'}
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowAiInsights(!showAiInsights)}
          >
            {showAiInsights ? 'Hide AI Insights' : 'Show AI Insights'}
          </button>
        </div>
      </header>

      <main>
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={handleDismissError}>Dismiss</button>
          </div>
        )}

        <KanbanBoard
          tasks={tasks}
          onStatusChange={handleStatusChange}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          showAiInsights={showAiInsights}
          aiWorkflowImprovements={aiWorkflowImprovements}
          onToggleInsights={() => setShowAiInsights(!showAiInsights)}
        />

        {showTaskModal && (
          <div className="modal-overlay">
            <div className="modal">
              <button
                className="close-button"
                onClick={() => {
                  setShowTaskModal(false);
                  setTaskToEdit(null);
                }}
              >
                ×
              </button>
              <TaskModal
                task={taskToEdit}
                users={users}
                onSave={async (taskData) => {
                  try {
                    let result;
                    if (taskToEdit) {
                      result = await handleUpdateTask(taskToEdit.id, taskData);
                    } else {
                      result = await handleCreateTask(taskData);
                    }
                    return result;
                  } catch (error) {
                    console.error('Error in onSave:', error);
                    setError('Failed to save task.');
                    return false;
                  }
                }}
                onCancel={() => {
                  setShowTaskModal(false);
                  setTaskToEdit(null);
                }}
                getAiSuggestions={getAiSuggestions}
              />
            </div>
          </div>
        )}

        {showAiDashboard && (
          <div className="modal-overlay ai-dashboard-overlay">
            <div className="modal ai-dashboard-modal">
              <button
                className="close-button"
                onClick={() => setShowAiDashboard(false)}
              >
                ×
              </button>
              <AIDashboard
                tasks={tasks}
                users={users}
              />
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          AI-Enabled Kanban Board powered by DeepSeek-R1 | {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

export default App;
