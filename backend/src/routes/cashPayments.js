const express = require('express');
const { body } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidation } = require('../middleware/errorHandler');
const { auditMiddleware } = require('../middleware/auditLog');
const { computePaymentStatus } = require('../services/alertsService');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate, auditMiddleware);

// GET /api/cash/:dealId — cash schedule for a deal
router.get('/:dealId', async (req, res, next) => {
  try {
    const items = await prisma.cashSchedule.findMany({
      where: { dealId: parseInt(req.params.dealId) },
      orderBy: { dueDate: 'asc' }
    });
    const enriched = items.map(item => ({
      ...item,
      amount: parseFloat(item.amount),
      receivedAmount: item.receivedAmount ? parseFloat(item.receivedAmount) : null,
      computedStatus: computePaymentStatus(item.dueDate, item.status)
    }));
    res.json({ success: true, data: enriched });
  } catch (err) { next(err); }
});

// POST /api/cash/:installmentId/receive
router.post('/:installmentId/receive', authorize('ADMIN', 'STAFF'), [
  body('receivedDate').notEmpty().withMessage('Received date is required'),
  body('receivedAmount').isFloat({ gt: 0 }).withMessage('Received amount must be greater than 0')
], handleValidation, async (req, res, next) => {
  try {
    const id = parseInt(req.params.installmentId);
    const { receivedDate, receivedAmount } = req.body;

    const item = await prisma.cashSchedule.findUnique({
      where: { id },
      include: { deal: { include: { unit: { select: { projectId: true } } } } }
    });
    if (!item) return res.status(404).json({ success: false, error: 'Cash installment not found.' });

    if (req.user.role === 'STAFF' && !req.user.projectIds.includes(item.deal.unit.projectId)) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const received = parseFloat(receivedAmount);
    const due = parseFloat(item.amount);
    const status = received >= due ? 'RECEIVED' : 'PARTIAL';

    const old = { status: item.status, receivedAmount: item.receivedAmount };
    const updated = await prisma.cashSchedule.update({
      where: { id },
      data: { receivedDate: new Date(receivedDate), receivedAmount: received, status }
    });

    await req.audit('CashSchedule', id, 'MARK_RECEIVED', old, { receivedAmount: received, status });
    res.json({ success: true, data: { ...updated, computedStatus: status } });
  } catch (err) { next(err); }
});

// GET /api/cash/summary/:projectId — project-level cash summary
router.get('/summary/:projectId', async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const deals = await prisma.deal.findMany({
      where: { projectId },
      include: {
        client: { select: { name: true } },
        unit: { select: { unitNumber: true } },
        cashSchedule: true
      }
    });

    const summary = deals.map(deal => {
      const committed = parseFloat(deal.totalCash);
      const received = deal.cashSchedule
        .filter(cs => cs.status === 'RECEIVED' || cs.status === 'PARTIAL')
        .reduce((s, cs) => s + parseFloat(cs.receivedAmount || 0), 0);
      const nextDue = deal.cashSchedule
        .filter(cs => cs.status !== 'RECEIVED')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

      return {
        dealId: deal.id,
        unitNumber: deal.unit.unitNumber,
        clientName: deal.client.name,
        cashCommitted: committed,
        cashReceived: received,
        balance: committed - received,
        nextDueDate: nextDue?.dueDate || null,
        nextDueAmount: nextDue ? parseFloat(nextDue.amount) : null
      };
    });

    const totals = {
      totalCommitted: summary.reduce((s, r) => s + r.cashCommitted, 0),
      totalReceived: summary.reduce((s, r) => s + r.cashReceived, 0),
      totalBalance: summary.reduce((s, r) => s + r.balance, 0)
    };

    res.json({ success: true, data: { summary, totals } });
  } catch (err) { next(err); }
});

module.exports = router;
