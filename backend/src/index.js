require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const unitRoutes = require('./routes/units');
const clientRoutes = require('./routes/clients');
const dealRoutes = require('./routes/deals');
const collectionRoutes = require('./routes/collections');
const cashRoutes = require('./routes/cashPayments');
const labourRoutes = require('./routes/labourPayments');
const reportRoutes = require('./routes/reports');
const alertRoutes = require('./routes/alerts');
const auditRoutes = require('./routes/auditLogs');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const prisma = new PrismaClient();

// Make prisma available throughout app
app.set('prisma', prisma);

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/labour', labourRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/audit-logs', auditRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Property Collection API is running', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🏠 Property Collection API running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
