const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { handleValidation } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/auditLog');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/auth/login
router.post('/login', [
  body('email').notEmpty().withMessage('Email or Login ID is required'),
  body('password').notEmpty().withMessage('Password is required')
], handleValidation, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { projectAccess: { include: { project: { select: { id: true, name: true } } } } }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          assignedProjects: user.projectAccess.map(pa => pa.project)
        }
      }
    });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        projectAccess: { include: { project: { select: { id: true, name: true, status: true } } } },
        developerProject: { select: { id: true, name: true, status: true } }
      }
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    res.json({
      success: true,
      data: {
        id: user.id, name: user.name, email: user.email, role: user.role,
        assignedProjects: user.role === 'DEVELOPER'
          ? user.developerProject
          : user.projectAccess.map(pa => pa.project)
      }
    });
  } catch (err) { next(err); }
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, [
  body('oldPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], handleValidation, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValid) return res.status(400).json({ success: false, error: 'Current password is incorrect.' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) { next(err); }
});

module.exports = router;
