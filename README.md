# AI-Enabled Kanban Board

A modern Kanban board application enhanced with AI-powered features using DeepSeek-R1, an open-source large language model. This project demonstrates how AI can be integrated into project management workflows to provide intelligent suggestions, optimize processes, and improve team productivity.

## Features

### Core Kanban Functionality
- Interactive drag-and-drop Kanban board with customizable columns
- Task creation, editing, and deletion
- Priority and category assignment
- Task assignment to team members
- Deadlines and status tracking

### AI-Powered Capabilities
- **Task Prioritization**: AI analysis of task descriptions to suggest appropriate priority levels
- **Role Assignments**: Recommendations for task assignments based on team member skills and workload
- **Deadline Estimation**: Prediction of realistic completion dates based on task complexity
- **Workflow Optimization**: Identification of inconsistencies in task management and suggestions for standardization
- **Bottleneck Detection**: Analysis of workflow patterns to identify and address bottlenecks
- **AI Assistant**: Natural language query interface for task-specific questions and suggestions

## Architecture

### Frontend
- React.js for the UI components and state management
- React Beautiful DnD for drag-and-drop functionality
- Axios for API communication
- Socket.IO for real-time updates

### Backend
- Node.js with Express for the API server
- Sequelize ORM for database interactions
- Socket.IO for real-time event broadcasting
- RESTful API design with structured routes and controllers

### AI Integration
- Local deployment of DeepSeek-R1 (simulated in this demo)
- Custom prompt engineering for project management tasks
- API endpoints for AI-powered suggestions and analysis

## Project Structure

```
project/
├── frontend/                  # React frontend application
│   ├── public/                # Static files
│   └── src/
│       ├── components/        # React components
│       │   ├── KanbanBoard.js # Main board component
│       │   ├── TaskModal.js   # Task creation/editing with AI assistance
│       │   ├── TaskCard.js    # Individual task card component
│       │   └── AIDashboard.js # AI insights dashboard
│       ├── services/          # API service connectors
│       └── App.js             # Main application component
│
├── backend/                   # Node.js backend application
│   ├── app/
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Express middleware
│   │   ├── models/            # Sequelize models
│   │   ├── routes/            # API route definitions
│   │   └── services/          # Business logic services
│   └── server.js              # Main server entry point
└── README.md                  # Project documentation
```

## DeepSeek-R1 Integration

This project demonstrates how DeepSeek-R1, an open-source LLM released under MIT license, can be leveraged for enterprise applications while maintaining data privacy and security.

Key integration points:
- **Local Deployment**: DeepSeek-R1 can be hosted on-premises, ensuring sensitive project data never leaves your infrastructure
- **Task Analysis**: The model analyzes task descriptions to extract insights about priority, complexity, and relationships
- **Chain-of-Thought Reasoning**: Carefully crafted prompts enable the model to explain its suggestions with detailed reasoning
- **Fine-Tuning Potential**: The model could be fine-tuned on your organization's project history data to improve accuracy (not implemented in this demo)

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL (optional - can run in demo mode without a database)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/kanban-ai.git
cd kanban-ai
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server
```bash
cd backend
npm start
```

2. Start the frontend development server
```bash
cd frontend
npm start
```

3. Access the application at http://localhost:3000

### Demo Mode

The application can run in demo mode without a database connection or AI model. In this mode, it uses mock data and simulated AI responses to demonstrate the functionality.

## Future Enhancements

- **Advanced Analytics**: More detailed AI analysis of project timelines and team performance
- **Automated Documentation**: Generate project documentation and reports based on task descriptions and history
- **Risk Assessment**: Predictive analysis to identify potential project risks before they impact deadlines
- **Fine-Tuned Model**: Deploy a version of DeepSeek-R1 fine-tuned on project management data for more accurate suggestions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- DeepSeek-R1 is an open-source large language model released by DeepSeek under MIT license
- React Beautiful DnD for the drag-and-drop functionality
