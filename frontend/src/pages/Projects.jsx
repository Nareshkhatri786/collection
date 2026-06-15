import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatINR } from '../utils/cashFormat'
import api from '../utils/api'
import StatusBadge from '../components/ui/StatusBadge'
import Modal from '../components/ui/Modal'
import FormField from '../components/ui/FormField'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const Projects = () => {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [projectStats, setProjectStats] = useState({})
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  
  // Modal State
  const [openModal, setOpenModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [developers, setDevelopers] = useState([])
  const [newProject, setNewProject] = useState({
    name: '',
    developerName: '',
    location: '',
    status: 'UNDER_CONSTRUCTION',
    maintenanceDeposit: '',
    possessionDate: '',
    developerUserId: ''
  })

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const res = await api.get('/projects')
      const projs = res.data.data
      setProjects(projs)

      // Fetch stats for each project to show collection & booked percentages
      const statsMap = {}
      const statsPromises = projs.map(async (p) => {
        try {
          const statsRes = await api.get(`/projects/${p.id}/stats`)
          statsMap[p.id] = statsRes.data.data
        } catch (err) {
          console.error(`Error fetching stats for project ${p.id}:`, err)
        }
      })
      await Promise.all(statsPromises)
      setProjectStats(statsMap)
    } catch (err) {
      toast.error('Failed to load projects.')
    } finally {
      setLoading(false)
    }
  }

  const fetchDevelopers = async () => {
    if (!isAdmin()) return
    try {
      const res = await api.get('/users')
      const devs = res.data.data.filter(u => u.role === 'DEVELOPER')
      setDevelopers(devs)
    } catch (err) {
      console.error('Failed to load developers:', err)
    }
  }

  useEffect(() => {
    fetchProjects()
    fetchDevelopers()
  }, [])

  const handleCreateProject = async (e) => {
    e.preventDefault()
    if (!newProject.name || !newProject.developerName || !newProject.location) {
      toast.error('Please fill in all required fields.')
      return
    }

    try {
      setSaving(true)
      const payload = {
        ...newProject,
        maintenanceDeposit: parseFloat(newProject.maintenanceDeposit || 0),
        developerUserId: newProject.developerUserId ? parseInt(newProject.developerUserId) : null,
        possessionDate: newProject.possessionDate || null
      }
      
      await api.post('/projects', payload)
      toast.success('Project created successfully! 🏢')
      setOpenModal(false)
      // Reset form
      setNewProject({
        name: '',
        developerName: '',
        location: '',
        status: 'UNDER_CONSTRUCTION',
        maintenanceDeposit: '',
        possessionDate: '',
        developerUserId: ''
      })
      fetchProjects()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create project.')
    } finally {
      setSaving(false)
    }
  }

  // Filter projects list
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.developerName.toLowerCase().includes(search.toLowerCase()) ||
                          p.location.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <LoadingSpinner center={true} size="lg" />
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p>Manage real estate projects under sales mandates</p>
        </div>
        {isAdmin() && (
          <button className="btn btn-primary" onClick={() => setOpenModal(true)}>
            ➕ Add New Mandate
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search projects by name, developer, or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ width: '200px' }}>
            <select
              className="form-select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="UNDER_CONSTRUCTION">Under Construction</option>
              <option value="READY">Ready to Move</option>
            </select>
          </div>
        </div>
      </div>

      {/* Project Cards Grid */}
      {filteredProjects.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <h3>No projects found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your search filters or add a new mandate.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {filteredProjects.map((p) => {
            const stats = projectStats[p.id] || { totalUnits: 0, bookedUnits: 0, registeredUnits: 0, totalCollected: 0 }
            const bookedPct = stats.totalUnits > 0 ? Math.round(((stats.bookedUnits + stats.registeredUnits) / stats.totalUnits) * 100) : 0
            const isUnderConst = p.status === 'UNDER_CONSTRUCTION'

            // Possession countdown
            let possessionLabel = null
            let countdownClass = ''
            if (p.possessionDate) {
              const daysLeft = Math.ceil((new Date(p.possessionDate) - new Date()) / (1000 * 60 * 60 * 24))
              if (daysLeft < 0) {
                possessionLabel = `${Math.abs(daysLeft)}d Overdue`
                countdownClass = 'urgent'
              } else if (daysLeft <= 90) {
                possessionLabel = `${daysLeft}d to Possession`
                countdownClass = 'soon'
              } else {
                possessionLabel = `${daysLeft}d to Possession`
                countdownClass = ''
              }
            }

            return (
              <div
                key={p.id}
                className="card card-hover-effect"
                onClick={() => navigate(`/projects/${p.id}`)}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '240px' }}
              >
                <div>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`status-dot ${isUnderConst ? 'active' : 'ready'}`}></span>
                      <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>{p.name}</h3>
                    </div>
                    <StatusBadge status={p.status} type="project" />
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    🏢 {p.developerName} &nbsp;•&nbsp; 📍 {p.location}
                  </div>
                  {/* Possession Countdown */}
                  {possessionLabel && isUnderConst && (
                    <div style={{ marginBottom: '12px' }}>
                      <span className={`possession-countdown ${countdownClass}`}>
                        🏁 {possessionLabel}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  {/* Collection Progress Bar */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Booked/Registered:</span>
                      <strong style={{ color: 'var(--accent-info)' }}>
                        {stats.bookedUnits + stats.registeredUnits} / {stats.totalUnits} Units ({bookedPct}%)
                      </strong>
                    </div>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar-fill" style={{ width: `${bookedPct}%` }}></div>
                    </div>
                  </div>

                  {/* Micro Stats Footer */}
                  <div className="project-micro-stats">
                    <div className="project-micro-stat">
                      <div className="ms-val">{stats.totalUnits || 0}</div>
                      <div className="ms-label">Total</div>
                    </div>
                    <div className="project-micro-stat">
                      <div className="ms-val" style={{ color: 'var(--accent-warning)' }}>{stats.bookedUnits || 0}</div>
                      <div className="ms-label">Booked</div>
                    </div>
                    <div className="project-micro-stat">
                      <div className="ms-val" style={{ color: 'var(--accent-success)' }}>{stats.registeredUnits || 0}</div>
                      <div className="ms-label">Registered</div>
                    </div>
                    <div className="project-micro-stat">
                      <div className="ms-val" style={{ color: 'var(--accent-gold)', fontSize: '12px' }}>{formatINR(stats.totalCollected)}</div>
                      <div className="ms-label">Collected</div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Creation Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Add New Mandate">
        <form onSubmit={handleCreateProject}>
          <FormField label="Project Name" required>
            <input
              className="form-input"
              placeholder="e.g. Green Valley Residency"
              value={newProject.name}
              onChange={e => setNewProject({ ...newProject, name: e.target.value })}
              required
            />
          </FormField>

          <div className="form-row-2">
            <FormField label="Developer Name" required>
              <input
                className="form-input"
                placeholder="e.g. Mehta Constructions"
                value={newProject.developerName}
                onChange={e => setNewProject({ ...newProject, developerName: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Location" required>
              <input
                className="form-input"
                placeholder="e.g. Bandra East, Mumbai"
                value={newProject.location}
                onChange={e => setNewProject({ ...newProject, location: e.target.value })}
                required
              />
            </FormField>
          </div>

          <div className="form-row-2">
            <FormField label="Project Status">
              <select
                className="form-select"
                value={newProject.status}
                onChange={e => setNewProject({ ...newProject, status: e.target.value, possessionDate: e.target.value === 'READY' ? '' : newProject.possessionDate })}
              >
                <option value="UNDER_CONSTRUCTION">Under Construction</option>
                <option value="READY">Ready</option>
              </select>
            </FormField>
            <FormField label="Maintenance Deposit (₹)" hint="Standard amount setup by builder">
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 50000"
                value={newProject.maintenanceDeposit}
                onChange={e => setNewProject({ ...newProject, maintenanceDeposit: e.target.value })}
              />
            </FormField>
          </div>

          <div className="form-row-2">
            <FormField label="Target Possession Date" required={newProject.status === 'UNDER_CONSTRUCTION'} hint="Ignored if project is Ready">
              <input
                type="date"
                className="form-input"
                value={newProject.possessionDate}
                onChange={e => setNewProject({ ...newProject, possessionDate: e.target.value })}
                disabled={newProject.status === 'READY'}
                required={newProject.status === 'UNDER_CONSTRUCTION'}
              />
            </FormField>

            <FormField label="Developer Link (Developer Login)" hint="Link a developer user account">
              <select
                className="form-select"
                value={newProject.developerUserId}
                onChange={e => setNewProject({ ...newProject, developerUserId: e.target.value })}
              >
                <option value="">-- No User Linked --</option>
                {developers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.email})</option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setOpenModal(false)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating Mandate... ⏳' : 'Save Project 🏢'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Projects
