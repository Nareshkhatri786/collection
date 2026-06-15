const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidation } = require('../middleware/errorHandler');
const { auditMiddleware } = require('../middleware/auditLog');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate, authorize('ADMIN'), auditMiddleware);

// GET /api/users
router.get('/', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
        projectAccess: { include: { project: { select: { id: true, name: true } } } },
        developerProject: { select: { id: true, name: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
});

// POST /api/users
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['ADMIN', 'STAFF', 'DEVELOPER']).withMessage('Invalid role')
], handleValidation, async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase(), passwordHash, role },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
    });
    await req.audit('User', user.id, 'CREATE', null, { name, email, role });
    res.status(201).json({ success: true, data: user });
  } catch (err) { next(err); }
});

// GET /api/users/:id
router.get('/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
        projectAccess: { include: { project: { select: { id: true, name: true, status: true } } } },
        developerProject: { select: { id: true, name: true } }
      }
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// PUT /api/users/:id
router.put('/:id', [
  body('name').optional().notEmpty(),
  body('email').optional().isEmail(),
  body('role').optional().isIn(['ADMIN', 'STAFF', 'DEVELOPER'])
], handleValidation, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const old = await prisma.user.findUnique({ where: { id } });
    if (!old) return res.status(404).json({ success: false, error: 'User not found.' });

    const { name, email, role, isActive } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email.toLowerCase();
    if (role !== undefined) data.role = role;
    if (isActive !== undefined) data.isActive = isActive;

    const updated = await prisma.user.update({ where: { id }, data,
      select: { id: true, name: true, email: true, role: true, isActive: true }
    });
    await req.audit('User', id, 'UPDATE', { name: old.name, email: old.email, role: old.role }, data);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// DELETE /api/users/:id (soft delete)
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (id === req.user.id) return res.status(400).json({ success: false, error: 'Cannot deactivate your own account.' });
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    await req.audit('User', id, 'DEACTIVATE', null, { isActive: false });
    res.json({ success: true, message: 'User deactivated.' });
  } catch (err) { next(err); }
});

// GET /api/users/:id/projects
router.get('/:id/projects', async (req, res, next) => {
  try {
    const access = await prisma.userProjectAccess.findMany({
      where: { userId: parseInt(req.params.id) },
      include: { project: { select: { id: true, name: true, developerName: true, status: true } } }
    });
    res.json({ success: true, data: access.map(a => a.project) });
  } catch (err) { next(err); }
});

// POST /api/users/:id/projects
router.post('/:id/projects', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { projectId } = req.body;
    if (!projectId) return res.status(400).json({ success: false, error: 'projectId is required.' });
    await prisma.userProjectAccess.upsert({
      where: { userId_projectId: { userId, projectId: parseInt(projectId) } },
      update: {},
      create: { userId, projectId: parseInt(projectId) }
    });
    await req.audit('UserProjectAccess', userId, 'ASSIGN_PROJECT', null, { projectId });
    res.json({ success: true, message: 'Project access granted.' });
  } catch (err) { next(err); }
});

// DELETE /api/users/:id/projects/:projectId
router.delete('/:id/projects/:projectId', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const projectId = parseInt(req.params.projectId);
    await prisma.userProjectAccess.delete({ where: { userId_projectId: { userId, projectId } } });
    await req.audit('UserProjectAccess', userId, 'REMOVE_PROJECT', { projectId }, null);
    res.json({ success: true, message: 'Project access removed.' });
  } catch (err) { next(err); }
});

// POST /api/users/:id/reset-password (admin reset)
router.post('/:id/reset-password', [
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], handleValidation, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const passwordHash = await bcrypt.hash(req.body.newPassword, 12);
    await prisma.user.update({ where: { id }, data: { passwordHash } });
    await req.audit('User', id, 'PASSWORD_RESET', null, { resetBy: req.user.id });
    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) { next(err); }
});

module.exports = router;
