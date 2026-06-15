const express = require('express');
const { body } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidation } = require('../middleware/errorHandler');
const { auditMiddleware } = require('../middleware/auditLog');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate, auditMiddleware);

// Helper: build project where clause based on user role
const projectFilter = (user) => {
  if (user.role === 'ADMIN') return {};
  if (user.role === 'DEVELOPER') return { developerUserId: user.id };
  return { id: { in: user.projectIds } };
};

// GET /api/projects
router.get('/', async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: projectFilter(req.user),
      include: {
        unitTypes: true,
        _count: { select: { units: true, deals: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: projects });
  } catch (err) { next(err); }
});

// POST /api/projects
router.post('/', authorize('ADMIN'), [
  body('name').notEmpty().withMessage('Project name is required'),
  body('developerName').notEmpty().withMessage('Developer name is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('status').optional().isIn(['UNDER_CONSTRUCTION', 'READY']),
  body('maintenanceDeposit').optional().isFloat({ min: 0 })
], handleValidation, async (req, res, next) => {
  try {
    const { name, developerName, location, status, maintenanceDeposit, possessionDate, developerUserId, unitTypes } = req.body;
    const project = await prisma.project.create({
      data: {
        name, developerName, location,
        status: status || 'UNDER_CONSTRUCTION',
        maintenanceDeposit: maintenanceDeposit || 0,
        possessionDate: possessionDate ? new Date(possessionDate) : null,
        developerUserId: developerUserId ? parseInt(developerUserId) : null,
        unitTypes: unitTypes?.length ? { create: unitTypes.map(ut => ({ typeName: ut.typeName, basePrice: ut.basePrice })) } : undefined
      },
      include: { unitTypes: true }
    });
    await req.audit('Project', project.id, 'CREATE', null, { name, developerName, location, status });
    res.status(201).json({ success: true, data: project });
  } catch (err) { next(err); }
});

// GET /api/projects/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const project = await prisma.project.findFirst({
      where: { id, ...projectFilter(req.user) },
      include: {
        unitTypes: true,
        developerUser: { select: { id: true, name: true, email: true } },
        userAccess: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        _count: { select: { units: true, deals: true } }
      }
    });
    if (!project) return res.status(404).json({ success: false, error: 'Project not found or access denied.' });
    res.json({ success: true, data: project });
  } catch (err) { next(err); }
});

// PUT /api/projects/:id
router.put('/:id', authorize('ADMIN'), [
  body('status').optional().isIn(['UNDER_CONSTRUCTION', 'READY'])
], handleValidation, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const old = await prisma.project.findUnique({ where: { id } });
    if (!old) return res.status(404).json({ success: false, error: 'Project not found.' });

    const { name, developerName, location, status, maintenanceDeposit, possessionDate, developerUserId } = req.body;
    const data = {};
    if (name) data.name = name;
    if (developerName) data.developerName = developerName;
    if (location) data.location = location;
    if (status) data.status = status;
    if (maintenanceDeposit !== undefined) data.maintenanceDeposit = parseFloat(maintenanceDeposit);
    if (possessionDate !== undefined) data.possessionDate = possessionDate ? new Date(possessionDate) : null;
    if (developerUserId !== undefined) data.developerUserId = developerUserId ? parseInt(developerUserId) : null;

    const updated = await prisma.project.update({ where: { id }, data, include: { unitTypes: true } });

    // If status changed to READY, log GST review alert
    if (old.status === 'UNDER_CONSTRUCTION' && status === 'READY') {
      await req.audit('Project', id, 'STATUS_CHANGED_TO_READY', { status: old.status }, { status: 'READY', gstReviewRequired: true });
    } else {
      await req.audit('Project', id, 'UPDATE', { name: old.name, status: old.status }, data);
    }

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// DELETE /api/projects/:id
router.delete('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.project.delete({ where: { id } });
    await req.audit('Project', id, 'DELETE', null, null);
    res.json({ success: true, message: 'Project deleted.' });
  } catch (err) { next(err); }
});

// GET /api/projects/:id/units
router.get('/:id/units', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.query;
    const where = { projectId: id };
    if (status) where.status = status;
    const units = await prisma.unit.findMany({
      where,
      include: {
        unitType: { select: { typeName: true, basePrice: true } },
        deal: { include: { client: { select: { name: true, mobile: true } } } }
      },
      orderBy: { unitNumber: 'asc' }
    });
    res.json({ success: true, data: units });
  } catch (err) { next(err); }
});

// GET /api/projects/:id/unit-types
router.get('/:id/unit-types', async (req, res, next) => {
  try {
    const types = await prisma.unitType.findMany({ where: { projectId: parseInt(req.params.id) } });
    res.json({ success: true, data: types });
  } catch (err) { next(err); }
});

// POST /api/projects/:id/unit-types
router.post('/:id/unit-types', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { typeName, basePrice } = req.body;
    if (!typeName || basePrice === undefined) return res.status(400).json({ success: false, error: 'typeName and basePrice are required.' });
    const unitType = await prisma.unitType.create({
      data: { projectId: parseInt(req.params.id), typeName, basePrice: parseFloat(basePrice) }
    });
    res.status(201).json({ success: true, data: unitType });
  } catch (err) { next(err); }
});

// PUT /api/projects/:id/unit-types/:typeId
router.put('/:id/unit-types/:typeId', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { typeName, basePrice } = req.body;
    const data = {};
    if (typeName) data.typeName = typeName;
    if (basePrice !== undefined) data.basePrice = parseFloat(basePrice);
    const unitType = await prisma.unitType.update({ where: { id: parseInt(req.params.typeId) }, data });
    res.json({ success: true, data: unitType });
  } catch (err) { next(err); }
});

// DELETE /api/projects/:id/unit-types/:typeId
router.delete('/:id/unit-types/:typeId', authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.unitType.delete({ where: { id: parseInt(req.params.typeId) } });
    res.json({ success: true, message: 'Unit type deleted.' });
  } catch (err) { next(err); }
});

// GET /api/projects/:id/stats
router.get('/:id/stats', async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id);
    const [totalUnits, bookedUnits, registeredUnits, deals] = await Promise.all([
      prisma.unit.count({ where: { projectId } }),
      prisma.unit.count({ where: { projectId, status: 'BOOKED' } }),
      prisma.unit.count({ where: { projectId, status: 'REGISTERED' } }),
      prisma.deal.findMany({
        where: { projectId },
        include: {
          marginSchedule: { where: { status: 'RECEIVED' } },
          loanSchedule: { where: { status: 'RECEIVED' } }
        }
      })
    ]);

    let totalCollected = 0;
    for (const deal of deals) {
      for (const ms of deal.marginSchedule) totalCollected += parseFloat(ms.receivedAmount || 0);
      for (const ls of deal.loanSchedule) totalCollected += parseFloat(ls.receivedAmount || 0);
    }

    res.json({
      success: true,
      data: {
        totalUnits, bookedUnits, registeredUnits,
        availableUnits: totalUnits - bookedUnits - registeredUnits,
        totalDeals: deals.length, totalCollected
      }
    });
  } catch (err) { next(err); }
});

module.exports = router;
