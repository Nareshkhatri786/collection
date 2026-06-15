import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import Modal from '../components/ui/Modal'
import FormField from '../components/ui/FormField'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'

const Users = () => {
  const { user: currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])
  
  // Create User Modal State
  const [openCreateModal, setOpenCreateModal] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'STAFF' })
  const [creating, setCreating] = useState(false)

  // Project Assignment Modal State
  const [openAssignModal, setOpenAssignModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userProjects, setUserProjects] = useState([])
  const [assigning, setAssigning] = useState(false)

  // Password Reset Modal State
  const [openResetModal, setOpenResetModal] = useState(false)
  const [resetUserId, setResetUserId] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [usersRes, projRes] = await Promise.all([
        api.get('/users'),
        api.get('/projects')
      ])
      setUsers(usersRes.data.data)
      setProjects(projRes.data.data)
    } catch (err) {
      toast.error('Failed to load user management lists.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('All fields are required.')
      return
    }

    try {
      setCreating(true)
      await api.post('/users', newUser)
      toast.success('User account created!')
      setOpenCreateModal(false)
      setNewUser({ name: '', email: '', password: '', role: 'STAFF' })
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user.')
    } finally {
      setCreating(false)
    }
  }

  const handleDeactivate = async (id, name, isActive) => {
    const action = isActive ? 'deactivate' : 'reactivate'
    if (!window.confirm(`Are you sure you want to ${action} ${name}'s account?`)) return
    
    try {
      if (isActive) {
        await api.delete(`/users/${id}`)
        toast.success(`User ${name} deactivated.`)
      } else {
        await api.put(`/users/${id}`, { isActive: true })
        toast.success(`User ${name} reactivated.`)
      }
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${action} user.`)
    }
  }

  const openAssignModalFor = async (userObj) => {
    setSelectedUser(userObj)
    try {
      const res = await api.get(`/users/${userObj.id}/projects`)
      setUserProjects(res.data.data)
      setOpenAssignModal(true)
    } catch (err) {
      toast.error('Failed to load user project access.')
    }
  }

  const toggleProjectAccess = async (projId, hasAccess) => {
    if (!selectedUser) return
    try {
      setAssigning(true)
      if (hasAccess) {
        // Remove access
        await api.delete(`/users/${selectedUser.id}/projects/${projId}`)
        setUserProjects(prev => prev.filter(p => p.id !== projId))
        toast.success('Project access revoked.')
      } else {
        // Grant access
        await api.post(`/users/${selectedUser.id}/projects`, { projectId: projId })
        const addedProj = projects.find(p => p.id === projId)
        setUserProjects(prev => [...prev, addedProj])
        toast.success('Project access granted!')
      }
      fetchData() // Refresh parent list to show updated projects
    } catch (err) {
      toast.error('Failed to update project assignment.')
    } finally {
      setAssigning(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.')
      return
    }
    try {
      setResetting(true)
      await api.post(`/users/${resetUserId}/reset-password`, { newPassword })
      toast.success('Password reset successfully! 🔐')
      setOpenResetModal(false)
      setNewPassword('')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password.')
    } finally {
      setResetting(false)
    }
  }

  if (loading && users.length === 0) {
    return <LoadingSpinner center={true} size="lg" />
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>User Account Management</h1>
          <p>Configure access, reset passwords, and assign project mandates for agent staff</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpenCreateModal(true)}>
          👤 Create User Account
        </button>
      </div>

      {/* Users table list */}
      {users.length === 0 ? (
        <EmptyState icon="👤" title="No users found" message="No accounts registered." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email Address</th>
                <th>System Role</th>
                <th>Assigned Mandates</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="table-row-hover">
                  <td style={{ fontWeight: 600 }}>{u.name} {u.id === currentUser?.id && ' (You)'}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${
                      u.role === 'ADMIN' ? 'badge-danger' : 
                      u.role === 'DEVELOPER' ? 'badge-warning' : 
                      'badge-primary'
                    }`} style={{ fontSize: '10px' }}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.role === 'ADMIN' ? (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Full Mandate Access</span>
                    ) : u.role === 'DEVELOPER' ? (
                      <span style={{ fontSize: '12px' }}>
                        🏗️ {u.developerProject?.map(p => p.name).join(', ') || 'Unlinked'}
                      </span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {u.projectAccess?.map(pa => (
                          <span key={pa.projectId} className="badge badge-secondary" style={{ fontSize: '9px', padding: '2px 4px' }}>
                            {pa.project?.name}
                          </span>
                        ))}
                        {u.projectAccess?.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>No assignments</span>}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-success' : 'badge-secondary'}`}>
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {u.role === 'STAFF' && u.isActive && (
                      <button className="btn btn-secondary btn-sm" onClick={() => openAssignModalFor(u)} style={{ marginRight: '8px' }}>
                        🔑 Assign Projects
                      </button>
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setResetUserId(u.id); setOpenResetModal(true) }}
                      style={{ marginRight: '8px' }}
                    >
                      🔐 Reset Pass
                    </button>
                    {u.id !== currentUser?.id && (
                      <button
                        className={`btn ${u.isActive ? 'btn-danger' : 'btn-primary'} btn-sm`}
                        onClick={() => handleDeactivate(u.id, u.name, u.isActive)}
                      >
                        {u.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      <Modal open={openCreateModal} onClose={() => setOpenCreateModal(false)} title="Create User Account">
        <form onSubmit={handleCreateUser}>
          <FormField label="Full Name" required>
            <input
              className="form-input"
              placeholder="e.g. Neha Sharma"
              value={newUser.name}
              onChange={e => setNewUser({ ...newUser, name: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Email Address" required>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. neha@propertysystem.com"
              value={newUser.email}
              onChange={e => setNewUser({ ...newUser, email: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Initial Password" required hint="Must be at least 6 characters">
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={newUser.password}
              onChange={e => setNewUser({ ...newUser, password: e.target.value })}
              required
            />
          </FormField>

          <FormField label="System Security Role">
            <select
              className="form-select"
              value={newUser.role}
              onChange={e => setNewUser({ ...newUser, role: e.target.value })}
            >
              <option value="STAFF">Staff / Office Assistant (Restricted project lists)</option>
              <option value="DEVELOPER">Builder / Developer Partner (Access single project + reports)</option>
              <option value="ADMIN">System Admin (Full system mandate control)</option>
            </select>
          </FormField>

          <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setOpenCreateModal(false)} disabled={creating}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Saving User... ⏳' : 'Create Account 👤'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Project Assignment Modal */}
      <Modal open={openAssignModal} onClose={() => setOpenAssignModal(false)} title={`Mandated Project Access: ${selectedUser?.name}`}>
        <div style={{ padding: '6px 0', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Select which projects <strong>{selectedUser?.name}</strong> can view and edit collections for.
        </div>

        {projects.length === 0 ? (
          <EmptyState icon="🏢" title="No projects mandates" message="Register projects first before assigning." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
            {projects.map(p => {
              const hasAccess = userProjects.some(up => up.id === p.id)
              
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-card)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.developerName}</div>
                  </div>
                  <button
                    className={`btn ${hasAccess ? 'btn-danger' : 'btn-primary'} btn-sm`}
                    onClick={() => toggleProjectAccess(p.id, hasAccess)}
                    disabled={assigning}
                    style={{ minWidth: '100px' }}
                  >
                    {hasAccess ? 'Revoke ❌' : 'Grant ➕'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-primary" onClick={() => setOpenAssignModal(false)}>
            Close
          </button>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal open={openResetModal} onClose={() => setOpenResetModal(false)} title="Reset User Password">
        <form onSubmit={handleResetPassword}>
          <FormField label="Enter New Password" required hint="Must be at least 6 characters">
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
          </FormField>

          <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setOpenResetModal(false)} disabled={resetting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={resetting}>
              {resetting ? 'Resetting... ⏳' : 'Reset Password 🔐'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Users
