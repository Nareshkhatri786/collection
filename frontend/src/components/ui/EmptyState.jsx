import React from 'react'

const EmptyState = ({ icon = '📭', title = 'No data found', message = 'Nothing to display here yet.', action }) => (
  <div className="empty-state">
    <div className="empty-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{message}</p>
    {action && action}
  </div>
)

export default EmptyState
