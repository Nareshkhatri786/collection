import React from 'react'

const ConfirmDialog = ({ open, onClose, onConfirm, title = 'Confirm', message, confirmLabel = 'Confirm', danger = false, loading = false }) => {
  if (!open) return null
  return (
    <div className="modal-overlay">
      <div className="modal-content modal-sm">
        <div className="modal-header">
          <h2 className="modal-title">{danger ? '⚠️ ' : ''}{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-ghost" disabled={loading}>Cancel</button>
          <button onClick={onConfirm} className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} disabled={loading}>
            {loading ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
