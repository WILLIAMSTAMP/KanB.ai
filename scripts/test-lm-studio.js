/**
 * LM Studio Connection Test Script
 * 
 * This script tests the connection to LM Studio and verifies that the DeepSeek-R1 model
 * is responding correctly. It simulates the same API calls that the Kanban board makes.
 * 
 * Usage:
 * 1. Make sure LM Studio is running with DeepSeek-R1 model on port 1234
 * 2. Run this script with: node scripts/test-lm-studio.js
 */

const axios = require('axios');
require('dotenv').config({ path: process.env.ENV_FILE || './backend/.env' });

// Get configuration from environment variables or use defaults
const LM_STUDIO_ENDPOINT = process.env.LM_STUDIO_ENDPOINT || 'http://localhost:1234/v1';
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || 'hermes-3-llama-3.1-8b';
const TEMPERATURE = parseFloat(process.env.LM_STUDIO_TEMPERATURE || '0.7');
const MAX_TOKENS = parseInt(process.env.LM_STUDIO_MAX_TOKENS || '-1');

console.log('=== LM Studio Connection Test ===');
console.log(`Endpoint: ${LM_STUDIO_ENDPOINT}`);
console.log(`Model: ${LM_STUDIO_MODEL}`);
console.log(`Temperature: ${TEMPERATURE}`);
console.log(`Max Tokens: ${MAX_TOKENS}`);
console.log('');

/**
 * Test the connection to LM Studio with a simple query
 */
async function testConnection() {
  console.log('Testing connection to LM Studio...');
  
  try {
    // Basic system and user messages
    const systemPrompt = 'You are an AI assistant for a Kanban board application. Provide helpful, concise responses.';
    const userPrompt = 'What categories would you suggest for a task titled "Design firmware update for cardiac monitor"?';
    
    console.log('Sending test request...');
    console.log(`System: ${systemPrompt}`);
    console.log(`User: ${userPrompt}`);
    console.log('');
    
    // Send request to LM Studio
    const startTime = Date.now();
    const response = await axios.post(`${LM_STUDIO_ENDPOINT}/chat/completions`, {
      model: LM_STUDIO_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
      stream: false
    });
    
    const endTime = Date.now();
    const responseTimeMs = endTime - startTime;
    
    // Display results
    console.log('=== Response ===');
    console.log(`Status: ${response.status}`);
    console.log(`Response Time: ${responseTimeMs}ms`);
    console.log('');
    
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const content = response.data.choices[0].message.content;
      console.log('AI Response:');
      console.log('--------------');
      console.log(content);
      console.log('--------------');
      console.log('');
      
      // All looking good!
      console.log('✅ Connection test successful!');
      console.log('');
      console.log('Your LM Studio integration is working correctly.');
      console.log('You can now run the Kanban board application with AI features enabled.');
    } else {
      console.log('❌ Received an unexpected response format:');
      console.log(JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('❌ Connection test failed!');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(`Status: ${error.response.status}`);
      console.log('Response data:');
      console.log(JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // The request was made but no response was received
      console.log('No response received from LM Studio. Is the server running?');
      console.log('Check that LM Studio is running and the server is started on port 1234.');
    } else {
      // Something happened in setting up the request
      console.log('Error:', error.message);
    }
    
    console.log('');
    console.log('Troubleshooting steps:');
    console.log('1. Make sure LM Studio is installed and running');
    console.log('2. Verify that you have started the server in LM Studio');
    console.log('3. Check that the DeepSeek-R1 model is loaded in LM Studio');
    console.log('4. Confirm that the server is running on port 1234 (or update LM_STUDIO_ENDPOINT)');
    console.log('5. Ensure that the model name in your .env file matches exactly the name in LM Studio');
  }
}

// Run the test
testConnection();