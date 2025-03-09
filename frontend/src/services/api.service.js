/**
 * API Service
 * Centralized service for API calls
 */
import axios from 'axios';
import io from 'socket.io-client';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5004/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000 // Increase timeout to 60 seconds for AI requests
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token') || 'mock-jwt-token-for-development';
    if (token) {
      config.headers['x-access-token'] = token;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 errors (unauthorized) by redirecting to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
const authService = {
  login: credentials => apiClient.post('/auth/login', credentials),
  register: userData => apiClient.post('/auth/register', userData),
  refreshToken: () => apiClient.post('/auth/refresh-token'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

// Task services
const taskService = {
  getAll: async () => {
    try {
      console.log('Fetching all tasks from API...');
      const response = await apiClient.get('/tasks');
      console.log('Tasks API response:', response);
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn('API returned non-array data for tasks:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  },
  
  getTaskById: async (id) => {
    try {
      const response = await apiClient.get(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching task ${id}:`, error);
      throw error;
    }
  },
  
  createTask: async (taskData) => {
    try {
      // Add validation for required fields
      if (!taskData.title) {
        throw new Error('Task title is required');
      }
      
      const response = await apiClient.post('/tasks', taskData);
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      
      // Check for specific error types
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Server error:', error.response.status, error.response.data);
        
        // Handle specific status codes
        if (error.response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (error.response.status === 400) {
          throw new Error(error.response.data.message || 'Invalid task data');
        }
      }
      
      throw error;
    }
  },
  
  updateTask: async (id, taskData) => {
    try {
      const response = await apiClient.put(`/tasks/${id}`, taskData);
      return response.data;
    } catch (error) {
      console.error(`Error updating task ${id}:`, error);
      throw error;
    }
  },
  
  deleteTask: async (id) => {
    try {
      const response = await apiClient.delete(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting task ${id}:`, error);
      throw error;
    }
  },
  
  moveTask: async (id, status) => {
    try {
      const response = await apiClient.patch(`/tasks/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error moving task ${id} to ${status}:`, error);
      throw error;
    }
  },
  
  getTaskHistory: async (id) => {
    try {
      const response = await apiClient.get(`/tasks/${id}/history`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching history for task ${id}:`, error);
      return [];
    }
  },
  
  getAiSuggestions: async (taskData) => {
    try {
      console.log('Sending AI suggestions request:', JSON.stringify(taskData, null, 2));
      const response = await apiClient.post('/ai/task-suggestions', taskData);
      console.log('AI suggestions response received:', JSON.stringify(response.data, null, 2));
      return response.data; // Return the data property, not the entire response
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      } else if (error.request) {
        console.error('No response received from server');
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      // Rethrow the error to be handled by the caller
      throw error;
    }
  },
  
  findAll: () => apiClient.get('/tasks'),
  findOne: id => apiClient.get(`/tasks/${id}`),
  
  create: (taskData, onUploadProgress) => {
    // If taskData is already FormData, use it directly
    if (taskData instanceof FormData) {
      return apiClient.post('/tasks', taskData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress
      });
    }
    
    // Otherwise, convert to FormData
    const formData = new FormData();
    Object.keys(taskData).forEach(key => {
      if (taskData[key] !== undefined && taskData[key] !== null) {
        formData.append(key, taskData[key]);
      }
    });
    
    return apiClient.post('/tasks', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    });
  },
  
  update: (id, taskData, onUploadProgress) => {
    // If taskData is already FormData, use it directly
    if (taskData instanceof FormData) {
      return apiClient.put(`/tasks/${id}`, taskData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress
      });
    }
    
    // Otherwise, convert to FormData
    const formData = new FormData();
    Object.keys(taskData).forEach(key => {
      if (taskData[key] !== undefined && taskData[key] !== null) {
        formData.append(key, taskData[key]);
      }
    });
    
    return apiClient.put(`/tasks/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    });
  },
  
  updateStatus: (id, status) => apiClient.patch(`/tasks/${id}/status`, { status }),
  delete: id => apiClient.delete(`/tasks/${id}`),
  getHistory: id => apiClient.get(`/tasks/${id}/history`),
  deleteFile: (taskId, filename) => apiClient.delete(`/tasks/${taskId}/files/${filename}`)
};

// User services
const userService = {
  getAllUsers: async () => {
    // Perform the GET request
    const response = await apiClient.get('/users');
    // Return only the data array
    return response.data;
  },
  getUserById: id => apiClient.get(`/users/${id}`),
  updateUser: (id, userData) => apiClient.put(`/users/${id}`, userData),
  deleteUser: id => apiClient.delete(`/users/${id}`),
  changePassword: passwordData => apiClient.post('/users/change-password', passwordData),
  updateProfile: profileData => apiClient.put('/users/profile', profileData)
};

// AI services
const aiService = {
  getTaskPriorities: async () => {
    const response = await apiClient.get('/ai/priorities');
    return response.data; // Return just the array
  },
  getWorkflowImprovements: async () => {
    const response = await apiClient.get('/ai/workflow-improvements');
    return response.data;
  },
  
  getBottlenecks: async () => {
    const response = await apiClient.get('/ai/bottlenecks');
    return response.data;
  },
  
  getPredictions: async () => {
    const response = await apiClient.get('/ai/predictions');
    return response.data;
  },
  getQueryResponse: (query, taskId = null) => 
    apiClient.post('/ai/query', { query, taskId })
};

// Socket service for real-time updates
const socketService = {
  socket: null,
  
  initialize: () => {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5004';
    
    if (!socketService.socket) {
      socketService.socket = io(socketUrl, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      
      // Log connection status
      socketService.socket.on('connect', () => {
        console.log('Socket connected');
      });
      
      socketService.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
      
      socketService.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }
    
    return socketService.socket;
  },
  
  disconnect: () => {
    if (socketService.socket) {
      socketService.socket.disconnect();
      socketService.socket = null;
    }
  }
};

// Check if the API is available
const checkConnection = async () => {
  try {
    const response = await apiClient.get('/health', {
      timeout: 3000,
      // Retry logic for better reliability
      retry: 2,
      retryDelay: 500
    });
    return response.status === 200;
  } catch (error) {
    console.warn('API connection check failed:', error);
    // Log more detailed error information for debugging
    if (error.response) {
      console.warn('Error response:', error.response.status, error.response.data);
    } else if (error.request) {
      console.warn('No response received:', error.request);
    } else {
      console.warn('Error setting up request:', error.message);
    }
    return false;
  }
};

// Export all services
const apiService = {
  auth: authService,
  tasks: taskService,
  users: userService,
  ai: aiService,
  socket: socketService,
  checkConnection
};

export default apiService;