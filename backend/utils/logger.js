const AuditLog = require('../models/AuditLog');

/**
 * Log a system action
 * @param {Object} params - Log parameters
 * @param {string} params.action - Action name (e.g., 'LOGIN', 'UPDATE_GRADE')
 * @param {Object} [params.req] - Express request object (to extract user info & IP)
 * @param {number} [params.userId] - ID of user performing action (if not in req)
 * @param {string} [params.userRole] - Role of user (if not in req)
 * @param {string} [params.details] - Description or JSON details
 * @param {string} [params.resourceId] - ID of affected resource
 */
const logAction = async ({ action, req, userId, userRole, details, resourceId }) => {
    try {
        const logData = {
            action,
            details: typeof details === 'object' ? JSON.stringify(details) : details,
            resourceId: resourceId ? String(resourceId) : null
        };

        if (req) {
            logData.ipAddress = req.ip ||
                (req.socket ? req.socket.remoteAddress : null) ||
                (req.connection ? req.connection.remoteAddress : null);
            if (req.user) {
                logData.userId = req.user.id || req.user.studentId || req.user.teacherId;
                logData.userRole = req.user.role;
            }
        }

        // Overrides
        if (userId) logData.userId = userId;
        if (userRole) logData.userRole = userRole;

        await AuditLog.create(logData);
    } catch (err) {
        console.error('Audit Logging Error:', err);
        // Don't block main execution flow if logging fails
    }
};

module.exports = logAction;
