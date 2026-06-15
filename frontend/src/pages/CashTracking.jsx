import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatCash, formatINR } from '../utils/cashFormat'
import api from '../utils/api'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import StatCard from '../components/ui/StatCard'
import FormField from '../components/ui/FormField'
import toast from 'react-hot-toast'

const CashTracking = () => {
  const { isAdmin } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  
  // Project Cash Data
  const [cashSummary, setCashSummary] = useState([])
  const [cashTotals, setCashTotals] = useState({ totalCommitted: 0, totalReceived: 0, totalBalance: 0 })

  // Labour Section State (Admin Only)
  const [projectDeals, setProjectDeals] = useState([])
  const [selectedDealId, setSelectedDealId] = useState('')
  const [labourPayments, setLabourPayments] = useState([])
  const [labourTotal, setLabourTotal] = useState(0)
  const [loadingLabour, setLoadingLabour] = useState(false)
  
  const [labourForm, setLabourForm] = useState({
    paidDate: new Date().toISOString().split('T')[0],
    amount: '',
    description: ''
  })
  const [savingLabour, setSavingLabour] = useState(false)

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects')
      const projs = res.data.data
      setProjects(projs)
      if (projs.length > 0) {
        setSelectedProjectId(projs[0].id)
      } else {
        setLoading(false)
      }
    } catch (err) {
      toast.error('Failed to load projects list.')
    }
  }

  const fetchProjectCashDetails = async () => {
    if (!selectedProjectId) return
    try {
      setLoading(true)
      const res = await api.get(`/cash/summary/${selectedProjectId}`)
      setCashSummary(res.data.data.summary)
      setCashTotals(res.data.data.totals)

      // Fetch deals for labour management dropdown
      const dealsRes = await api.get(`/deals?projectId=${selectedProjectId}`)
      setProjectDeals(dealsRes.data.data)
      if (dealsRes.data.data.length > 0) {
        setSelectedDealId(dealsRes.data.data[0].id)
      } else {
        setSelectedDealId('')
        setLabourPayments([])
        setLabourTotal(0)
      }
    } catch (err) {
      toast.error('Failed to load cash ledger summary.')
    } finally {
      setLoading(false)
    }
  }

  const fetchLabourPayments = async () => {
    if (!selectedDealId) {
      setLabourPayments([])
      setLabourTotal(0)
      return
    }
    try {
      setLoadingLabour(true)
      const res = await api.get(`/labour/${selectedDealId}`)
      setLabourPayments(res.data.data)
      setLabourTotal(res.data.total || 0)
    } catch (err) {
      console.error('Failed to fetch labour payments:', err)
    } finally {
      setLoadingLabour(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    fetchProjectCashDetails()
  }, [selectedProjectId])

  useEffect(() => {
    fetchLabourPayments()
  }, [selectedDealId])

  const handleAddLabourPayment = async (e) => {
    e.preventDefault()
    if (!selectedDealId) {
      toast.error('Please select a booking unit first.')
      return
    }
    if (!labourForm.amount || parseFloat(labourForm.amount) <= 0) {
      toast.error('Please enter a valid amount.')
      return
    }

    try {
      setSavingLabour(true)
      await api.post(`/labour/${selectedDealId}`, {
        paidDate: labourForm.paidDate,
        amount: parseFloat(labourForm.amount),
        description: labourForm.description
      })
      toast.success('Contractor cost logged!')
      setLabourForm({ paidDate: new Date().toISOString().split('T')[0], amount: '', description: '' })
      fetchLabourPayments()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record cost.')
    } finally {
      setSavingLabour(false)
    }
  }

  const handleDeleteLabourPayment = async (paymentId) => {
    if (!window.confirm('Delete this contractor payment?')) return
    try {
      await api.delete(`/labour/payment/${paymentId}`)
      toast.success('Payment deleted.')
      fetchLabourPayments()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete record.')
    }
  }

  if (loading && projects.length === 0) {
    return <LoadingSpinner center={true} size="lg" />
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1>Cash Component Tracking</h1>
          <p>Separate ledger for Extra Work payments and site contractor outstandings</p>
        </div>
        <div style={{ width: '220px' }}>
          <select
            className="form-select"
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            style={{ width: '100%' }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState icon="🏢" title="No projects found" message="Add a project mandate first to enable cash tracking." />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="form-row-3" style={{ marginBottom: '30px' }}>
            <StatCard
              label="Cash Committed (=)"
              value={formatCash(cashTotals.totalCommitted)}
              icon="🪙"
              variant="gold"
              sub="Extra Work & Other Charges"
            />
            <StatCard
              label="Cash Collected (=)"
              value={formatCash(cashTotals.totalReceived)}
              icon="🟢"
              variant="success"
              sub="Total cash collected"
            />
            <StatCard
              label="Outstanding Cash Balance"
              value={formatCash(cashTotals.totalBalance)}
              icon="⏳"
              variant="danger"
              sub="Total outstanding"
            />
          </div>

          {/* Cash Table */}
          <div className="card" style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '16px' }}>Unit-Wise Cash Commitments</h3>
            {cashSummary.length === 0 ? (
              <EmptyState icon="📭" title="No Cash Agreements" message="No deals with cash components have been booked in this project." />
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Unit</th>
                      <th>Client Name</th>
                      <th>Committed Amount (=)</th>
                      <th>Received Amount (=)</th>
                      <th>Outstanding Balance (=)</th>
                      <th>Next Due Date</th>
                      <th>Next Due Amount (=)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashSummary.map((row) => (
                      <tr key={row.dealId} className="table-row-hover">
                        <td style={{ fontWeight: 700 }}>
                          <Link to={`/deals/${row.dealId}`} style={{ color: 'var(--accent-info)', textDecoration: 'none' }}>
                            {row.unitNumber}
                          </Link>
                        </td>
                        <td style={{ fontWeight: 600 }}>{row.clientName}</td>
                        <td className="cash-amount" style={{ fontWeight: 600 }}>{formatCash(row.cashCommitted)}</td>
                        <td className="cash-amount" style={{ fontWeight: 600, color: 'var(--accent-success)' }}>{formatCash(row.cashReceived)}</td>
                        <td className="cash-amount" style={{ fontWeight: 600, color: row.balance > 0 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>{formatCash(row.balance)}</td>
                        <td>{row.nextDueDate ? new Date(row.nextDueDate).toLocaleDateString() : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                        <td className="cash-amount">{row.nextDueAmount ? formatCash(row.nextDueAmount) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Labour cost management - Admin Only */}
          {isAdmin() && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              {/* Left Column: Payments List */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0 }}>👷 Site Contractor Cost Registry</h3>
                  <div style={{ width: '150px' }}>
                    <select
                      className="form-select"
                      value={selectedDealId}
                      onChange={e => setSelectedDealId(e.target.value)}
                      style={{ width: '100%', fontSize: '12px' }}
                    >
                      {projectDeals.map(d => (
                        <option key={d.id} value={d.id}>Unit {d.unit?.unitNumber}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {loadingLabour ? (
                  <LoadingSpinner center={true} />
                ) : !selectedDealId ? (
                  <EmptyState icon="👷" title="No bookings" message="No active bookings to record labour payments against." />
                ) : labourPayments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <span style={{ fontSize: '24px' }}>🏗️</span>
                    <h4 style={{ marginTop: '8px' }}>No payments logged yet</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Use the right side form to log payments to site contractors.</p>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', background: 'rgba(248,113,113,0.03)', border: '1px solid rgba(248,113,113,0.1)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '14px' }}>
                      <span>Total Labour Costs Logged:</span>
                      <strong style={{ color: 'var(--accent-danger)' }}>{formatINR(labourTotal)}</strong>
                    </div>
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Date Paid</th>
                            <th>Amount Paid (₹)</th>
                            <th>Cost Remarks</th>
                            <th>Paid By</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {labourPayments.map((lp) => (
                            <tr key={lp.id}>
                              <td>{new Date(lp.paidDate).toLocaleDateString()}</td>
                              <td style={{ color: 'var(--accent-danger)', fontWeight: 600 }}>{formatINR(lp.amount)}</td>
                              <td>{lp.description || 'Labour Cost'}</td>
                              <td>👤 {lp.paidByUser?.name}</td>
                              <td style={{ textAlign: 'right' }}>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteLabourPayment(lp.id)}>
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* Right Column: Add Form */}
              <div className="card">
                <h3 style={{ marginBottom: '16px' }}>Log Contractor Payment</h3>
                <form onSubmit={handleAddLabourPayment}>
                  <FormField label="Payment Date" required>
                    <input
                      type="date"
                      className="form-input"
                      value={labourForm.paidDate}
                      onChange={e => setLabourForm({ ...labourForm, paidDate: e.target.value })}
                      required
                    />
                  </FormField>

                  <FormField label="Amount Paid (₹)" required>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 25000"
                      value={labourForm.amount}
                      onChange={e => setLabourForm({ ...labourForm, amount: e.target.value })}
                      required
                    />
                  </FormField>

                  <FormField label="Remarks / Description">
                    <textarea
                      className="form-textarea"
                      rows="3"
                      placeholder="e.g. Tile flooring contractor advance"
                      value={labourForm.description}
                      onChange={e => setLabourForm({ ...labourForm, description: e.target.value })}
                    />
                  </FormField>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '12px' }}
                    disabled={savingLabour || !selectedDealId}
                  >
                    {savingLabour ? 'Saving Payment... ⏳' : 'Record Contractor Cost 👷'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CashTracking
