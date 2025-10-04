/**
 * Utility functions for handling query parameters
 */

/**
 * Parse and validate limit parameter from request query
 * @param {Object} req - Express request object
 * @param {number} defaultLimit - Default limit if not specified (default: 10)
 * @param {number} maxLimit - Maximum allowed limit (default: 100)
 * @returns {number} - Validated limit value
 */
function parseLimit(req, defaultLimit = 10, maxLimit = 100) {
  const limit = parseInt(req.query.limit);
  
  // If no limit specified, use default
  if (isNaN(limit)) {
    return defaultLimit;
  }
  
  // Ensure limit is positive
  if (limit <= 0) {
    return defaultLimit;
  }
  
  // Cap at maximum limit to prevent performance issues
  if (limit > maxLimit) {
    return maxLimit;
  }
  
  return limit;
}

/**
 * Parse and validate skip parameter from request query
 * @param {Object} req - Express request object
 * @returns {number} - Validated skip value
 */
function parseSkip(req) {
  const skip = parseInt(req.query.skip);
  return isNaN(skip) || skip < 0 ? 0 : skip;
}

/**
 * Parse and validate sort parameter from request query
 * @param {Object} req - Express request object
 * @param {string} defaultSort - Default sort field
 * @returns {string} - Validated sort field
 */
function parseSort(req, defaultSort = '_id') {
  return req.query.sort || defaultSort;
}

/**
 * Parse sort parameter and return sort object with direction
 * @param {Object} req - Express request object
 * @param {string} defaultSort - Default sort field
 * @param {number} defaultDirection - Default sort direction (1 for asc, -1 for desc)
 * @returns {Object} - Sort object for MongoDB
 */
function parseSortWithDirection(req, defaultSort = '_id', defaultDirection = -1) {
  const sortField = req.query.sort || defaultSort;
  const direction = req.query.sortDirection === 'asc' ? 1 : defaultDirection;
  return { [sortField]: direction };
}

module.exports = {
  parseLimit,
  parseSkip,
  parseSort,
  parseSortWithDirection
};
