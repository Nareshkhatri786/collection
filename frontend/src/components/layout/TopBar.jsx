import React from 'react'
import { useLocation } from 'react-router-dom'
import AlertsBell from './AlertsBell'
import { useAuth } from '../../context/AuthContext'

const pageTitles = {
  '/dashboard': { title: 'Dashboard', sub: 'Welcome back!' },
  '/projects': { title: 'Projects', sub: 'Manage your real estate projects' },
  '/units': { title: 'Units', sub: 'All units across projects' },
  '/clients': { title: 'Clients', sub: 'Client master records' },
  '/deals': { title: 'Deals & Bookings', sub: 'All booking records' },
  '/deals/new': { title: 'New Booking', sub: 'Create a new deal' },
  '/collections': { title: 'Collections', sub: 'Track incoming payments' },
  '/cash-tracking': { title: 'Cash Tracking', sub: 'Extra work & cash amounts' },
  '/reports': { title: 'Reports', sub: 'Monthly projections & achievements' },
  '/alerts': { title: 'Alerts & Reminders', sub: 'Due payments & important notices' },
  '/users': { title: 'User Management', sub: 'Admin: manage staff & developer access' },
  '/audit-log': { title: 'Audit Log', sub: 'Track all system changes' }
}

const TopBar = () => {
  const { pathname } = useLocation()
  const { user } = useAuth()

  const key = Object.keys(pageTitles).find(k => pathname.startsWith(k)) || '/dashboard'
  const { title, sub } = pageTitles[key] || { title: 'Page', sub: '' }

  return (
    <div className="topbar">
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>{sub}</div>
      </div>
      <AlertsBell />
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '6px 12px', background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)',
        fontSize: '12px'
      }}>
        <span style={{ color: 'var(--text-secondary)' }}>Logged in as</span>
        <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{user?.role}</span>
      </div>
    </div>
  )
}

export default TopBar
