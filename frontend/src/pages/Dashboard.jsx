import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatINR } from '../utils/cashFormat'
import api from '../utils/api'
import StatCard from '../components/ui/StatCard'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'

const Dashboard = () => {
  const { user, isDeveloper } = useAuth()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [projectStats, setProjectStats] = useState({})
  const [alerts, setAlerts] = useState([])
  const [alertCounts, setAlertCounts] = useState({ OVERDUE: 0, total: 0 })
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeDeals: 0,
    totalCollection: 0,
    overdueCount: 0
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        const [projRes, alertsRes, alertCountRes] = await Promise.all([
          api.get('/projects'),
          api.get('/alerts'),
          api.get('/alerts/count')
        ])

        const fetchedProjects = projRes.data.data
        const fetchedAlerts = alertsRes.data.data
        const fetchedAlertCounts = alertCountRes.data.data

        setProjects(fetchedProjects)
        setAlerts(fetchedAlerts)
        setAlertCounts(fetchedAlertCounts)

        let totalCollection = 0
        let activeDeals = 0
        const statsMap = {}

        const statsPromises = fetchedProjects.map(p => api.get(`/projects/${p.id}/stats`))
        const statsResults = await Promise.all(statsPromises)

        statsResults.forEach((res, idx) => {
          const s = res.data.data
          statsMap[fetchedProjects[idx].id] = s
          totalCollection += parseFloat(s.totalCollected || 0)
          activeDeals += parseInt(s.totalDeals || 0)
        })

        setProjectStats(statsMap)
        setStats({
          totalProjects: fetchedProjects.length,
          activeDeals,
          totalCollection,
          overdueCount: fetchedAlertCounts.OVERDUE || 0
        })
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return <LoadingSpinner center={true} size="lg" />
  }

  const firstName = user?.name?.split(' ')[0] || 'there'
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const alertColors = {
    OVERDUE: 'var(--accent-danger)',
    DUE_SOON: 'var(--accent-warning)',
    POSSESSION_NEAR: 'var(--accent-info)',
    REGISTRY_DUE: 'var(--accent-secondary)',
    GST_REVIEW: 'var(--accent-gold)'
  }
  const alertIcons = {
    OVERDUE: '🔴', DUE_SOON: '🟡', POSSESSION_NEAR: '🔵',
    REGISTRY_DUE: '🟣', GST_REVIEW: '⚙️'
  }

  return (
    <div>
      {/* KPI Welcome Strip */}
      <div className="kpi-strip">
        <div>
          <div className="kpi-strip-welcome">
            Good {today.getHours() < 12 ? 'Morning' : today.getHours() < 17 ? 'Afternoon' : 'Evening'},&nbsp;
            <span>{firstName}!</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Here's a snapshot of your portfolio performance
          </div>
        </div>
        <div className="kpi-strip-date">
          <strong>{dateStr}</strong>
          <span>{user?.role === 'ADMIN' ? '👑 Administrator View' : user?.role === 'DEVELOPER' ? '🏗️ Developer View' : '💼 Staff View'}</span>
        </div>
      </div>

      {/* Stats Cards — uses .form-row-4 (the bug is now fixed) */}
      <div className="form-row-4" style={{ marginBottom: '30px' }}>
        <StatCard
          label={isDeveloper() ? 'My Project' : 'Total Projects'}
          value={stats.totalProjects}
          icon="🏢"
          sub={isDeveloper() ? 'Assigned project' : 'Active mandates'}
        />
        <StatCard
          label="Bookings (Active Deals)"
          value={stats.activeDeals}
          icon="🤝"
          variant="secondary"
          sub="Total units booked/registered"
        />
        <StatCard
          label="Total Collection"
          value={formatINR(stats.totalCollection)}
          icon="💰"
          variant="gold"
          sub="Received margin & loans"
        />
        <StatCard
          label="Overdue Collections"
          value={stats.overdueCount}
          icon="⏳"
          variant="danger"
          sub="Requires immediate follow-up"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column: Active Alerts */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px' }}>Active Action Alerts</h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Showing top {Math.min(alerts.length, 5)} of {alertCounts.total || 0} alerts
              </p>
            </div>
            <Link to="/alerts" className="btn btn-secondary btn-sm">
              View All →
            </Link>
          </div>

          {alerts.length === 0 ? (
            <EmptyState
              icon="🔔"
              title="All Clear!"
              message="No outstanding overdue, due soon, or registry alerts found."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {alerts.slice(0, 5).map((alert, idx) => {
                const daysOverdue = alert.dueDate
                  ? Math.floor((new Date() - new Date(alert.dueDate)) / (1000 * 60 * 60 * 24))
                  : 0

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-card-hover)',
                      border: '1px solid var(--border-card)',
                      borderLeft: `4px solid ${alertColors[alert.type] || 'var(--accent-primary)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '18px' }}>{alertIcons[alert.type] || '🔔'}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {alert.unitNumber} — {alert.clientName}
                          {alert.type === 'OVERDUE' && daysOverdue > 0 && (
                            <span className="days-overdue-badge">{daysOverdue}d overdue</span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {alert.description}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {alert.amount && (
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent-gold)' }}>
                          {formatINR(alert.amount)}
                        </div>
                      )}
                      <Link
                        to={`/deals/${alert.dealId}`}
                        style={{ fontSize: '11px', color: 'var(--accent-primary)', textDecoration: 'none' }}
                      >
                        Open Deal →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Actions — styled as action tiles */}
          {!isDeveloper() && (
            <div className="card">
              <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link to="/deals/new" className="quick-action-tile">
                  <div className="tile-icon primary">🤝</div>
                  <span>Create New Booking</span>
                  <span className="tile-arrow">›</span>
                </Link>
                <Link to="/collections" className="quick-action-tile">
                  <div className="tile-icon gold">💰</div>
                  <span>Record Collection</span>
                  <span className="tile-arrow">›</span>
                </Link>
                <Link to="/reports" className="quick-action-tile">
                  <div className="tile-icon success">📊</div>
                  <span>View Reports</span>
                  <span className="tile-arrow">›</span>
                </Link>
              </div>
            </div>
          )}

          {/* Projects mini list */}
          <div className="card" style={{ flex: 1 }}>
            <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Projects</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
              {projects.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No projects found.</p>
              ) : projects.map(p => {
                const ps = projectStats[p.id] || {}
                const total = ps.totalUnits || 0
                const booked = (ps.bookedUnits || 0) + (ps.registeredUnits || 0)
                const pct = total > 0 ? Math.round((booked / total) * 100) : 0
                const isUnderConst = p.status === 'UNDER_CONSTRUCTION'

                return (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    style={{
                      display: 'block', padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card-hover)',
                      border: '1px solid var(--border-card)',
                      textDecoration: 'none', color: 'inherit'
                    }}
                    className="card-hover-effect"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isUnderConst && <span className="status-dot active"></span>}
                          {!isUnderConst && <span className="status-dot ready"></span>}
                          {p.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.developerName}</div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-info)' }}>{pct}%</span>
                    </div>
                    {/* Mini progress bar */}
                    <div className="progress-bar-wrap">
                      <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
