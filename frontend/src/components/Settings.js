import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Settings.css';

const Settings = () => {
  const [llmUrl, setLlmUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Fetch current LLM URL when component mounts
  useEffect(() => {
    const fetchLlmUrl = async () => {
      try {
        const response = await axios.get('/api/settings/llm-url');
        setLlmUrl(response.data.llmUrl);
      } catch (error) {
        console.error('Error fetching LLM URL:', error);
      }
    };
    fetchLlmUrl();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');

    try {
      await axios.post('/api/settings/llm-url', { llmUrl });
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving LLM URL:', error);
      setSaveMessage('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>
      
      <div className="settings-section">
        <h3>AI Configuration</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="llmUrl">LLM URL:</label>
            <input
              type="text"
              id="llmUrl"
              value={llmUrl}
              onChange={(e) => setLlmUrl(e.target.value)}
              placeholder="http://localhost:1234/v1"
              className="form-control"
            />
            <small className="form-text">
              Enter the URL for your LLM service. For local LM Studio, this is typically http://localhost:1234/v1
            </small>
          </div>
          
          <button type="submit" className="btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
          
          {saveMessage && (
            <div className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>
              {saveMessage}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Settings; 