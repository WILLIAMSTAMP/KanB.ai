import React from 'react';
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
  const { total, completionRate, overdue, highPriority } = computeMetrics();

  return (
    <div className="kanban-wrapper">
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* The main board container. If the panel is open, we add a class to shift it left. */}
        <div className={`kanban-board ${showAiInsights ? 'panel-open' : ''}`}>
          {columns.map(col => (
            <div key={col.id} className="kanban-column">
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

      {/* Slide-out AI Insights Panel (fixed to right edge, top=60px so it’s below the navbar) */}
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
    </div>
  );
};

export default KanbanBoard;
