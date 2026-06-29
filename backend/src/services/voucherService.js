/**
 * Voucher / Receipt Number Generator
 *
 * Format:
 *   RCP-YYMM-NNNN  → Collection Receipts (Margin, Loan, Cash received)
 *   CVR-YYMM-NNNN  → Cash Payment Vouchers (Labour / Extra Work payments)
 *
 * The serial counter is maintained in-memory and resets on server restart.
 * The date prefix (YYMM) ensures uniqueness across months.
 * For production persistence, this can be moved to a DB sequence table.
 */

const counters = {};

/**
 * Get current YYMM prefix string  e.g. "2506" for June 2025
 */
function getDatePrefix() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${yy}${mm}`;
}

/**
 * Generate a unique voucher/receipt number
 * @param {'RCP'|'CVR'} type - Receipt or Cash Voucher
 * @returns {string} e.g. "RCP-2506-0001"
 */
function generateVoucherNumber(type = 'RCP') {
  const prefix = getDatePrefix();
  const key = `${type}-${prefix}`;

  if (!counters[key]) {
    counters[key] = 0;
  }
  counters[key] += 1;

  const serial = String(counters[key]).padStart(4, '0');
  return `${type}-${prefix}-${serial}`;
}

module.exports = { generateVoucherNumber };
