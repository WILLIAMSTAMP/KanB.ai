@echo off
echo Setting up AI-Enabled Kanban Board...

echo Installing backend dependencies...
cd backend
npm install
cd ..

echo Installing frontend dependencies...
cd frontend
npm install
cd ..

echo Creating .env file from example...
copy backend\.env.example backend\.env

echo Setup complete!
echo.
echo To start the application:
echo 1. Start the backend: cd backend && npm run dev
echo 2. Start the frontend: cd frontend && npm start
echo.
echo Note: Make sure LM Studio is running with DeepSeek-R1 model to use AI features
echo or set USE_MOCK_AI=true in backend/.env for demo mode.