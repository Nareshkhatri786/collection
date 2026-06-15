const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Create an audit log entry
 * @param {number|null} userId - User performing the action
 * @param {string} entityType - e.g. 'Deal', 'MarginSchedule', 'Project'
 * @param {number} entityId - ID of the affected record
 * @param {string} action - e.g. 'CREATE', 'UPDATE', 'DELETE', 'REGISTRY_DONE'
 * @param {object|null} oldValues - Previous values (for updates)
 * @param {object|null} newValues - New values
 * @param {string|null} ipAddress - Request IP
 */
const createAuditLog = async (userId, entityType, entityId, action, oldValues = null, newValues = null, ipAddress = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        entityType,
        entityId,
        action,
        oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )) : null,
        newValues: newValues ? JSON.parse(JSON.stringify(newValues, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )) : null,
        ipAddress
      }
    });
  } catch (err) {
    // Audit log failure should not break the main operation
    console.error('[AuditLog Error]', err.message);
  }
};

/**
 * Express middleware to extract IP address and attach audit helper to req
 */
const auditMiddleware = (req, res, next) => {
  req.clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || null;
  req.audit = (entityType, entityId, action, oldValues, newValues) =>
    createAuditLog(req.user?.id, entityType, entityId, action, oldValues, newValues, req.clientIp);
  next();
};

module.exports = { createAuditLog, auditMiddleware };
