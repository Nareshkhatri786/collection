import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NavItem = ({ to, icon, label, end }) => (
  <NavLink to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
    <span className="nav-icon">{icon}</span>
    {label}
  </NavLink>
)

const Sidebar = () => {
  const { user, logout, isAdmin, isDeveloper } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'
  const roleLabel = { ADMIN: 'Administrator', STAFF: 'Staff', DEVELOPER: 'Developer' }[user?.role] || ''

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">🏠</span>
        <h2>Property Collection</h2>
        <span>Management System</span>
      </div>

      <nav className="sidebar-nav">
        <NavItem to="/dashboard" icon="📊" label="Dashboard" end />

        {!isDeveloper() && (
          <>
            <div className="nav-section-label">Master Data</div>
            <NavItem to="/projects" icon="🏗️" label="Projects" />
            <NavItem to="/units" icon="🏢" label="Units" />
            <NavItem to="/clients" icon="👥" label="Clients" />
          </>
        )}

        {isDeveloper() && (
          <>
            <div className="nav-section-label">My Project</div>
            <NavItem to="/projects" icon="🏗️" label="Projects" />
            <NavItem to="/units" icon="🏢" label="Units" />
          </>
        )}

        {!isDeveloper() && (
          <>
            <div className="nav-section-label">Transactions</div>
            <NavItem to="/deals" icon="📝" label="Deals / Bookings" />
            <NavItem to="/collections" icon="💰" label="Collections" />
            <NavItem to="/cash-tracking" icon="💵" label="Cash Tracking" />
          </>
        )}

        <div className="nav-section-label">Reports & Alerts</div>
        <NavItem to="/reports" icon="📈" label="Reports" />
        <NavItem to="/alerts" icon="🔔" label="Alerts" />

        {isAdmin() && (
          <>
            <div className="nav-section-label">Administration</div>
            <NavItem to="/users" icon="👤" label="User Management" />
            <NavItem to="/audit-log" icon="📋" label="Audit Log" />
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
          <button onClick={handleLogout} className="btn btn-ghost btn-icon btn-sm" title="Logout" style={{ marginLeft: 'auto', flexShrink: 0 }}>
            🚪
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
