import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// SVG Icons
const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
)
const IconProjects = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const IconUnits = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="7" x2="15" y2="7"/>
    <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="17" x2="15" y2="17"/>
  </svg>
)
const IconClients = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IconDeals = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
)
const IconCollections = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)
const IconCash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>
    <path d="M6 12h.01M18 12h.01"/>
  </svg>
)
const IconReports = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
)
const IconAlerts = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)
const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconAudit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
)
const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const NavItem = ({ to, icon, label, end }) => (
  <NavLink to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
    <span className="nav-icon">{icon}</span>
    {label}
  </NavLink>
)

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin, isDeveloper } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'
  const roleLabel = { ADMIN: 'Administrator', STAFF: 'Staff', DEVELOPER: 'Developer' }[user?.role] || ''

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Close button on mobile */}
      <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">✕</button>
      {/* Upgraded Brand Block */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">🏢</div>
        <div className="sidebar-brand-name">Property Collection</div>
        <div className="sidebar-brand-sub">Management System</div>
      </div>

      <nav className="sidebar-nav">
        <NavItem to="/dashboard" icon={<IconDashboard />} label="Dashboard" end />

        {!isDeveloper() && (
          <>
            <div className="nav-section-label">Master Data</div>
            <NavItem to="/projects" icon={<IconProjects />} label="Projects" />
            <NavItem to="/units" icon={<IconUnits />} label="Units" />
            <NavItem to="/clients" icon={<IconClients />} label="Clients" />
          </>
        )}

        {isDeveloper() && (
          <>
            <div className="nav-section-label">My Project</div>
            <NavItem to="/projects" icon={<IconProjects />} label="Projects" />
            <NavItem to="/units" icon={<IconUnits />} label="Units" />
          </>
        )}

        {!isDeveloper() && (
          <>
            <div className="nav-section-label">Transactions</div>
            <NavItem to="/deals" icon={<IconDeals />} label="Deals / Bookings" />
            <NavItem to="/collections" icon={<IconCollections />} label="Collections" />
            <NavItem to="/cash-tracking" icon={<IconCash />} label="Cash Tracking" />
          </>
        )}

        <div className="nav-section-label">Reports & Alerts</div>
        <NavItem to="/reports" icon={<IconReports />} label="Reports" />
        <NavItem to="/alerts" icon={<IconAlerts />} label="Alerts" />

        {isAdmin() && (
          <>
            <div className="nav-section-label">Administration</div>
            <NavItem to="/users" icon={<IconUsers />} label="User Management" />
            <NavItem to="/audit-log" icon={<IconAudit />} label="Audit Log" />
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{roleLabel}</div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-icon btn-sm"
            title="Logout"
            style={{ marginLeft: 'auto', flexShrink: 0, color: 'var(--text-muted)' }}
          >
            <IconLogout />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
