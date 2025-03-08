import React, { useState, useEffect } from 'react';
import './TaskForm.css';

/**
 * TaskForm Component
 * Used for creating and editing tasks with AI suggestion support
 */
const TaskForm = ({
  task,
  users,
  onSave,
  onCancel,
}) => {
  // Initialize form state with task data or defaults
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    category: '',
    deadline: '',
    assignee_id: '',
    tags: [],
    estimated_hours: '',
  });

  // AI suggestions state
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Example queries for AI
  const exampleQueries = [
    "Who should I assign this to?",
    "What priority should this task have?",
    "When should this be completed by?",
    "What category does this task belong to?"
  ];

  // Populate form with task data if editing
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        category: task.category || '',
        deadline: task.deadline ? task.deadline.split('T')[0] : '',
        assignee_id: task.assignee_id ? String(task.assignee_id) : '',
        tags: task.tags || [],
        estimated_hours: task.estimated_hours || '',
      });
    }
  }, [task]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle tag input
  const handleTagInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newTag = e.target.value.trim();
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      e.target.value = '';
    }
  };

  // Remove tag
  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert assignee_id to a number if it's not empty
    const processedData = {
      ...formData,
      assignee_id: formData.assignee_id ? parseInt(formData.assignee_id, 10) : null,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null
    };
    
    onSave(processedData);
  };

  // Get AI suggestions based on task title and description
  const getAiSuggestions = async () => {
    if (!formData.title) {
      alert('Please enter a task title first');
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch('/api/tasks/ai-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          requestType: 'standard'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI suggestions');
      }

      const data = await response.json();
      setAiSuggestions(data);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Apply specific AI suggestion to form
  const applySuggestion = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Submit custom AI query
  const submitCustomQuery = async () => {
    if (!customQuery.trim()) {
      alert('Please enter a question for the AI');
      return;
    }

    setIsLoadingSuggestions(true);
    setAiResponse(null);
    
    try {
      const response = await fetch('/api/tasks/ai-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestType: 'custom_query',
          query: customQuery,
          currentTask: {
            ...formData,
            id: task?.id || null,
            assignee_id: formData.assignee_id ? parseInt(formData.assignee_id, 10) : null
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      setAiResponse(data);
    } catch (error) {
      console.error('Error getting AI response:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Set example query
  const handleExampleQuery = (query) => {
    setCustomQuery(query);
  };

  // Apply AI response to form
  const applyAiResponse = () => {
    if (!aiResponse) return;

    const updates = {};

    if (aiResponse.priority) {
      updates.priority = aiResponse.priority;
    }

    if (aiResponse.category) {
      updates.category = aiResponse.category;
    }

    if (aiResponse.deadline) {
      updates.deadline = aiResponse.deadline;
    }
    
    if (aiResponse.assignee_id) {
      updates.assignee_id = aiResponse.assignee_id;
    }

    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  return (
    <div className="task-form-container">
      <form onSubmit={handleSubmit} className="task-form">
        <h2>{task ? 'Edit Task' : 'Create New Task'}</h2>
        
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="deadline">Deadline</label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="assignee_id">Assignee</label>
            <select
              id="assignee_id"
              name="assignee_id"
              value={formData.assignee_id}
              onChange={handleChange}
            >
              <option value="">Not assigned</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="estimated_hours">Estimated Hours</label>
            <input
              type="number"
              id="estimated_hours"
              name="estimated_hours"
              value={formData.estimated_hours}
              onChange={handleChange}
              min="0"
              step="0.5"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="tags">Tags</label>
          <div className="tags-container">
            {formData.tags.map(tag => (
              <span key={tag} className="tag">
                {tag}
                <button type="button" onClick={() => removeTag(tag)}>×</button>
              </span>
            ))}
            <input
              type="text"
              placeholder="Add a tag and press Enter"
              onKeyDown={handleTagInput}
            />
          </div>
        </div>
        
        {/* Toggle AI panel */}
        <button 
          type="button" 
          className="btn ai-toggle-btn"
          onClick={() => setShowAiPanel(!showAiPanel)}
        >
          🤖 {showAiPanel ? 'Hide AI Assistant' : 'Show AI Assistant'}
        </button>
        
        {/* AI Suggestions Panel */}
        {showAiPanel && (
          <div className="ai-suggestions-panel">
            <h3>DeepSeek-R1 AI Assistant</h3>
            
            <div className="ai-section">
              <h4>Get Task Suggestions</h4>
              <p>Get AI suggestions based on your task title and description.</p>
              <button 
                type="button" 
                className="btn ai-btn"
                onClick={getAiSuggestions}
                disabled={isLoadingSuggestions}
              >
                {isLoadingSuggestions ? 'Loading...' : 'Get Suggestions'}
              </button>
              
              {aiSuggestions && (
                <div className="ai-results">
                  <h4>AI Suggestions:</h4>
                  <div className="suggestion-item">
                    <p>{aiSuggestions.recommendation}</p>
                    <p className="confidence">Confidence: {(aiSuggestions.confidence * 100).toFixed(0)}%</p>
                  </div>
                  
                  <div className="suggestion-actions">
                    <h5>Apply Suggestions:</h5>
                    <div className="action-buttons">
                      <button
                        type="button"
                        onClick={() => applySuggestion('priority', aiSuggestions.priority)}
                        className="btn apply-btn"
                        disabled={!aiSuggestions.priority}
                      >
                        Apply Priority
                      </button>
                      <button
                        type="button"
                        onClick={() => applySuggestion('category', aiSuggestions.category)}
                        className="btn apply-btn"
                        disabled={!aiSuggestions.category}
                      >
                        Apply Category
                      </button>
                      <button
                        type="button"
                        onClick={() => applySuggestion('deadline', aiSuggestions.deadline)}
                        className="btn apply-btn"
                        disabled={!aiSuggestions.deadline}
                      >
                        Apply Deadline
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Custom AI Query Section */}
            <div className="ai-section">
              <h4>Ask AI a Question</h4>
              <p>Ask specific questions about this task to get intelligent recommendations.</p>
              
              <div className="example-queries">
                <p>Examples:</p>
                <div className="example-buttons">
                  {exampleQueries.map((query, index) => (
                    <button
                      key={index}
                      type="button"
                      className="btn example-btn"
                      onClick={() => handleExampleQuery(query)}
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="custom-query-input">
                <textarea
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="Ask a question about this task..."
                  rows="2"
                ></textarea>
                <button
                  type="button"
                  className="btn ask-btn"
                  onClick={submitCustomQuery}
                  disabled={isLoadingSuggestions}
                >
                  {isLoadingSuggestions ? 'Thinking...' : 'Ask AI'}
                </button>
              </div>
              
              {aiResponse && (
                <div className="ai-response">
                  <h4>AI Response:</h4>
                  <div className="response-content">
                    <p>{aiResponse.response}</p>
                    
                    {(aiResponse.priority || aiResponse.category || 
                     aiResponse.deadline || aiResponse.assignee_id) && (
                      <div className="apply-response">
                        <button
                          type="button"
                          className="btn apply-response-btn"
                          onClick={applyAiResponse}
                        >
                          Apply These Suggestions
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="form-actions">
          <button type="button" className="btn cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn save-btn">
            {task ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;