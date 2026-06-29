const express = require('express');
const { body } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidation } = require('../middleware/errorHandler');
const { auditMiddleware } = require('../middleware/auditLog');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate, auditMiddleware);

// Helper: accessible project IDs
const getAccessibleProjectIds = async (user) => {
  if (user.role === 'ADMIN') {
    const projects = await prisma.project.findMany({ select: { id: true } });
    return projects.map(p => p.id);
  }
  if (user.role === 'DEVELOPER') {
    const projects = await prisma.project.findMany({ where: { developerUserId: user.id }, select: { id: true } });
    return projects.map(p => p.id);
  }
  return user.projectIds;
};

// GET /api/units
router.get('/', async (req, res, next) => {
  try {
    const { projectId, status, search } = req.query;
    const accessibleIds = await getAccessibleProjectIds(req.user);

    const where = { projectId: { in: accessibleIds } };
    if (projectId) where.projectId = parseInt(projectId);
    if (status) where.status = status;
    if (search) where.unitNumber = { contains: search };

    const units = await prisma.unit.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        unitType: { select: { typeName: true, basePrice: true } },
        deal: {
          include: { client: { select: { name: true, mobile: true } } }
        }
      },
      orderBy: [{ projectId: 'asc' }, { unitNumber: 'asc' }]
    });
    res.json({ success: true, data: units });
  } catch (err) { next(err); }
});

// POST /api/units
router.post('/', authorize('ADMIN', 'STAFF'), [
  body('projectId').isInt().withMessage('projectId is required'),
  body('unitNumber').notEmpty().withMessage('Unit number is required')
], handleValidation, async (req, res, next) => {
  try {
    const { projectId, unitTypeId, unitNumber, floor, carpetArea } = req.body;

    // Staff access check
    if (req.user.role === 'STAFF' && !req.user.projectIds.includes(parseInt(projectId))) {
      return res.status(403).json({ success: false, error: 'Access denied to this project.' });
    }

    const unit = await prisma.unit.create({
      data: {
        projectId: parseInt(projectId),
        unitTypeId: unitTypeId ? parseInt(unitTypeId) : null,
        unitNumber,
        floor: floor ? parseInt(floor) : null,
        carpetArea: carpetArea ? parseFloat(carpetArea) : null
      },
      include: { unitType: true }
    });
    await req.audit('Unit', unit.id, 'CREATE', null, { projectId, unitNumber });
    res.status(201).json({ success: true, data: unit });
  } catch (err) { next(err); }
});

// POST /api/units/bulk
router.post('/bulk', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { projectId, units } = req.body;
    if (!projectId || !Array.isArray(units) || !units.length) {
      return res.status(400).json({ success: false, error: 'projectId and units array are required.' });
    }
    const created = await prisma.$transaction(
      units.map(u => prisma.unit.create({
        data: {
          projectId: parseInt(projectId),
          unitTypeId: u.unitTypeId ? parseInt(u.unitTypeId) : null,
          unitNumber: u.unitNumber,
          floor: u.floor ? parseInt(u.floor) : null,
          carpetArea: u.carpetArea ? parseFloat(u.carpetArea) : null
        }
      }))
    );
    await req.audit('Unit', parseInt(projectId), 'BULK_CREATE', null, { count: created.length, projectId });
    res.status(201).json({ success: true, data: created, count: created.length });
  } catch (err) { next(err); }
});

// GET /api/units/:id
router.get('/:id', async (req, res, next) => {
  try {
    const unit = await prisma.unit.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        project: { select: { id: true, name: true, status: true } },
        unitType: true,
        deal: {
          include: {
            client: { select: { id: true, name: true, mobile: true, email: true } },
            marginSchedule: { orderBy: { dueDate: 'asc' } },
            loanSchedule: { orderBy: { expectedDate: 'asc' } },
            cashSchedule: { orderBy: { dueDate: 'asc' } }
          }
        }
      }
    });
    if (!unit) return res.status(404).json({ success: false, error: 'Unit not found.' });
    res.json({ success: true, data: unit });
  } catch (err) { next(err); }
});

// PUT /api/units/:id
router.put('/:id', authorize('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const old = await prisma.unit.findUnique({ where: { id } });
    if (!old) return res.status(404).json({ success: false, error: 'Unit not found.' });

    if (req.user.role === 'STAFF' && !req.user.projectIds.includes(old.projectId)) {
      return res.status(403).json({ success: false, error: 'Access denied to this project.' });
    }

    const { unitTypeId, floor, carpetArea } = req.body;
    const data = {};
    if (unitTypeId !== undefined) data.unitTypeId = unitTypeId ? parseInt(unitTypeId) : null;
    if (floor !== undefined) data.floor = floor ? parseInt(floor) : null;
    if (carpetArea !== undefined) data.carpetArea = carpetArea ? parseFloat(carpetArea) : null;

    const updated = await prisma.unit.update({ where: { id }, data, include: { unitType: true } });
    await req.audit('Unit', id, 'UPDATE', { floor: old.floor, carpetArea: old.carpetArea }, data);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// DELETE /api/units/:id
router.delete('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const unit = await prisma.unit.findUnique({ where: { id } });
    if (!unit) return res.status(404).json({ success: false, error: 'Unit not found.' });
    if (unit.status !== 'AVAILABLE') {
      return res.status(400).json({ success: false, error: 'Cannot delete a unit that is Booked or Registered.' });
    }
    await prisma.unit.delete({ where: { id } });
    await req.audit('Unit', id, 'DELETE', { unitNumber: unit.unitNumber }, null);
    res.json({ success: true, message: 'Unit deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
