import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      {/* Sidebar with mobile toggle controls */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Backdrop overlay for closing the sidebar on mobile click-outside */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      
      <div className="main-content">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <div className="page-content fade-in">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AppLayout
