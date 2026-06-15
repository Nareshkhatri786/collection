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

// Helper: enrich schedule items with computed overdue status
const enrichStatus = (items, dateField) => items.map(item => ({
  ...item,
  computedStatus: computePaymentStatus(item[dateField], item.status)
}));

// ── Margin Schedule ────────────────────────────────────────────────────────────

// GET /api/collections/margin/:dealId
router.get('/margin/:dealId', async (req, res, next) => {
  try {
    const items = await prisma.marginSchedule.findMany({
      where: { dealId: parseInt(req.params.dealId) },
      orderBy: { dueDate: 'asc' }
    });
    res.json({ success: true, data: enrichStatus(items, 'dueDate') });
  } catch (err) { next(err); }
});

// POST /api/collections/margin/:installmentId/receive
router.post('/margin/:installmentId/receive', authorize('ADMIN', 'STAFF'), [
  body('receivedDate').notEmpty().withMessage('Received date is required'),
  body('receivedAmount').isFloat({ gt: 0 }).withMessage('Received amount must be greater than 0'),
  body('paymentMode').isIn(['CHEQUE', 'NEFT', 'CASH', 'UPI']).withMessage('Invalid payment mode')
], handleValidation, async (req, res, next) => {
  try {
    const id = parseInt(req.params.installmentId);
    const { receivedDate, receivedAmount, paymentMode, receiptNumber } = req.body;

    const item = await prisma.marginSchedule.findUnique({ where: { id }, include: { deal: { include: { unit: { select: { projectId: true } } } } } });
    if (!item) return res.status(404).json({ success: false, error: 'Installment not found.' });

    // Staff project access check
    if (req.user.role === 'STAFF' && !req.user.projectIds.includes(item.deal.unit.projectId)) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const received = parseFloat(receivedAmount);
    const due = parseFloat(item.amount);
    const status = received >= due ? 'RECEIVED' : 'PARTIAL';

    const old = { status: item.status, receivedAmount: item.receivedAmount, receivedDate: item.receivedDate };
    const updated = await prisma.marginSchedule.update({
      where: { id },
      data: {
        receivedDate: new Date(receivedDate),
        receivedAmount: received,
        paymentMode,
        receiptNumber: receiptNumber || null,
        status
      }
    });

    await req.audit('MarginSchedule', id, 'MARK_RECEIVED', old, { receivedAmount: received, status, paymentMode });
    res.json({ success: true, data: { ...updated, computedStatus: status } });
  } catch (err) { next(err); }
});

