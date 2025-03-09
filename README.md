<div align="center">
  <svg width="300" height="120" viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg">
    <!-- Kanban columns background -->
    <rect x="20" y="20" width="50" height="60" rx="5" fill="#f0f8ff" stroke="#007ACC" stroke-width="1" />
    <rect x="80" y="20" width="50" height="60" rx="5" fill="#fff8f0" stroke="#FFA500" stroke-width="1" />
    <rect x="140" y="20" width="50" height="60" rx="5" fill="#f8f0ff" stroke="#800080" stroke-width="1" />
    <rect x="200" y="20" width="50" height="60" rx="5" fill="#f0fff0" stroke="#008000" stroke-width="1" />
    
    <rect x="25" y="30" width="40" height="10" fill="#007ACC" rx="2" />
    <rect x="85" y="30" width="40" height="10" fill="#FFA500" rx="2" />
    <rect x="145" y="30" width="40" height="10" fill="#800080" rx="2" />
    <rect x="205" y="30" width="40" height="10" fill="#008000" rx="2" />
    
    <rect x="25" y="45" width="40" height="10" fill="#007ACC" rx="2" />
    <rect x="85" y="45" width="40" height="10" fill="#FFA500" rx="2" />
    <rect x="145" y="45" width="40" height="10" fill="#800080" rx="2" />
    
    <rect x="25" y="60" width="40" height="10" fill="#007ACC" rx="2" />
    <rect x="85" y="60" width="40" height="10" fill="#FFA500" rx="2" />
    
    <!-- Logo text -->
    <text x="150" y="105" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#333333">KanB.ai</text>
  </svg>
  
  <h1>KanB.ai - AI-Enabled Kanban Board</h1>
</div>

A modern Kanban board application enhanced with AI-powered features using LM Studio and open-source large language models. This project demonstrates how AI can be integrated into project management workflows to provide intelligent suggestions, optimize processes, and improve team productivity.

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
- Local deployment of LLMs using LM Studio
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

## LM Studio Integration

This project demonstrates how open-source LLMs can be leveraged for enterprise applications while maintaining data privacy and security.

Key integration points:
- **Local Deployment**: LLMs are hosted locally using LM Studio, ensuring sensitive project data never leaves your infrastructure
- **Task Analysis**: The model analyzes task descriptions to extract insights about priority, complexity, and relationships
- **Chain-of-Thought Reasoning**: Carefully crafted prompts enable the model to explain its suggestions with detailed reasoning
- **Customizable Models**: You can choose from various open-source models available in LM Studio based on your performance needs

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MySQL database
- LM Studio (for AI features)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/kanb-ai.git
cd kanb-ai
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

4. Set up the database
```bash
# Create a MySQL database named 'kanban_ai'
# Update the .env file with your database credentials
```

5. Set up LM Studio
- Download and install LM Studio from [https://lmstudio.ai/](https://lmstudio.ai/)
- Download a compatible model (recommended: hermes-3-llama-3.1-8b or similar)
- Start the local server in LM Studio on the default port (1234)

6. Configure the backend
- Create a `.env` file in the backend directory with the following content:
```
DB_NAME=kanban_ai
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DIALECT=mysql
PORT=5004
LM_STUDIO_MODEL=hermes-3-llama-3.1-8b

ENABLE_AI=true
USE_MOCK_AI=false

NODE_ENV=development
```

### Running the Application

1. Start LM Studio and ensure the local server is running

2. Start the backend server
```bash
cd backend
node server.js
```

3. Start the frontend development server
```bash
cd frontend
npm start
```

4. Access the application at http://localhost:3000

### Using the AI Features

1. **Task Suggestions**: When creating or editing a task, click the "Get AI Suggestions" button to receive AI-powered recommendations for priority, category, deadline, and assignee.

2. **AI Assistant**: In the task modal, click the "AI Assistant" tab to ask questions about the task. Example questions:
   - "What priority should this task have and why?"
   - "Who would be the best person to assign this to?"
   - "How long will this task likely take to complete?"
   - "Should this task be broken down into smaller subtasks?"

3. **Workflow Insights**: Click the "AI Insights" button in the top navigation to view AI-generated workflow improvement suggestions.

4. **Task Priorities**: The system automatically analyzes tasks and suggests priority levels based on their descriptions and deadlines.

### Troubleshooting

- **AI Features Not Working**: Ensure LM Studio is running and the local server is active on port 1234
- **Database Connection Issues**: Check your database credentials in the .env file
- **Frontend Connection Issues**: Make sure the backend server is running on port 5004

## Known Limitations

- The LM Studio integration requires the model to return properly formatted JSON responses, which may not always happen with certain models
- Some AI features may take time to respond depending on the size and complexity of the model you're using
- The application is designed for demonstration purposes and may require additional security measures for production use

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- LM Studio for providing an easy way to run local LLMs
- React Beautiful DnD for the drag-and-drop functionality
- The open-source LLM community for making powerful AI models accessible