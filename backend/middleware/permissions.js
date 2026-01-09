/**
 * Permission-based Authorization Middleware
 * Provides secure route protection based on user permissions
 */

const { hasPermission } = require('../utils/permissions');

/**
 * Middleware to check if user has required permission
 * @param {string|string[]} requiredPermissions - Permission(s) required to access route
 * @returns {Function} Express middleware function
 */
const requirePermission = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ msg: 'Authentication required' });
      }

      // Convert single permission to array
      const permissions = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions];

      // Check if user has any of the required permissions
      const hasRequiredPermission = permissions.some(permission =>
        hasPermission(req.user, permission)
      );

      if (!hasRequiredPermission) {
        return res.status(403).json({ msg: 'Insufficient permissions' });
      }

      next();
    } catch (err) {
      console.error('Permission check error:', err.message);
      res.status(500).json({ msg: 'Authorization error' });
    }
  };
};

/**
 * Convenience middleware for common permission checks
 */
const requireAdmin = requirePermission('manage_users');
const requireTeacher = requirePermission(['enter_grades', 'view_students']);
const requireStudent = requirePermission('view_own_grades');
const requireParent = requirePermission('view_child_grades');

module.exports = {
  requirePermission,
  requireAdmin,
  requireTeacher,
  requireStudent,
  requireParent
};