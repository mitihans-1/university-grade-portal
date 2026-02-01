const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const { sanitizeUser, getPermissionsForRole } = require('../utils/permissions');

const auth = async (req, res, next) => {
  try {
    const token = req.header('x-auth-token');

    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultSecret');
    const { userId, role: tokenRole } = decoded;

    if (!userId) {
      return res.status(401).json({ msg: 'Invalid token structure' });
    }

    // Find user based on role from token
    let user, role;

    if (tokenRole === 'student') {
      user = await Student.findByPk(userId);
      if (user) role = 'student';
    } else if (tokenRole === 'parent') {
      user = await Parent.findByPk(userId);
      if (user) role = 'parent';
    } else if (tokenRole === 'admin') {
      const { Admin } = require('../models');
      user = await Admin.findByPk(userId);
      if (user) role = 'admin';
    } else if (tokenRole === 'teacher') {
      const { Teacher } = require('../models');
      user = await Teacher.findByPk(userId);
      if (user) role = 'teacher';
    } else {
      // Fallback for tokens without role (legacy support or error)
      // This is risky with ID collisions but kept as a last resort
      user = await Student.findByPk(userId);
      if (user) {
        role = 'student';
      } else {
        user = await Parent.findByPk(userId);
        if (user) {
          role = 'parent';
        } else {
          const { Admin } = require('../models');
          user = await Admin.findByPk(userId);
          if (user) {
            role = 'admin';
          } else {
            const { Teacher } = require('../models');
            user = await Teacher.findByPk(userId);
            if (user) {
              role = 'teacher';
            }
          }
        }
      }
    }

    if (!user || !role) {
      return res.status(401).json({ msg: 'User not found' });
    }

    // Attach sanitized user object with permissions (no role exposed)
    req.user = sanitizeUser(user, role);
    req.userRole = role; // Keep role internally for authorization checks

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(401).json({ msg: 'Token is not valid', error: err.message });
  }
};

module.exports = auth;