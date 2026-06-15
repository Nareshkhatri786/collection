import React from 'react'

export const LoadingSpinner = ({ size = 'md', center = false }) => {
  const cls = size === 'sm' ? 'spinner spinner-sm' : size === 'lg' ? 'spinner spinner-lg' : 'spinner'
  if (center) return <div className="loading-center"><div className={cls} /></div>
  return <div className={cls} />
}

export const PageLoader = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
    <div className="spinner spinner-lg" />
    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading...</p>
  </div>
)

export default LoadingSpinner
