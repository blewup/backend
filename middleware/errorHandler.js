class AppError extends Error {
  constructor(message, status, code = 'UNKNOWN_ERROR', details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorTypes = {
  ValidationError: {
    status: 400,
    code: 'VALIDATION_ERROR'
  },
  AuthenticationError: {
    status: 401,
    code: 'AUTHENTICATION_ERROR'
  },
  AuthorizationError: {
    status: 403,
    code: 'AUTHORIZATION_ERROR'
  },
  NotFoundError: {
    status: 404,
    code: 'NOT_FOUND_ERROR'
  },
  ConflictError: {
    status: 409,
    code: 'CONFLICT_ERROR'
  },
  RateLimitError: {
    status: 429,
    code: 'RATE_LIMIT_ERROR'
  },
  DatabaseError: {
    status: 500,
    code: 'DATABASE_ERROR'
  }
};

const createAppError = (type, message, details = null) => {
  const errorType = errorTypes[type];
  if (!errorType) {
    throw new Error(`Unknown error type: ${type}`);
  }
  return new AppError(message, errorType.status, errorType.code, details);
};

const errorHandler = (err, req, res, next) => {
  // Log the error with context
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.userId,
    requestId: req.id
  });

  // Default error structure
  let error = {
    status: err.status || 500,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'Internal Server Error',
    details: err.details || null
  };

  // Handle specific error types
  if (err instanceof AppError) {
    error = {
      status: err.status,
      code: err.code,
      message: err.message,
      details: err.details
    };
  } else if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    error = {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation Error',
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message,
        type: e.type,
        value: e.value
      }))
    };
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    error = {
      status: 400,
      code: 'INVALID_REFERENCE',
      message: 'Invalid Reference',
      details: [{
        field: err.fields[0],
        message: 'Referenced record does not exist',
        constraint: err.index
      }]
    };
  } else if (err.name === 'SequelizeDatabaseError') {
    error = {
      status: 500,
      code: 'DATABASE_ERROR',
      message: 'Database Error',
      details: process.env.NODE_ENV === 'development' ? {
        name: err.name,
        sql: err.sql,
        parameters: err.parameters
      } : null
    };
  } else if (err.name === 'JsonWebTokenError') {
    error = {
      status: 401,
      code: 'INVALID_TOKEN',
      message: 'Invalid or malformed token',
      details: { type: err.name }
    };
  } else if (err.name === 'TokenExpiredError') {
    error = {
      status: 401,
      code: 'TOKEN_EXPIRED',
      message: 'Token has expired',
      details: { 
        expiredAt: err.expiredAt,
        type: err.name
      }
    };
  }

  // Add request tracking info
  error.requestId = req.id;
  
  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
  }

  // Send error response
  res.status(error.status).json({
    success: false,
    error
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 404,
      message: 'Route not found'
    }
  });
};

module.exports = {
  AppError,
  createAppError,
  errorHandler,
  notFoundHandler,
  errorTypes
};