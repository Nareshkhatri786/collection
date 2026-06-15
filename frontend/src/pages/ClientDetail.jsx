import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { formatINR } from '../utils/cashFormat'
import api from '../utils/api'
import StatusBadge from '../components/ui/StatusBadge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import FormField from '../components/ui/FormField'
import toast from 'react-hot-toast'

const ClientDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedClient, setEditedClient] = useState({
    name: '',
    mobile: '',
    email: '',
    pan: '',
    aadhar: '',
    address: ''
  })
  const [saving, setSaving] = useState(false)

  const fetchClientDetails = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/clients/${id}`)
      const data = res.data.data
      setClient(data)
      setEditedClient({
        name: data.name || '',
        mobile: data.mobile || '',
        email: data.email || '',
        pan: data.pan || '',
        aadhar: data.aadhar || '',
        address: data.address || ''
      })
    } catch (err) {
      toast.error('Failed to load client details.')
      navigate('/clients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClientDetails()
  }, [id])

  const handleUpdateClient = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await api.put(`/clients/${id}`, editedClient)
      toast.success('Client profile updated! 👤')
      setIsEditing(false)
      fetchClientDetails()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingSpinner center={true} size="lg" />
  }

  if (!client) {
    return <EmptyState icon="👤" title="Client profile not found" message="This client may have been deleted or access is restricted." />
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1>👤 {client.name}</h1>
          <p>Client ID: #{client.id} • Registered {new Date(client.createdAt).toLocaleDateString()}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/clients" className="btn btn-secondary">
            ← Back to Clients
          </Link>
          <button className="btn btn-primary" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Cancel Edit' : '📝 Edit Profile'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isEditing ? '1fr' : '1fr 2fr', gap: '24px' }}>
        {/* Profile Card / Edit Form */}
        <div className="card">
          {isEditing ? (
            <form onSubmit={handleUpdateClient}>
              <h3 style={{ marginBottom: '18px', color: 'var(--accent-primary)' }}>Edit Profile Info</h3>
              <FormField label="Full Name" required>
                <input
                  className="form-input"
                  value={editedClient.name}
                  onChange={e => setEditedClient({ ...editedClient, name: e.target.value })}
                  required
                />
              </FormField>

              <FormField label="Mobile Number" required>
                <input
                  className="form-input"
                  value={editedClient.mobile}
                  onChange={e => setEditedClient({ ...editedClient, mobile: e.target.value })}
                  required
                />
              </FormField>

              <FormField label="Email Address">
                <input
                  type="email"
                  className="form-input"
                  value={editedClient.email}
                  onChange={e => setEditedClient({ ...editedClient, email: e.target.value })}
                />
              </FormField>

              <div className="form-row-2">
                <FormField label="PAN Card">
                  <input
                    className="form-input"
                    value={editedClient.pan}
                    onChange={e => setEditedClient({ ...editedClient, pan: e.target.value.toUpperCase() })}
                  />
                </FormField>
                <FormField label="Aadhar Card">
                  <input
                    className="form-input"
                    value={editedClient.aadhar}
                    onChange={e => setEditedClient({ ...editedClient, aadhar: e.target.value })}
                  />
                </FormField>
              </div>

              <FormField label="Address">
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={editedClient.address}
                  onChange={e => setEditedClient({ ...editedClient, address: e.target.value })}
                />
              </FormField>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving... ⏳' : 'Save Profile'}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <h3 style={{ marginBottom: '16px' }}>Profile Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Mobile:</span>{' '}
                  <strong>{client.mobile}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Email:</span>{' '}
                  <span>{client.email || <span style={{ color: 'var(--text-muted)' }}>No email registered</span>}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>PAN Card:</span>{' '}
                  <code style={{ fontSize: '12px' }}>{client.pan || '—'}</code>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Aadhar Card:</span>{' '}
                  <span>{client.aadhar || '—'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Address:</span>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.04)', fontStyle: 'italic' }}>
                    {client.address || 'No address registered.'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Client Bookings History */}
        {!isEditing && (
          <div className="card">
            <h3 style={{ marginBottom: '18px' }}>Purchase & Booking Mandates</h3>
            {(!client.deals || client.deals.length === 0) ? (
              <EmptyState
                icon="🤝"
                title="No bookings recorded"
                message="This client profile does not have any active deal or property booking yet."
              />
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Mandate Unit</th>
                      <th>Project Mandate</th>
                      <th>Sub Total (Agreement)</th>
                      <th>Cash committed</th>
                      <th>Registry Target</th>
                      <th>Registry Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.deals.map((deal) => (
                      <tr key={deal.id} className="table-row-hover">
                        <td style={{ fontWeight: 600 }}>{deal.unit?.unitNumber}</td>
                        <td>{deal.project?.name}</td>
                        <td style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{formatINR(deal.subTotal)}</td>
                        <td className="cash-amount" style={{ fontWeight: 600 }}>{formatINR(deal.totalCash)}</td>
                        <td>{deal.registryTargetDate ? new Date(deal.registryTargetDate).toLocaleDateString() : '—'}</td>
                        <td><StatusBadge status={deal.registryStatus} type="registry" /></td>
                        <td style={{ textAlign: 'right' }}>
                          <Link to={`/deals/${deal.id}`} className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                            View Deal →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientDetail
