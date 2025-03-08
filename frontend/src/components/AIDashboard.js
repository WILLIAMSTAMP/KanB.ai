// AIDashboard.js
// Production version with no mock references.
// This component fetches real AI data (priorities, improvements, bottlenecks, predictions)
// from your backend (apiService) and displays them in a tabbed dashboard.

import React, { useState, useEffect } from 'react';
import apiService from '../services/api.service';
import './AIDashboard.css';

const AIDashboard = ({ tasks, users }) => {
  const [loading, setLoading] = useState(true);
  const [taskPriorities, setTaskPriorities] = useState([]);
  const [workflowImprovements, setWorkflowImprovements] = useState([]);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [activeTab, setActiveTab] = useState('insights');

  useEffect(() => {
    const fetchAIData = async () => {
      setLoading(true);
      try {
        // Fetch real AI data from the backend
        const priorities = await apiService.ai.getTaskPriorities();
        setTaskPriorities(priorities);

        const improvements = await apiService.ai.getWorkflowImprovements();
        setWorkflowImprovements(improvements);

        const bottleneckData = await apiService.ai.getBottlenecks();
        setBottlenecks(bottleneckData);

        const predictionData = await apiService.ai.getPredictions();
        setPredictions(predictionData);

      } catch (error) {
        console.error('Error fetching AI data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAIData();
  }, [tasks, users]);

  // Calculate task distribution by status
  const calculateStatusDistribution = () => {
    const distribution = {
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0
    };

    tasks.forEach(task => {
      if (distribution[task.status] !== undefined) {
        distribution[task.status]++;
      }
    });

    return distribution;
  };

  // Calculate task distribution by assignee
  const calculateAssigneeDistribution = () => {
    const distribution = {};

    tasks.forEach(task => {
      if (task.assignee && task.assignee.id) {
        const assigneeId = task.assignee.id;
        distribution[assigneeId] = (distribution[assigneeId] || 0) + 1;
      }
    });

    return distribution;
  };

  // Render the Task Priority Recommendations table
  const renderTaskPriorityRecommendations = () => {
    if (!taskPriorities || taskPriorities.length === 0) {
      return <p>No priority recommendations available.</p>;
    }

    return (
      <div className="priority-recommendations">
        <h3>Task Priority Recommendations</h3>
        <table className="ai-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Priority</th>
              {/* <th>Suggested Priority</th> */}
              <th>Reasoning</th>
            </tr>
          </thead>
          <tbody>
  {taskPriorities.map(task => (
    <tr key={task.id}>
      <td>{task.title}</td>
      
      <td className="priority-cell">
  <div className="priority-comparison">
    {/* Current Priority */}
    <div className="priority-block">
      <span className="small-label">Current</span>
      <span className={`priority-badge ${task.current_priority}`}>
        {task.current_priority}
      </span>
    </div>

    {/* AI suggestion (only if different) */}
    {task.suggested_priority && task.suggested_priority !== task.current_priority && (
      <div className="priority-block">
        <span className="small-label">AI Suggestion</span>
        <span className={`priority-badge ${task.suggested_priority}`}>
          {task.suggested_priority}
        </span>
      </div>
    )}
  </div>
</td>


      
      <td>{task.reason}</td>
    </tr>
  ))}
</tbody>
        </table>
      </div>
    );
  };

  // Render detected bottlenecks
  const renderBottlenecks = () => {
    if (!bottlenecks || bottlenecks.length === 0) {
      return <p>No bottlenecks detected.</p>;
    }

    return (
      <div className="bottlenecks">
        <h3>Detected Bottlenecks</h3>
        <div className="bottleneck-cards">
          {bottlenecks.map(bottleneck => (
            <div key={bottleneck.id} className="bottleneck-card">
              <div className="bottleneck-header">
                <h4>{bottleneck.area}</h4>
                <span className={`bottleneck-severity ${bottleneck.severity}`}>
                  {bottleneck.severity}
                </span>
              </div>
              <p className="bottleneck-description">{bottleneck.description}</p>
              <div className="bottleneck-metrics">
                <div className="metric">
                  <span className="metric-label">Affected Tasks:</span>
                  <span className="metric-value">{bottleneck.affected_tasks}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Avg. Delay:</span>
                  <span className="metric-value">{bottleneck.avg_delay} days</span>
                </div>
              </div>
              <div className="bottleneck-solution">
                <h5>Recommended Solution:</h5>
                <p>{bottleneck.solution}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render predictive analytics
  const renderPredictions = () => {
    if (!predictions) {
      return <p>No predictions available.</p>;
    }

    return (
      <div className="predictions">
        <h3>Project Predictions</h3>

        <div className="prediction-card">
          <h4>Project Timeline</h4>
          <div className="prediction-chart">
            <div className="timeline-bar">
              <div
                className="timeline-progress"
                style={{ width: `${predictions.completion_percentage}%` }}
              ></div>
            </div>
            <div className="timeline-labels">
              <span>Start</span>
              <span className="current-date">Today</span>
              <span>Predicted End: {predictions.projected_end_date}</span>
            </div>
          </div>
          <div className="prediction-detail">
            <p>Current completion: {predictions.completion_percentage}%</p>
            <p>Predicted completion date: {predictions.projected_end_date}</p>
            <p className={predictions.on_schedule ? 'on-track' : 'delayed'}>
              Status: {predictions.on_schedule ? 'On schedule' : 'Potential delay detected'}
            </p>
          </div>
        </div>

        <div className="prediction-card">
          <h4>Resource Forecast</h4>
          <div className="resource-alerts">
            {predictions.resource_alerts.map((alert, index) => (
              <div key={index} className={`resource-alert ${alert.severity}`}>
                <span className="alert-icon">⚠️</span>
                <div className="alert-content">
                  <h5>{alert.title}</h5>
                  <p>{alert.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="prediction-card">
          <h4>Risk Assessment</h4>
          <div className="risk-factors">
            {predictions.risk_factors.map((risk, index) => (
              <div key={index} className="risk-factor">
                <div className="risk-header">
                  <h5>{risk.factor}</h5>
                  <div className="risk-level">
                    <span className={`risk-indicator ${risk.level}`}></span>
                    <span>{risk.level} risk</span>
                  </div>
                </div>
                <p>{risk.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render workflow optimization suggestions
  const renderWorkflowOptimizations = () => {
    if (!workflowImprovements || workflowImprovements.length === 0) {
      return <p>No workflow optimizations available.</p>;
    }

    return (
      <div className="workflow-optimizations">
        <h3>Workflow Optimization Suggestions</h3>
        <div className="optimization-cards">
          {workflowImprovements.map(improvement => (
            <div key={improvement.id} className="optimization-card">
              <h4>{improvement.title}</h4>
              <p>{improvement.description}</p>
              <div className="impact-indicator">
                <span className="impact-label">Potential Impact:</span>
                <div className="impact-stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      className={star <= (improvement.impact || 3) ? 'star filled' : 'star'}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="ai-dashboard">
      <div className="dashboard-header">
        <h2>AI-Powered Analytics Dashboard</h2>
        <div className="dashboard-tabs">
          <button
            className={activeTab === 'insights' ? 'active' : ''}
            onClick={() => setActiveTab('insights')}
          >
            Insights & Recommendations
          </button>
          <button
            className={activeTab === 'bottlenecks' ? 'active' : ''}
            onClick={() => setActiveTab('bottlenecks')}
          >
            Bottleneck Analysis
          </button>
          <button
            className={activeTab === 'predictions' ? 'active' : ''}
            onClick={() => setActiveTab('predictions')}
          >
            Predictive Analytics
          </button>
          <button
            className={activeTab === 'optimizations' ? 'active' : ''}
            onClick={() => setActiveTab('optimizations')}
          >
            Workflow Optimizations
          </button>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-loading">
          <p>Loading AI analysis...</p>
        </div>
      ) : (
        <div className="dashboard-content">
          {activeTab === 'insights' && (
            <>
    <div className="dashboard-summary">
      {/* FIRST summary card: Task Distribution (fixed width ~300px) */}
      <div className="summary-card">
        <h3>Task Distribution</h3>
        <div className="distribution-grid">
          {Object.entries(calculateStatusDistribution()).map(([status, count]) => (
            <div key={status} className={`status-count ${status}`}>
              <span className="status-label">{status.replace('_', ' ')}</span>
              <span className="count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SECOND summary card: Team Workload (fills remaining space) */}
      <div className="summary-card">
        <h3>Team Workload</h3>
        <div className="workload-bars">
          {users.map(user => {
            const taskCount = calculateAssigneeDistribution()[user.id] || 0;
            // Example: 5 tasks = 100% workload
            const workloadPercentage = Math.min((taskCount / 5) * 100, 100);

            return (
              <div key={user.id} className="workload-item">
                <div className="workload-user">
                  <span className="user-name">{user.name}</span>
                  <span className="task-count">{taskCount} tasks</span>
                </div>
                <div className="workload-bar-container">
                  <div
                    className={`workload-bar ${
                      workloadPercentage > 80
                        ? 'high'
                        : workloadPercentage > 50
                        ? 'medium'
                        : 'low'
                    }`}
                    style={{ width: `${workloadPercentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>

              {renderTaskPriorityRecommendations()}
            </>
          )}

          {activeTab === 'bottlenecks' && renderBottlenecks()}
          {activeTab === 'predictions' && renderPredictions()}
          {activeTab === 'optimizations' && renderWorkflowOptimizations()}
        </div>
      )}
    </div>
  );
};

export default AIDashboard;
