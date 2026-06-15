const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { generateMonthlyProjectionPDF, generateMonthEndAchievementPDF, generateUnitWiseStatusPDF, generateExtraWorkPDF } = require('../services/pdfService');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Helper: get accessible project IDs
const getProjectIds = async (user) => {
  if (user.role === 'ADMIN') {
    const ps = await prisma.project.findMany({ select: { id: true } });
    return ps.map(p => p.id);
  }
  if (user.role === 'DEVELOPER') {
    const ps = await prisma.project.findMany({ where: { developerUserId: user.id }, select: { id: true } });
    return ps.map(p => p.id);
  }
  return user.projectIds;
};

// ── Monthly Projection ─────────────────────────────────────────────────────────
// GET /api/reports/monthly-projection?projectId=&month=&year=&pdf=true
router.get('/monthly-projection', async (req, res, next) => {
  try {
    const { projectId, month, year, pdf } = req.query;
    if (!projectId || !month || !year) return res.status(400).json({ success: false, error: 'projectId, month, and year are required.' });

    const accessibleIds = await getProjectIds(req.user);
    const pid = parseInt(projectId);
    if (!accessibleIds.includes(pid)) return res.status(403).json({ success: false, error: 'Access denied.' });

    const m = parseInt(month); const y = parseInt(year);
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const project = await prisma.project.findUnique({ where: { id: pid }, select: { name: true } });

    const [marginItems, loanItems, cashItems] = await Promise.all([
      prisma.marginSchedule.findMany({
        where: { dueDate: { gte: startDate, lte: endDate }, deal: { projectId: pid } },
        include: { deal: { include: { client: { select: { name: true } }, unit: { select: { unitNumber: true } } } } }
      }),
      prisma.loanSchedule.findMany({
        where: { expectedDate: { gte: startDate, lte: endDate }, deal: { projectId: pid } },
        include: { deal: { include: { client: { select: { name: true } }, unit: { select: { unitNumber: true } } } } }
      }),
      prisma.cashSchedule.findMany({
        where: { dueDate: { gte: startDate, lte: endDate }, deal: { projectId: pid } },
        include: { deal: { include: { client: { select: { name: true } }, unit: { select: { unitNumber: true } } } } }
      })
    ]);

    const data = [
      ...marginItems.map(item => ({
        unitNumber: item.deal.unit.unitNumber, clientName: item.deal.client.name,
        paymentType: item.description, dueDate: item.dueDate,
        expectedAmount: parseFloat(item.amount), category: 'Cheque / NEFT', isCash: false
      })),
      ...loanItems.map(item => ({
        unitNumber: item.deal.unit.unitNumber, clientName: item.deal.client.name,
        paymentType: item.stageDescription, dueDate: item.expectedDate,
        expectedAmount: parseFloat(item.amount), category: 'Bank (Loan)', isCash: false
      })),
      ...cashItems.map(item => ({
        unitNumber: item.deal.unit.unitNumber, clientName: item.deal.client.name,
        paymentType: item.description, dueDate: item.dueDate,
        expectedAmount: parseFloat(item.amount), category: 'Cash', isCash: true
      }))
    ].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    if (pdf === 'true') {
      const buffer = await generateMonthlyProjectionPDF(data, m, y, project.name);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="monthly-projection-${y}-${m}.pdf"`);
      return res.send(buffer);
    }

    res.json({ success: true, data, projectName: project.name, month: m, year: y });
  } catch (err) { next(err); }
});

// ── Month-End Achievement ──────────────────────────────────────────────────────
// GET /api/reports/month-end-achievement?projectId=&month=&year=&pdf=true
router.get('/month-end-achievement', async (req, res, next) => {
  try {
    const { projectId, month, year, pdf } = req.query;
    if (!projectId || !month || !year) return res.status(400).json({ success: false, error: 'projectId, month, and year are required.' });

    const accessibleIds = await getProjectIds(req.user);
    const pid = parseInt(projectId);
    if (!accessibleIds.includes(pid)) return res.status(403).json({ success: false, error: 'Access denied.' });

    const m = parseInt(month); const y = parseInt(year);
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const project = await prisma.project.findUnique({ where: { id: pid }, select: { name: true } });

    const [marginItems, loanItems, cashItems] = await Promise.all([
      prisma.marginSchedule.findMany({
        where: { dueDate: { gte: startDate, lte: endDate }, deal: { projectId: pid } },
        include: { deal: { include: { client: { select: { name: true } }, unit: { select: { unitNumber: true } } } } }
      }),
      prisma.loanSchedule.findMany({
        where: { expectedDate: { gte: startDate, lte: endDate }, deal: { projectId: pid } },
        include: { deal: { include: { client: { select: { name: true } }, unit: { select: { unitNumber: true } } } } }
      }),
      prisma.cashSchedule.findMany({
        where: { dueDate: { gte: startDate, lte: endDate }, deal: { projectId: pid } },
        include: { deal: { include: { client: { select: { name: true } }, unit: { select: { unitNumber: true } } } } }
      })
    ]);

    const totalExpected = [...marginItems, ...loanItems].reduce((s, i) => s + parseFloat(i.amount), 0);
    const totalExpectedCash = cashItems.reduce((s, i) => s + parseFloat(i.amount), 0);
    const totalReceived = [...marginItems, ...loanItems].reduce((s, i) => s + parseFloat(i.receivedAmount || 0), 0);
    const totalReceivedCash = cashItems.reduce((s, i) => s + parseFloat(i.receivedAmount || 0), 0);
    const pending = totalExpected - totalReceived;
    const collectionPct = totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0;

    const pendingItems = [
      ...marginItems.filter(i => i.status !== 'RECEIVED').map(i => ({
        unitNumber: i.deal.unit.unitNumber, clientName: i.deal.client.name,
        description: i.description, amount: parseFloat(i.amount) - parseFloat(i.receivedAmount || 0)
      })),
      ...loanItems.filter(i => i.status !== 'RECEIVED').map(i => ({
        unitNumber: i.deal.unit.unitNumber, clientName: i.deal.client.name,
        description: i.stageDescription, amount: parseFloat(i.amount) - parseFloat(i.receivedAmount || 0)
      }))
    ];

    const result = { totalExpected, totalExpectedCash, totalReceived, totalReceivedCash, pending, collectionPct, pendingItems };

    if (pdf === 'true') {
      const buffer = await generateMonthEndAchievementPDF(result, m, y, project.name);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="month-end-achievement-${y}-${m}.pdf"`);
      return res.send(buffer);
    }

    res.json({ success: true, data: result, projectName: project.name });
  } catch (err) { next(err); }
});

