# Setting Up LM Studio with DeepSeek-R1

This guide will walk you through the process of setting up LM Studio and configuring it to run the DeepSeek-R1 model for the AI-Enabled Kanban Board.

## What is LM Studio?

LM Studio is a desktop application that allows you to run local large language models (LLMs) on your own computer. It provides an easy-to-use interface for downloading, managing, and running various open-source LLMs.

For our Kanban board, we'll be using LM Studio to run the DeepSeek-R1 model locally, ensuring all data remains secure on your own infrastructure.

## System Requirements

Running DeepSeek-R1 models requires a reasonably powerful computer:

- **Operating System**: Windows 10/11, macOS 10.15+, or Linux
- **RAM**: 16GB minimum, 32GB recommended
- **GPU**: 
  - For full model: NVIDIA GPU with 8GB+ VRAM (e.g., RTX 3060 or better)
  - For quantized model: NVIDIA GPU with 4GB+ VRAM or Apple Silicon
- **Storage**: At least 10GB free space for the model files

## Installation Steps

### 1. Download and Install LM Studio

1. Visit [LM Studio's website](https://lmstudio.ai/) and download the appropriate version for your operating system.
2. Install LM Studio by following the installation prompts.
3. Launch LM Studio after installation.

### 2. Download the DeepSeek-R1 Model

1. In LM Studio, click on the "Browse Models" tab in the left sidebar.
2. In the search bar, type "deepseek-r1" to find the DeepSeek-R1 models.
3. We recommend using the "hermes-3-llama-3.1-8b" model for a good balance of performance and resource usage.
4. Click on the model name, then click "Download" to start downloading the model.
5. Wait for the download to complete (this may take some time depending on your internet connection).

### 3. Set Up the Local Server

1. Once the model is downloaded, it will appear in your "Library" tab.
2. Select the DeepSeek-R1 model from your library.
3. Click on the "Local Server" button in the top-right corner.
4. Configure the server settings:
   - Host: `127.0.0.1` (localhost)
   - Port: `1234` (or another port if 1234 is in use)
   - Context Length: `4096` (recommended)
   - Temperature: `0.7` (default, can be adjusted)
   - Model: Ensure the DeepSeek-R1 model is selected

5. Click "Start Server" to launch the API server.
6. You should see a message indicating the server is running.

### 4. Verify the Server is Working

1. With the server running, open a new terminal or command prompt.
2. Test the API with a simple curl command:

   ```bash
   curl http://localhost:1234/v1/chat/completions \
     -H "Content-Type: application/json" \
     -d '{
       "model": "hermes-3-llama-3.1-8b",
       "messages": [
         {"role": "system", "content": "You are a helpful assistant."},
         {"role": "user", "content": "Hello, can you hear me?"}
       ],
       "temperature": 0.7
     }'
   ```

3. You should receive a JSON response with the model's reply.

## Configuring the Kanban Board

Once LM Studio is running properly, you need to configure the Kanban board application to use it:

1. Make sure your backend `.env` file has the following settings:

   ```
   # AI Configuration
   ENABLE_AI=true


   # LM Studio Configuration
   LM_STUDIO_ENDPOINT=http://localhost:1234/v1
   LM_STUDIO_MODEL=hermes-3-llama-3.1-8b
   LM_STUDIO_TEMPERATURE=0.7
   LM_STUDIO_MAX_TOKENS=-1
   ```

2. Ensure the port number in `LM_STUDIO_ENDPOINT` matches the port you configured in LM Studio.
3. Make sure the model name in `LM_STUDIO_MODEL` matches exactly the model you have running in LM Studio.

## Troubleshooting

### Server Won't Start

- Check if another application is using port 1234. Try changing to a different port.
- Ensure your GPU drivers are up to date.
- Make sure you have enough free RAM and VRAM for the model.

### Slow Response Times

- Try a smaller model (e.g., the 8B variant instead of the 13B variant).
- Lower the context window size in LM Studio settings.
- Use a quantized model version (GGUF Q4_K_M) for better performance on limited hardware.

### Connection Errors

- Ensure LM Studio server is running when you start the backend.
- Check the port number in your .env file matches the LM Studio server port.
- Verify there are no firewall rules blocking the connection.

### Out of Memory Errors

- Close other memory-intensive applications.
- Try a smaller or more optimized model variant.
- Reduce the context window size.

## Running Multiple Models

If you want to experiment with different models:

1. Download multiple models in LM Studio's library.
2. When switching models:
   - Stop the current server
   - Select a different model from your library
   - Start the server again with the new model
   - Update the `LM_STUDIO_MODEL` value in your .env file

## Resources

- [LM Studio Documentation](https://lmstudio.ai/docs)
- [DeepSeek-R1 GitHub Repository](https://github.com/deepseek-ai)
- [OpenAI API Compatibility](https://platform.openai.com/docs/api-reference/chat) (LM Studio implements this API format)