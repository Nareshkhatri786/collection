/**
 * Format a number in Indian cash "=" notation
 * e.g. 24500 → "24500=00"
 * e.g. 8000 → "8000=00"
 */
export const formatCash = (amount) => {
  if (amount === null || amount === undefined || amount === '') return '—'
  const num = Math.round(parseFloat(amount))
  return `${num.toLocaleString('en-IN')}=00`
}

/**
 * Format a number as Indian Rupee currency
 * e.g. 525705 → "₹5,25,705"
 */
export const formatINR = (amount) => {
  if (amount === null || amount === undefined || amount === '') return '—'
  const num = parseFloat(amount)
  if (isNaN(num)) return '—'
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

/**
 * Format a number as compact INR (e.g. 4500000 → "₹45 L")
 */
export const formatINRCompact = (amount) => {
  if (!amount) return '₹0'
  const num = parseFloat(amount)
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)} Cr`
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)} L`
  if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K`
  return `₹${num}`
}

/**
 * Parse cash "=" notation input to plain number
 * e.g. "24500=00" → 24500
 */
export const parseCash = (value) => {
  if (!value) return 0
  return parseFloat(String(value).replace('=00', '').replace(/,/g, '')) || 0
}