// PUT /api/collections/margin/:installmentId — Admin can edit
router.put('/margin/:installmentId', authorize('ADMIN'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.installmentId);
    const old = await prisma.marginSchedule.findUnique({ where: { id } });
    if (!old) return res.status(404).json({ success: false, error: 'Installment not found.' });

    const { dueDate, amount, receivedDate, receivedAmount, paymentMode, receiptNumber, description } = req.body;
    const data = {};
    if (dueDate) data.dueDate = new Date(dueDate);
    if (amount !== undefined) data.amount = parseFloat(amount);
    if (receivedDate !== undefined) data.receivedDate = receivedDate ? new Date(receivedDate) : null;
    if (receivedAmount !== undefined) data.receivedAmount = receivedAmount ? parseFloat(receivedAmount) : null;
    if (paymentMode !== undefined) data.paymentMode = paymentMode;
    if (receiptNumber !== undefined) data.receiptNumber = receiptNumber;
    if (description !== undefined) data.description = description;

    // Recompute status
    if (data.receivedAmount !== undefined) {
      const due = data.amount ?? parseFloat(old.amount);
      data.status = parseFloat(data.receivedAmount) >= due ? 'RECEIVED' : (parseFloat(data.receivedAmount) > 0 ? 'PARTIAL' : 'PENDING');
    }

    const updated = await prisma.marginSchedule.update({ where: { id }, data });
    await req.audit('MarginSchedule', id, 'EDIT', old, data);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// ── Loan Schedule ──────────────────────────────────────────────────────────────

// GET /api/collections/loan/:dealId
router.get('/loan/:dealId', async (req, res, next) => {
  try {
    const items = await prisma.loanSchedule.findMany({
      where: { dealId: parseInt(req.params.dealId) },
      orderBy: { expectedDate: 'asc' }
    });
    res.json({ success: true, data: enrichStatus(items, 'expectedDate') });
  } catch (err) { next(err); }
});

// POST /api/collections/loan/:installmentId/receive
router.post('/loan/:installmentId/receive', authorize('ADMIN', 'STAFF'), [
  body('receivedDate').notEmpty().withMessage('Received date is required'),
  body('receivedAmount').isFloat({ gt: 0 }).withMessage('Received amount must be greater than 0')
], handleValidation, async (req, res, next) => {
  try {
    const id = parseInt(req.params.installmentId);
    const { receivedDate, receivedAmount } = req.body;

    const item = await prisma.loanSchedule.findUnique({ where: { id }, include: { deal: { include: { unit: { select: { projectId: true } } } } } });
    if (!item) return res.status(404).json({ success: false, error: 'Loan installment not found.' });

    if (req.user.role === 'STAFF' && !req.user.projectIds.includes(item.deal.unit.projectId)) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const received = parseFloat(receivedAmount);
    const due = parseFloat(item.amount);
    const status = received >= due ? 'RECEIVED' : 'PARTIAL';

    const old = { status: item.status, receivedAmount: item.receivedAmount };
    const updated = await prisma.loanSchedule.update({
      where: { id },
      data: { receivedDate: new Date(receivedDate), receivedAmount: received, status }
    });

    await req.audit('LoanSchedule', id, 'MARK_RECEIVED', old, { receivedAmount: received, status });
    res.json({ success: true, data: { ...updated, computedStatus: status } });
  } catch (err) { next(err); }
});

// PUT /api/collections/loan/:installmentId
router.put('/loan/:installmentId', authorize('ADMIN'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.installmentId);
    const old = await prisma.loanSchedule.findUnique({ where: { id } });
    if (!old) return res.status(404).json({ success: false, error: 'Loan installment not found.' });

    const { expectedDate, amount, receivedDate, receivedAmount, stageDescription } = req.body;
    const data = {};
    if (expectedDate) data.expectedDate = new Date(expectedDate);
    if (amount !== undefined) data.amount = parseFloat(amount);
    if (receivedDate !== undefined) data.receivedDate = receivedDate ? new Date(receivedDate) : null;
    if (receivedAmount !== undefined) {
      data.receivedAmount = receivedAmount ? parseFloat(receivedAmount) : null;
      const due = data.amount ?? parseFloat(old.amount);
      data.status = data.receivedAmount >= due ? 'RECEIVED' : (data.receivedAmount > 0 ? 'PARTIAL' : 'PENDING');
    }
    if (stageDescription !== undefined) data.stageDescription = stageDescription;

    const updated = await prisma.loanSchedule.update({ where: { id }, data });
    await req.audit('LoanSchedule', id, 'EDIT', old, data);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// ── Overdue / Cross-project ────────────────────────────────────────────────────

// GET /api/collections/overdue
router.get('/overdue', async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let projectIds = req.user.projectIds;
    if (req.user.role === 'ADMIN') projectIds = undefined;

    const projectFilter = projectIds ? { deal: { projectId: { in: projectIds } } } : {};

    const [overdueMargin, overdueLoan, overdueCash] = await Promise.all([
      prisma.marginSchedule.findMany({
        where: { dueDate: { lt: today }, status: { notIn: ['RECEIVED'] }, ...projectFilter },
        include: { deal: { include: { client: { select: { name: true } }, unit: { select: { unitNumber: true } }, project: { select: { name: true } } } } },
        orderBy: { dueDate: 'asc' }
      }),
      prisma.loanSchedule.findMany({
        where: { expectedDate: { lt: today }, status: { notIn: ['RECEIVED'] }, ...projectFilter },
        include: { deal: { include: { client: { select: { name: true } }, unit: { select: { unitNumber: true } }, project: { select: { name: true } } } } },
        orderBy: { expectedDate: 'asc' }
      }),
      prisma.cashSchedule.findMany({
        where: { dueDate: { lt: today }, status: { notIn: ['RECEIVED'] }, ...projectFilter },
        include: { deal: { include: { client: { select: { name: true } }, unit: { select: { unitNumber: true } }, project: { select: { name: true } } } } },
        orderBy: { dueDate: 'asc' }
      })
    ]);

    res.json({
      success: true,
      data: {
        margin: overdueMargin.map(m => ({ ...m, scheduleType: 'MARGIN', computedStatus: 'OVERDUE' })),
        loan: overdueLoan.map(l => ({ ...l, scheduleType: 'LOAN', computedStatus: 'OVERDUE' })),
        cash: overdueCash.map(c => ({ ...c, scheduleType: 'CASH', computedStatus: 'OVERDUE', isCash: true })),
        total: overdueMargin.length + overdueLoan.length + overdueCash.length
      }
    });
  } catch (err) { next(err); }
});

module.exports = router;
