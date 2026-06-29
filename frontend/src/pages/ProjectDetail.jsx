import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatINR } from '../utils/cashFormat'
import api from '../utils/api'
import StatusBadge from '../components/ui/StatusBadge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import StatCard from '../components/ui/StatCard'
import Modal from '../components/ui/Modal'
import FormField from '../components/ui/FormField'
import toast from 'react-hot-toast'

const ProjectDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin, isDeveloper } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState(null)
  const [units, setUnits] = useState([])
  const [deals, setDeals] = useState([])
  const [stats, setStats] = useState(null)
  const [activeTab, setActiveTab] = useState('units')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [unitTypes, setUnitTypes] = useState([])

  // ── Add Single Unit Modal ─────────────────────────────────────────────────
  const [openSingleModal, setOpenSingleModal] = useState(false)
  const [singleUnit, setSingleUnit] = useState({ unitTypeId: '', unitNumber: '', floor: '', carpetArea: '' })
  const [singleSaving, setSingleSaving] = useState(false)

  // ── Bulk Generate Modal ───────────────────────────────────────────────────
  const [openBulkModal, setOpenBulkModal] = useState(false)
  const [bulkUnit, setBulkUnit] = useState({ unitTypeId: '', floor: '', carpetArea: '', prefix: '', startNumber: '101', count: '5' })
  const [bulkSaving, setBulkSaving] = useState(false)

  // ── Unit Types Management ────────────────────────────────────────────────
  const [openTypeModal, setOpenTypeModal] = useState(false)
  const [typeForm, setTypeForm] = useState({ typeName: '' })
  const [typeSaving, setTypeSaving] = useState(false)
  const [editingType, setEditingType] = useState(null)

  // ── Edit Project Modal ───────────────────────────────────────────────────
  const [openEditProjectModal, setOpenEditProjectModal] = useState(false)
  const [editProjectForm, setEditProjectForm] = useState({
    name: '', developerName: '', location: '', status: '', maintenanceDeposit: '', possessionDate: ''
  })
  const [projectSaving, setProjectSaving] = useState(false)

  const fetchProjectData = async () => {
    try {
      setLoading(true)
      const [projRes, unitsRes, dealsRes, statsRes, typesRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/units`),
        api.get(`/deals?projectId=${id}`),
        api.get(`/projects/${id}/stats`),
        api.get(`/projects/${id}/unit-types`)
      ])

      const proj = projRes.data.data
      setProject(proj)
      setUnits(unitsRes.data.data)
      setDeals(dealsRes.data.data)
      setStats(statsRes.data.data)
      setUnitTypes(typesRes.data.data)

      setEditProjectForm({
        name: proj.name,
        developerName: proj.developerName,
        location: proj.location,
        status: proj.status,
        maintenanceDeposit: proj.maintenanceDeposit || '',
        possessionDate: proj.possessionDate ? new Date(proj.possessionDate).toISOString().split('T')[0] : ''
      })
    } catch (err) {
      toast.error('Failed to load project details.')
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjectData()
  }, [id])

  // ── Handle Edit Project Submit ───────────────────────────────────────────
  const handleEditProjectSubmit = async (e) => {
    e.preventDefault()
    try {
      setProjectSaving(true)
      await api.put(`/projects/${id}`, {
        name: editProjectForm.name,
        developerName: editProjectForm.developerName,
        location: editProjectForm.location,
        status: editProjectForm.status,
        maintenanceDeposit: editProjectForm.maintenanceDeposit ? parseFloat(editProjectForm.maintenanceDeposit) : null,
        possessionDate: editProjectForm.status === 'READY' ? null : (editProjectForm.possessionDate || null)
      })
      toast.success('Mandate settings updated successfully! 🎉')
      setOpenEditProjectModal(false)
      fetchProjectData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update project settings.')
    } finally {
      setProjectSaving(false)
    }
  }

  // ── Create / Edit Unit Type ───────────────────────────────────
  const openAddType = () => {
    setEditingType(null)
    setTypeForm({ typeName: '' })
    setOpenTypeModal(true)
  }

  const openEditType = (ut) => {
    setEditingType(ut)
    setTypeForm({ typeName: ut.typeName })
    setOpenTypeModal(true)
  }

  const handleSaveType = async (e) => {
    e.preventDefault()
    if (!typeForm.typeName.trim()) { toast.error('Type name is required.'); return }
    try {
      setTypeSaving(true)
      if (editingType) {
        await api.put(`/projects/${id}/unit-types/${editingType.id}`, { typeName: typeForm.typeName })
        toast.success(`✅ Type "${typeForm.typeName}" updated!`)
      } else {
        await api.post(`/projects/${id}/unit-types`, { typeName: typeForm.typeName })
        toast.success(`✅ Type "${typeForm.typeName}" added!`)
      }
      setOpenTypeModal(false)
      fetchProjectData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save type.')
    } finally {
      setTypeSaving(false)
    }
  }

  const handleDeleteType = async (ut) => {
    if (!window.confirm(`Delete unit type "${ut.typeName}"? This will unlink it from existing units.`)) return
    try {
      await api.delete(`/projects/${id}/unit-types/${ut.id}`)
      toast.success(`Deleted type "${ut.typeName}"`)
      fetchProjectData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot delete — units may be linked to this type.')
    }
  }

  // ── Create Single Unit ───────────────────────────────────────────────────
  const handleCreateSingle = async (e) => {
    e.preventDefault()
    if (!singleUnit.unitNumber) { toast.error('Unit Number is required.'); return }
    try {
      setSingleSaving(true)
      await api.post('/units', {
        projectId: parseInt(id),
        unitTypeId: singleUnit.unitTypeId ? parseInt(singleUnit.unitTypeId) : null,
        unitNumber: singleUnit.unitNumber,
        floor: singleUnit.floor ? parseInt(singleUnit.floor) : null,
        carpetArea: singleUnit.carpetArea ? parseFloat(singleUnit.carpetArea) : null
      })
      toast.success(`Unit ${singleUnit.unitNumber} added! ✅`)
      setOpenSingleModal(false)
      setSingleUnit({ unitTypeId: '', unitNumber: '', floor: '', carpetArea: '' })
      fetchProjectData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add unit.')
    } finally {
      setSingleSaving(false)
    }
  }

  // ── Bulk Generate Units ──────────────────────────────────────────────────
  const handleCreateBulk = async (e) => {
    e.preventDefault()
    const { unitTypeId, floor, carpetArea, prefix, startNumber, count } = bulkUnit
    if (!startNumber || !count) { toast.error('Start Number and Count are required.'); return }
    try {
      setBulkSaving(true)
      const startNum = parseInt(startNumber)
      const qty = parseInt(count)
      const generatedUnits = []
      for (let i = 0; i < qty; i++) {
        generatedUnits.push({
          unitNumber: `${prefix}${startNum + i}`,
          unitTypeId: unitTypeId ? parseInt(unitTypeId) : null,
          floor: floor ? parseInt(floor) : null,
          carpetArea: carpetArea ? parseFloat(carpetArea) : null
        })
      }
      await api.post('/units/bulk', { projectId: parseInt(id), units: generatedUnits })
      toast.success(`✅ ${qty} units generated!`)
      setOpenBulkModal(false)
      setBulkUnit({ unitTypeId: '', floor: '', carpetArea: '', prefix: '', startNumber: '101', count: '5' })
      fetchProjectData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to bulk generate units.')
    } finally {
      setBulkSaving(false)
    }
  }

  if (loading) {
    return <LoadingSpinner center={true} size="lg" />
  }

  if (!project) {
    return <EmptyState icon="🏢" title="Project not found" message="This project mandating may not exist or you lack permission." />
  }

  // Filter units
  const filteredUnits = units.filter(u => {
    const matchesSearch = u.unitNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Filter deals
  const filteredDeals = deals.filter(d => {
    return (
      d.unit?.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.client?.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const tabStyle = (tab) => ({
    background: 'none',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid var(--accent-primary)' : '2px solid transparent',
    color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600
  })

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1>{project.name}</h1>
            <StatusBadge status={project.status} type="project" />
          </div>
          <p style={{ marginTop: '4px' }}>
            🏢 {project.developerName} | 📍 {project.location}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/projects" className="btn btn-secondary">
            ← Back to Mandates
          </Link>
          {isAdmin() && (
            <button className="btn btn-ghost" onClick={() => setOpenEditProjectModal(true)} style={{ border: '1px solid var(--border-primary)' }}>
              ⚙️ Edit Mandate Settings
            </button>
          )}
          {!isDeveloper() && (
            <Link to={`/deals/new?projectId=${project.id}`} className="btn btn-primary">
              ➕ New Booking
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="form-row-4" style={{ marginBottom: '30px' }}>
          <StatCard label="Total Units" value={stats.totalUnits} icon="🔲" />
          <StatCard label="Available Units" value={stats.availableUnits} icon="🟢" variant="success" />
          <StatCard label="Booked Units" value={stats.bookedUnits} icon="🔵" variant="secondary" />
          <StatCard label="Total Mandate Collections" value={formatINR(stats.totalCollected)} icon="💰" variant="gold" />
        </div>
      )}

      {/* Tabs Menu */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', marginBottom: '24px', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => { setActiveTab('units'); setSearchQuery(''); setStatusFilter('ALL') }} style={tabStyle('units')}>
          🔲 Units Grid ({units.length})
        </button>
        <button onClick={() => { setActiveTab('deals'); setSearchQuery('') }} style={tabStyle('deals')}>
          🤝 Booked Deals ({deals.length})
        </button>
        {isAdmin() && (
          <button onClick={() => setActiveTab('types')} style={tabStyle('types')}>
            🏷️ Unit Types ({unitTypes.length})
          </button>
        )}
        <button onClick={() => setActiveTab('reports')} style={tabStyle('reports')}>
          📊 Mandate Reports
        </button>

        {/* Add Unit Buttons — shown only on Units tab for Admin/Staff */}
        {activeTab === 'units' && !isDeveloper() && (
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setOpenSingleModal(true)}>
              ➕ Add Unit
            </button>
            {isAdmin() && (
              <button className="btn btn-primary btn-sm" onClick={() => setOpenBulkModal(true)}>
                🗂️ Bulk Generate
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search & Filter Bar for tabs */}
      {activeTab !== 'reports' && (
        <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                className="form-input"
                placeholder={activeTab === 'units' ? "Search unit number..." : "Search client name or unit..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            {activeTab === 'units' && (
              <div style={{ width: '180px' }}>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="BOOKED">Booked</option>
                  <option value="REGISTERED">Registered</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Contents: Units */}
      {activeTab === 'units' && (
        filteredUnits.length === 0 ? (
          <EmptyState
            icon="🔲"
            title={units.length === 0 ? "No units added yet" : "No units match filter"}
            message={units.length === 0 ? "Click 'Add Unit' above to start adding units to this project." : "Adjust your filters or query to find units."}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
            {filteredUnits.map((u) => {
              const hasDeal = u.deal && u.status !== 'AVAILABLE'
              const statusColor = 
                u.status === 'AVAILABLE' ? 'var(--accent-success)' :
                u.status === 'BOOKED' ? 'var(--accent-primary)' :
                'var(--accent-gold)'
              
              return (
                <div
                  key={u.id}
                  style={{
                    border: `1px solid ${statusColor}`,
                    background: 'rgba(20,28,46,0.5)',
                    padding: '16px 12px',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: u.status !== 'AVAILABLE' ? 'none' : '0 0 10px rgba(52,211,153,0.05)'
                  }}
                  className="card-hover-effect"
                  onClick={() => {
                    if (u.status === 'AVAILABLE') {
                      if (!isDeveloper()) {
                        navigate(`/deals/new?projectId=${project.id}&unitId=${u.id}`)
                      } else {
                        toast.error('Developer role cannot create new bookings.')
                      }
                    } else if (u.deal?.id) {
                      navigate(`/deals/${u.deal.id}`)
                    }
                  }}
                >
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {u.unitNumber}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    {u.unitType?.typeName || '—'}
                  </div>
                  {u.carpetArea && (
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      {u.carpetArea} Sq Yd
                    </div>
                  )}
                  {u.floor !== null && u.floor !== undefined && (
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Floor {u.floor}
                    </div>
                  )}
                  <span
                    style={{
                      fontSize: '9px',
                      textTransform: 'uppercase',
                      padding: '3px 6px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      color: 'var(--text-inverse)',
                      background: statusColor
                    }}
                  >
                    {u.status}
                  </span>
                  {hasDeal && (
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '10px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      👤 {u.deal.client?.name}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Tab Contents: Deals */}
      {activeTab === 'deals' && (
        filteredDeals.length === 0 ? (
          <EmptyState icon="🤝" title="No active bookings found" message="No deals have been created for this project yet." />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Unit Number</th>
                  <th>Client Name</th>
                  <th>Base Amount</th>
                  <th>Agreement Amount</th>
                  <th>Registry Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map((d) => (
                  <tr key={d.id} className="table-row-hover">
                    <td style={{ fontWeight: 600 }}>{d.unit?.unitNumber}</td>
                    <td>{d.client?.name}</td>
                    <td>{formatINR(d.dealAmount)}</td>
                    <td style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{formatINR(d.subTotal)}</td>
                    <td><StatusBadge status={d.registryStatus} type="registry" /></td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/deals/${d.id}`} className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                        Manage Deal →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Tab Contents: Unit Types */}
      {activeTab === 'types' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Unit Configurations</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Define types like <strong>2 BHK</strong>, <strong>3 BHK</strong>, <strong>Plot</strong>, <strong>Shop</strong> etc. before adding units.
              </p>
            </div>
            <button className="btn btn-primary" onClick={openAddType}>
              ➕ Add Unit Type
            </button>
          </div>

          {unitTypes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '2px dashed var(--border-primary)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏷️</div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No unit types defined yet</h4>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>
                Add types like "2 BHK", "3 BHK", "Plot 30×40" etc. to categorize your inventory.
              </p>
              <button className="btn btn-primary" onClick={openAddType}>➕ Add First Unit Type</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {unitTypes.map(ut => (
                <div key={ut.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {ut.typeName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {units.filter(u => u.unitTypeId === ut.id).length} units linked
                      </div>
                    </div>
                    <span style={{ fontSize: '24px' }}>🏠</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openEditType(ut)}
                      style={{ flex: 1 }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDeleteType(ut)}
                      style={{ color: 'var(--accent-error)', border: '1px solid var(--accent-error)' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Contents: Reports */}
      {activeTab === 'reports' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ color: 'var(--accent-primary)', marginBottom: '8px' }}>Monthly Projection</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                View and export payment collection projections for a specific month.
              </p>
            </div>
            <Link to={`/reports?projectId=${project.id}&type=projection`} className="btn btn-secondary" style={{ textAlign: 'center', textDecoration: 'none' }}>
              Generate Projection →
            </Link>
          </div>

          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ color: 'var(--accent-success)', marginBottom: '8px' }}>Month-End Achievement</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Compare collection projections against actual received payments.
              </p>
            </div>
            <Link to={`/reports?projectId=${project.id}&type=achievement`} className="btn btn-secondary" style={{ textAlign: 'center', textDecoration: 'none' }}>
              Generate Achievement →
            </Link>
          </div>

          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ color: 'var(--accent-secondary)', marginBottom: '8px' }}>Unit-Wise Status</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Audit financials, outstanding, and registration status of each unit.
              </p>
            </div>
            <Link to={`/reports?projectId=${project.id}&type=unit-status`} className="btn btn-secondary" style={{ textAlign: 'center', textDecoration: 'none' }}>
              Generate Unit Status →
            </Link>
          </div>

          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ color: 'var(--accent-gold)', marginBottom: '8px' }}>Extra Work Projection</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Track cash receipts committed vs actual for extra work / charges.
              </p>
            </div>
            <Link to={`/reports?projectId=${project.id}&type=extra-work`} className="btn btn-secondary" style={{ textAlign: 'center', textDecoration: 'none' }}>
              Generate Cash Report →
            </Link>
          </div>
        </div>
      )}

      {/* ── Add Single Unit Modal ─────────────────────────────────────────────── */}
      <Modal open={openSingleModal} onClose={() => setOpenSingleModal(false)} title={`Add Single Unit — ${project.name}`}>
        <form onSubmit={handleCreateSingle}>
          <div className="form-row-2">
            <FormField label="Unit Number" required hint="e.g. A-101, B-504, Shop-12">
              <input
                className="form-input"
                placeholder="Unit identifier"
                value={singleUnit.unitNumber}
                onChange={e => setSingleUnit({ ...singleUnit, unitNumber: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Unit Configuration (Type)">
              <select
                className="form-select"
                value={singleUnit.unitTypeId}
                onChange={e => setSingleUnit({ ...singleUnit, unitTypeId: e.target.value })}
              >
                <option value="">-- General Unit / No Type --</option>
                {unitTypes.map(ut => (
                  <option key={ut.id} value={ut.id}>{ut.typeName}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="form-row-2">
            <FormField label="Floor Number" hint="Numeric value only">
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 5"
                value={singleUnit.floor}
                onChange={e => setSingleUnit({ ...singleUnit, floor: e.target.value })}
              />
            </FormField>
            <FormField label="Area (Sq Yards)" hint="Super Built-Up Area in Sq Yards">
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="e.g. 30.50"
                value={singleUnit.carpetArea}
                onChange={e => setSingleUnit({ ...singleUnit, carpetArea: e.target.value })}
              />
            </FormField>
          </div>

          <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setOpenSingleModal(false)} disabled={singleSaving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={singleSaving}>
              {singleSaving ? 'Adding... ⏳' : 'Save Unit ✅'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Bulk Generate Units Modal ─────────────────────────────────────────── */}
      <Modal open={openBulkModal} onClose={() => setOpenBulkModal(false)} title={`Bulk Generate Units — ${project.name}`}>
        <form onSubmit={handleCreateBulk}>
          <FormField label="Unit Configuration (Type)">
            <select
              className="form-select"
              value={bulkUnit.unitTypeId}
              onChange={e => setBulkUnit({ ...bulkUnit, unitTypeId: e.target.value })}
            >
              <option value="">-- General Unit / No Type --</option>
              {unitTypes.map(ut => (
                <option key={ut.id} value={ut.id}>{ut.typeName}</option>
              ))}
            </select>
          </FormField>

          <div className="form-row-2">
            <FormField label="Floor Number" hint="Apply same floor to all bulk units">
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 2"
                value={bulkUnit.floor}
                onChange={e => setBulkUnit({ ...bulkUnit, floor: e.target.value })}
              />
            </FormField>
            <FormField label="Area (Sq Yards)" hint="Super Built-Up Area in Sq Yards">
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="e.g. 30.50"
                value={bulkUnit.carpetArea}
                onChange={e => setBulkUnit({ ...bulkUnit, carpetArea: e.target.value })}
              />
            </FormField>
          </div>

          <div className="form-row-3">
            <FormField label="Number Prefix" hint="e.g. 'A-', 'Shop-'">
              <input
                className="form-input"
                placeholder="e.g. A-"
                value={bulkUnit.prefix}
                onChange={e => setBulkUnit({ ...bulkUnit, prefix: e.target.value })}
              />
            </FormField>
            <FormField label="Starting Number" required>
              <input
                type="number"
                className="form-input"
                value={bulkUnit.startNumber}
                onChange={e => setBulkUnit({ ...bulkUnit, startNumber: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Count" required hint="Total units to generate">
              <input
                type="number"
                className="form-input"
                value={bulkUnit.count}
                onChange={e => setBulkUnit({ ...bulkUnit, count: e.target.value })}
                required
                min="1"
                max="200"
              />
            </FormField>
          </div>

          {bulkUnit.prefix && bulkUnit.startNumber && bulkUnit.count && (
            <div style={{ background: 'rgba(79,142,247,0.06)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              📋 Preview: <strong style={{ color: 'var(--accent-primary)' }}>
                {bulkUnit.prefix}{bulkUnit.startNumber}
              </strong> to <strong style={{ color: 'var(--accent-primary)' }}>
                {bulkUnit.prefix}{parseInt(bulkUnit.startNumber) + parseInt(bulkUnit.count) - 1}
              </strong> ({bulkUnit.count} units total)
            </div>
          )}

          <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setOpenBulkModal(false)} disabled={bulkSaving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={bulkSaving}>
              {bulkSaving ? 'Generating... ⏳' : `Generate ${bulkUnit.count || 0} Units 🗂️`}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Add / Edit Unit Type Modal ─────────────────────────────────────────── */}
      <Modal
        open={openTypeModal}
        onClose={() => setOpenTypeModal(false)}
        title={editingType ? `✏️ Edit Unit Type — ${editingType.typeName}` : '🏷️ Add Unit Type'}
      >
        <form onSubmit={handleSaveType}>
          <div style={{ marginBottom: '16px', padding: '14px', background: 'rgba(79,142,247,0.06)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            💡 Unit Type is the <strong>configuration/category</strong> of the unit — for example:
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
              {['2 BHK', '3 BHK', '4 BHK', 'Plot 30×40', 'Shop', 'Office'].map(ex => (
                <span
                  key={ex}
                  onClick={() => setTypeForm({ typeName: ex })}
                  style={{ padding: '4px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.color = 'var(--accent-primary)' }}
                  onMouseLeave={e => { e.target.style.borderColor = 'var(--border-primary)'; e.target.style.color = 'var(--text-primary)' }}
                >
                  {ex}
                </span>
              ))}
            </div>
          </div>

          <FormField label="Type Name" required hint="e.g. 2 BHK, 3 BHK, Plot 30×40, Shop, Villa">
            <input
              className="form-input"
              placeholder="Enter type name..."
              value={typeForm.typeName}
              onChange={e => setTypeForm({ typeName: e.target.value })}
              autoFocus
              required
            />
          </FormField>

          <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setOpenTypeModal(false)} disabled={typeSaving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={typeSaving}>
              {typeSaving ? 'Saving... ⏳' : (editingType ? '✅ Update Type' : '✅ Add Type')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Project Settings Modal ───────────────────────────────────────── */}
      <Modal open={openEditProjectModal} onClose={() => setOpenEditProjectModal(false)} title="⚙️ Edit Mandate Settings">
        <form onSubmit={handleEditProjectSubmit}>
          <FormField label="Project Name" required>
            <input
              className="form-input"
              value={editProjectForm.name}
              onChange={e => setEditProjectForm({ ...editProjectForm, name: e.target.value })}
              required
            />
          </FormField>

          <div className="form-row-2">
            <FormField label="Developer Name" required>
              <input
                className="form-input"
                value={editProjectForm.developerName}
                onChange={e => setEditProjectForm({ ...editProjectForm, developerName: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Location" required>
              <input
                className="form-input"
                value={editProjectForm.location}
                onChange={e => setEditProjectForm({ ...editProjectForm, location: e.target.value })}
                required
              />
            </FormField>
          </div>

          <div className="form-row-2">
            <FormField label="Project Status">
              <select
                className="form-select"
                value={editProjectForm.status}
                onChange={e => setEditProjectForm({ ...editProjectForm, status: e.target.value })}
              >
                <option value="UNDER_CONSTRUCTION">Under Construction</option>
                <option value="READY">Ready</option>
              </select>
            </FormField>
            <FormField label="Maintenance Deposit (₹)">
              <input
                type="number"
                className="form-input"
                value={editProjectForm.maintenanceDeposit}
                onChange={e => setEditProjectForm({ ...editProjectForm, maintenanceDeposit: e.target.value })}
              />
            </FormField>
          </div>

          <FormField
            label="Target Possession Date"
            required={editProjectForm.status === 'UNDER_CONSTRUCTION'}
            hint="Changing this will automatically update all deal schedules and client print layouts linked to this mandate"
          >
            <input
              type="date"
              className="form-input"
              value={editProjectForm.possessionDate}
              onChange={e => setEditProjectForm({ ...editProjectForm, possessionDate: e.target.value })}
              disabled={editProjectForm.status === 'READY'}
              required={editProjectForm.status === 'UNDER_CONSTRUCTION'}
            />
          </FormField>

          <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setOpenEditProjectModal(false)} disabled={projectSaving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={projectSaving}>
              {projectSaving ? 'Saving Changes... ⏳' : 'Save Changes ✅'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ProjectDetail
