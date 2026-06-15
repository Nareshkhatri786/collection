import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import Modal from '../components/ui/Modal'
import FormField from '../components/ui/FormField'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'

const Clients = () => {
  const { isDeveloper } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal State
  const [openModal, setOpenModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newClient, setNewClient] = useState({
    name: '',
    mobile: '',
    email: '',
    pan: '',
    aadhar: '',
    address: ''
  })

  const fetchClients = async () => {
    try {
      setLoading(true)
      const res = await api.get('/clients')
      setClients(res.data.data)
    } catch (err) {
      toast.error('Failed to load clients database.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleCreateClient = async (e) => {
    e.preventDefault()
    if (!newClient.name || !newClient.mobile) {
      toast.error('Name and Mobile Number are required.')
      return
    }

    try {
      setSaving(true)
      await api.post('/clients', newClient)
      toast.success(`Client ${newClient.name} added successfully!`)
      setOpenModal(false)
      // Reset
      setNewClient({ name: '', mobile: '', email: '', pan: '', aadhar: '', address: '' })
      fetchClients()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create client.')
    } finally {
      setSaving(false)
    }
  }

  // Filter clients locally
  const filteredClients = clients.filter(c => {
    const query = searchQuery.toLowerCase()
    return (
      c.name.toLowerCase().includes(query) ||
      c.mobile.includes(query) ||
      (c.pan && c.pan.toLowerCase().includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query))
    )
  })

  if (loading) {
    return <LoadingSpinner center={true} size="lg" />
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Clients Directory</h1>
          <p>Search and manage customer contact profiles</p>
        </div>
        {!isDeveloper() && (
          <button className="btn btn-primary" onClick={() => setOpenModal(true)}>
            👤 Add New Client
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search by client name, mobile number, PAN, or email..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      {/* Clients Table */}
      {filteredClients.length === 0 ? (
        <EmptyState icon="👤" title="No clients found" message="Try searching for a different name, or create a client record." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Mobile Number</th>
                <th>Email Address</th>
                <th>PAN Card</th>
                <th>Aadhar Card</th>
                <th>Active Bookings</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((c) => (
                <tr key={c.id} className="table-row-hover">
                  <td style={{ fontWeight: 600 }}>
                    <Link to={`/clients/${c.id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                      👤 {c.name}
                    </Link>
                  </td>
                  <td>{c.mobile}</td>
                  <td>{c.email || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td><code style={{ fontSize: '12px' }}>{c.pan || '—'}</code></td>
                  <td>{c.aadhar || '—'}</td>
                  <td>
                    <span className="badge badge-info" style={{ fontSize: '11px' }}>
                      {c._count?.deals || c.deals?.length || 0} Mandate(s)
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link to={`/clients/${c.id}`} className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                      View History →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Client Creation Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Create Client Profile">
        <form onSubmit={handleCreateClient}>
          <FormField label="Full Name" required>
            <input
              className="form-input"
              placeholder="e.g. Rajesh Kumar"
              value={newClient.name}
              onChange={e => setNewClient({ ...newClient, name: e.target.value })}
              required
            />
          </FormField>

          <div className="form-row-2">
            <FormField label="Mobile Number" required>
              <input
                className="form-input"
                placeholder="10-digit mobile"
                value={newClient.mobile}
                onChange={e => setNewClient({ ...newClient, mobile: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Email Address">
              <input
                type="email"
                className="form-input"
                placeholder="e.g. rajesh@email.com"
                value={newClient.email}
                onChange={e => setNewClient({ ...newClient, email: e.target.value })}
              />
            </FormField>
          </div>

          <div className="form-row-2">
            <FormField label="PAN Card Number" hint="Format: ABCDE1234F">
              <input
                className="form-input"
                placeholder="PAN"
                value={newClient.pan}
                onChange={e => setNewClient({ ...newClient, pan: e.target.value.toUpperCase() })}
              />
            </FormField>
            <FormField label="Aadhar Card Number">
              <input
                className="form-input"
                placeholder="12-digit UIDAI number"
                value={newClient.aadhar}
                onChange={e => setNewClient({ ...newClient, aadhar: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Correspondence Address">
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="Enter client's full address"
              value={newClient.address}
              onChange={e => setNewClient({ ...newClient, address: e.target.value })}
            />
          </FormField>

          <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setOpenModal(false)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating Record... ⏳' : 'Save Client 👤'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Clients
