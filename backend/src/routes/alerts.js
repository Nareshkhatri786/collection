const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { getAlerts } = require('../services/alertsService');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/alerts
router.get('/', async (req, res, next) => {
  try {
    const { type } = req.query;
    let projectIds = req.user.projectIds;
    if (req.user.role === 'DEVELOPER') {
      const ps = await prisma.project.findMany({ where: { developerUserId: req.user.id }, select: { id: true } });
      projectIds = ps.map(p => p.id);
    }
    let alerts = await getAlerts(req.user.id, req.user.role, projectIds);
    if (type) alerts = alerts.filter(a => a.type === type);
    res.json({ success: true, data: alerts, count: alerts.length });
  } catch (err) { next(err); }
});

// GET /api/alerts/count
router.get('/count', async (req, res, next) => {
  try {
    let projectIds = req.user.projectIds;
    if (req.user.role === 'DEVELOPER') {
      const ps = await prisma.project.findMany({ where: { developerUserId: req.user.id }, select: { id: true } });
      projectIds = ps.map(p => p.id);
    }
    const alerts = await getAlerts(req.user.id, req.user.role, projectIds);
    const counts = { total: alerts.length, OVERDUE: 0, DUE_SOON: 0, POSSESSION_NEAR: 0, REGISTRY_DUE: 0, GST_REVIEW: 0 };
    alerts.forEach(a => { if (counts[a.type] !== undefined) counts[a.type]++; });
    res.json({ success: true, data: counts });
  } catch (err) { next(err); }
});

module.exports = router;