// ── Unit-Wise Status ───────────────────────────────────────────────────────────
// GET /api/reports/unit-wise-status?projectId=&pdf=true
router.get('/unit-wise-status', async (req, res, next) => {
  try {
    const { projectId, pdf } = req.query;
    if (!projectId) return res.status(400).json({ success: false, error: 'projectId is required.' });

    const accessibleIds = await getProjectIds(req.user);
    const pid = parseInt(projectId);
    if (!accessibleIds.includes(pid)) return res.status(403).json({ success: false, error: 'Access denied.' });

    const project = await prisma.project.findUnique({ where: { id: pid }, select: { name: true } });
    const deals = await prisma.deal.findMany({
      where: { projectId: pid },
      include: {
        client: { select: { name: true } },
        unit: { select: { unitNumber: true } },
        marginSchedule: true,
        loanSchedule: true
      }
    });

    const data = deals.map(deal => {
      const totalDealValue = parseFloat(deal.subTotal);
      const received = [
        ...deal.marginSchedule.filter(m => m.status === 'RECEIVED' || m.status === 'PARTIAL').map(m => parseFloat(m.receivedAmount || 0)),
        ...deal.loanSchedule.filter(l => l.status === 'RECEIVED' || l.status === 'PARTIAL').map(l => parseFloat(l.receivedAmount || 0))
      ].reduce((s, v) => s + v, 0);

      const nextMargin = deal.marginSchedule.filter(m => m.status !== 'RECEIVED').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
      const nextLoan = deal.loanSchedule.filter(l => l.status !== 'RECEIVED').sort((a, b) => new Date(a.expectedDate) - new Date(b.expectedDate))[0];
      const nextDue = nextMargin && nextLoan
        ? (new Date(nextMargin.dueDate) < new Date(nextLoan.expectedDate) ? nextMargin : { ...nextLoan, dueDate: nextLoan.expectedDate })
        : nextMargin || (nextLoan ? { ...nextLoan, dueDate: nextLoan.expectedDate } : null);

      return {
        dealId: deal.id, unitNumber: deal.unit.unitNumber, clientName: deal.client.name,
        totalDealValue, totalCollected: received, balance: totalDealValue - received,
        nextDueDate: nextDue?.dueDate || null, nextDueAmount: nextDue ? parseFloat(nextDue.amount) : null,
        registryStatus: deal.registryStatus
      };
    });

    if (pdf === 'true') {
      const buffer = await generateUnitWiseStatusPDF(data, project.name);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="unit-wise-status.pdf"`);
      return res.send(buffer);
    }

    res.json({ success: true, data, projectName: project.name });
  } catch (err) { next(err); }
});

// ── Extra Work Report ──────────────────────────────────────────────────────────
// GET /api/reports/extra-work?projectId=&pdf=true
router.get('/extra-work', async (req, res, next) => {
  try {
    const { projectId, pdf } = req.query;
    if (!projectId) return res.status(400).json({ success: false, error: 'projectId is required.' });

    const accessibleIds = await getProjectIds(req.user);
    const pid = parseInt(projectId);
    if (!accessibleIds.includes(pid)) return res.status(403).json({ success: false, error: 'Access denied.' });

    const project = await prisma.project.findUnique({ where: { id: pid }, select: { name: true } });
    const deals = await prisma.deal.findMany({
      where: { projectId: pid, totalCash: { gt: 0 } },
      include: {
        client: { select: { name: true } },
        unit: { select: { unitNumber: true } },
        cashSchedule: true
      }
    });

    const data = deals.map(deal => {
      const cashCommitted = parseFloat(deal.totalCash);
      const cashReceived = deal.cashSchedule
        .filter(cs => cs.status === 'RECEIVED' || cs.status === 'PARTIAL')
        .reduce((s, cs) => s + parseFloat(cs.receivedAmount || 0), 0);
      return {
        dealId: deal.id, unitNumber: deal.unit.unitNumber, clientName: deal.client.name,
        cashCommitted, cashReceived, balance: cashCommitted - cashReceived
      };
    });

    if (pdf === 'true') {
      const buffer = await generateExtraWorkPDF(data, project.name);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="extra-work-report.pdf"`);
      return res.send(buffer);
    }

    res.json({ success: true, data, projectName: project.name });
  } catch (err) { next(err); }
});

module.exports = router;
