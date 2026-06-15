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
        
        // 1. Fetch projects and alerts count in parallel
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

        // 2. Fetch stats for each project to calculate total collection and total deals
        let totalCollection = 0
        let activeDeals = 0

        const statsPromises = fetchedProjects.map(p => api.get(`/projects/${p.id}/stats`))
        const statsResults = await Promise.all(statsPromises)

        statsResults.forEach(res => {
          const s = res.data.data
          totalCollection += parseFloat(s.totalCollected || 0)
          activeDeals += parseInt(s.totalDeals || 0)
        })

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

  const alertIcons = {
    OVERDUE: '🔴',
    DUE_SOON: '🟡',
    POSSESSION_NEAR: '🔵',
    REGISTRY_DUE: '🟣',
    GST_REVIEW: '⚙️'
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1>Dashboard</h1>
        <p>Welcome back, <strong>{user?.name}</strong> ({user?.role})</p>
      </div>

      {/* Stats Cards Row */}
      <div className="form-row-4" style={{ marginBottom: '30px' }}>
        <StatCard
          label={isDeveloper() ? 'My Project' : 'Total Projects'}
          value={stats.totalProjects}
          icon="🏢"
          sub={isDeveloper() ? 'Assigned' : 'Active selling'}
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
        {/* Left Column: Recent Alerts */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ margin: 0 }}>Active Action Alerts</h3>
            <Link to="/alerts" className="btn btn-secondary btn-sm">View All Alerts ({alertCounts.total || 0})</Link>
          </div>

          {alerts.length === 0 ? (
            <EmptyState
              icon="🔔"
              title="All Clear!"
              message="No outstanding overdue, due soon, or registry alerts found."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alerts.slice(0, 5).map((alert, idx) => (
                <div
                  key={idx}
                  className={`alert-item ${alert.type.toLowerCase()}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: `4px solid ${
                      alert.type === 'OVERDUE' ? 'var(--accent-danger)' :
                      alert.type === 'DUE_SOON' ? 'var(--accent-warning)' :
                      alert.type === 'POSSESSION_NEAR' ? 'var(--accent-info)' :
                      alert.type === 'REGISTRY_DUE' ? 'var(--accent-secondary)' :
                      'var(--accent-primary)'
                    }`,
                    background: 'rgba(255,255,255,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{alertIcons[alert.type] || '🔔'}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>
                        {alert.unitNumber} — {alert.clientName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {alert.description}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
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
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions & Projects */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {!isDeveloper() && (
                <Link to="/deals/new" className="btn btn-primary" style={{ textAlign: 'center', display: 'block', textDecoration: 'none' }}>
                  🤝 Create New Booking
                </Link>
              )}
              {!isDeveloper() && (
                <Link to="/collections" className="btn btn-secondary" style={{ textAlign: 'center', display: 'block', textDecoration: 'none' }}>
                  ⏳ Record Collection
                </Link>
              )}
              <Link to="/reports" className="btn btn-secondary" style={{ textAlign: 'center', display: 'block', textDecoration: 'none' }}>
                📊 Export Reports
              </Link>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Projects</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
              {projects.map(p => (
                <Link
                  key={p.id}
                  to={`/projects/${p.id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-card)',
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                  className="card-hover-effect"
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.developerName}</div>
                  </div>
                  <span
                    className={`badge ${p.status === 'READY' ? 'badge-success' : 'badge-warning'}`}
                    style={{ fontSize: '10px', padding: '2px 6px' }}
                  >
                    {p.status === 'READY' ? 'Ready' : 'Const.'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
