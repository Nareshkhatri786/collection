import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter both email and password.')
      return
    }
    try {
      setLoading(true)
      await login(email, password)
      toast.success('Successfully logged in! Welcome.')
      navigate(from, { replace: true })
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Login failed. Please check your credentials.'
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-split-container">
      {/* Background Orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>

      {/* Left — Login Form */}
      <div className="login-split-left">
        <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
          {/* Logo mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{
              width: '44px', height: '44px',
              background: 'var(--gradient-brand)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 16px rgba(79,142,247,0.35)',
              flexShrink: 0
            }}>
              🏢
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Property Collection
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Management System
              </div>
            </div>
          </div>

          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '28px' }}>
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="email">Email / Login ID</label>
              <input
                id="email"
                type="text"
                className="form-input"
                placeholder="e.g. admin or admin@propertysystem.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  style={{ width: '100%', paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    color: 'var(--text-secondary)', cursor: 'pointer',
                    fontSize: '16px', outline: 'none', userSelect: 'none',
                    lineHeight: 1
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '🔒'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              className="btn btn-primary btn-lg btn-shimmer"
              style={{
                width: '100%', border: 'none',
                marginTop: '8px', height: '48px',
                fontSize: '15px', fontWeight: 700,
                borderRadius: 'var(--radius-md)',
                letterSpacing: '0.02em'
              }}
              disabled={loading}
            >
              {loading ? '⏳  Signing in...' : 'Login Securely →'}
            </button>
          </form>

          <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
            Property Collection System v1.0.0 · Secured Platform
          </div>
        </div>
      </div>

      {/* Right — Branding Panel */}
      <div className="login-split-right" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="login-brand-panel">
          <div className="login-brand-logo">🏗️</div>
          <h2 className="login-brand-title">
            Property Collection<br />
            <span style={{ color: 'var(--accent-primary)' }}>Management</span>
          </h2>
          <p className="login-brand-subtitle">
            The complete platform for sole-selling agents to track bookings, collections, and project milestones — all in one place.
          </p>

          <div className="login-usp-list">
            <div className="login-usp-item">
              <div className="login-usp-icon">📊</div>
              <div className="login-usp-text">
                <strong>Track Collections in Real Time</strong>
                <span>Monitor every payment installment and due date as they happen</span>
              </div>
            </div>
            <div className="login-usp-item">
              <div className="login-usp-icon">🔔</div>
              <div className="login-usp-text">
                <strong>Registry & Possession Alerts</strong>
                <span>Never miss a critical deadline with automated reminders</span>
              </div>
            </div>
            <div className="login-usp-item">
              <div className="login-usp-icon">💰</div>
              <div className="login-usp-text">
                <strong>Detailed Financial Ledgers</strong>
                <span>Full cash flow visibility across margin, home loans, and labour</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
