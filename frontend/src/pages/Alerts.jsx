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

  useEffect(() => { fetchAlerts() }, [])

  const alertConfig = {
    OVERDUE: {
      icon: '🔴', label: 'Overdue Payments', color: 'var(--accent-danger)',
      groupClass: 'critical', pillClass: 'danger', priority: 1
    },
    DUE_SOON: {
      icon: '🟡', label: 'Due Soon (3 Days)', color: 'var(--accent-warning)',
      groupClass: 'warning', pillClass: 'warning', priority: 2
    },
    POSSESSION_NEAR: {
      icon: '🔵', label: 'Possession Handover Near', color: 'var(--accent-info)',
      groupClass: 'info', pillClass: '', priority: 3
    },
    REGISTRY_DUE: {
      icon: '🟣', label: 'Registry Mandate Due', color: 'var(--accent-secondary)',
      groupClass: 'info', pillClass: '', priority: 4
    },
    GST_REVIEW: {
      icon: '⚙️', label: 'GST Rate Change Reviews', color: 'var(--accent-gold)',
      groupClass: 'info', pillClass: '', priority: 5
    }
  }

  const getDaysOverdue = (dueDate) => {
    if (!dueDate) return 0
    const days = Math.floor((new Date() - new Date(dueDate)) / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  const filteredAlerts = filterType === 'ALL' ? alerts : alerts.filter(a => a.type === filterType)

  // Summary counts
  const overdueAlerts = alerts.filter(a => a.type === 'OVERDUE')
  const dueSoonAlerts = alerts.filter(a => a.type === 'DUE_SOON')
  const overdueAmount = overdueAlerts.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0)

  // Group by priority when showing ALL
  const alertTypes = ['OVERDUE', 'DUE_SOON', 'POSSESSION_NEAR', 'REGISTRY_DUE', 'GST_REVIEW']
  const groupedAlerts = filterType === 'ALL'
    ? alertTypes.map(type => ({
        type,
        items: alerts.filter(a => a.type === type)
      })).filter(g => g.items.length > 0)
    : null

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

      {/* Summary Banner */}
      {alerts.length > 0 && (
        <div className="alerts-summary-banner">
          <div className="alerts-summary-item">
            <div className="value danger">{overdueAlerts.length}</div>
            <div className="label">Overdue Items</div>
          </div>
          <div className="alerts-summary-item">
            <div className="value gold">{formatINR(overdueAmount)}</div>
            <div className="label">Total Overdue Amount</div>
          </div>
          <div className="alerts-summary-item">
            <div className="value warning">{dueSoonAlerts.length}</div>
            <div className="label">Due in 3 Days</div>
          </div>
          <div className="alerts-summary-item">
            <div className="value">{alerts.length}</div>
            <div className="label">Total Active Alerts</div>
          </div>
        </div>
      )}

      {/* Filter Pills */}
      <div className="filter-pill-tabs">
        {['ALL', 'OVERDUE', 'DUE_SOON', 'POSSESSION_NEAR', 'REGISTRY_DUE', 'GST_REVIEW'].map(type => {
          const count = type === 'ALL' ? alerts.length : alerts.filter(a => a.type === type).length
          const cfg = alertConfig[type]
          const isActive = filterType === type
          const pillClass = `filter-pill${isActive ? ' active' : ''}${isActive && cfg?.pillClass ? ' ' + cfg.pillClass : ''}`

          return (
            <button key={type} className={pillClass} onClick={() => setFilterType(type)}>
              {type === 'ALL' ? '🔔 All Alerts' : `${cfg.icon} ${cfg.label}`}
              <span className="pill-count">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="All Action Items Clear!"
          message={filterType === 'ALL' ? 'There are no pending alerts in the system.' : `There are no alerts for category "${alertConfig[filterType]?.label}".`}
        />
      ) : (
        <div>
          {/* Grouped view when ALL selected */}
          {filterType === 'ALL' && groupedAlerts ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {groupedAlerts.map(group => {
                const cfg = alertConfig[group.type]
                return (
                  <div key={group.type}>
                    <div className={`alert-group-header ${cfg.groupClass}`}>
                      <span style={{ fontSize: '18px' }}>{cfg.icon}</span>
                      <span>{cfg.label}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 600, opacity: 0.8 }}>
                        {group.items.length} alert{group.items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {group.items.map((alert, idx) => (
                        <AlertCard key={idx} alert={alert} cfg={cfg} getDaysOverdue={getDaysOverdue} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredAlerts.map((alert, idx) => {
                const cfg = alertConfig[alert.type] || alertConfig.GST_REVIEW
                return <AlertCard key={idx} alert={alert} cfg={cfg} getDaysOverdue={getDaysOverdue} />
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Alert Card Sub-component
const AlertCard = ({ alert, cfg, getDaysOverdue }) => {
  const daysOverdue = alert.type === 'OVERDUE' ? getDaysOverdue(alert.dueDate) : 0

  // Light-mode background tints per alert type
  const bgTints = {
    OVERDUE: 'rgba(220,38,38,0.04)',
    DUE_SOON: 'rgba(217,119,6,0.04)',
    POSSESSION_NEAR: 'rgba(37,99,235,0.04)',
    REGISTRY_DUE: 'rgba(124,92,252,0.04)',
    GST_REVIEW: 'rgba(217,119,6,0.04)',
  }

  return (
    <div
      className={`alert-item alert-${alert.type.toLowerCase()}`}
      style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(0,0,0,0.07)',
        borderLeft: `5px solid ${cfg.color}`,
        background: bgTints[alert.type] || '#ffffff',
        boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
        gap: '16px',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '24px', flexShrink: 0 }}>{cfg.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Unit {alert.unitNumber} — {alert.clientName}
            </h4>
            {/* Priority Tag */}
            {alert.type === 'OVERDUE' && (
              <span className="priority-tag urgent">● Urgent</span>
            )}
            {alert.type === 'DUE_SOON' && (
              <span className="priority-tag high">● High</span>
            )}
            {/* Days Overdue */}
            {daysOverdue > 0 && (
              <span className="days-overdue-badge">⏰ {daysOverdue} days overdue</span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
            {alert.description}
          </p>
          {alert.dueDate && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Target Date: {new Date(alert.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
        {alert.amount && (
          <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--accent-gold)' }}>
            {formatINR(alert.amount)}
          </div>
        )}
        <Link
          to={`/deals/${alert.dealId}`}
          className="btn btn-secondary btn-sm"
          style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          Manage Deal →
        </Link>
      </div>
    </div>
  )
}

export default Alerts

