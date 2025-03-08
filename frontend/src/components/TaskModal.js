import React, { useState, useEffect } from 'react';
import apiService from '../services/api.service';
import './TaskModal.css';

/**
 * TaskModal Component
 * Enhanced task creation/editing with AI suggestions
 */
const TaskModal = ({
  task = null,
  users = [],
  onSave,
  onCancel,
  // Provide a function that calls your AI endpoint
  // e.g. getAiTaskSuggestions({ title, description, currentPriority, ... })
  getAiSuggestions
}) => {
  // Safeguard in case `users` is not an array
  const safeUsers = Array.isArray(users) ? users : [];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    category: '',
    deadline: '',
    assignee_id: ''
  });

  // States for AI suggestions, custom queries, etc.
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);

  const [activeTab, setActiveTab] = useState('details');

  // Populate formData if editing an existing task
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        category: task.category || '',
        deadline: task.deadline ? task.deadline.split('T')[0] : '',
        assignee_id: task.assignee_id || task.assignee?.id || ''
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

  // Handle form submission
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    try {
      setIsLoadingSuggestions(true);
      const success = await onSave(formData);
      if (!success) {
        alert('Failed to save task. Please try again.');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      alert('An error occurred while saving the task. Please try again.');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Get AI suggestions (priority, category, deadline, assignee)
  const handleGetSuggestions = async () => {
    if (!formData.title && !formData.description) {
      alert('Please enter a title or description first.');
      return;
    }
    try {
      setIsLoadingSuggestions(true);

      // We pass the current fields + the user list so the AI can see them
      // For example, your getAiSuggestions function might do:
      //    apiService.ai.getTaskUpdateSuggestions(formData, safeUsers)
      // or similar.
      const result = await getAiSuggestions({
        title: formData.title,
        description: formData.description,
        currentPriority: formData.priority,
        currentCategory: formData.category,
        currentDeadline: formData.deadline,
        currentAssigneeId: formData.assignee_id,
        userList: safeUsers
      });

      // result might be an axios response or plain object
      const data = result.data || result;
      setAiSuggestions(data);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      // fallback if the AI service is unavailable
      setAiSuggestions({
        priority: formData.priority,
        category: formData.category,
        deadline: formData.deadline,
        suggested_assignee: formData.assignee_id,
        reasoning: 'Could not reach AI service, fallback used.'
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Apply the AI suggestions to the form
// Suppose you have a `safeUsers` array that looks like [{ id: 4, name: "Alice Brown", ... }, ...]
// Make sure it's accessible in this scope (e.g., from props or a higher-level variable).

const applySuggestion = (field) => {
  if (!aiSuggestions) return;

  switch (field) {
    case 'all': {
      // Convert each field as usual
      // But for assignee, do name → user.id
      setFormData((prev) => {
        // Fallbacks
        const newPriority = aiSuggestions.priority || prev.priority;
        const newCategory = aiSuggestions.category || prev.category;
        const newDeadline = aiSuggestions.deadline || prev.deadline;

        // Convert LLM name → numeric ID
        let newAssigneeId = prev.assignee_id;
        if (aiSuggestions.suggested_assignee) {
          const foundUser = safeUsers.find(
            (u) => u.name === aiSuggestions.suggested_assignee
          );
          // If found, use the numeric ID; else keep the old one
          if (foundUser) {
            newAssigneeId = foundUser.id;
          }
        }

        return {
          ...prev,
          priority: newPriority,
          category: newCategory,
          deadline: newDeadline,
          assignee_id: newAssigneeId,
        };
      });
      break;
    }

    case 'priority':
      setFormData((prev) => ({
        ...prev,
        priority: aiSuggestions.priority || prev.priority,
      }));
      break;

    case 'category':
      setFormData((prev) => ({
        ...prev,
        category: aiSuggestions.category || prev.category,
      }));
      break;

    case 'deadline':
      setFormData((prev) => ({
        ...prev,
        deadline: aiSuggestions.deadline || prev.deadline,
      }));
      break;

    case 'assignee': {
      // Convert LLM name → numeric ID
      const suggestedName = aiSuggestions.suggested_assignee;
      const foundUser = safeUsers.find((u) => u.name === suggestedName);

      setFormData((prev) => ({
        ...prev,
        // If the LLM-suggested name doesn't match, keep the old ID
        assignee_id: foundUser ? foundUser.id : prev.assignee_id,
      }));
      break;
    }

    default:
      break;
  }
};


  // Ask the AI a custom question about the task
  const askAI = async () => {
    if (!aiPrompt) {
      alert('Please enter a question first.');
      return;
    }
    try {
      setIsLoadingResponse(true);
      // Example: call your custom AI query endpoint
      const response = await apiService.ai.getQueryResponse(
        aiPrompt,
        task ? task.id : null
      );
      setAiResponse(response.data.response);
    } catch (error) {
      console.error('Error getting AI response:', error);
      // fallback
      setAiResponse('Could not get AI response. Please try again.');
    } finally {
      setIsLoadingResponse(false);
    }
  };

  return (
    <div className="task-modal">
      <h2>{task ? 'Edit Task' : 'Create New Task'}</h2>

      <div className="modal-tabs">
        <button
          className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Task Details
        </button>
        <button
          className={`tab-button ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          AI Assistant
        </button>
      </div>

      {activeTab === 'details' ? (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title*</label>
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
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                <option value="Design" />
                <option value="Development" />
                <option value="Testing" />
                <option value="Documentation" />
                <option value="Research" />
                <option value="Regulatory" />
              </datalist>
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

          <div className="form-group">
            <label htmlFor="assignee_id">Assignee</label>
            <select
              id="assignee_id"
              name="assignee_id"
              value={formData.assignee_id}
              onChange={handleChange}
            >
              <option value="">Unassigned</option>
              {safeUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* AI Suggestions Panel */}
          {aiSuggestions && (
            <div className="ai-suggestions-panel">
              <h3>
                <span role="img" aria-label="AI">🤖</span> AI Suggestions
              </h3>
              <div className="suggestion-items">
                {aiSuggestions.priority && (
                  <div className="suggestion-item">
                    <span>Priority: <b>{aiSuggestions.priority}</b></span>
                    <button
                      type="button"
                      className="apply-btn"
                      onClick={() => applySuggestion('priority')}
                    >
                      Apply
                    </button>
                  </div>
                )}

                {aiSuggestions.category && (
                  <div className="suggestion-item">
                    <span>Category: <b>{aiSuggestions.category}</b></span>
                    <button
                      type="button"
                      className="apply-btn"
                      onClick={() => applySuggestion('category')}
                    >
                      Apply
                    </button>
                  </div>
                )}

                {aiSuggestions.deadline && (
                  <div className="suggestion-item">
                    <span>
                      Deadline:{' '}
                      <b>{new Date(aiSuggestions.deadline).toLocaleDateString()}</b>
                    </span>
                    <button
                      type="button"
                      className="apply-btn"
                      onClick={() => applySuggestion('deadline')}
                    >
                      Apply
                    </button>
                  </div>
                )}

                {aiSuggestions.suggested_assignee && (
                  <div className="suggestion-item">
                    <span>
                      Assignee:{' '}
                      <b>
                        {
                          safeUsers.find(u => String(u.name) === String(aiSuggestions.suggested_assignee))
                            ?.name || 'Unknown'
                        }
                      </b>
                    </span>
                    <button
                      type="button"
                      className="apply-btn"
                      onClick={() => applySuggestion('assignee')}
                    >
                      Apply
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  className="apply-all-btn"
                  onClick={() => applySuggestion('all')}
                >
                  Apply All Suggestions
                </button>
              </div>

              {aiSuggestions.reasoning && (
                <div className="ai-reasoning">
                  <h4>AI Reasoning:</h4>
                  <p>{aiSuggestions.reasoning}</p>
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={handleGetSuggestions}
              disabled={isLoadingSuggestions}
            >
              {isLoadingSuggestions ? 'Getting Suggestions...' : 'Get AI Suggestions'}
            </button>

            <div className="main-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="save-btn"
              >
                {task ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* AI Assistant Tab */
        <div className="ai-assistant-tab">
          <h3>Ask AI Assistant</h3>
          <p className="ai-assistant-help">
            Ask questions about this task, get suggestions for prioritization,
            deadlines, or assignment recommendations.
          </p>

          <div className="ai-prompt-section">
            <textarea
              className="ai-prompt-input"
              placeholder="Ask a question about this task..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows="3"
            />
            <button
              className="ask-ai-btn"
              onClick={askAI}
              disabled={isLoadingResponse}
            >
              {isLoadingResponse ? 'Thinking...' : 'Ask AI'}
            </button>
          </div>

          {aiResponse && (
            <div className="ai-response">
              <h4>AI Response:</h4>
              <div className="response-content">
                {aiResponse}
              </div>
            </div>
          )}

          <div className="ai-assistant-examples">
            <h4>Example Questions:</h4>
            <ul>
              <li>
                <button
                  className="example-question"
                  onClick={() => setAiPrompt('What priority should this task have and why?')}
                >
                  What priority should this task have and why?
                </button>
              </li>
              <li>
                <button
                  className="example-question"
                  onClick={() => setAiPrompt('Who would be the best person to assign this to?')}
                >
                  Who would be the best person to assign this to?
                </button>
              </li>
              <li>
                <button
                  className="example-question"
                  onClick={() => setAiPrompt('How long will this task likely take to complete?')}
                >
                  How long will this task likely take to complete?
                </button>
              </li>
              <li>
                <button
                  className="example-question"
                  onClick={() => setAiPrompt('Should this task be broken down into smaller subtasks?')}
                >
                  Should this task be broken down into smaller subtasks?
                </button>
              </li>
            </ul>
          </div>

          <div className="form-actions ai-tab-actions">
            <div className="main-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="save-btn"
                onClick={handleSubmit}
              >
                {task ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskModal;
