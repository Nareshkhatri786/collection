import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import AlertsBell from './AlertsBell'
import { useAuth } from '../../context/AuthContext'

const pageTitles = {
  '/dashboard': { title: 'Dashboard', sub: 'Overview of your portfolio' },
  '/projects': { title: 'Projects', sub: 'Manage your real estate mandates' },
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
  const [now, setNow] = useState(new Date())

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const key = Object.keys(pageTitles).find(k => pathname.startsWith(k)) || '/dashboard'
  const { title, sub } = pageTitles[key] || { title: 'Page', sub: '' }

  const roleLabel = { ADMIN: 'Admin', STAFF: 'Staff', DEVELOPER: 'Developer' }[user?.role] || user?.role

  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

  return (
    <div className="topbar">
      {/* Page Title */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          {title}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>{sub}</div>
      </div>

      {/* Date + Time */}
      <div className="topbar-datetime" style={{ display: 'none' }} id="topbar-datetime">
        <strong>{dateStr}</strong>
        {timeStr}
      </div>
      <div className="topbar-datetime" style={{ textAlign: 'right', lineHeight: 1.5, marginRight: '4px' }}>
        <strong style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px' }}>{dateStr}</strong>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{timeStr}</span>
      </div>

      <AlertsBell />

      {/* User pill */}
      <div className="topbar-user-pill">
        <div style={{
          width: '28px', height: '28px',
          borderRadius: '50%',
          background: 'var(--gradient-brand)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 800, color: 'white',
          flexShrink: 0
        }}>
          {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
        </div>
        <div>
          <div className="user-name">{user?.name?.split(' ')[0] || 'User'}</div>
          <div className="user-role">{roleLabel}</div>
        </div>
      </div>
    </div>
  )
}

export default TopBar
