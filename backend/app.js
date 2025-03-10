// Import routes
const taskRoutes = require('./app/routes/task.routes');
const userRoutes = require('./app/routes/user.routes');
const aiRoutes = require('./app/routes/ai.routes');
const settingsRoutes = require('./app/routes/settings.routes');

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingsRoutes); 