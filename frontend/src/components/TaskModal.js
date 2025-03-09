import React, { useState, useEffect, useRef } from 'react';
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
    assignee_id: '',
    notes: ''
  });

  // States for AI suggestions, custom queries, etc.
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [currentAssigneeName, setCurrentAssigneeName] = useState(null);

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);

  const [activeTab, setActiveTab] = useState('details');
  
  // State for file uploads
  const [files, setFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

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
        assignee_id: task.assignee ? task.assignee.id : '',
        notes: task.notes || ''
      });
      
      // Set existing files if any
      if (task.file_attachments && Array.isArray(task.file_attachments)) {
        setExistingFiles(task.file_attachments);
      }
    }
  }, [task]);

  // Update currentAssigneeName whenever assignee_id changes
  useEffect(() => {
    if (formData.assignee_id) {
      const assigneeUser = safeUsers.find(u => String(u.id) === String(formData.assignee_id));
      setCurrentAssigneeName(assigneeUser ? assigneeUser.name : null);
    } else {
      setCurrentAssigneeName(null);
    }
  }, [formData.assignee_id, safeUsers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const deleteExistingFile = async (filename) => {
    try {
      if (!task || !task.id) return;
      
      await apiService.tasks.deleteFile(task.id, filename);
      
      // Update the existing files list
      setExistingFiles(prev => prev.filter(file => file.filename !== filename));
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create FormData object for file uploads
      const formDataObj = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== null) {
          formDataObj.append(key, formData[key]);
        }
      });
      
      // Add files
      files.forEach(file => {
        formDataObj.append('files', file);
      });
      
      // Create or update task
      let savedTask;
      
      if (task && task.id) {
        // Update existing task
        savedTask = await apiService.tasks.update(task.id, formDataObj, updateProgress);
      } else {
        // Create new task
        savedTask = await apiService.tasks.create(formDataObj, updateProgress);
      }
      
      // Call the onSave callback with the saved task
      onSave(savedTask);
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Failed to save task. Please try again.');
    }
  };
  
  const updateProgress = (progressEvent) => {
    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    setUploadProgress(percentCompleted);
  };

  const handleGetSuggestions = async () => {
    if (!formData.title && !formData.description) {
      alert('Please enter a title or description first');
      return;
    }

    setIsLoadingSuggestions(true);
    console.log('Fetching AI suggestions for:', formData.title);

    try {
      // Call the AI suggestions endpoint
      const result = await getAiSuggestions({
        title: formData.title,
        description: formData.description,
        currentPriority: formData.priority,
        currentCategory: formData.category,
        currentDeadline: formData.deadline,
        currentAssigneeName,
        userList: safeUsers
      });

      console.log('AI suggestions result:', result);
      
      // Set the suggestions
      setAiSuggestions(result);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      
      // Fallback response if API is unavailable
      setAiSuggestions({
        priority: formData.priority || 'medium',
        category: formData.category || '',
        deadline: formData.deadline || '',
        suggested_assignee: currentAssigneeName,
        reasoning: "Generated locally due to API unavailability. The AI service might be down or experiencing issues."
      });
      
      // Show a user-friendly error message
      alert('Could not get AI suggestions. Using local fallback instead.');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const applySuggestion = (field) => {
    if (!aiSuggestions) return;

    switch (field) {
      case 'priority':
        if (aiSuggestions.priority) {
          setFormData(prev => ({ ...prev, priority: aiSuggestions.priority }));
        }
        break;
      case 'category':
        if (aiSuggestions.category) {
          setFormData(prev => ({ ...prev, category: aiSuggestions.category }));
        }
        break;
      case 'deadline':
        if (aiSuggestions.deadline) {
          // Format the date as YYYY-MM-DD for the input field
          const date = new Date(aiSuggestions.deadline);
          const formattedDate = date.toISOString().split('T')[0];
          setFormData(prev => ({ ...prev, deadline: formattedDate }));
        }
        break;
      case 'assignee':
        if (aiSuggestions.suggested_assignee) {
          // Find the user ID by name
          const user = safeUsers.find(u => u.name === aiSuggestions.suggested_assignee);
          if (user) {
            setFormData(prev => ({ ...prev, assignee_id: user.id }));
          }
        }
        break;
      case 'all':
        // Apply all suggestions at once
        let updates = {};
        
        if (aiSuggestions.priority) {
          updates.priority = aiSuggestions.priority;
        }
        
        if (aiSuggestions.category) {
          updates.category = aiSuggestions.category;
        }
        
        if (aiSuggestions.deadline) {
          const date = new Date(aiSuggestions.deadline);
          updates.deadline = date.toISOString().split('T')[0];
        }
        
        if (aiSuggestions.suggested_assignee) {
          const user = safeUsers.find(u => u.name === aiSuggestions.suggested_assignee);
          if (user) {
            updates.assignee_id = user.id;
          }
        }
        
        setFormData(prev => ({ ...prev, ...updates }));
        break;
      default:
        break;
    }
  };

  const askAI = async () => {
    if (!aiPrompt.trim()) {
      alert('Please enter a question for the AI');
      return;
    }

    setIsLoadingResponse(true);

    try {
      // Call the AI query endpoint
      const response = await apiService.ai.query(aiPrompt, task?.id);
      
      // Set the response
      setAiResponse(response.response || 'No response from AI');
    } catch (error) {
      console.error('Error getting AI response:', error);
      setAiResponse('Failed to get a response from the AI. Please try again.');
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
          className={`tab-button ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          Notes & Files
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
                autoComplete="off"
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
              </div>

              {aiSuggestions.reasoning && (
                <div className="suggestion-reasoning">
                  <h4>Reasoning:</h4>
                  <p>{aiSuggestions.reasoning}</p>
                </div>
              )}

              <div className="suggestion-actions">
                <button
                  type="button"
                  className="apply-all-btn"
                  onClick={() => applySuggestion('all')}
                >
                  Apply All Suggestions
                </button>
                
                <button
                  type="button"
                  className="dismiss-btn"
                  onClick={() => setAiSuggestions(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onCancel}
            >
              Cancel
            </button>
            
            <div className="main-actions">
              {!aiSuggestions && (
                <button
                  type="button"
                  className="get-suggestions-btn"
                  onClick={handleGetSuggestions}
                  disabled={isLoadingSuggestions}
                >
                  {isLoadingSuggestions ? (
                    <>
                      <span className="loading-spinner"></span>
                      Getting suggestions...
                    </>
                  ) : (
                    'Get AI Suggestions'
                  )}
                </button>
              )}
              
              <button
                type="submit"
                className="save-btn"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      ) : activeTab === 'notes' ? (
        <div className="notes-tab">
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="8"
              placeholder="Add notes, comments, or additional details about this task..."
            />
          </div>
          
          <div className="form-group">
            <label>File Attachments</label>
            <div className="file-upload-container">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="file-input"
              />
              <button
                type="button"
                className="upload-btn"
                onClick={() => fileInputRef.current.click()}
              >
                Select Files
              </button>
              <span className="file-info">
                {files.length > 0 ? `${files.length} file(s) selected` : 'No files selected'}
              </span>
            </div>
            
            {/* Display selected files */}
            {files.length > 0 && (
              <div className="selected-files">
                <h4>Selected Files</h4>
                <ul className="file-list">
                  {files.map((file, index) => (
                    <li key={`new-${index}`} className="file-item">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={() => removeFile(index)}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Display existing files */}
            {existingFiles.length > 0 && (
              <div className="existing-files">
                <h4>Existing Files</h4>
                <ul className="file-list">
                  {existingFiles.map((file, index) => (
                    <li key={`existing-${index}`} className="file-item">
                      <span className="file-name">{file.originalname}</span>
                      <span className="file-size">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        type="button"
                        className="download-file-btn"
                        onClick={() => window.open(`/uploads/${file.filename}`, '_blank')}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={() => deleteExistingFile(file.filename)}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="upload-progress">
                <div 
                  className="progress-bar" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
                <span className="progress-text">{uploadProgress}%</span>
              </div>
            )}
          </div>
          
          <div className="form-actions">
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
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="ai-tab">
          <div className="ai-chat">
            <div className="ai-prompt">
              <label htmlFor="ai-prompt">Ask AI about this task:</label>
              <textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="E.g., What are the best practices for this type of task? How should I approach this?"
                rows="3"
              />
              <button
                type="button"
                className="ask-ai-btn"
                onClick={askAI}
                disabled={isLoadingResponse}
              >
                {isLoadingResponse ? 'Loading...' : 'Ask AI'}
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
          </div>

          <div className="form-actions">
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
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskModal;
