import React, { useState } from 'react'
import api from '../../utils/api'
import FormField from '../ui/FormField'

const Step1_Client = ({ formData, update, onNext }) => {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [errors, setErrors] = useState({})

  const searchClients = async (q) => {
    setSearch(q)
    if (q.length < 2) { setResults([]); return }
    try {
      setSearching(true)
      const res = await api.get('/clients', { params: { search: q, limit: 8 } })
      setResults(res.data.data)
    } catch { setResults([]) }
    finally { setSearching(false) }
  }

  const selectClient = (client) => {
    update({ client, newClient: false })
    setSearch(client.name)
    setResults([])
  }

  const validate = () => {
    const e = {}
    if (!formData.client && !formData.newClient) e.client = 'Please select or create a client'
    if (formData.newClient) {
      if (!formData.clientName) e.clientName = 'Name is required'
      if (!formData.clientMobile) e.clientMobile = 'Mobile is required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => { if (validate()) onNext() }

  return (
    <div>
      <h3 style={{ marginBottom: '20px', color: 'var(--accent-primary)' }}>Step 1 — Client Information</h3>

      {!formData.newClient && (
        <>
          <FormField label="Search Existing Client" hint="Search by name, mobile or PAN">
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                value={search}
                onChange={e => searchClients(e.target.value)}
                placeholder="Type name, mobile, or PAN..."
              />
              {searching && <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>}
              {results.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', zIndex: 50, maxHeight: '200px', overflowY: 'auto', boxShadow: 'var(--shadow-modal)' }}>
                  {results.map(c => (
                    <div key={c.id} onClick={() => selectClient(c)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-card)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{c.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{c.mobile} {c.pan ? `• ${c.pan}` : ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormField>

          {formData.client && (
            <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>✅ Selected: {formData.client.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formData.client.mobile} • {formData.client.email} • PAN: {formData.client.pan || '—'}</div>
              <button onClick={() => { update({ client: null }); setSearch('') }} className="btn btn-ghost btn-sm" style={{ marginTop: '8px' }}>Change Client</button>
            </div>
          )}

          {errors.client && <div className="form-error" style={{ marginBottom: '12px' }}>⚠ {errors.client}</div>}

          <div className="divider" />
          <button onClick={() => update({ newClient: true, client: null })} className="btn btn-secondary">+ Create New Client</button>
        </>
      )}

      {formData.newClient && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ color: 'var(--text-primary)' }}>New Client Details</h4>
            <button onClick={() => update({ newClient: false })} className="btn btn-ghost btn-sm">← Search Existing</button>
          </div>
          <div className="form-row-2">
            <FormField label="Full Name" required error={errors.clientName}>
              <input className="form-input" value={formData.clientName} onChange={e => update({ clientName: e.target.value })} placeholder="e.g. Ramesh Hasmukh Shah" />
            </FormField>
            <FormField label="Mobile Number" required error={errors.clientMobile}>
              <input className="form-input" value={formData.clientMobile} onChange={e => update({ clientMobile: e.target.value })} placeholder="e.g. 98250 12345" />
            </FormField>
          </div>
          <div className="form-row-2">
            <FormField label="Email Address">
              <input className="form-input" type="email" value={formData.clientEmail} onChange={e => update({ clientEmail: e.target.value })} placeholder="email@example.com" />
            </FormField>
            <FormField label="PAN Number">
              <input className="form-input" value={formData.clientPan} onChange={e => update({ clientPan: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" maxLength={10} />
            </FormField>
          </div>
          <div className="form-row-2">
            <FormField label="Aadhar Number">
              <input className="form-input" value={formData.clientAadhar} onChange={e => update({ clientAadhar: e.target.value })} placeholder="XXXX-XXXX-XXXX" />
            </FormField>
            <FormField label="Address">
              <input className="form-input" value={formData.clientAddress} onChange={e => update({ clientAddress: e.target.value })} placeholder="Street, City" />
            </FormField>
          </div>
        </>
      )}

      <div className="wizard-footer">
        <span />
        <button onClick={handleNext} className="btn btn-primary btn-lg">Next: Unit Selection →</button>
      </div>
    </div>
  )
}

export default Step1_Client
