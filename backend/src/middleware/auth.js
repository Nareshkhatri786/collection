const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Verify JWT token and attach user to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { projectAccess: { select: { projectId: true } } }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'User not found or account deactivated.' });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      projectIds: user.projectAccess.map(pa => pa.projectId)
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, error: 'Invalid authentication token.' });
  }
};

/**
 * Role-based access control
 * Usage: authorize('ADMIN', 'STAFF')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
      });
    }
    next();
  };
};

/**
 * Check that the current user has access to the project
 * ADMIN: always passes
 * STAFF: checks UserProjectAccess table
 * DEVELOPER: checks developerProject relationship
 */
const checkProjectAccess = (projectIdSource = 'params') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      // Admin has access to everything
      if (req.user.role === 'ADMIN') return next();

      const projectId = parseInt(
        projectIdSource === 'params' ? req.params.projectId || req.params.id
          : projectIdSource === 'body' ? req.body.projectId
          : req.query.projectId
      );

      if (!projectId || isNaN(projectId)) return next(); // Let route handle missing ID

      if (req.user.role === 'STAFF') {
        const access = await prisma.userProjectAccess.findUnique({
          where: { userId_projectId: { userId: req.user.id, projectId } }
        });
        if (!access) {
          return res.status(403).json({ success: false, error: 'You do not have access to this project.' });
        }
      }

      if (req.user.role === 'DEVELOPER') {
        const project = await prisma.project.findFirst({
          where: { id: projectId, developerUserId: req.user.id }
        });
        if (!project) {
          return res.status(403).json({ success: false, error: 'You do not have access to this project.' });
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { authenticate, authorize, checkProjectAccess };
