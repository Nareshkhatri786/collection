import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns'

export const formatDate = (date) => {
  if (!date) return '—'
  try { return format(new Date(date), 'dd MMM yyyy') } catch { return '—' }
}

export const formatDateShort = (date) => {
  if (!date) return '—'
  try { return format(new Date(date), 'dd/MM/yyyy') } catch { return '—' }
}

export const formatDateInput = (date) => {
  if (!date) return ''
  try { return format(new Date(date), 'yyyy-MM-dd') } catch { return '' }
}

export const formatMonthYear = (date) => {
  if (!date) return '—'
  try { return format(new Date(date), 'MMM yyyy') } catch { return '—' }
}

export const formatRelative = (date) => {
  if (!date) return '—'
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }) } catch { return '—' }
}

export const isOverdue = (date) => {
  if (!date) return false
  return isBefore(new Date(date), new Date())
}

export const isDueSoon = (date, days = 3) => {
  if (!date) return false
  const d = new Date(date)
  const now = new Date()
  return isAfter(d, now) && isBefore(d, addDays(now, days))
}

export const todayISO = () => format(new Date(), 'yyyy-MM-dd')

export const monthOptions = () =>
  Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(2024, i, 1), 'MMMM')
  }))

export const yearOptions = (from = 2024, to = 2030) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i)
