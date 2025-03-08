# AI Features Guide

This document explains how to use the AI-powered features of the Kanban board and how to get the most out of the DeepSeek-R1 integration.

## Available AI Features

The Kanban board leverages DeepSeek-R1's capabilities to provide the following AI-powered features:

### 1. Task Categorization

When creating a new task, the AI will analyze the task title and description to suggest appropriate categories.

**How to use:**
1. Start creating a new task by clicking the "Create Task" button
2. Fill in the title and description
3. Click "Get AI Suggestions"
4. The AI will analyze your task and suggest appropriate categories
5. You can accept or modify the suggestions before saving

### 2. Priority Recommendations

The AI analyzes project goals, task descriptions, deadlines, and team capacity to suggest appropriate priority levels for tasks.

**How to use:**
1. View the AI Dashboard by clicking "Show AI Insights"
2. Navigate to the "Insights & Recommendations" tab
3. Review the "Task Priority Recommendations" section
4. For each task with a recommended priority change, you'll see the current priority, suggested priority, and reasoning
5. You can implement these changes by editing the respective tasks

### 3. Team Member Assignment Suggestions

Based on team member skills, workloads, and past performance, the AI recommends who should handle each task.

**How to use:**
1. When creating or editing a task, after entering the title and description
2. Click "Get AI Suggestions"
3. The AI will recommend team members based on their skills and current workload
4. You can accept or modify the suggestion before saving

### 4. Deadline Estimation

The AI predicts realistic completion dates using historical data and task complexity.

**How to use:**
1. When creating a new task, after entering the title and description
2. Click "Get AI Suggestions"
3. The AI will analyze the task complexity and suggest a realistic deadline
4. You can accept or modify the suggested deadline

### 5. Workflow Optimizations

The AI identifies inconsistencies in how tasks are defined or progressed and suggests standardized approaches.

**How to use:**
1. View the AI Dashboard by clicking "Show AI Insights"
2. Navigate to the "Workflow Optimizations" tab
3. Review the suggested workflow improvements
4. Implement these recommendations at your team's discretion

### 6. Bottleneck Detection

The AI analyzes task movement patterns to identify bottlenecks in your workflow.

**How to use:**
1. View the AI Dashboard by clicking "Show AI Insights"
2. Navigate to the "Bottleneck Analysis" tab
3. Review detected bottlenecks, their severity, and recommended solutions
4. Address these bottlenecks to improve workflow efficiency

### 7. Project Predictions

The AI provides predictions about project completion, potential delays, and resource allocation.

**How to use:**
1. View the AI Dashboard by clicking "Show AI Insights"
2. Navigate to the "Predictive Analytics" tab
3. Review the project timeline, resource forecast, and risk assessment
4. Use this information for proactive project management

## Customizing AI Behavior

You can customize the AI's behavior by modifying the following parameters in your `.env` file:

```
# AI Configuration
ENABLE_AI=true              # Set to false to disable AI features completely

# LM Studio Configuration
LM_STUDIO_ENDPOINT=http://localhost:1234/v1
LM_STUDIO_MODEL=hermes-3-llama-3.1-8b
LM_STUDIO_TEMPERATURE=0.7   # Controls randomness (0.0-1.0)
LM_STUDIO_MAX_TOKENS=-1     # Maximum tokens to generate (-1 for no limit)
```

### Temperature

The `LM_STUDIO_TEMPERATURE` parameter controls how random or deterministic the AI's responses are:

- **Lower values (0.1-0.3)**: More deterministic, focused responses. Good for factual analysis and consistent recommendations.
- **Medium values (0.4-0.7)**: Balanced creativity and coherence. Recommended for most features.
- **Higher values (0.8-1.0)**: More creative, varied responses. May introduce more diversity but less consistency.

For most business applications, we recommend keeping this value between 0.5-0.7.

### Token Limit

The `LM_STUDIO_MAX_TOKENS` parameter controls the maximum length of the model's responses:

- **-1**: No limit (model will decide when to stop)
- **Specific number**: Limits response length (e.g., 200, 500, 1000)

A higher limit allows for more detailed explanations but may slow down response times.

## Troubleshooting AI Features

### AI Suggestions Not Working

If AI suggestions are not working:

1. Check that LM Studio is running and serving DeepSeek-R1 on the configured port
2. Verify your .env settings: `ENABLE_AI=true` and `USE_MOCK_AI=false`
3. Check the backend logs for any API errors
4. Ensure the model name in .env exactly matches the one in LM Studio

### AI Responses Are Too Slow

If AI responses are taking too long:

1. Try using a smaller/optimized model variant
2. Lower the `max_tokens` setting to generate shorter responses
3. Ensure no other resource-intensive applications are running
4. Check if your hardware meets the recommended specifications

### AI Suggestions Are Not Relevant

If AI suggestions don't seem relevant:

1. Make sure you're providing sufficient context in task descriptions
2. Try adjusting the temperature setting (lower for more deterministic results)
3. Ensure your team and task data is properly set up in the system
4. Remember that the AI improves as it sees more examples of your specific workflow

## Demo Mode

If you don't have LM Studio set up or prefer not to use AI, you can still explore the interface with mock data:

1. Set `USE_MOCK_AI=true` in your backend .env file
2. Restart the backend server
3. The interface will now display pre-generated mock recommendations

This is useful for demonstrations or when running on hardware that doesn't meet the requirements for local AI inference.