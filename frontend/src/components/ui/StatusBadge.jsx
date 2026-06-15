import React from 'react'

const StatusBadge = ({ status, type = 'payment' }) => {
  const maps = {
    payment: {
      PENDING: { cls: 'badge-secondary', label: 'Pending', icon: '⏳' },
      PARTIAL: { cls: 'badge-warning', label: 'Partial', icon: '🔸' },
      RECEIVED: { cls: 'badge-success', label: 'Received', icon: '✅' },
      OVERDUE: { cls: 'badge-danger', label: 'Overdue', icon: '🔴' },
      DUE_SOON: { cls: 'badge-warning', label: 'Due Soon', icon: '🟡' }
    },
    unit: {
      AVAILABLE: { cls: 'badge-success', label: 'Available', icon: '🟢' },
      BOOKED: { cls: 'badge-info', label: 'Booked', icon: '🔵' },
      REGISTERED: { cls: 'badge-gold', label: 'Registered', icon: '⭐' }
    },
    registry: {
      PENDING: { cls: 'badge-secondary', label: 'Pending', icon: '⏳' },
      IN_PROGRESS: { cls: 'badge-info', label: 'In Progress', icon: '🔄' },
      DONE: { cls: 'badge-gold', label: 'Done', icon: '✅' }
    },
    project: {
      UNDER_CONSTRUCTION: { cls: 'badge-warning', label: 'Under Construction', icon: '🏗️' },
      READY: { cls: 'badge-success', label: 'Ready', icon: '✅' }
    }
  }

  const map = maps[type] || maps.payment
  const cfg = map[status] || { cls: 'badge-secondary', label: status, icon: '•' }

  return (
    <span className={`badge ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

export default StatusBadge
