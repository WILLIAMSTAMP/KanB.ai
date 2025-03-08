/**
 * Authentication Routes
 * Routes for authentication operations
 */
const express = require('express');
const router = express.Router();

/**
 * @route POST /api/auth/login
 * @description Log in a user
 * @access Public
 */
router.post('/login', (req, res) => {
  // Mock login functionality
  const { username, password } = req.body;
  
  // In a real app, we would validate credentials against the database
  if (username && password) {
    // Return mock user and token
    res.status(200).json({
      user: {
        id: 1,
        username: 'developer',
        name: 'Developer User',
        role: 'admin'
      },
      token: 'mock-jwt-token-for-development'
    });
  } else {
    res.status(400).json({
      status: 'error',
      message: 'Username and password are required'
    });
  }
});

/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */
router.post('/register', (req, res) => {
  // Mock registration functionality
  const { username, password, name } = req.body;
  
  // In a real app, we would validate input and create a new user
  if (username && password && name) {
    // Return mock created user and token
    res.status(201).json({
      user: {
        id: 4, // Mock new user ID
        username,
        name,
        role: 'user'
      },
      token: 'mock-jwt-token-for-development'
    });
  } else {
    res.status(400).json({
      status: 'error',
      message: 'Username, password, and name are required'
    });
  }
});

/**
 * @route POST /api/auth/logout
 * @description Log out a user
 * @access Public
 */
router.post('/logout', (req, res) => {
  // In a real app with JWT, the client would simply discard the token
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

module.exports = router;