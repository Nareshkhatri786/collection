const STAMP_DUTY_RATE = 0.059
const GST_THRESHOLD = 4500000

export const calculateGST = (projectStatus, dealAmount) => {
  const amount = parseFloat(dealAmount) || 0
  if (projectStatus === 'READY') return { rate: 0, amount: 0 }
  if (amount <= GST_THRESHOLD) return { rate: 1, amount: Math.round(amount * 0.01) }
  return { rate: 5, amount: Math.round(amount * 0.05) }
}

export const calculateStampDuty = (dealAmount) => {
  return Math.round((parseFloat(dealAmount) || 0) * STAMP_DUTY_RATE)
}

export const calculateDealFinancials = (projectStatus, dealAmount, maintenanceDeposit, gstOverride = null) => {
  const amount = parseFloat(dealAmount) || 0
  const maint = parseFloat(maintenanceDeposit) || 0
  const stampDuty = calculateStampDuty(amount)
  const gst = calculateGST(projectStatus, amount)
  const gstAmount = gstOverride !== null ? parseFloat(gstOverride) : gst.amount
  const gstRate = gstOverride !== null ? null : gst.rate
  const subTotal = amount + stampDuty + gstAmount + maint
  return { stampDuty, gstRate: gstOverride !== null ? 0 : gst.rate, gstAmount, subTotal }
}
