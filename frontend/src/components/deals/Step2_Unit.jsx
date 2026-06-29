import React, { useState, useEffect } from 'react'
import api from '../../utils/api'
import StatusBadge from '../ui/StatusBadge'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import FormField from '../ui/FormField'

const Step2_Unit = ({ formData, update, onNext, onPrev }) => {
  const [projects, setProjects] = useState([])
  const [units, setUnits] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data.data)).finally(() => setLoadingProjects(false))
  }, [])

  const selectProject = async (project) => {
    update({ project, unit: null })
    setLoadingUnits(true)
    try {
      const res = await api.get(`/projects/${project.id}/units`, { params: { status: 'AVAILABLE' } })
      setUnits(res.data.data)
    } catch { setUnits([]) }
    finally { setLoadingUnits(false) }
  }

  const validate = () => {
    const e = {}
    if (!formData.project) e.project = 'Please select a project'
    if (!formData.unit) e.unit = 'Please select a unit'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => { if (validate()) onNext() }

  if (loadingProjects) return <LoadingSpinner center />

  return (
    <div>
      <h3 style={{ marginBottom: '20px', color: 'var(--accent-primary)' }}>Step 2 — Unit Selection</h3>

      <FormField label="Select Project" required error={errors.project}>
        <select className="form-select" value={formData.project?.id || ''} onChange={e => {
          const p = projects.find(p => p.id === parseInt(e.target.value))
          if (p) selectProject(p)
        }}>
          <option value="">— Choose Project —</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.developerName})</option>
          ))}
        </select>
      </FormField>

      {formData.project && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '20px', fontSize: '13px' }}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <span>📍 {formData.project.location}</span>
            <StatusBadge status={formData.project.status} type="project" />
            <span>🏦 Maintenance: ₹{parseFloat(formData.project.maintenanceDeposit || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}

      {formData.project && (
        <>
          <FormField label="Available Units" required error={errors.unit}>
            <div style={{ marginTop: '4px' }} />
          </FormField>

          {loadingUnits ? <LoadingSpinner center /> : units.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏢</div>
              <div>No available units in this project</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
              {units.map(u => {
                const selected = formData.unit?.id === u.id
                return (
                  <div key={u.id} onClick={() => update({ unit: u, maintenanceDeposit: formData.project?.maintenanceDeposit || '' })}
                    style={{
                      padding: '14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      border: `2px solid ${selected ? 'var(--accent-primary)' : 'var(--border-card)'}`,
                      background: selected ? 'rgba(79,142,247,0.1)' : 'var(--bg-secondary)',
                      transition: 'all 0.15s', textAlign: 'center'
                    }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: selected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{u.unitNumber}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{u.unitType?.typeName || '—'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Floor {u.floor ?? '—'} • {u.carpetArea ?? '—'} Sq Yd</div>
                    {selected && <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--accent-success)', fontWeight: 700 }}>✓ Selected</div>}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      <div className="wizard-footer">
        <button onClick={onPrev} className="btn btn-ghost">← Back</button>
        <button onClick={handleNext} className="btn btn-primary btn-lg">Next: Deal Amounts →</button>
      </div>
    </div>
  )
}

export default Step2_Unit
