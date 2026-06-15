import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatINR } from '../utils/cashFormat'
import api from '../utils/api'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'

const Alerts = () => {
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState([])
  const [filterType, setFilterType] = useState('ALL')

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const res = await api.get('/alerts')
      setAlerts(res.data.data)
    } catch (err) {
      toast.error('Failed to load alerts feed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  const alertIcons = {
    OVERDUE: '🔴',
    DUE_SOON: '🟡',
    POSSESSION_NEAR: '🔵',
    REGISTRY_DUE: '🟣',
    GST_REVIEW: '⚙️'
  }

  const alertLabels = {
    OVERDUE: 'Overdue Payments',
    DUE_SOON: 'Due Soon (3 Days)',
    POSSESSION_NEAR: 'Possession Handover Near',
    REGISTRY_DUE: 'Registry Mandate Due',
    GST_REVIEW: 'GST Rate Change Reviews'
  }

  const filteredAlerts = filterType === 'ALL' ? alerts : alerts.filter(a => a.type === filterType)

  if (loading) {
    return <LoadingSpinner center={true} size="lg" />
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1>Alerts Feed</h1>
          <p>System-generated warnings, due dates, and action items requiring agent attention</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {['ALL', 'OVERDUE', 'DUE_SOON', 'POSSESSION_NEAR', 'REGISTRY_DUE', 'GST_REVIEW'].map(type => {
          const isActive = filterType === type
          const count = type === 'ALL' ? alerts.length : alerts.filter(a => a.type === type).length
          
          return (
            <button
              key={type}
              className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType(type)}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              {type === 'ALL' ? '🔔 All Alerts' : `${alertIcons[type]} ${alertLabels[type]}`} ({count})
            </button>
          )
        })}
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="All Action Items Clear!"
          message={filterType === 'ALL' ? "There are no pending alerts in the system." : `There are no alerts for category "${alertLabels[filterType]}".`}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredAlerts.map((alert, idx) => (
            <div
              key={idx}
              className={`alert-item ${alert.type.toLowerCase()}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-card)',
                borderLeft: `5px solid ${
                  alert.type === 'OVERDUE' ? 'var(--accent-danger)' :
                  alert.type === 'DUE_SOON' ? 'var(--accent-warning)' :
                  alert.type === 'POSSESSION_NEAR' ? 'var(--accent-info)' :
                  alert.type === 'REGISTRY_DUE' ? 'var(--accent-secondary)' :
                  'var(--accent-primary)'
                }`,
                background: 'rgba(20,28,46,0.3)',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '26px' }}>{alertIcons[alert.type] || '🔔'}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                      Unit {alert.unitNumber} — {alert.clientName}
                    </h4>
                    <span
                      style={{
                        fontSize: '9px',
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        background: 'rgba(255,255,255,0.06)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {alert.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {alert.description}
                  </p>
                  {alert.dueDate && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Target Due Date: {new Date(alert.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {alert.amount && (
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-gold)' }}>
                    {formatINR(alert.amount)}
                  </div>
                )}
                <Link to={`/deals/${alert.dealId}`} className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                  Manage Deal →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Alerts
