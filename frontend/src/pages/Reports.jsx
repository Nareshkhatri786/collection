import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatINR, formatCash } from '../utils/cashFormat'
import api from '../utils/api'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import FormField from '../components/ui/FormField'
import toast from 'react-hot-toast'

const Reports = () => {
  const [searchParams] = useSearchParams()
  const { isDeveloper } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState([])
  
  // Active Report parameters
  const [activeReport, setActiveReport] = useState('') // 'projection' | 'achievement' | 'unit-status' | 'extra-work'
  const [projectId, setProjectId] = useState('')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  
  // Results
  const [reportData, setReportData] = useState(null)
  const [exporting, setExporting] = useState(false)

  const MONTHS = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ]

  const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects')
        setProjects(res.data.data)
        
        // Handle query params pre-select
        const projIdParam = searchParams.get('projectId')
        const typeParam = searchParams.get('type')
        
        if (projIdParam) setProjectId(projIdParam)
        else if (res.data.data.length > 0) setProjectId(res.data.data[0].id)
        
        if (typeParam) {
          setActiveReport(typeParam)
        }
      } catch (err) {
        toast.error('Failed to load projects.')
      }
    }
    fetchProjects()
  }, [searchParams])

  const generateReport = async () => {
    if (!projectId) {
      toast.error('Please select a project first.')
      return
    }
    if (!activeReport) {
      toast.error('Please select a report type.')
      return
    }

    try {
      setLoading(true)
      setReportData(null)
      let endpoint = ''

      if (activeReport === 'projection') {
        endpoint = `/reports/monthly-projection?projectId=${projectId}&month=${month}&year=${year}`
      } else if (activeReport === 'achievement') {
        endpoint = `/reports/month-end-achievement?projectId=${projectId}&month=${month}&year=${year}`
      } else if (activeReport === 'unit-status') {
        endpoint = `/reports/unit-wise-status?projectId=${projectId}`
      } else if (activeReport === 'extra-work') {
        endpoint = `/reports/extra-work?projectId=${projectId}`
      }

      const res = await api.get(endpoint)
      setReportData(res.data.data)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate report.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = async () => {
    if (!projectId || !activeReport) return
    try {
      setExporting(true)
      let endpoint = ''
      if (activeReport === 'projection') {
        endpoint = `/reports/monthly-projection?projectId=${projectId}&month=${month}&year=${year}&pdf=true`
      } else if (activeReport === 'achievement') {
        endpoint = `/reports/month-end-achievement?projectId=${projectId}&month=${month}&year=${year}&pdf=true`
      } else if (activeReport === 'unit-status') {
        endpoint = `/reports/unit-wise-status?projectId=${projectId}&pdf=true`
      } else if (activeReport === 'extra-work') {
        endpoint = `/reports/extra-work?projectId=${projectId}&pdf=true`
      }

      const res = await api.get(endpoint, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.setAttribute('download', `${activeReport}-report-${projectId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Report PDF exported successfully! 📄')
    } catch (err) {
      toast.error('Failed to export report PDF.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1>Mandate Reports</h1>
          <p>Generate, review, and download official property collection reports</p>
        </div>
      </div>

      {/* 2x2 Grid of Report Types */}
      {!activeReport && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '30px' }}>
          <div className="card card-hover-effect" onClick={() => setActiveReport('projection')} style={{ cursor: 'pointer', padding: '24px' }}>
            <span style={{ fontSize: '32px' }}>📊</span>
            <h3 style={{ margin: '12px 0 6px 0', color: 'var(--accent-primary)' }}>Monthly Projection Report</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Lists expected margin collections, loan disbursements, and cash installments due in a selected month.
            </p>
          </div>

          <div className="card card-hover-effect" onClick={() => setActiveReport('achievement')} style={{ cursor: 'pointer', padding: '24px' }}>
            <span style={{ fontSize: '32px' }}>📈</span>
            <h3 style={{ margin: '12px 0 6px 0', color: 'var(--accent-success)' }}>Month-End Achievement Report</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Compares projected expectations against actual payments received within the month, showing collection percentages.
            </p>
          </div>

          <div className="card card-hover-effect" onClick={() => setActiveReport('unit-status')} style={{ cursor: 'pointer', padding: '24px' }}>
            <span style={{ fontSize: '32px' }}>🔲</span>
            <h3 style={{ margin: '12px 0 6px 0', color: 'var(--accent-secondary)' }}>Unit-Wise Financial Status</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              A master audit list of all units in a project, displaying total deal value, collected amounts, outstanding, and registration.
            </p>
          </div>

          <div className="card card-hover-effect" onClick={() => setActiveReport('extra-work')} style={{ cursor: 'pointer', padding: '24px' }}>
            <span style={{ fontSize: '32px' }}>🪙</span>
            <h3 style={{ margin: '12px 0 6px 0', color: 'var(--accent-gold)' }}>Extra Work Cash Report</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Summary of cash commitments (Extra Work & Other Charges) comparing total committed value against actual collections.
            </p>
          </div>
        </div>
      )}

      {/* Parameters Selector Form */}
      {activeReport && (
        <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, textTransform: 'capitalize', color: 'var(--accent-primary)' }}>
              {activeReport.replace('-', ' ')} Parameters
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => { setActiveReport(''); setReportData(null) }}>
              ← Change Report Type
            </button>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 2, minWidth: '200px' }}>
              <label className="form-label">Select Mandated Project</label>
              <select
                className="form-select"
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">-- Choose Project --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {(activeReport === 'projection' || activeReport === 'achievement') && (
              <>
                <div style={{ flex: 1, minWidth: '130px' }}>
                  <label className="form-label">Month</label>
                  <select
                    className="form-select"
                    value={month}
                    onChange={e => setMonth(parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  >
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: '100px' }}>
                  <label className="form-label">Year</label>
                  <select
                    className="form-select"
                    value={year}
                    onChange={e => setYear(parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  >
                    {YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <button className="btn btn-primary" onClick={generateReport} disabled={loading} style={{ height: '42px' }}>
              {loading ? 'Running... ⏳' : 'Generate Report'}
            </button>
          </div>
        </div>
      )}

      {/* Loading Screen */}
      {loading && <LoadingSpinner center={true} size="lg" />}

      {/* Report Results */}
      {reportData && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Report Ledger</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Generated on {new Date().toLocaleDateString()}
              </span>
            </div>
            <button className="btn btn-secondary" onClick={handleExportPDF} disabled={exporting}>
              {exporting ? 'Exporting PDF... ⏳' : '📥 Download PDF'}
            </button>
          </div>

          {/* TABLE: Monthly Projection */}
          {activeReport === 'projection' && (
            reportData.length === 0 ? (
              <EmptyState title="No items projected" message="There are no scheduled installments due for this project in this month." />
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Unit</th>
                      <th>Client Name</th>
                      <th>Payment Milestone</th>
                      <th>Category</th>
                      <th>Due Date</th>
                      <th style={{ textAlign: 'right' }}>Expected Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{row.unitNumber}</td>
                        <td>{row.clientName}</td>
                        <td>{row.paymentType}</td>
                        <td>
                          <span className={`badge ${
                            row.isCash ? 'badge-warning' : (row.category.includes('Loan') ? 'badge-info' : 'badge-primary')
                          }`} style={{ fontSize: '10px' }}>
                            {row.category}
                          </span>
                        </td>
                        <td>{new Date(row.dueDate).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }} className={row.isCash ? 'cash-amount' : ''}>
                          {row.isCash ? formatCash(row.expectedAmount) : formatINR(row.expectedAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* TABLE: Month-End Achievement */}
          {activeReport === 'achievement' && (
            <div>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Total Projected (Banking)</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-primary)' }}>{formatINR(reportData.totalExpected)}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Total Received (Banking)</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-success)' }}>{formatINR(reportData.totalReceived)}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Collection Efficiency</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-success)' }}>{reportData.collectionPct}%</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Pending Outstanding</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-danger)' }}>{formatINR(reportData.pending)}</div>
                </div>
              </div>

              <h4 style={{ marginBottom: '12px' }}>Outstanding Milestones Pending Receipt</h4>
              {reportData.pendingItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No pending collections for this month. 100% efficiency! 🎉</div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Unit</th>
                        <th>Client Name</th>
                        <th>Milestone Description</th>
                        <th style={{ textAlign: 'right' }}>Outstanding Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.pendingItems.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{row.unitNumber}</td>
                          <td>{row.clientName}</td>
                          <td>{row.description}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-danger)' }}>{formatINR(row.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TABLE: Unit-Wise Status */}
          {activeReport === 'unit-status' && (
            reportData.length === 0 ? (
              <EmptyState title="No bookings registered" message="No deals have been booked in this project." />
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Unit</th>
                      <th>Client Name</th>
                      <th>Agreement Value</th>
                      <th>Total Collected</th>
                      <th>Balance Outstanding</th>
                      <th>Registry Status</th>
                      <th>Next Due Date</th>
                      <th style={{ textAlign: 'right' }}>Next Due Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{row.unitNumber}</td>
                        <td>{row.clientName}</td>
                        <td style={{ fontWeight: 600 }}>{formatINR(row.totalDealValue)}</td>
                        <td style={{ color: 'var(--accent-success)', fontWeight: 600 }}>{formatINR(row.totalCollected)}</td>
                        <td style={{ color: row.balance > 0 ? 'var(--accent-danger)' : 'var(--accent-success)', fontWeight: 600 }}>
                          {formatINR(row.balance)}
                        </td>
                        <td>
                          <span className={`badge ${
                            row.registryStatus === 'DONE' ? 'badge-success' :
                            row.registryStatus === 'IN_PROGRESS' ? 'badge-info' :
                            'badge-secondary'
                          }`} style={{ fontSize: '10px' }}>
                            {row.registryStatus}
                          </span>
                        </td>
                        <td>{row.nextDueDate ? new Date(row.nextDueDate).toLocaleDateString() : '—'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.nextDueAmount ? formatINR(row.nextDueAmount) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* TABLE: Extra Work Cash */}
          {activeReport === 'extra-work' && (
            reportData.length === 0 ? (
              <EmptyState title="No cash transactions recorded" message="There are no bookings with cash commitments in this project." />
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Unit</th>
                      <th>Client Name</th>
                      <th>Committed Cash (=)</th>
                      <th>Collected Cash (=)</th>
                      <th style={{ textAlign: 'right' }}>Balance Outstanding (=)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{row.unitNumber}</td>
                        <td>{row.clientName}</td>
                        <td className="cash-amount" style={{ fontWeight: 600 }}>{formatCash(row.cashCommitted)}</td>
                        <td className="cash-amount" style={{ color: 'var(--accent-success)', fontWeight: 600 }}>{formatCash(row.cashReceived)}</td>
                        <td className="cash-amount" style={{ textAlign: 'right', color: row.balance > 0 ? 'var(--accent-danger)' : 'var(--accent-success)', fontWeight: 700 }}>
                          {formatCash(row.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}

export default Reports
