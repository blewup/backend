const { createAppError } = require('../middleware/errorHandler');

/**
 * Wraps an async route handler with error handling
 * @param {Function} handler - The async route handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (handler) => {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Checks if a user has the required roles or permissions
 * @param {Array<string>} roles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
const checkRoles = (roles) => {
  return (req, res, next) => {
    if (!req.userId) {
      throw createAppError('AuthenticationError', 'Authentication required');
    }

    if (!roles.includes(req.userRole)) {
      throw createAppError('AuthorizationError', 'Insufficient permissions');
    }
    next();
  };
};

/**
 * Validates resource ownership
 * @param {Function} getResourceOwner - Function to get the resource owner ID
 * @returns {Function} Express middleware function
 */
const checkOwnership = (getResourceOwner) => {
  return async (req, res, next) => {
    if (!req.userId) {
      throw createAppError('AuthenticationError', 'Authentication required');
    }

    const ownerId = await getResourceOwner(req);
    
    if (req.userId !== ownerId) {
      throw createAppError('AuthorizationError', 'Resource access denied');
    }
    next();
  };
};

/**
 * Validates the existence of required request parameters
 * @param {Array<string>} params - Array of required parameter names
 * @returns {Function} Express middleware function
 */
const validateParams = (params) => {
  return (req, res, next) => {
    const missing = params.filter(param => {
      const value = req.params[param] || req.query[param] || req.body[param];
      return value === undefined || value === null || value === '';
    });

    if (missing.length > 0) {
      throw createAppError('ValidationError', 'Missing required parameters', {
        missing,
        message: `Required parameters missing: ${missing.join(', ')}`
      });
    }
    next();
  };
};

/**
 * Rate limiting middleware
 * @param {Object} options - Rate limiting options
 * @returns {Function} Express middleware function
 */
const rateLimit = (options = { windowMs: 60000, max: 100 }) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - options.windowMs;
    
    // Clean up old requests
    requests.forEach((timestamps, ip) => {
      requests.set(ip, timestamps.filter(time => time > windowStart));
    });

    // Get user's requests in the current window
    const userRequests = requests.get(key) || [];
    requests.set(key, userRequests);

    // Check rate limit
    if (userRequests.length >= options.max) {
      throw createAppError('RateLimitError', 'Too many requests', {
        retryAfter: Math.ceil((windowStart + options.windowMs - now) / 1000)
      });
    }

    // Add current request
    userRequests.push(now);
    next();
  };
};

module.exports = {
  asyncHandler,
  checkRoles,
  checkOwnership,
  validateParams,
  rateLimit
};