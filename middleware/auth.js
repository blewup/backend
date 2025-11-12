const AuthUtils = require('../utils/auth');
const { User } = require('../models');

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }

    const decoded = AuthUtils.verifyToken(token);
    if (!decoded) {
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Get full user object from database
    const user = await User.findByPk(decoded.sub);
    if (!user || !user.is_active) {
      return res.status(403).json({
        error: 'User account is inactive or not found',
        code: 'INVALID_USER'
      });
    }

    // Attach full user object and permissions to request
    req.user = user;
    req.userPermissions = AuthUtils.getPermissionsForUserType(user.user_type);
    
    next();
  } catch (error) {
    next(error);
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
      req.userId = decoded.userId || decoded.sub;
    }
  }

  next();
}

function requirePermission(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (AuthUtils.isSuperAdmin(req.user)) {
      return next(); // Super admin has all permissions
    }

    if (!AuthUtils.hasPermission(req.user, permissions)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permissions,
        current: req.userPermissions
      });
    }

    next();
  };
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (AuthUtils.isSuperAdmin(req.user)) {
      return next(); // Super admin has all roles
    }

    if (!roles.includes(req.user.user_type)) {
      return res.status(403).json({ 
        error: 'Insufficient role',
        required: roles,
        current: req.user.user_type
      });
    }

    next();
  };
}

function requireSuperAdmin(req, res, next) {
  if (!req.user || !AuthUtils.isSuperAdmin(req.user)) {
    return res.status(403).json({
      error: 'Super admin access required',
      code: 'SUPER_ADMIN_REQUIRED'
    });
  }
  next();
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requirePermission,
  requireSuperAdmin
};