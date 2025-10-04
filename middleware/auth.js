const jwt = require('jsonwebtoken');
const Account = require('../models/accounts');

// JWT Secret - should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authentication middleware - verifies JWT token
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    req.user = null;
    req.role = 'unregistered';
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const account = await Account.findOne({ Uid: decoded.uid });
    
    if (!account) {
      req.user = null;
      req.role = 'unregistered';
      return next();
    }

    req.user = account;
    req.role = account.AccountType || 'user';
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    req.user = null;
    req.role = 'unregistered';
    next();
  }
};

/**
 * Authorization middleware - checks if user has required role
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user && !allowedRoles.includes('unregistered')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    if (req.user && !allowedRoles.includes(req.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

/**
 * Resource ownership middleware - checks if user owns the resource
 */
const requireOwnership = (resourceIdParam = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    const resourceId = req.params[resourceIdParam];
    
    // For now, we'll implement basic ownership checks
    // This can be enhanced based on specific resource requirements
    if (req.user._id.toString() !== resourceId && req.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You can only access your own resources'
      });
    }

    next();
  };
};

/**
 * Admin-only middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required',
      message: 'This action requires administrator privileges'
    });
  }
  next();
};

/**
 * Generate JWT token
 */
const generateToken = (account) => {
  return jwt.sign(
    { 
      uid: account.Uid,
      role: account.AccountType,
      email: account.Email
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOwnership,
  requireAdmin,
  generateToken
};

