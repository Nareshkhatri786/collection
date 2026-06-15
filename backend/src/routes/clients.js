const express = require('express');
const { body, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { handleValidation } = require('../middleware/errorHandler');
const { auditMiddleware } = require('../middleware/auditLog');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate, auditMiddleware);

// GET /api/clients
router.get('/', async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search ? {
      OR: [
        { name: { contains: search } },
        { mobile: { contains: search } },
        { pan: { contains: search } },
        { email: { contains: search } }
      ]
    } : {};

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: { _count: { select: { deals: true } } },
        orderBy: { name: 'asc' },
        skip, take: parseInt(limit)
      }),
      prisma.client.count({ where })
    ]);

    res.json({ success: true, data: clients, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

// POST /api/clients
router.post('/', [
  body('name').notEmpty().withMessage('Client name is required'),
  body('mobile').notEmpty().withMessage('Mobile number is required')
], handleValidation, async (req, res, next) => {
  try {
    const { name, mobile, email, pan, aadhar, address } = req.body;
    const client = await prisma.client.create({ data: { name, mobile, email, pan, aadhar, address } });
    await req.audit('Client', client.id, 'CREATE', null, { name, mobile });
    res.status(201).json({ success: true, data: client });
  } catch (err) { next(err); }
});

// GET /api/clients/:id
router.get('/:id', async (req, res, next) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        deals: {
          include: {
            project: { select: { id: true, name: true } },
            unit: { select: { id: true, unitNumber: true, status: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!client) return res.status(404).json({ success: false, error: 'Client not found.' });
    res.json({ success: true, data: client });
  } catch (err) { next(err); }
});

// PUT /api/clients/:id
router.put('/:id', [
  body('name').optional().notEmpty(),
  body('mobile').optional().notEmpty()
], handleValidation, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const old = await prisma.client.findUnique({ where: { id } });
    if (!old) return res.status(404).json({ success: false, error: 'Client not found.' });

    const { name, mobile, email, pan, aadhar, address } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (mobile !== undefined) data.mobile = mobile;
    if (email !== undefined) data.email = email;
    if (pan !== undefined) data.pan = pan;
    if (aadhar !== undefined) data.aadhar = aadhar;
    if (address !== undefined) data.address = address;

    const updated = await prisma.client.update({ where: { id }, data });
    await req.audit('Client', id, 'UPDATE', { name: old.name, mobile: old.mobile }, data);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

module.exports = router;
