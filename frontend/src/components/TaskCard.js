import React from 'react';
import './TaskCard.css';

/**
 * TaskCard Component
 * Displays an individual task with its details
 * Drag and drop functionality is handled by react-beautiful-dnd in the parent component
 */
const TaskCard = ({ task, onEdit, onDelete, isDragging }) => {
  // Format date to be more readable
  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Check if a task is overdue
  const isOverdue = (dateString) => {
    if (!dateString) return false;
    
    const deadlineDate = new Date(dateString);
    const today = new Date();
    
    // Remove time portion for comparison
    today.setHours(0, 0, 0, 0);
    
    return deadlineDate < today && task.status !== 'done';
  };
  
  // Get formatted deadline with overdue indicator if needed
  const getDeadlineDisplay = () => {
    const formattedDate = formatDate(task.deadline);
    const overdue = isOverdue(task.deadline);
    
    return (
      <span className={`task-deadline ${overdue ? 'overdue' : ''}`}>
        {formattedDate}
        {overdue && <span className="overdue-indicator"> (Overdue)</span>}
      </span>
    );
  };
  
  // Get color for priority badge
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return '#c0392b';
      case 'high':
        return '#e74c3c';
      case 'medium':
        return '#f39c12';
      case 'low':
        return '#27ae60';
      default:
        return '#95a5a6';
    }
  };

  return (
    <div 
      className={`task-card ${task.priority || ''} ${isDragging ? 'is-dragging' : ''}`}
      style={{ borderLeftColor: getPriorityColor(task.priority) }}
    >
      {/* Show AI suggestion indicator if task has recommendations */}
      {task.ai_recommendation && (
        <div
          className="ai-suggestion-indicator"
          title={task.ai_recommendation}
        >
          🤖
        </div>
      )}
      
      <div className="task-header">
        <h3 className="task-title">{task.title}</h3>
        
        <span
          className={`priority-badge ${task.priority?.toLowerCase()}`}
        >
          {task.priority}
        </span>
      </div>
      
      {task.description && (
        <p className="task-description">
          {task.description.length > 150
            ? `${task.description.substring(0, 150)}...`
            : task.description}
        </p>
      )}
      
      <div className="task-meta">
        {/* Category, Assignee, and Due Date moved to the bottom */}
        {task.category && (
          <div className="task-category-container">
            <span className="meta-label">Category:</span>
            <span className="task-category">{task.category}</span>
          </div>
        )}
        
        {/* Stacked assignee field */}
        {task.assignee && (
          <div className="task-assignee">
            <span className="meta-label">Assignee:</span>
            <span className="assignee-name">
              {typeof task.assignee === 'object' ? task.assignee.name : task.assignee}
            </span>
          </div>
        )}
        
        {/* Stacked due date field */}
        <div className="task-deadline-container">
          <span className="meta-label">Due:</span>
          {getDeadlineDisplay()}
        </div>
      </div>
      
      {/* Display AI recommendation if present */}
      {task.ai_recommendation && (
        <div className="ai-recommendation">
          <span role="img" aria-label="AI">🤖</span>
          <p className="recommendation-text">{task.ai_recommendation}</p>
        </div>
      )}
      
      {/* Task actions */}
      <div className="task-actions">
        <button onClick={onEdit} className="task-action-btn edit-btn" title="Edit task">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          <span>Edit</span>
        </button>
        <button onClick={onDelete} className="task-action-btn delete-btn" title="Delete task">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};

export default TaskCard;