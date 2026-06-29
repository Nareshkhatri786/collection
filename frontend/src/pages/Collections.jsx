import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatINR, formatCash } from '../utils/cashFormat'
import api from '../utils/api'
import StatusBadge from '../components/ui/StatusBadge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import FormField from '../components/ui/FormField'
import ReceiptButton from '../components/ui/ReceiptButton'
import toast from 'react-hot-toast'

const Collections = () => {
  const { isDeveloper } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [overdueData, setOverdueData] = useState({ margin: [], loan: [], cash: [], total: 0 })
  const [flatItems, setFlatItems] = useState([])
  
  // Filters & Sorting
  const [selectedProjectId, setSelectedProjectId] = useState('ALL')
  const [selectedType, setSelectedType] = useState('ALL') // 'ALL' | 'MARGIN' | 'LOAN' | 'CASH'
  const [sortField, setSortField] = useState('dueDate')
  const [sortOrder, setSortOrder] = useState('asc')

  // Receive Modal
  const [openReceiveModal, setOpenReceiveModal] = useState(false)
  const [activeItem, setActiveItem] = useState(null)
  const [receiveForm, setReceiveForm] = useState({
    receivedDate: new Date().toISOString().split('T')[0],
    receivedAmount: '',
    paymentMode: 'NEFT',
    receiptNumber: ''
  })
  const [saving, setSaving] = useState(false)
  const [lastReceipt, setLastReceipt] = useState(null) // { number, type, id }

  const fetchFilters = async () => {
    try {
      const res = await api.get('/projects')
      setProjects(res.data.data)
    } catch (err) {
      console.error('Failed to load projects list:', err)
    }
  }

  const fetchCollections = async () => {
    try {
      setLoading(true)
      const res = await api.get('/collections/overdue')
      const data = res.data.data
      setOverdueData(data)

      // Flatten items into a single list
      const flattened = [
        ...data.margin.map(item => ({
          ...item,
          id: item.id,
          dealId: item.dealId,
          dueDate: item.dueDate,
          amount: parseFloat(item.amount),
          receivedAmount: parseFloat(item.receivedAmount || 0),
          description: item.description,
          client: item.deal.client.name,
          unit: item.deal.unit.unitNumber,
          project: item.deal.project.name,
          projectId: item.deal.projectId,
          type: 'MARGIN',
          label: 'Own Margin'
        })),
        ...data.loan.map(item => ({
          ...item,
          id: item.id,
          dealId: item.dealId,
          dueDate: item.expectedDate, // Map expectedDate to dueDate
          amount: parseFloat(item.amount),
          receivedAmount: parseFloat(item.receivedAmount || 0),
          description: item.stageDescription,
          client: item.deal.client.name,
          unit: item.deal.unit.unitNumber,
          project: item.deal.project.name,
          projectId: item.deal.projectId,
          type: 'LOAN',
          label: 'Home Loan'
        })),
        ...data.cash.map(item => ({
          ...item,
          id: item.id,
          dealId: item.dealId,
          dueDate: item.dueDate,
          amount: parseFloat(item.amount),
          receivedAmount: parseFloat(item.receivedAmount || 0),
          description: item.description,
          client: item.deal.client.name,
          unit: item.deal.unit.unitNumber,
          project: item.deal.project.name,
          projectId: item.deal.projectId,
          type: 'CASH',
          label: 'Cash (Extra Work)',
          isCash: true
        }))
      ]

      setFlatItems(flattened)
    } catch (err) {
      toast.error('Failed to load collections registry.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFilters()
    fetchCollections()
  }, [])

  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc'
    setSortField(field)
    setSortOrder(isAsc ? 'desc' : 'asc')
  }

  const openLogModal = (item) => {
    setActiveItem(item)
    setReceiveForm({
      receivedDate: new Date().toISOString().split('T')[0],
      receivedAmount: item.amount - item.receivedAmount,
      paymentMode: 'NEFT',
      receiptNumber: ''
    })
    setOpenReceiveModal(true)
  }

  const handleSaveReceive = async (e) => {
    e.preventDefault()
    if (!receiveForm.receivedAmount || parseFloat(receiveForm.receivedAmount) <= 0) {
      toast.error('Please enter a valid received amount.')
      return
    }

    try {
      setSaving(true)
      let endpoint = ''
      const payload = {
        receivedDate: receiveForm.receivedDate,
        receivedAmount: parseFloat(receiveForm.receivedAmount)
      }

      if (activeItem.type === 'MARGIN') {
        endpoint = `/collections/margin/${activeItem.id}/receive`
        payload.paymentMode = receiveForm.paymentMode
        payload.receiptNumber = receiveForm.receiptNumber
      } else if (activeItem.type === 'LOAN') {
        endpoint = `/collections/loan/${activeItem.id}/receive`
      } else if (activeItem.type === 'CASH') {
        endpoint = `/cash/${activeItem.id}/receive`
      }

      const res = await api.post(endpoint, payload)
      const rNo = res.data.data?.receiptNumber
      if (rNo) {
        setLastReceipt({ number: rNo, type: activeItem.type.toLowerCase(), id: activeItem.id })
        toast.success(
          <div>
            <div>✅ Collection logged!</div>
            <div style={{ fontSize: '11px', marginTop: '4px', fontFamily: 'monospace', color: '#a3e635' }}>🧾 {rNo}</div>
          </div>,
          { duration: 5000 }
        )
      } else {
        toast.success('Collection logged successfully! 💰')
      }
      setOpenReceiveModal(false)
      fetchCollections()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to log receipt.')
    } finally {
      setSaving(false)
    }
  }

  // Filter combined list
  const filteredItems = flatItems.filter(item => {
    const matchesProject = selectedProjectId === 'ALL' || item.projectId === parseInt(selectedProjectId)
    const matchesType = selectedType === 'ALL' || item.type === selectedType
    return matchesProject && matchesType
  })

  // Sort combined list
  const sortedItems = [...filteredItems].sort((a, b) => {
    let aValue = a[sortField]
    let bValue = b[sortField]

    if (sortField === 'dueDate') {
      aValue = new Date(aValue)
      bValue = new Date(bValue)
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  if (loading && flatItems.length === 0) {
    return <LoadingSpinner center={true} size="lg" />
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Pending Collections</h1>
          <p>Cross-project schedule tracking of outstanding payments</p>
        </div>
      </div>

      {/* Summary Strip */}
      {flatItems.length > 0 && (
        <div className="collections-summary-strip">
          <div className="collection-strip-item">
            <div className="strip-value danger">{flatItems.length}</div>
            <div className="strip-label">Pending Items</div>
          </div>
          <div className="collection-strip-item">
            <div className="strip-value gold">
              {formatINR(flatItems.reduce((sum, i) => sum + (i.amount - i.receivedAmount), 0))}
            </div>
            <div className="strip-label">Total Pending Amount</div>
          </div>
          <div className="collection-strip-item">
            <div className="strip-value warning">
              {flatItems.filter(i => {
                const days = Math.floor((new Date() - new Date(i.dueDate)) / (1000 * 60 * 60 * 24))
                return days > 0
              }).length}
            </div>
            <div className="strip-label">Overdue Items</div>
          </div>
          <div className="collection-strip-item">
            <div className="strip-value">
              {flatItems.filter(i => {
                const d = new Date(i.dueDate)
                const now = new Date()
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
              }).length}
            </div>
            <div className="strip-label">Due This Month</div>
          </div>
        </div>
      )}


      {/* Filters card */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ width: '220px' }}>
            <label className="form-label" style={{ marginBottom: '6px' }}>Filter by Project</label>
            <select
              className="form-select"
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="ALL">All Mandated Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div style={{ width: '180px' }}>
            <label className="form-label" style={{ marginBottom: '6px' }}>Milestone Type</label>
            <select
              className="form-select"
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="ALL">All Types</option>
              <option value="MARGIN">Own Margin</option>
              <option value="LOAN">Home Loan</option>
              <option value="CASH">Cash (Extra Work)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Collections datatable */}
      {sortedItems.length === 0 ? (
        <EmptyState icon="⏳" title="No outstanding collections" message="All payments are up to date! Great job." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('dueDate')} style={{ cursor: 'pointer' }}>
                  Due Date {sortField === 'dueDate' ? (sortOrder === 'asc' ? '🔼' : '🔽') : ''}
                </th>
                <th onClick={() => handleSort('unit')} style={{ cursor: 'pointer' }}>
                  Unit {sortField === 'unit' ? (sortOrder === 'asc' ? '🔼' : '🔽') : ''}
                </th>
                <th>Client</th>
                <th>Project</th>
                <th>Milestone Stage</th>
                <th>Type</th>
                <th onClick={() => handleSort('amount')} style={{ cursor: 'pointer' }}>
                  Unpaid Amount {sortField === 'amount' ? (sortOrder === 'asc' ? '🔼' : '🔽') : ''}
                </th>
                {!isDeveloper() && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item, idx) => {
                const unpaid = item.amount - item.receivedAmount
                const daysOverdue = Math.floor((new Date() - new Date(item.dueDate)) / (1000 * 60 * 60 * 24))
                const isOverdue = daysOverdue > 0
                
                return (
                  <tr
                    key={idx}
                    style={{
                      borderLeft: `4px solid ${isOverdue ? 'var(--accent-danger)' : 'var(--border-card)'}`,
                      background: isOverdue ? 'rgba(248,113,113,0.04)' : 'transparent'
                    }}
                  >
                    <td style={{ fontWeight: 600, color: isOverdue ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                      <div>{new Date(item.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      {isOverdue && (
                        <span className="days-overdue-badge" style={{ marginTop: '4px' }}>{daysOverdue}d overdue</span>
                      )}

                    </td>
                    <td style={{ fontWeight: 700 }}>
                      <Link to={`/deals/${item.dealId}`} style={{ color: 'var(--accent-info)', textDecoration: 'none' }}>
                        {item.unit}
                      </Link>
                    </td>
                    <td>{item.client}</td>
                    <td>{item.project}</td>
                    <td>{item.description}</td>
                    <td>
                      <span className={`badge ${
                        item.type === 'MARGIN' ? 'badge-primary' :
                        item.type === 'LOAN' ? 'badge-info' :
                        'badge-warning'
                      }`} style={{ fontSize: '10px' }}>
                        {item.label}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }} className={item.isCash ? 'cash-amount' : ''}>
                      {item.isCash ? formatCash(unpaid) : formatINR(unpaid)}
                    </td>
                    {!isDeveloper() && (
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => openLogModal(item)}>
                          Log Collection 💰
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Receipt Modal */}
      <Modal open={openReceiveModal} onClose={() => setOpenReceiveModal(false)} title={`Log Collection (${activeItem?.label})`}>
        <form onSubmit={handleSaveReceive}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '13px' }}>
            Unit: <strong>{activeItem?.unit}</strong> | Client: <strong>{activeItem?.client}</strong>
            <br />
            Milestone: <strong>{activeItem?.description}</strong>
            <br />
            Target Due: <strong style={{ color: 'var(--accent-gold)' }}>
              {activeItem?.isCash ? formatCash(activeItem?.amount) : formatINR(activeItem?.amount)}
            </strong>
          </div>

          <FormField label="Collection Date" required>
            <input
              type="date"
              className="form-input"
              value={receiveForm.receivedDate}
              onChange={e => setReceiveForm({ ...receiveForm, receivedDate: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Amount Received (₹)" required>
            <input
              type="number"
              className="form-input"
              value={receiveForm.receivedAmount}
              onChange={e => setReceiveForm({ ...receiveForm, receivedAmount: e.target.value })}
              required
            />
            {receiveForm.receivedAmount && (
              <div style={{ fontSize: '11px', color: 'var(--accent-success)', marginTop: '2px' }}>
                {activeItem?.isCash ? formatCash(receiveForm.receivedAmount) : formatINR(receiveForm.receivedAmount)}
              </div>
            )}
          </FormField>

          {activeItem?.type === 'MARGIN' && (
            <div className="form-row-2">
              <FormField label="Payment Mode">
                <select
                  className="form-select"
                  value={receiveForm.paymentMode}
                  onChange={e => setReceiveForm({ ...receiveForm, paymentMode: e.target.value })}
                >
                  <option value="CHEQUE">Cheque</option>
                  <option value="NEFT">NEFT / Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash Deposit</option>
                </select>
              </FormField>

              <FormField label="Cheque / UTR / Reference No.">
                <input
                  className="form-input"
                  placeholder="e.g. UTR-HDFC-123"
                  value={receiveForm.receiptNumber}
                  onChange={e => setReceiveForm({ ...receiveForm, receiptNumber: e.target.value })}
                />
              </FormField>
            </div>
          )}

          <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setOpenReceiveModal(false)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Logging Collection... ⏳' : 'Confirm Collection 💰'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Collections
