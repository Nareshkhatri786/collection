import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LoadingSpinner } from './components/ui/LoadingSpinner'

// Layout
import AppLayout from './components/layout/AppLayout'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Units from './pages/Units'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Deals from './pages/Deals'
import DealWizard from './components/deals/DealWizard'
import DealDetail from './pages/DealDetail'
import Collections from './pages/Collections'
import CashTracking from './pages/CashTracking'
import Reports from './pages/Reports'
import Alerts from './pages/Alerts'
import AuditLog from './pages/AuditLog'
import Users from './pages/Users'
import NotFound from './pages/NotFound'

// Route protection guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, hasRole } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingSpinner center={true} size="lg" />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !hasRole(...allowedRoles)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes inside layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Redirects root to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="units" element={<Units />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/:id" element={<ClientDetail />} />
            <Route path="deals" element={<Deals />} />
            <Route path="deals/new" element={<DealWizard />} />
            <Route path="deals/:id" element={<DealDetail />} />
            <Route path="collections" element={<Collections />} />
            <Route path="cash-tracking" element={<CashTracking />} />
            <Route path="reports" element={<Reports />} />
            <Route path="alerts" element={<Alerts />} />
            
            {/* Admin Only Routes */}
            <Route
              path="audit-log"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AuditLog />
                </ProtectedRoute>
              }
            />
            <Route path="users" element={<Users />} />

            {/* Fallback 404 inside layout */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
