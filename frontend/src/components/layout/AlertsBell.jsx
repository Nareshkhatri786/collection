import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlerts } from '../../hooks/useAlerts'

const alertIcons = { OVERDUE: '🔴', DUE_SOON: '🟡', POSSESSION_NEAR: '🔵', REGISTRY_DUE: '🟣', GST_REVIEW: '🟠' }

const AlertsBell = () => {
  const { counts } = useAlerts()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const handleViewAll = () => { setOpen(false); navigate('/alerts') }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="btn btn-ghost btn-icon"
        style={{ position: 'relative', fontSize: '18px' }}
        title="Alerts"
      >
        🔔
        {counts.total > 0 && (
          <span style={{
            position: 'absolute', top: '-2px', right: '-2px',
            background: 'var(--accent-danger)',
            color: 'white', borderRadius: '100px',
            fontSize: '10px', fontWeight: 800,
            padding: '1px 5px', minWidth: '16px', textAlign: 'center',
            lineHeight: '14px'
          }}>
            {counts.total > 99 ? '99+' : counts.total}
          </span>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 150 }} />
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
            width: '320px', background: 'var(--bg-modal)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-modal)',
            zIndex: 160, overflow: 'hidden'
          }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '14px' }}>🔔 Alerts</span>
              <span className="badge badge-danger">{counts.total} active</span>
            </div>

            <div style={{ padding: '8px' }}>
              {[
                { key: 'OVERDUE', label: 'Overdue Payments', cls: 'badge-danger' },
                { key: 'DUE_SOON', label: 'Due in 3 Days', cls: 'badge-warning' },
                { key: 'REGISTRY_DUE', label: 'Registry Due', cls: 'badge-purple' },
                { key: 'POSSESSION_NEAR', label: 'Possession Near', cls: 'badge-info' },
                { key: 'GST_REVIEW', label: 'GST Review Needed', cls: 'badge-gold' }
              ].filter(a => counts[a.key] > 0).map(a => (
                <div key={a.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {alertIcons[a.key]} {a.label}
                  </span>
                  <span className={`badge ${a.cls}`}>{counts[a.key]}</span>
                </div>
              ))}
              {counts.total === 0 && <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>✅ No active alerts</div>}
            </div>

            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-card)' }}>
              <button onClick={handleViewAll} className="btn btn-primary btn-sm w-full">View All Alerts</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AlertsBell
