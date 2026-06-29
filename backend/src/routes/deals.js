const express = require('express');
const { body } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidation } = require('../middleware/errorHandler');
const { auditMiddleware } = require('../middleware/auditLog');
const { calculateDealFinancials } = require('../services/gstCalculator');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate, auditMiddleware);

const TOLERANCE = 2; // Allow ₹2 rounding tolerance

const sumArray = (arr, field) => arr.reduce((s, item) => s + parseFloat(item[field] || 0), 0);

// GET /api/deals
router.get('/', async (req, res, next) => {
  try {
    const { projectId, status, clientId, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build accessible project filter
    let projectIds = req.user.projectIds;
    if (req.user.role === 'ADMIN') projectIds = undefined;
    if (req.user.role === 'DEVELOPER') {
      const devProjects = await prisma.project.findMany({ where: { developerUserId: req.user.id }, select: { id: true } });
      projectIds = devProjects.map(p => p.id);
    }

    const where = {};
    if (projectIds) where.projectId = { in: projectIds };
    if (projectId) where.projectId = parseInt(projectId);
    if (clientId) where.clientId = parseInt(clientId);
    if (status) where.registryStatus = status;

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where, skip, take: parseInt(limit),
        include: {
          project: { select: { id: true, name: true, possessionDate: true } },
          unit: { select: { id: true, unitNumber: true, status: true } },
          client: { select: { id: true, name: true, mobile: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.deal.count({ where })
    ]);

    const mappedDeals = deals.map(d => {
      if (!d.possessionDate && d.project) {
        d.possessionDate = d.project.possessionDate;
      }
      return d;
    });

    res.json({ success: true, data: mappedDeals, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

// POST /api/deals — Full deal creation with validation
router.post('/', authorize('ADMIN', 'STAFF'), [
  body('projectId').isInt().withMessage('projectId is required'),
  body('unitId').isInt().withMessage('unitId is required'),
  body('clientId').isInt().withMessage('clientId is required'),
  body('dealAmount').isFloat({ gt: 0 }).withMessage('Deal amount must be greater than 0'),
  body('ownMargin').isFloat({ min: 0 }).withMessage('Own margin must be 0 or greater'),
  body('loanAmount').isFloat({ min: 0 }).withMessage('Loan amount must be 0 or greater'),
  body('marginSchedule').isArray({ min: 1 }).withMessage('At least one margin installment is required'),
  body('cashSchedule').isArray().withMessage('cashSchedule must be an array'),
  body('loanSchedule').isArray().withMessage('loanSchedule must be an array')
], handleValidation, async (req, res, next) => {
  try {
    const {
      projectId, unitId, clientId, dealAmount, maintenanceDeposit,
      ownMargin, loanAmount, loanBank, extraWork, otherCharges,
      gstOverridden, gstAmount: gstAmountOverride,
      possessionDate, registryTargetDate, notes,
      marginSchedule, loanSchedule, cashSchedule
    } = req.body;

    const pid = parseInt(projectId);
    const uid = parseInt(unitId);
    const cid = parseInt(clientId);

    // Staff access check
    if (req.user.role === 'STAFF' && !req.user.projectIds.includes(pid)) {
      return res.status(403).json({ success: false, error: 'Access denied to this project.' });
    }

    // 1. Validate unit is available
    const unit = await prisma.unit.findUnique({ where: { id: uid } });
    if (!unit) return res.status(404).json({ success: false, error: 'Unit not found.' });
    if (unit.status !== 'AVAILABLE') {
      return res.status(400).json({ success: false, error: `Unit ${unit.unitNumber} is already ${unit.status}. Cannot create a new booking.` });
    }
    if (unit.projectId !== pid) {
      return res.status(400).json({ success: false, error: 'Unit does not belong to the selected project.' });
    }

    // 2. Get project for GST calculation
    const project = await prisma.project.findUnique({ where: { id: pid } });
    if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });

    // 3. Calculate financials
    const maintDeposit = parseFloat(maintenanceDeposit ?? project.maintenanceDeposit ?? 0);
    const { stampDuty, gstRate, gstAmount } = calculateDealFinancials(
      project.status, parseFloat(dealAmount), maintDeposit,
      gstOverridden ? parseFloat(gstAmountOverride || 0) : null
    );
    const subTotal = parseFloat(dealAmount) + stampDuty + gstAmount + maintDeposit;

    // 4. Validate: ownMargin + loanAmount = subTotal
    const marginNum = parseFloat(ownMargin);
    const loanNum = parseFloat(loanAmount);
    if (Math.abs(marginNum + loanNum - subTotal) > TOLERANCE) {
      return res.status(400).json({
        success: false,
        error: `Own Margin (₹${marginNum.toLocaleString('en-IN')}) + Loan (₹${loanNum.toLocaleString('en-IN')}) = ₹${(marginNum + loanNum).toLocaleString('en-IN')} but Sub Total = ₹${subTotal.toLocaleString('en-IN')}. They must match.`
      });
    }

    // 5. Validate margin schedule total = ownMargin
    const marginTotal = sumArray(marginSchedule, 'amount');
    if (Math.abs(marginTotal - marginNum) > TOLERANCE) {
      return res.status(400).json({
        success: false,
        error: `Margin schedule total (₹${marginTotal.toLocaleString('en-IN')}) must equal Own Margin (₹${marginNum.toLocaleString('en-IN')}).`
      });
    }

    // 6. Validate loan schedule total = loanAmount (if loan > 0)
    if (loanNum > 0 && loanSchedule.length > 0) {
      const loanTotal = sumArray(loanSchedule, 'amount');
      if (Math.abs(loanTotal - loanNum) > TOLERANCE) {
        return res.status(400).json({
          success: false,
          error: `Loan schedule total (₹${loanTotal.toLocaleString('en-IN')}) must equal Loan Amount (₹${loanNum.toLocaleString('en-IN')}).`
        });
      }
    }

    // 7. Validate cash schedule total = totalCash
    const extraWorkNum = parseFloat(extraWork || 0);
    const otherChargesNum = parseFloat(otherCharges || 0);
    const totalCash = extraWorkNum + otherChargesNum;
    if (totalCash > 0 && cashSchedule.length > 0) {
      const cashTotal = sumArray(cashSchedule, 'amount');
      if (Math.abs(cashTotal - totalCash) > TOLERANCE) {
        return res.status(400).json({
          success: false,
          error: `Cash schedule total (${cashTotal}) must equal Total Cash (${totalCash}).`
        });
      }
    }

    // 8. Create deal in transaction
    const deal = await prisma.$transaction(async (tx) => {
      const newDeal = await tx.deal.create({
        data: {
          projectId: pid, unitId: uid, clientId: cid,
          dealAmount: parseFloat(dealAmount),
          stampDuty, gstRate, gstAmount, maintenanceDeposit: maintDeposit,
          subTotal, ownMargin: marginNum, loanAmount: loanNum,
          loanBank: loanBank || null, extraWork: extraWorkNum,
          otherCharges: otherChargesNum, totalCash,
          possessionDate: possessionDate ? new Date(possessionDate) : null,
          registryTargetDate: registryTargetDate ? new Date(registryTargetDate) : null,
          gstOverridden: !!gstOverridden, notes: notes || null,
          createdBy: req.user.id,
          marginSchedule: {
            create: marginSchedule.map(ms => ({
              description: ms.description, dueDate: new Date(ms.dueDate),
              amount: parseFloat(ms.amount)
            }))
          },
          loanSchedule: {
            create: (loanSchedule || []).map(ls => ({
              stageDescription: ls.stageDescription, expectedDate: new Date(ls.expectedDate),
              amount: parseFloat(ls.amount)
            }))
          },
          cashSchedule: {
            create: (cashSchedule || []).map(cs => ({
              description: cs.description, dueDate: new Date(cs.dueDate),
              amount: parseFloat(cs.amount)
            }))
          }
        },
        include: {
          marginSchedule: true, loanSchedule: true, cashSchedule: true,
          client: { select: { name: true } }, unit: { select: { unitNumber: true } }
        }
      });

      // Update unit status to BOOKED
      await tx.unit.update({ where: { id: uid }, data: { status: 'BOOKED' } });

      return newDeal;
    });

    await req.audit('Deal', deal.id, 'CREATE', null, {
      projectId: pid, unitId: uid, clientId: cid, dealAmount: parseFloat(dealAmount), subTotal
    });

    res.status(201).json({ success: true, data: deal });
  } catch (err) { next(err); }
});

// GET /api/deals/:id
router.get('/:id', async (req, res, next) => {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        project: { select: { id: true, name: true, developerName: true, status: true, possessionDate: true } },
        unit: { select: { id: true, unitNumber: true, floor: true, carpetArea: true, unitType: { select: { typeName: true } } } },
        client: true,
        createdByUser: { select: { id: true, name: true } },
        marginSchedule: { orderBy: { dueDate: 'asc' } },
        loanSchedule: { orderBy: { expectedDate: 'asc' } },
        cashSchedule: { orderBy: { dueDate: 'asc' } },
        labourPayments: { orderBy: { paidDate: 'desc' }, include: { paidByUser: { select: { name: true } } } }
      }
    });
    if (!deal) return res.status(404).json({ success: false, error: 'Deal not found.' });
    if (!deal.possessionDate && deal.project) {
      deal.possessionDate = deal.project.possessionDate;
    }
    res.json({ success: true, data: deal });
  } catch (err) { next(err); }
});

// PUT /api/deals/:id — Update deal details (not schedules)
router.put('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const old = await prisma.deal.findUnique({ where: { id } });
    if (!old) return res.status(404).json({ success: false, error: 'Deal not found.' });

    const { possessionDate, registryTargetDate, notes, loanBank } = req.body;
    const data = {};
    if (possessionDate !== undefined) data.possessionDate = possessionDate ? new Date(possessionDate) : null;
    if (registryTargetDate !== undefined) data.registryTargetDate = registryTargetDate ? new Date(registryTargetDate) : null;
    if (notes !== undefined) data.notes = notes;
    if (loanBank !== undefined) data.loanBank = loanBank;

    const updated = await prisma.deal.update({ where: { id }, data });
    await req.audit('Deal', id, 'UPDATE', {
      possessionDate: old.possessionDate, registryTargetDate: old.registryTargetDate, notes: old.notes
    }, data);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// POST /api/deals/:id/registry — Mark registry done
router.post('/:id/registry', authorize('ADMIN'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { registryDoneDate, registryStatus } = req.body;
    const old = await prisma.deal.findUnique({ where: { id }, include: { unit: true } });
    if (!old) return res.status(404).json({ success: false, error: 'Deal not found.' });

    const newStatus = registryStatus || 'DONE';
    const data = {
      registryStatus: newStatus,
      registryDoneDate: registryDoneDate ? new Date(registryDoneDate) : new Date()
    };

    const [updated] = await prisma.$transaction([
      prisma.deal.update({ where: { id }, data }),
      ...(newStatus === 'DONE' ? [prisma.unit.update({ where: { id: old.unitId }, data: { status: 'REGISTERED' } })] : [])
    ]);

    await req.audit('Deal', id, 'REGISTRY_UPDATE', { registryStatus: old.registryStatus }, { registryStatus: newStatus, registryDoneDate: data.registryDoneDate });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// GET /api/deals/:id/summary — Financial summary
router.get('/:id/summary', async (req, res, next) => {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        marginSchedule: true, loanSchedule: true, cashSchedule: true, labourPayments: true
      }
    });
    if (!deal) return res.status(404).json({ success: false, error: 'Deal not found.' });

    const marginReceived = deal.marginSchedule.filter(m => m.status === 'RECEIVED' || m.status === 'PARTIAL')
      .reduce((s, m) => s + parseFloat(m.receivedAmount || 0), 0);
    const loanReceived = deal.loanSchedule.filter(l => l.status === 'RECEIVED' || l.status === 'PARTIAL')
      .reduce((s, l) => s + parseFloat(l.receivedAmount || 0), 0);
    const cashReceived = deal.cashSchedule.filter(c => c.status === 'RECEIVED' || c.status === 'PARTIAL')
      .reduce((s, c) => s + parseFloat(c.receivedAmount || 0), 0);
    const labourPaid = deal.labourPayments.reduce((s, l) => s + parseFloat(l.amount || 0), 0);

    const subTotal = parseFloat(deal.subTotal);
    const totalCash = parseFloat(deal.totalCash);
    const totalBankingReceived = marginReceived + loanReceived;

    res.json({
      success: true,
      data: {
        subTotal, ownMargin: parseFloat(deal.ownMargin), loanAmount: parseFloat(deal.loanAmount),
        marginReceived, loanReceived, totalBankingReceived,
        bankingBalance: subTotal - totalBankingReceived,
        totalCash, cashReceived, cashBalance: totalCash - cashReceived,
        labourPaid, labourBalance: parseFloat(deal.extraWork) - labourPaid
      }
    });
  } catch (err) { next(err); }
});

module.exports = router;
