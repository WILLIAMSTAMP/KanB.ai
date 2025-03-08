/**
 * Authentication Middleware
 *
 * For development purposes, this middleware simply passes through all requests.
 * In a production environment, this should be replaced with proper JWT or session-based authentication.
 */

/**
 * Verify token middleware function
 * For now, this simply attaches a mock user to the request and allows all requests through
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const verifyToken = (req, res, next) => {
  // For development: attach mock user to request
  req.user = {
    id: 1,
    username: 'developer',
    role: 'admin',
    name: 'Developer User'
  };
  
  // Allow request to proceed
  next();
};

// Alias authenticate to verifyToken for backward compatibility
const authenticate = verifyToken;

module.exports = {
  verifyToken,
  authenticate
};