const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

/**
 * GET /api/vouchers/margin/:id
 * Returns full receipt data for a margin schedule payment
 */
router.get('/margin/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const item = await prisma.marginSchedule.findUnique({
      where: { id },
      include: {
        deal: {
          include: {
            client: { select: { id: true, name: true, mobile: true } },
            unit: { select: { unitNumber: true, floor: true } },
            project: { select: { name: true, developerName: true, location: true } },
            createdByUser: { select: { name: true } }
          }
        }
      }
    });
    if (!item) return res.status(404).json({ success: false, error: 'Receipt not found.' });
    if (item.status === 'PENDING') return res.status(400).json({ success: false, error: 'This installment has not been received yet.' });

    res.json({
      success: true,
      data: {
        voucherType: 'RECEIPT',
        voucherNumber: item.receiptNumber || `RCP-${item.id}`,
        voucherDate: item.receivedDate,
        amount: parseFloat(item.receivedAmount || item.amount),
        amountDue: parseFloat(item.amount),
        paymentMode: item.paymentMode,
        referenceNumber: item.receiptNumber,
        description: item.description,
        milestoneType: 'Own Margin',
        client: item.deal.client,
        unit: item.deal.unit,
        project: item.deal.project,
        dealId: item.deal.id,
        createdBy: item.deal.createdByUser?.name || 'System'
      }
    });
  } catch (err) { next(err); }
});

/**
 * GET /api/vouchers/loan/:id
 * Returns full receipt data for a loan schedule payment
 */
router.get('/loan/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const item = await prisma.loanSchedule.findUnique({
      where: { id },
      include: {
        deal: {
          include: {
            client: { select: { id: true, name: true, mobile: true } },
            unit: { select: { unitNumber: true, floor: true } },
            project: { select: { name: true, developerName: true, location: true } },
            createdByUser: { select: { name: true } }
          }
        }
      }
    });
    if (!item) return res.status(404).json({ success: false, error: 'Receipt not found.' });
    if (item.status === 'PENDING') return res.status(400).json({ success: false, error: 'This installment has not been received yet.' });

    res.json({
      success: true,
      data: {
        voucherType: 'RECEIPT',
        voucherNumber: `RCP-LOAN-${item.id}`,
        voucherDate: item.receivedDate,
        amount: parseFloat(item.receivedAmount || item.amount),
        amountDue: parseFloat(item.amount),
        paymentMode: 'Bank Disbursement',
        description: item.stageDescription,
        milestoneType: 'Home Loan',
        client: item.deal.client,
        unit: item.deal.unit,
        project: item.deal.project,
        dealId: item.deal.id,
        createdBy: item.deal.createdByUser?.name || 'System'
      }
    });
  } catch (err) { next(err); }
});

/**
 * GET /api/vouchers/cash/:id
 * Returns receipt for a cash (extra work) schedule payment
 */
router.get('/cash/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const item = await prisma.cashSchedule.findUnique({
      where: { id },
      include: {
        deal: {
          include: {
            client: { select: { id: true, name: true, mobile: true } },
            unit: { select: { unitNumber: true, floor: true } },
            project: { select: { name: true, developerName: true, location: true } },
            createdByUser: { select: { name: true } }
          }
        }
      }
    });
    if (!item) return res.status(404).json({ success: false, error: 'Receipt not found.' });
    if (item.status === 'PENDING') return res.status(400).json({ success: false, error: 'This item has not been received yet.' });

    res.json({
      success: true,
      data: {
        voucherType: 'RECEIPT',
        voucherNumber: item.receiptNumber || `RCP-CASH-${item.id}`,
        voucherDate: item.receivedDate,
        amount: parseFloat(item.receivedAmount || item.amount),
        amountDue: parseFloat(item.amount),
        paymentMode: 'Cash',
        description: item.description,
        milestoneType: 'Cash (Extra Work)',
        client: item.deal.client,
        unit: item.deal.unit,
        project: item.deal.project,
        dealId: item.deal.id,
        createdBy: item.deal.createdByUser?.name || 'System'
      }
    });
  } catch (err) { next(err); }
});

/**
 * GET /api/vouchers/labour/:id
 * Returns cash payment voucher for a labour payment
 */
router.get('/labour/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const item = await prisma.labourPayment.findUnique({
      where: { id },
      include: {
        paidByUser: { select: { name: true } },
        deal: {
          include: {
            client: { select: { id: true, name: true, mobile: true } },
            unit: { select: { unitNumber: true, floor: true } },
            project: { select: { name: true, developerName: true, location: true } }
          }
        }
      }
    });
    if (!item) return res.status(404).json({ success: false, error: 'Voucher not found.' });

    res.json({
      success: true,
      data: {
        voucherType: 'PAYMENT',
        voucherNumber: item.voucherNumber || `CVR-${item.id}`,
        voucherDate: item.paidDate,
        amount: parseFloat(item.amount),
        paymentMode: 'Cash',
        description: item.description || 'Labour / Extra Work Payment',
        milestoneType: 'Labour Payment',
        client: item.deal.client,
        unit: item.deal.unit,
        project: item.deal.project,
        dealId: item.deal.id,
        createdBy: item.paidByUser?.name || 'Admin'
      }
    });
  } catch (err) { next(err); }
});

module.exports = router;
