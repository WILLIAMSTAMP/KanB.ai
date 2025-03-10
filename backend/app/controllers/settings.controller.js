const fs = require('fs');
const path = require('path');

// Path to the .env file
const envPath = path.resolve(__dirname, '../../.env');

/**
 * Get the current LLM URL from the .env file
 */
exports.getLlmUrl = async (req, res) => {
  try {
    // Read the .env file
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Find the LM_STUDIO_ENDPOINT line
    const llmUrlMatch = envContent.match(/LM_STUDIO_ENDPOINT=(.+)/);
    const llmUrl = llmUrlMatch ? llmUrlMatch[1] : 'http://localhost:1234/v1';
    
    res.status(200).json({ llmUrl });
  } catch (error) {
    console.error('Error reading LLM URL:', error);
    res.status(500).json({ message: 'Error reading LLM URL configuration' });
  }
};

/**
 * Update the LLM URL in the .env file
 */
exports.updateLlmUrl = async (req, res) => {
  try {
    const { llmUrl } = req.body;
    
    if (!llmUrl) {
      return res.status(400).json({ message: 'LLM URL is required' });
    }
    
    // Read the current .env file
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update or add the LM_STUDIO_ENDPOINT line
    if (envContent.includes('LM_STUDIO_ENDPOINT=')) {
      envContent = envContent.replace(
        /LM_STUDIO_ENDPOINT=.+/,
        `LM_STUDIO_ENDPOINT=${llmUrl}`
      );
    } else {
      envContent += `\nLM_STUDIO_ENDPOINT=${llmUrl}`;
    }
    
    // Write the updated content back to the .env file
    fs.writeFileSync(envPath, envContent);
    
    res.status(200).json({ message: 'LLM URL updated successfully' });
  } catch (error) {
    console.error('Error updating LLM URL:', error);
    res.status(500).json({ message: 'Error updating LLM URL configuration' });
  }
}; 