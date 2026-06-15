/**
 * GST Calculator Service
 * Rules:
 *   - Project READY → GST = 0%
 *   - Under Construction + deal ≤ 45 lakh → GST = 1%
 *   - Under Construction + deal > 45 lakh → GST = 5%
 * Stamp Duty is always 5.9% of deal amount regardless of project status.
 */

const STAMP_DUTY_RATE = 0.059;
const GST_THRESHOLD = 4500000; // 45 lakhs in rupees

/**
 * Calculate GST based on project status and deal amount
 * @param {string} projectStatus - 'UNDER_CONSTRUCTION' | 'READY'
 * @param {number} dealAmount - Deal amount in rupees
 * @returns {{ rate: number, amount: number }} rate is percentage (0, 1, or 5)
 */
const calculateGST = (projectStatus, dealAmount) => {
  if (projectStatus === 'READY') {
    return { rate: 0, amount: 0 };
  }
  if (dealAmount <= GST_THRESHOLD) {
    return { rate: 1, amount: Math.round(dealAmount * 0.01) };
  }
  return { rate: 5, amount: Math.round(dealAmount * 0.05) };
};

/**
 * Calculate stamp duty
 * @param {number} dealAmount
 * @returns {number} stamp duty amount
 */
const calculateStampDuty = (dealAmount) => {
  return Math.round(dealAmount * STAMP_DUTY_RATE);
};

/**
 * Calculate full deal financials
 * @param {string} projectStatus
 * @param {number} dealAmount
 * @param {number} maintenanceDeposit
 * @param {number|null} gstOverride - Manual GST amount if overridden
 * @returns {{ stampDuty, gstRate, gstAmount, subTotal }}
 */
const calculateDealFinancials = (projectStatus, dealAmount, maintenanceDeposit, gstOverride = null) => {
  const stampDuty = calculateStampDuty(dealAmount);
  const gst = calculateGST(projectStatus, dealAmount);
  const gstAmount = gstOverride !== null ? gstOverride : gst.amount;
  const gstRate = gstOverride !== null ? null : gst.rate; // null means manually overridden
  const subTotal = dealAmount + stampDuty + gstAmount + maintenanceDeposit;

  return {
    stampDuty,
    gstRate: gstOverride !== null ? 0 : gst.rate,
    gstAmount,
    subTotal
  };
};

module.exports = { calculateGST, calculateStampDuty, calculateDealFinancials, STAMP_DUTY_RATE, GST_THRESHOLD };
