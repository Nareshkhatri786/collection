import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => (
  <div style={{ padding: '60px', textAlign: 'center' }}>
    <span style={{ fontSize: '72px' }}>🚧</span>
    <h1 style={{ fontSize: '32px', marginTop: '20px', marginBottom: '10px' }}>404 — Page Not Found</h1>
    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '15px' }}>
      The URL you are trying to access does not exist or has been moved.
    </p>
    <Link to="/dashboard" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>
      Return to Dashboard Home →
    </Link>
  </div>
)

export default NotFound
