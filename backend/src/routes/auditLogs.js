const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate, authorize('ADMIN'));

// GET /api/audit-logs
router.get('/', async (req, res, next) => {
  try {
    const { entityType, entityId, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = parseInt(entityId);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where, skip, take: parseInt(limit),
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({ success: true, data: logs, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

// GET /api/audit-logs/deal/:dealId
router.get('/deal/:dealId', async (req, res, next) => {
  try {
    const dealId = parseInt(req.params.dealId);
    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { entityType: 'Deal', entityId: dealId },
          { entityType: 'MarginSchedule', entityId: { in: await prisma.marginSchedule.findMany({ where: { dealId }, select: { id: true } }).then(r => r.map(i => i.id)) } },
          { entityType: 'LoanSchedule', entityId: { in: await prisma.loanSchedule.findMany({ where: { dealId }, select: { id: true } }).then(r => r.map(i => i.id)) } },
          { entityType: 'CashSchedule', entityId: { in: await prisma.cashSchedule.findMany({ where: { dealId }, select: { id: true } }).then(r => r.map(i => i.id)) } },
          { entityType: 'LabourPayment', entityId: { in: await prisma.labourPayment.findMany({ where: { dealId }, select: { id: true } }).then(r => r.map(i => i.id)) } }
        ]
      },
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: logs });
  } catch (err) { next(err); }
});

module.exports = router;
