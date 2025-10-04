/**
 * Permission definitions for different roles
 */
const PERMISSIONS = {
  // Content Reading Permissions
  READ_PUBLIC_CONTENT: ['admin', 'user', 'unregistered'],
  READ_PRIVATE_CONTENT: ['admin', 'user'],
  READ_ADMIN_CONTENT: ['admin'],

  // Content Creation Permissions
  CREATE_VIDEOS: ['admin', 'user'],
  CREATE_COMBOS: ['admin', 'user'],
  CREATE_ARTICLES: ['admin', 'user'],
  CREATE_NOTES: ['admin', 'user'],
  CREATE_COLLECTIONS: ['admin', 'user'],
  CREATE_MONTAGES: ['admin', 'user'],
  CREATE_EVENTS: ['admin'],
  CREATE_TOURNAMENTS: ['admin'],
  CREATE_PLAYERS: ['admin'],
  CREATE_CHARACTERS: ['admin'],
  CREATE_GAMES: ['admin'],

  // Content Modification Permissions
  UPDATE_OWN_CONTENT: ['admin', 'user'],
  UPDATE_ANY_CONTENT: ['admin'],
  DELETE_OWN_CONTENT: ['admin', 'user'],
  DELETE_ANY_CONTENT: ['admin'],

  // User Management Permissions
  MANAGE_USERS: ['admin'],
  VIEW_USER_DATA: ['admin'],
  MODERATE_CONTENT: ['admin'],

  // System Permissions
  SYSTEM_CONFIG: ['admin'],
  BULK_OPERATIONS: ['admin'],
  DATA_EXPORT: ['admin']
};

/**
 * Check if a role has a specific permission
 */
const hasPermission = (role, permission) => {
  if (!PERMISSIONS[permission]) {
    return false;
  }
  return PERMISSIONS[permission].includes(role);
};

/**
 * Middleware to check specific permissions
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      // Check if unregistered users can access this permission
      if (hasPermission('unregistered', permission)) {
        return next();
      }
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    if (!hasPermission(req.role, permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};

/**
 * Resource-specific permission checks
 */
const canAccessResource = (user, resource, action) => {
  if (!user) {
    return action === 'read' && hasPermission('unregistered', 'READ_PUBLIC_CONTENT');
  }

  const role = user.AccountType || 'user';
  
  switch (action) {
    case 'read':
      return hasPermission(role, 'READ_PUBLIC_CONTENT');
    case 'create':
      return hasPermission(role, `CREATE_${resource.toUpperCase()}`);
    case 'update':
      return hasPermission(role, 'UPDATE_ANY_CONTENT') || 
             (hasPermission(role, 'UPDATE_OWN_CONTENT') && isOwner(user, resource));
    case 'delete':
      return hasPermission(role, 'DELETE_ANY_CONTENT') || 
             (hasPermission(role, 'DELETE_OWN_CONTENT') && isOwner(user, resource));
    default:
      return false;
  }
};

/**
 * Check if user owns a resource
 */
const isOwner = (user, resource) => {
  // This is a simplified check - you'll need to implement based on your resource structure
  return resource.createdBy && resource.createdBy.toString() === user._id.toString();
};

/**
 * Get user's accessible resources based on role
 */
const getAccessibleResources = (role) => {
  const resources = [];
  
  Object.keys(PERMISSIONS).forEach(permission => {
    if (PERMISSIONS[permission].includes(role)) {
      resources.push(permission);
    }
  });
  
  return resources;
};

module.exports = {
  PERMISSIONS,
  hasPermission,
  requirePermission,
  canAccessResource,
  isOwner,
  getAccessibleResources
};

