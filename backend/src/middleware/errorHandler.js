const { validationResult } = require('express-validator');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()} ${req.method} ${req.path}:`, err.message);

  // Express-validator errors
  if (err.type === 'validation') {
    return res.status(400).json({ success: false, error: err.message, errors: err.errors });
  }

  // Prisma errors
  if (err.code === 'P2002') {
    const fields = err.meta?.target?.join(', ') || 'field';
    return res.status(409).json({ success: false, error: `A record with this ${fields} already exists.` });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, error: 'Record not found.' });
  }
  if (err.code === 'P2003') {
    return res.status(400).json({ success: false, error: 'Related record not found. Check your IDs.' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, error: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Token expired. Please log in again.' });
  }

  // Default
  const statusCode = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'An internal server error occurred.'
    : err.message || 'Something went wrong.';

  res.status(statusCode).json({ success: false, error: message });
};

/**
 * Middleware to check express-validator results
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errArr = errors.array();
    return res.status(400).json({
      success: false,
      error: errArr[0].msg,
      errors: errArr.map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

module.exports = errorHandler;
module.exports.handleValidation = handleValidation;
