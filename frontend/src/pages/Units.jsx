import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import StatusBadge from '../components/ui/StatusBadge'
import Modal from '../components/ui/Modal'
import FormField from '../components/ui/FormField'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import toast from 'react-hot-toast'

const Units = () => {
  const { isAdmin, isDeveloper } = useAuth()
  const [loading, setLoading] = useState(true)
  const [units, setUnits] = useState([])
  const [projects, setProjects] = useState([])
  const [unitTypes, setUnitTypes] = useState([])
  
  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Single Unit Modal State
  const [openSingleModal, setOpenSingleModal] = useState(false)
  const [singleUnit, setSingleUnit] = useState({
    projectId: '',
    unitTypeId: '',
    unitNumber: '',
    floor: '',
    carpetArea: ''
  })
  const [singleSaving, setSingleSaving] = useState(false)

  // Bulk Unit Modal State
  const [openBulkModal, setOpenBulkModal] = useState(false)
  const [bulkUnit, setBulkUnit] = useState({
    projectId: '',
    unitTypeId: '',
    floor: '',
    carpetArea: '',
    prefix: '',
    startNumber: '101',
    count: '5'
  })
  const [bulkSaving, setBulkSaving] = useState(false)

  // Pagination
  const [page, setPage] = useState(1)
  const limit = 15

  const fetchData = async () => {
    try {
      setLoading(true)
      const [projRes, unitsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/units')
      ])
      setProjects(projRes.data.data)
      setUnits(unitsRes.data.data)
    } catch (err) {
      toast.error('Failed to load units database.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Fetch unit types when a project is selected in either modal
  const handleProjectChange = async (projectId, isBulk = false) => {
    if (!projectId) {
      setUnitTypes([])
      return
    }
    try {
      const res = await api.get(`/projects/${projectId}/unit-types`)
      setUnitTypes(res.data.data)
    } catch (err) {
      console.error('Failed to load unit types:', err)
    }
  }

  const handleCreateSingle = async (e) => {
    e.preventDefault()
    if (!singleUnit.projectId || !singleUnit.unitNumber) {
      toast.error('Project and Unit Number are required.')
      return
    }

    try {
      setSingleSaving(true)
      const payload = {
        projectId: parseInt(singleUnit.projectId),
        unitTypeId: singleUnit.unitTypeId ? parseInt(singleUnit.unitTypeId) : null,
        unitNumber: singleUnit.unitNumber,
        floor: singleUnit.floor ? parseInt(singleUnit.floor) : null,
        carpetArea: singleUnit.carpetArea ? parseFloat(singleUnit.carpetArea) : null
      }
      await api.post('/units', payload)
      toast.success(`Unit ${singleUnit.unitNumber} created!`)
      setOpenSingleModal(false)
      // Reset
      setSingleUnit({ projectId: '', unitTypeId: '', unitNumber: '', floor: '', carpetArea: '' })
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create unit.')
    } finally {
      setSingleSaving(false)
    }
  }

  const handleCreateBulk = async (e) => {
    e.preventDefault()
    const { projectId, unitTypeId, floor, carpetArea, prefix, startNumber, count } = bulkUnit
    if (!projectId || !startNumber || !count) {
      toast.error('Project, Start Number, and Count are required.')
      return
    }

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

      const payload = {
        projectId: parseInt(projectId),
        units: generatedUnits
      }

      await api.post('/units/bulk', payload)
      toast.success(`Successfully added ${qty} units in bulk!`)
      setOpenBulkModal(false)
      setBulkUnit({ projectId: '', unitTypeId: '', floor: '', carpetArea: '', prefix: '', startNumber: '101', count: '5' })
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create units in bulk.')
    } finally {
      setBulkSaving(false)
    }
  }

  const handleDeleteUnit = async (id, number) => {
    if (!window.confirm(`Are you sure you want to delete unit ${number}?`)) return
    try {
      await api.delete(`/units/${id}`)
      toast.success(`Unit ${number} deleted.`)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not delete unit.')
    }
  }

  // Filter Units
  const filteredUnits = units.filter(u => {
    const matchesProject = selectedProjectId === 'ALL' || u.projectId === parseInt(selectedProjectId)
    const matchesStatus = selectedStatus === 'ALL' || u.status === selectedStatus
    const matchesSearch = u.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.project?.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesProject && matchesStatus && matchesSearch
  })

  // Paginated List
  const totalPages = Math.ceil(filteredUnits.length / limit)
  const paginatedUnits = filteredUnits.slice((page - 1) * limit, page * limit)

  if (loading) {
    return <LoadingSpinner center={true} size="lg" />
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Units Directory</h1>
          <p>Search, filter, and audit individual units in real-time</p>
        </div>
        {!isDeveloper() && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => setOpenSingleModal(true)}>
              ➕ Single Unit
            </button>
            {isAdmin() && (
              <button className="btn btn-primary" onClick={() => setOpenBulkModal(true)}>
                🗂️ Bulk Add Units
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by unit number or project name..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1) }}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ width: '180px' }}>
            <select
              className="form-select"
              value={selectedProjectId}
              onChange={e => { setSelectedProjectId(e.target.value); setPage(1) }}
              style={{ width: '100%' }}
            >
              <option value="ALL">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div style={{ width: '150px' }}>
            <select
              className="form-select"
              value={selectedStatus}
              onChange={e => { setSelectedStatus(e.target.value); setPage(1) }}
              style={{ width: '100%' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="BOOKED">Booked</option>
              <option value="REGISTERED">Registered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Units Table */}
      {filteredUnits.length === 0 ? (
        <EmptyState icon="🔲" title="No units found" message="Try adjusting your filters or add a new unit." />
      ) : (
        <>
          <div className="table-container" style={{ marginBottom: '20px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Unit Number</th>
                  <th>Project</th>
                  <th>Type</th>
                  <th>Floor</th>
                  <th>Carpet Area</th>
                  <th>Status</th>
                  <th>Client Linked</th>
                  {!isDeveloper() && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedUnits.map((u) => (
                  <tr key={u.id} className="table-row-hover">
                    <td style={{ fontWeight: 600 }}>{u.unitNumber}</td>
                    <td>{u.project?.name}</td>
                    <td>{u.unitType?.typeName || '—'}</td>
                    <td>{u.floor ?? '—'}</td>
                    <td>{u.carpetArea ? `${u.carpetArea} sqft` : '—'}</td>
                    <td><StatusBadge status={u.status} type="unit" /></td>
                    <td>
                      {u.deal?.client?.name ? (
                        <Link to={`/deals/${u.deal.id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 550 }}>
                          👤 {u.deal.client.name}
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    {!isDeveloper() && (
                      <td style={{ textAlign: 'right' }}>
                        {u.status === 'AVAILABLE' ? (
                          <>
                            <Link to={`/deals/new?projectId=${u.projectId}&unitId=${u.id}`} className="btn btn-secondary btn-sm" style={{ marginRight: '8px', textDecoration: 'none' }}>
                              Book
                            </Link>
                            {isAdmin() && (
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUnit(u.id, u.unitNumber)}>
                                Delete
                              </button>
                            )}
                          </>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Locked</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <Pagination page={page} pages={totalPages} onChange={setPage} />
        </>
      )}

      {/* Single Unit Modal */}
      <Modal open={openSingleModal} onClose={() => setOpenSingleModal(false)} title="Add Single Unit">
        <form onSubmit={handleCreateSingle}>
          <FormField label="Select Project" required>
            <select
              className="form-select"
              value={singleUnit.projectId}
              onChange={e => {
                setSingleUnit({ ...singleUnit, projectId: e.target.value, unitTypeId: '' })
                handleProjectChange(e.target.value)
              }}
              required
            >
              <option value="">-- Choose Mandated Project --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </FormField>

          <div className="form-row-2">
            <FormField label="Unit Number" required hint="e.g. A-101, B-504, Flat-12">
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
                  <option key={ut.id} value={ut.id}>{ut.typeName} (Base ₹{ut.basePrice.toLocaleString()})</option>
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

            <FormField label="Carpet Area (sqft)" hint="e.g. 785.45">
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="Carpet area"
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
              {singleSaving ? 'Adding Unit... ⏳' : 'Save Unit 🔲'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Units Modal */}
      <Modal open={openBulkModal} onClose={() => setOpenBulkModal(false)} title="Bulk Generate Units">
        <form onSubmit={handleCreateBulk}>
          <FormField label="Select Project" required>
            <select
              className="form-select"
              value={bulkUnit.projectId}
              onChange={e => {
                setBulkUnit({ ...bulkUnit, projectId: e.target.value, unitTypeId: '' })
                handleProjectChange(e.target.value)
              }}
              required
            >
              <option value="">-- Choose Mandated Project --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Unit Configuration (Type)">
            <select
              className="form-select"
              value={bulkUnit.unitTypeId}
              onChange={e => setBulkUnit({ ...bulkUnit, unitTypeId: e.target.value })}
            >
              <option value="">-- General Unit / No Type --</option>
              {unitTypes.map(ut => (
                <option key={ut.id} value={ut.id}>{ut.typeName} (Base ₹{ut.basePrice.toLocaleString()})</option>
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

            <FormField label="Carpet Area (sqft)">
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="sqft value"
                value={bulkUnit.carpetArea}
                onChange={e => setBulkUnit({ ...bulkUnit, carpetArea: e.target.value })}
              />
            </FormField>
          </div>

          <div className="form-row-3">
            <FormField label="Number Prefix" hint="e.g. 'A-', 'Floor3-'">
              <input
                className="form-input"
                placeholder="e.g. A-"
                value={bulkUnit.prefix}
                onChange={e => setBulkUnit({ ...bulkUnit, prefix: e.target.value })}
              />
            </FormField>

            <FormField label="Starting Number" required hint="Integer to start sequence">
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
                max="100"
              />
            </FormField>
          </div>

          <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setOpenBulkModal(false)} disabled={bulkSaving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={bulkSaving}>
              {bulkSaving ? 'Generating Units... ⏳' : 'Generate Units 🗂️'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Units
