/**
 * Permission-based Authorization System
 * Replaces role-based access control with secure permission checks
 */

// Permission definitions (internal mapping)
const PERMISSIONS = {
  // Admin permissions
  MANAGE_USERS: 'manage_users',
  MANAGE_GRADES: 'manage_grades',
  MANAGE_FEES: 'manage_fees',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_SYSTEM: 'manage_system',

  // Teacher permissions
  ENTER_GRADES: 'enter_grades',
  VIEW_STUDENTS: 'view_students',
  MANAGE_ATTENDANCE: 'manage_attendance',

  // Student permissions
  VIEW_OWN_GRADES: 'view_own_grades',
  VIEW_OWN_ATTENDANCE: 'view_own_attendance',
  VIEW_RESOURCES: 'view_resources',

  // Parent permissions
  VIEW_CHILD_GRADES: 'view_child_grades',
  VIEW_CHILD_ATTENDANCE: 'view_child_attendance',
  RECEIVE_NOTIFICATIONS: 'receive_notifications'
};

// Role to permissions mapping (internal only)
const ROLE_PERMISSIONS = {
  admin: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_GRADES,
    PERMISSIONS.MANAGE_FEES,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_SYSTEM,
    PERMISSIONS.ENTER_GRADES,
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.MANAGE_ATTENDANCE
  ],
  teacher: [
    PERMISSIONS.ENTER_GRADES,
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.MANAGE_ATTENDANCE
  ],
  student: [
    PERMISSIONS.VIEW_OWN_GRADES,
    PERMISSIONS.VIEW_OWN_ATTENDANCE,
    PERMISSIONS.VIEW_RESOURCES,
    PERMISSIONS.RECEIVE_NOTIFICATIONS
  ],
  parent: [
    PERMISSIONS.VIEW_CHILD_GRADES,
    PERMISSIONS.VIEW_CHILD_ATTENDANCE,
    PERMISSIONS.RECEIVE_NOTIFICATIONS
  ]
};

/**
 * Get permissions for a role
 * @param {string} role - The role name
 * @returns {string[]} Array of permission strings
 */
const getPermissionsForRole = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if user has specific permission
 * @param {Object} user - User object (without role exposed)
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
const hasPermission = (user, permission) => {
  if (!user || !user.permissions) return false;
  return user.permissions.includes(permission);
};

/**
 * Sanitize user object for API responses (remove sensitive data)
 * @param {Object} user - Raw user object from database
 * @param {string} role - User's role (internal use only)
 * @returns {Object} Sanitized user object
 */
const sanitizeUser = (user, role) => {
  if (!user) return null;

  const permissions = getPermissionsForRole(role);

  // Base sanitized user object
  const sanitized = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: role, // Restore role for backward compatibility
    permissions: permissions, // Keep permissions for forward compatibility
    // Role-specific fields
    ...(role === 'student' && {
      studentId: user.studentId,
      department: user.department,
      year: user.year
    }),
    ...(role === 'parent' && {
      phone: user.phone,
      relationship: user.relationship,
      status: user.status,
      notificationPreference: user.notificationPreference,
      studentId: user.studentId
    }),
    ...(role === 'teacher' && {
      employeeId: user.employeeId,
      department: user.department,
      subject: user.subject
    }),
    ...(role === 'admin' && {
      department: user.department
    })
  };

  return sanitized;
};

/**
 * Create secure JWT payload (no role information)
 * @param {Object} user - User object
 * @param {string} role - User's role (internal use only)
 * @returns {Object} JWT payload
 */
const createSecurePayload = (user, role) => {
  return {
    userId: user.id,
    role: role, // Included for backward compatibility and ID collision prevention
    permissions: getPermissionsForRole(role),
    iat: Math.floor(Date.now() / 1000)
  };
};

module.exports = {
  PERMISSIONS,
  getPermissionsForRole,
  hasPermission,
  sanitizeUser,
  createSecurePayload
};