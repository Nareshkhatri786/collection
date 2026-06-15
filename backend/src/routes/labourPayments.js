const express = require('express');
const { body } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidation } = require('../middleware/errorHandler');
const { auditMiddleware } = require('../middleware/auditLog');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate, authorize('ADMIN'), auditMiddleware);

// GET /api/labour/:dealId
router.get('/:dealId', async (req, res, next) => {
  try {
    const payments = await prisma.labourPayment.findMany({
      where: { dealId: parseInt(req.params.dealId) },
      include: { paidByUser: { select: { name: true } } },
      orderBy: { paidDate: 'desc' }
    });
    const total = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
    res.json({ success: true, data: payments, total });
  } catch (err) { next(err); }
});

// POST /api/labour/:dealId
router.post('/:dealId', [
  body('paidDate').notEmpty().withMessage('Paid date is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0')
], handleValidation, async (req, res, next) => {
  try {
    const dealId = parseInt(req.params.dealId);
    const { paidDate, amount, description } = req.body;

    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) return res.status(404).json({ success: false, error: 'Deal not found.' });

    const payment = await prisma.labourPayment.create({
      data: { dealId, paidDate: new Date(paidDate), amount: parseFloat(amount), description: description || null, paidBy: req.user.id },
      include: { paidByUser: { select: { name: true } } }
    });

    await req.audit('LabourPayment', payment.id, 'CREATE', null, { dealId, amount: parseFloat(amount), paidDate });
    res.status(201).json({ success: true, data: payment });
  } catch (err) { next(err); }
});

// DELETE /api/labour/:paymentId
router.delete('/payment/:paymentId', async (req, res, next) => {
  try {
    const id = parseInt(req.params.paymentId);
    const payment = await prisma.labourPayment.findUnique({ where: { id } });
    if (!payment) return res.status(404).json({ success: false, error: 'Labour payment not found.' });

    await prisma.labourPayment.delete({ where: { id } });
    await req.audit('LabourPayment', id, 'DELETE', { amount: parseFloat(payment.amount) }, null);
    res.json({ success: true, message: 'Labour payment deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
