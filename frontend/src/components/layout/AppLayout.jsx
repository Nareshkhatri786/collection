import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

const AppLayout = () => (
  <div className="app-layout">
    <Sidebar />
    <div className="main-content">
      <TopBar />
      <div className="page-content fade-in">
        <Outlet />
      </div>
    </div>
  </div>
)

export default AppLayout
