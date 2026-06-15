import React from 'react'

const StatCard = ({ label, value, sub, icon, variant = '' }) => (
  <div className={`stat-card ${variant}`}>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
    {sub && <div className="stat-sub">{sub}</div>}
    {icon && <div className="stat-icon">{icon}</div>}
  </div>
)

export default StatCard
