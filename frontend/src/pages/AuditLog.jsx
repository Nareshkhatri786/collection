import React, { useState, useEffect } from 'react'
import api from '../utils/api'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import Modal from '../components/ui/Modal'
import FormField from '../components/ui/FormField'
import toast from 'react-hot-toast'

const AuditLog = () => {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [entityType, setEntityType] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Details Modal State
  const [openModal, setOpenModal] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      const typeParam = entityType ? `&entityType=${entityType}` : ''
      const res = await api.get(`/audit-logs?page=${page}&limit=20${typeParam}`)
      setLogs(res.data.data)
      setTotalPages(res.data.pagination?.pages || 1)
    } catch (err) {
      toast.error('Failed to load audit logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs()
  }, [page, entityType])

  const openLogDetail = (log) => {
    setSelectedLog(log)
    setOpenModal(true)
  }

  if (loading && logs.length === 0) {
    return <LoadingSpinner center={true} size="lg" />
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1>System Audit Log</h1>
          <p>Historical audit trail of all booking, mandate, and collection modifications</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ width: '200px' }}>
            <label className="form-label" style={{ marginBottom: '6px' }}>Filter by Entity Type</label>
            <select
              className="form-select"
              value={entityType}
              onChange={e => { setEntityType(e.target.value); setPage(1) }}
              style={{ width: '100%' }}
            >
              <option value="">All Entities</option>
              <option value="Project">Project Mandates</option>
              <option value="Unit">Property Units</option>
              <option value="Client">Client Profiles</option>
              <option value="Deal">Bookings (Deals)</option>
              <option value="MarginSchedule">Margin Installments</option>
              <option value="LoanSchedule">Loan Milestones</option>
              <option value="CashSchedule">Cash Payments</option>
              <option value="LabourPayment">Labour Costs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      {logs.length === 0 ? (
        <EmptyState icon="📜" title="No audit entries" message="No logs found matching selected criteria." />
      ) : (
        <>
          <div className="table-container" style={{ marginBottom: '20px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User Operator</th>
                  <th>Action Category</th>
                  <th>Target Entity</th>
                  <th>Entity ID</th>
                  <th>Changes Summary</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  let summarySnippet = 'No additional payload'
                  if (log.newValues && typeof log.newValues === 'object') {
                    summarySnippet = Object.keys(log.newValues)
                      .slice(0, 3)
                      .map(key => `${key}: ${String(log.newValues[key])}`)
                      .join(', ')
                  }
                  
                  return (
                    <tr key={log.id} className="table-row-hover" onClick={() => openLogDetail(log)} style={{ cursor: 'pointer' }}>
                      <td style={{ color: 'var(--text-secondary)' }}>{new Date(log.createdAt).toLocaleString()}</td>
                      <td>
                        <strong>{log.user?.name || 'System / Auto'}</strong>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                          ({log.user?.role || 'SYSTEM'})
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{log.action}</td>
                      <td>{log.entityType}</td>
                      <td><code>#{log.entityId}</code></td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxBreakWord: '250px' }}>
                        {summarySnippet}
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openLogDetail(log)}>
                          Compare 🔍
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          <Pagination page={page} pages={totalPages} onChange={setPage} />
        </>
      )}

      {/* Comparison Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Audit Event Comparison Log" size="lg">
        {selectedLog && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '20px', fontSize: '13px' }}>
              <div>Operator: <strong>{selectedLog.user?.name || 'System'}</strong></div>
              <div>Entity: <strong>{selectedLog.entityType} (ID: #{selectedLog.entityId})</strong></div>
              <div>Action: <strong>{selectedLog.action}</strong></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Old Values */}
              <div>
                <h4 style={{ color: 'var(--accent-danger)', marginBottom: '8px' }}>Old Values (Before)</h4>
                <pre style={{ margin: 0, padding: '12px', background: 'rgba(239,68,68,0.02)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)', overflowX: 'auto', fontSize: '12px', maxHeight: '300px' }}>
                  {selectedLog.oldValues ? JSON.stringify(selectedLog.oldValues, null, 2) : '// No previous data recorded.'}
                </pre>
              </div>

              {/* New Values */}
              <div>
                <h4 style={{ color: 'var(--accent-success)', marginBottom: '8px' }}>New Values (After)</h4>
                <pre style={{ margin: 0, padding: '12px', background: 'rgba(52,211,153,0.02)', border: '1px solid rgba(52,211,153,0.1)', borderRadius: 'var(--radius-sm)', overflowX: 'auto', fontSize: '12px', maxHeight: '300px' }}>
                  {selectedLog.newValues ? JSON.stringify(selectedLog.newValues, null, 2) : '// No updated values payload.'}
                </pre>
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-primary" onClick={() => setOpenModal(false)}>
                Dismiss Log
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AuditLog
