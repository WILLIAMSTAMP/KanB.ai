/**
 * User Routes
 * Routes for user management operations
 */
const express = require('express');
const router = express.Router();
const { authJwt } = require('../middleware');

const userController = require('../controllers/user.controller');

/**
 * @route GET /api/users/profile
 * @description Get current user profile
 * @access Private
 */
router.get('/profile', authJwt.verifyToken, (req, res) => {
  // Return the mock user information from the auth middleware
  res.status(200).json({
    id: req.user.id,
    username: req.user.username,
    name: req.user.name,
    role: req.user.role
  });
});

// GET all users
router.get('/', userController.findAll);

// Get all users
router.get('/', authJwt.verifyToken, userController.findAll);
/**
 * @route GET /api/users
 * @description Get all users
 * @access Private
 */
// router.get('/', authJwt.verifyToken, (req, res) => {
//   // Return a mock list of users
//   res.status(200).json([
//     {
//       id: 1,
//       username: 'developer',
//       name: 'Developer User',
//       role: 'admin'
//     },
//     {
//       id: 2,
//       username: 'designer',
//       name: 'Designer User',
//       role: 'user'
//     },
//     {
//       id: 3,
//       username: 'manager',
//       name: 'Project Manager',
//       role: 'manager'
//     }
//   ]);
// });

module.exports = router;