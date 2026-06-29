import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatINR, formatCash } from '../utils/cashFormat'
import api from '../utils/api'
import StatusBadge from '../components/ui/StatusBadge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import FormField from '../components/ui/FormField'
import ReceiptButton from '../components/ui/ReceiptButton'
import DealPrintView from '../components/deals/DealPrintView'
import toast from 'react-hot-toast'

const DealDetail = () => {
  const { id } = useParams()
  const { isAdmin, isDeveloper } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [deal, setDeal] = useState(null)
  const [summary, setSummary] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])
  const [activeTab, setActiveTab] = useState('overview')

  // Collection Modals
  const [openReceiveModal, setOpenReceiveModal] = useState(false)
  const [receiveType, setReceiveType] = useState('margin') // 'margin' | 'loan' | 'cash'
  const [selectedInstallment, setSelectedInstallment] = useState(null)
  const [receiveForm, setReceiveForm] = useState({
    receivedDate: new Date().toISOString().split('T')[0],
    receivedAmount: '',
    paymentMode: 'NEFT',
    receiptNumber: ''
  })
  const [savingReceive, setSavingReceive] = useState(false)

  // Registry Modal
  const [openRegistryModal, setOpenRegistryModal] = useState(false)
  const [registryForm, setRegistryForm] = useState({
    registryDoneDate: new Date().toISOString().split('T')[0],
    registryStatus: 'DONE'
  })
  const [savingRegistry, setSavingRegistry] = useState(false)

  // Labour Modal
  const [openLabourModal, setOpenLabourModal] = useState(false)
  const [labourForm, setLabourForm] = useState({
    paidDate: new Date().toISOString().split('T')[0],
    amount: '',
    description: ''
  })
  const [savingLabour, setSavingLabour] = useState(false)

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [dealRes, summaryRes, auditRes] = await Promise.all([
        api.get(`/deals/${id}`),
        api.get(`/deals/${id}/summary`),
        api.get(`/audit-logs/deal/${id}`)
      ])
      setDeal(dealRes.data.data)
      setSummary(summaryRes.data.data)
      setAuditLogs(auditRes.data.data || [])
    } catch (err) {
      toast.error('Failed to load deal files.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [id])

  const openReceiveForm = (type, inst) => {
    setReceiveType(type)
    setSelectedInstallment(inst)
    setReceiveForm({
      receivedDate: new Date().toISOString().split('T')[0],
      receivedAmount: inst.amount - (inst.receivedAmount || 0),
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
      setSavingReceive(true)
      let endpoint = ''
      const payload = {
        receivedDate: receiveForm.receivedDate,
        receivedAmount: parseFloat(receiveForm.receivedAmount)
      }

      if (receiveType === 'margin') {
        endpoint = `/collections/margin/${selectedInstallment.id}/receive`
        payload.paymentMode = receiveForm.paymentMode
        payload.receiptNumber = receiveForm.receiptNumber
      } else if (receiveType === 'loan') {
        endpoint = `/collections/loan/${selectedInstallment.id}/receive`
      } else if (receiveType === 'cash') {
        endpoint = `/cash/${selectedInstallment.id}/receive`
      }

      const res = await api.post(endpoint, payload)
      const rNo = res.data.data?.receiptNumber
      if (rNo) {
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
      fetchAllData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record receipt.')
    } finally {
      setSavingReceive(false)
    }
  }

  const handleUpdateRegistry = async (e) => {
    e.preventDefault()
    try {
      setSavingRegistry(true)
      await api.post(`/deals/${id}/registry`, {
        registryDoneDate: registryForm.registryDoneDate,
        registryStatus: registryForm.registryStatus
      })
      toast.success('Registry state updated!')
      setOpenRegistryModal(false)
      fetchAllData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registry update failed.')
    } finally {
      setSavingRegistry(false)
    }
  }

  const handleAddLabour = async (e) => {
    e.preventDefault()
    if (!labourForm.amount || parseFloat(labourForm.amount) <= 0) {
      toast.error('Amount must be greater than 0.')
      return
    }
    try {
      setSavingLabour(true)
      await api.post(`/labour/${id}`, {
        paidDate: labourForm.paidDate,
        amount: parseFloat(labourForm.amount),
        description: labourForm.description
      })
      toast.success('Labour payment saved!')
      setOpenLabourModal(false)
      setLabourForm({ paidDate: new Date().toISOString().split('T')[0], amount: '', description: '' })
      fetchAllData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save labour payment.')
    } finally {
      setSavingLabour(false)
    }
  }

  const handleDeleteLabour = async (payId) => {
    if (!window.confirm('Are you sure you want to delete this labour payment record?')) return
    try {
      await api.delete(`/labour/${payId}`)
      toast.success('Labour payment deleted.')
      fetchAllData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete record.')
    }

  const handlePrintDeal = () => {
    const printArea = document.getElementById('deal-print-area')
    if (printArea) {
      printArea.style.display = 'block'
      window.print()
      setTimeout(() => { printArea.style.display = 'none' }, 500)
    }
  }
  }

  if (loading && !deal) {
    return <LoadingSpinner center={true} size="lg" />
  }

  if (!deal) {
    return <EmptyState icon="🤝" title="Booking not found" message="This deal record may not exist or has been deleted." />
  }

  const isOverdue = (dueDate, status) => {
    if (status === 'RECEIVED') return false
    return new Date(dueDate) < new Date()
  }

  return (
    <div>
      {/* Header Banner */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1>Mandate Unit {deal.unit?.unitNumber}</h1>
            <StatusBadge status={deal.registryStatus} type="registry" />
          </div>
          <p style={{ marginTop: '4px' }}>
            👤 Client: <strong>{deal.client?.name}</strong> ({deal.client?.mobile}) | 🏢 Project: <strong>{deal.project?.name}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/deals" className="btn btn-secondary">
            ← Deals Directory
          </Link>
          <button className="btn btn-ghost" onClick={handlePrintDeal}
            style={{ border: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🖨️ Print / Hard Copy
          </button>
          {isAdmin() && (
            <button className="btn btn-primary" onClick={() => setOpenRegistryModal(true)}>
              🛡️ Update Registry Status
            </button>
          )}
        </div>
      </div>

      {/* Tabs Layout */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', marginBottom: '24px', gap: '20px', overflowX: 'auto' }}>
        {[
          { key: 'overview', label: '📊 Overview' },
          { key: 'margin', label: '💳 Own Margin' },
          { key: 'loan', label: '🏦 Home Loan' },
          { key: 'cash', label: '🪙 Cash Ledger' },
          isAdmin() && { key: 'labour', label: '👷 Labour Costs' },
          { key: 'audit', label: '📜 History Trail' }
        ]
          .filter(Boolean)
          .map(t => (
            <button
              key={t.key}
              className={`btn-tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === t.key ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: activeTab === t.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              {t.label}
            </button>
          ))}
      </div>

      {/* Tab Content: OVERVIEW */}
      {activeTab === 'overview' && summary && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Banking Summary */}
          <div className="card">
            <h3 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>Banking Ledger (Cheque/NEFT)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}><td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Base Deal Price</td><td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>{formatINR(deal.dealAmount)}</td></tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}><td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Stamp Duty (5.9%)</td><td style={{ padding: '8px 0', textAlign: 'right' }}>{formatINR(deal.stampDuty)}</td></tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}><td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>GST ({deal.gstRate}%)</td><td style={{ padding: '8px 0', textAlign: 'right' }}>{formatINR(deal.gstAmount)}</td></tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}><td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Maintenance Deposit</td><td style={{ padding: '8px 0', textAlign: 'right' }}>{formatINR(deal.maintenanceDeposit)}</td></tr>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}><td style={{ padding: '12px 0', fontWeight: 700, color: 'var(--accent-primary)' }}>Agreement Value (Sub Total)</td><td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 800, color: 'var(--accent-primary)', fontSize: '15px' }}>{formatINR(deal.subTotal)}</td></tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}><td style={{ padding: '8px 0', color: 'var(--accent-success)' }}>Total Collected (Received)</td><td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: 'var(--accent-success)' }}>{formatINR(summary.totalBankingReceived)}</td></tr>
                <tr><td style={{ padding: '8px 0', color: 'var(--accent-danger)' }}>Outstanding Balance</td><td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: summary.bankingBalance > 0 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>{formatINR(summary.bankingBalance)}</td></tr>
              </tbody>
            </table>
          </div>

          {/* Cash Summary */}
          <div className="card">
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '16px' }}>Cash Ledger (Extra Work)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}><td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Extra Work Committed</td><td className="cash-amount" style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>{formatCash(deal.extraWork)}</td></tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}><td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Other Charges Committed</td><td className="cash-amount" style={{ padding: '8px 0', textAlign: 'right' }}>{formatCash(deal.otherCharges)}</td></tr>
                <tr style={{ borderBottom: '1px solid var(--accent-gold)' }}><td style={{ padding: '12px 0', fontWeight: 700, color: 'var(--accent-gold)' }}>Total Cash Committed</td><td className="cash-amount" style={{ padding: '12px 0', textAlign: 'right', fontWeight: 800, fontSize: '15px' }}>{formatCash(summary.totalCash)}</td></tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}><td style={{ padding: '8px 0', color: 'var(--accent-success)' }}>Total Cash Received</td><td className="cash-amount" style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: 'var(--accent-success)' }}>{formatCash(summary.cashReceived)}</td></tr>
                <tr><td style={{ padding: '8px 0', color: 'var(--accent-danger)' }}>Cash Balance Outstanding</td><td className="cash-amount" style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: summary.cashBalance > 0 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>{formatCash(summary.cashBalance)}</td></tr>
              </tbody>
            </table>
            
            <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>TIMELINES</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px', fontSize: '12px' }}>
                <div>Registry Target: <strong>{deal.registryTargetDate ? new Date(deal.registryTargetDate).toLocaleDateString() : '—'}</strong></div>
                {deal.possessionDate && <div>Possession Target: <strong>{new Date(deal.possessionDate).toLocaleDateString()}</strong></div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: OWN MARGIN */}
      {activeTab === 'margin' && (
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Own Margin Installment Ledger</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Due Date</th>
                  <th>Due Amount</th>
                  <th>Received Date</th>
                  <th>Received Amount</th>
                  <th>Mode / Receipt</th>
                  <th>Status</th>
                  {!isDeveloper() && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {deal.marginSchedule.map((row) => {
                  const overdue = isOverdue(row.dueDate, row.status)
                  return (
                    <tr 
                      key={row.id} 
                      style={{ 
                        borderLeft: overdue ? '4px solid var(--accent-danger)' : 'none',
                        background: overdue ? 'rgba(248,113,113,0.02)' : 'none'
                      }}
                    >
                      <td style={{ fontWeight: 600 }}>{row.description}</td>
                      <td>{new Date(row.dueDate).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 700 }}>{formatINR(row.amount)}</td>
                      <td>{row.receivedDate ? new Date(row.receivedDate).toLocaleDateString() : '—'}</td>
                      <td style={{ color: 'var(--accent-success)', fontWeight: 600 }}>{row.receivedAmount ? formatINR(row.receivedAmount) : '—'}</td>
                      <td>
                        {row.status === 'RECEIVED' ? (
                          <span style={{ fontSize: '12px' }}>
                            {row.paymentMode} {row.receiptNumber ? `(Receipt: ${row.receiptNumber})` : ''}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <span className={`badge ${
                          row.status === 'RECEIVED' ? 'badge-success' :
                          row.status === 'PARTIAL' ? 'badge-warning' :
                          overdue ? 'badge-danger' : 'badge-secondary'
                        }`}>
                          {overdue ? 'Overdue' : row.status}
                        </span>
                      </td>
                      {!isDeveloper() && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            {(row.status === 'RECEIVED' || row.status === 'PARTIAL') && (
                              <ReceiptButton type="margin" id={row.id} label="🧾 Receipt" />
                            )}
                            {row.status !== 'RECEIVED' && (
                              <button className="btn btn-primary btn-sm" onClick={() => openReceiveForm('margin', row)}>
                                Mark Receipt 💰
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: LOAN SCHEDULE */}
      {activeTab === 'loan' && (
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Loan Disbursement Milestones</h3>
          {deal.loanSchedule.length === 0 ? (
            <EmptyState icon="🏦" title="No home loan schedule" message="No bank loan was added to this agreement mandate." />
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Milestone Stage</th>
                    <th>Expected Date</th>
                    <th>Due Amount</th>
                    <th>Disbursed Date</th>
                    <th>Disbursed Amount</th>
                    <th>Status</th>
                    {!isDeveloper() && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {deal.loanSchedule.map((row) => {
                    const overdue = isOverdue(row.expectedDate, row.status)
                    return (
                      <tr 
                        key={row.id}
                        style={{ 
                          borderLeft: overdue ? '4px solid var(--accent-danger)' : 'none',
                          background: overdue ? 'rgba(248,113,113,0.02)' : 'none'
                        }}
                      >
                        <td style={{ fontWeight: 600 }}>{row.stageDescription}</td>
                        <td>{new Date(row.expectedDate).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 700 }}>{formatINR(row.amount)}</td>
                        <td>{row.receivedDate ? new Date(row.receivedDate).toLocaleDateString() : '—'}</td>
                        <td style={{ color: 'var(--accent-success)', fontWeight: 600 }}>{row.receivedAmount ? formatINR(row.receivedAmount) : '—'}</td>
                        <td>
                          <span className={`badge ${
                            row.status === 'RECEIVED' ? 'badge-success' :
                            row.status === 'PARTIAL' ? 'badge-warning' :
                            overdue ? 'badge-danger' : 'badge-secondary'
                          }`}>
                            {overdue ? 'Overdue' : row.status}
                          </span>
                        </td>
                        {!isDeveloper() && (
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              {(row.status === 'RECEIVED' || row.status === 'PARTIAL') && (
                                <ReceiptButton type="loan" id={row.id} label="🧾 Receipt" />
                              )}
                              {row.status !== 'RECEIVED' && (
                                <button className="btn btn-primary btn-sm" onClick={() => openReceiveForm('loan', row)}>
                                  Log Disburse 🏦
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: CASH SCHEDULE */}
      {activeTab === 'cash' && (
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Extra Work Cash Installments</h3>
          {deal.cashSchedule.length === 0 ? (
            <EmptyState icon="🪙" title="No cash schedule" message="No cash components are mandated for this deal." />
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Installment Description</th>
                    <th>Due Date</th>
                    <th>Due Amount (=)</th>
                    <th>Received Date</th>
                    <th>Received Amount (=)</th>
                    <th>Status</th>
                    {!isDeveloper() && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {deal.cashSchedule.map((row) => {
                    const overdue = isOverdue(row.dueDate, row.status)
                    return (
                      <tr 
                        key={row.id}
                        style={{ 
                          borderLeft: overdue ? '4px solid var(--accent-danger)' : 'none',
                          background: overdue ? 'rgba(248,113,113,0.02)' : 'none'
                        }}
                      >
                        <td style={{ fontWeight: 600 }}>{row.description}</td>
                        <td>{new Date(row.dueDate).toLocaleDateString()}</td>
                        <td className="cash-amount" style={{ fontWeight: 700 }}>{formatCash(row.amount)}</td>
                        <td>{row.receivedDate ? new Date(row.receivedDate).toLocaleDateString() : '—'}</td>
                        <td className="cash-amount" style={{ fontWeight: 700, color: 'var(--accent-success)' }}>
                          {row.receivedAmount ? formatCash(row.receivedAmount) : '—'}
                        </td>
                        <td>
                          <span className={`badge ${
                            row.status === 'RECEIVED' ? 'badge-success' :
                            row.status === 'PARTIAL' ? 'badge-warning' :
                            overdue ? 'badge-danger' : 'badge-secondary'
                          }`}>
                            {overdue ? 'Overdue' : row.status}
                          </span>
                        </td>
                        {!isDeveloper() && (
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              {(row.status === 'RECEIVED' || row.status === 'PARTIAL') && (
                                <ReceiptButton type="cash" id={row.id} label="🧾 Receipt" />
                              )}
                              {row.status !== 'RECEIVED' && (
                                <button className="btn btn-primary btn-sm" onClick={() => openReceiveForm('cash', row)}>
                                  Log Cash 🪙
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: LABOUR COSTS */}
      {activeTab === 'labour' && isAdmin() && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Labour & Site Contractor Payments</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setOpenLabourModal(true)}>
              ➕ Log Contractor Cost
            </button>
          </div>
          {(!deal.labourPayments || deal.labourPayments.length === 0) ? (
            <EmptyState icon="👷" title="No labour payments recorded" message="Log payment entries to contractors here." />
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date Paid</th>
                    <th>Amount Paid (₹)</th>
                    <th>Cost Description</th>
                    <th>Recorded By</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deal.labourPayments.map((row) => (
                    <tr key={row.id}>
                      <td>
                        {new Date(row.paidDate).toLocaleDateString()}
                        {row.voucherNumber && (
                          <div style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {row.voucherNumber}
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-danger)' }}>{formatINR(row.amount)}</td>
                      <td>{row.description || 'Contractor payment'}</td>
                      <td>👤 {row.paidByUser?.name}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <ReceiptButton type="labour" id={row.id} label="📄 Voucher" />
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteLabour(row.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: HISTORY TRAIL */}
      {activeTab === 'audit' && (
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Deal Modification Timeline</h3>
          {auditLogs.length === 0 ? (
            <EmptyState icon="📜" title="Clean History" message="No modifications have been recorded for this mandate." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '20px' }}>
              <div style={{ position: 'absolute', left: '7px', top: '5px', bottom: '5px', width: '2px', background: 'var(--border-primary)' }}></div>
              {auditLogs.map((log) => (
                <div key={log.id} style={{ position: 'relative' }}>
                  {/* Timeline dot */}
                  <div style={{ position: 'absolute', left: '-18px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
                  <div style={{ fontSize: '13px' }}>
                    <span style={{ fontWeight: 600 }}>{log.action}</span> by{' '}
                    <strong>{log.user?.name || 'System'}</strong> on {new Date(log.createdAt).toLocaleString()}
                  </div>
                  {log.newValues && (
                    <pre style={{ margin: '6px 0 0 0', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: 'var(--radius-sm)', fontSize: '11px', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.03)' }}>
                      {JSON.stringify(log.newValues, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Record Collection Modal */}
      <Modal open={openReceiveModal} onClose={() => setOpenReceiveModal(false)} title={`Log Collection (${receiveType.toUpperCase()})`}>
        <form onSubmit={handleSaveReceive}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '13px' }}>
            Installment: <strong>{selectedInstallment?.description || selectedInstallment?.stageDescription}</strong>
            <br />
            Installment Target Amount: <strong style={{ color: 'var(--accent-gold)' }}>
              {receiveType === 'cash' ? formatCash(selectedInstallment?.amount) : formatINR(selectedInstallment?.amount)}
            </strong>
          </div>

          <FormField label="Payment Received Date" required>
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
                {receiveType === 'cash' ? formatCash(receiveForm.receivedAmount) : formatINR(receiveForm.receivedAmount)}
              </div>
            )}
          </FormField>

          {receiveType === 'margin' && (
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

              <FormField label="Cheque / UTR / Receipt Number">
                <input
                  className="form-input"
                  placeholder="e.g. UTR124508"
                  value={receiveForm.receiptNumber}
                  onChange={e => setReceiveForm({ ...receiveForm, receiptNumber: e.target.value })}
                />
              </FormField>
            </div>
          )}

          <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setOpenReceiveModal(false)} disabled={savingReceive}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={savingReceive}>
              {savingReceive ? 'Logging Payment... ⏳' : 'Confirm Collection 💰'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Registry Status Modal */}
      <Modal open={openRegistryModal} onClose={() => setOpenRegistryModal(false)} title="Update Property Registry State">
        <form onSubmit={handleUpdateRegistry}>
          <FormField label="Registry Progress status">
            <select
              className="form-select"
              value={registryForm.registryStatus}
              onChange={e => setRegistryForm({ ...registryForm, registryStatus: e.target.value })}
            >
              <option value="PENDING">Pending (Registry not started)</option>
              <option value="IN_PROGRESS">In-Progress (Paperwork filed)</option>
              <option value="DONE">Done (Property registered!)</option>
            </select>
          </FormField>

          <FormField label="Date Registered / Scheduled">
            <input
              type="date"
              className="form-input"
              value={registryForm.registryDoneDate}
              onChange={e => setRegistryForm({ ...registryForm, registryDoneDate: e.target.value })}
              required
            />
          </FormField>

          <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setOpenRegistryModal(false)} disabled={savingRegistry}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={savingRegistry}>
              {savingRegistry ? 'Saving... ⏳' : 'Update Status 🛡️'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Labour Payment Modal */}
      <Modal open={openLabourModal} onClose={() => setOpenLabourModal(false)} title="Log Contractor Payment">
        <form onSubmit={handleAddLabour}>
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
              placeholder="e.g. 15000"
              value={labourForm.amount}
              onChange={e => setLabourForm({ ...labourForm, amount: e.target.value })}
              required
            />
            {labourForm.amount && parseFloat(labourForm.amount) > 10000 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px',
                padding: '8px 10px', background: 'rgba(251,146,60,0.1)',
                border: '1px solid rgba(251,146,60,0.3)', borderRadius: '6px',
                fontSize: '12px', color: '#fb923c'
              }}>
                ⚠️ <strong>Policy Alert:</strong> Cash payment above ₹10,000 requires Admin approval. Ensure this is authorized.
              </div>
            )}
          </FormField>

          <FormField label="Contractor Description / Remarks">
            <input
              className="form-input"
              placeholder="e.g. Brickwork contractor advance"
              value={labourForm.description}
              onChange={e => setLabourForm({ ...labourForm, description: e.target.value })}
            />
          </FormField>

          <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setOpenLabourModal(false)} disabled={savingLabour}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={savingLabour}>
              {savingLabour ? 'Saving Payment... ⏳' : 'Log Contractor payment 👷'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Hidden Print Area ── */}
      <DealPrintView deal={deal} summary={summary} />
    </div>
  )
}

export default DealDetail
