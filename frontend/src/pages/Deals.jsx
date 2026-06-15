import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatINR } from '../utils/cashFormat'
import api from '../utils/api'
import StatusBadge from '../components/ui/StatusBadge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import toast from 'react-hot-toast'

const Deals = () => {
  const { isDeveloper } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [deals, setDeals] = useState([])
  const [summaries, setSummaries] = useState({})
  const [projects, setProjects] = useState([])
  
  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchFilters = async () => {
    try {
      const res = await api.get('/projects')
      setProjects(res.data.data)
    } catch (err) {
      console.error('Failed to load projects list:', err)
    }
  }

  const fetchDeals = async () => {
    try {
      setLoading(true)
      const projParam = selectedProjectId === 'ALL' ? '' : `&projectId=${selectedProjectId}`
      const statusParam = selectedStatus === 'ALL' ? '' : `&status=${selectedStatus}`
      
      const res = await api.get(`/deals?page=${page}&limit=15${projParam}${statusParam}`)
      const fetchedDeals = res.data.data
      setDeals(fetchedDeals)
      setTotalPages(res.data.pagination?.pages || 1)

      // Fetch financial summary for each deal on the page to display collected and balance
      const summariesMap = {}
      const summaryPromises = fetchedDeals.map(async (d) => {
        try {
          const sumRes = await api.get(`/deals/${d.id}/summary`)
          summariesMap[d.id] = sumRes.data.data
        } catch (err) {
          console.error(`Error loading summary for deal ${d.id}:`, err)
        }
      })
      await Promise.all(summaryPromises)
      setSummaries(summariesMap)
    } catch (err) {
      toast.error('Failed to load deals registry.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFilters()
  }, [])

  useEffect(() => {
    fetchDeals()
  }, [page, selectedProjectId, selectedStatus])

  // Filter local results further by search query
  const filteredDeals = deals.filter(d => {
    const query = searchQuery.toLowerCase()
    return (
      d.unit?.unitNumber.toLowerCase().includes(query) ||
      d.client?.name.toLowerCase().includes(query) ||
      d.project?.name.toLowerCase().includes(query)
    )
  })

  if (loading && deals.length === 0) {
    return <LoadingSpinner center={true} size="lg" />
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bookings Registry</h1>
          <p>Full financial audit ledger of all booking transactions</p>
        </div>
        {!isDeveloper() && (
          <Link to="/deals/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            ➕ Record Booking
          </Link>
        )}
      </div>

      {/* Filters Card */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by unit#, client, or project..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
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
          <div style={{ width: '160px' }}>
            <select
              className="form-select"
              value={selectedStatus}
              onChange={e => { setSelectedStatus(e.target.value); setPage(1) }}
              style={{ width: '100%' }}
            >
              <option value="ALL">All Registries</option>
              <option value="PENDING">Registry Pending</option>
              <option value="IN_PROGRESS">Registry In-Progress</option>
              <option value="DONE">Registry Done</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deals List */}
      {filteredDeals.length === 0 ? (
        <EmptyState icon="🤝" title="No bookings registered" message="No deals match your search criteria. Create a booking." />
      ) : (
        <>
          <div className="table-container" style={{ marginBottom: '20px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Client</th>
                  <th>Project</th>
                  <th>Base Price</th>
                  <th>Agreement (Sub Total)</th>
                  <th>Collected (Banking)</th>
                  <th>Balance Outstanding</th>
                  <th>Registry Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map((d) => {
                  const s = summaries[d.id]
                  const collected = s ? s.totalBankingReceived : 0
                  const balance = s ? s.bankingBalance : parseFloat(d.subTotal)
                  
                  return (
                    <tr key={d.id} className="table-row-hover">
                      <td style={{ fontWeight: 700 }}>
                        <Link to={`/deals/${d.id}`} style={{ color: 'var(--accent-info)', textDecoration: 'none' }}>
                          {d.unit?.unitNumber}
                        </Link>
                      </td>
                      <td style={{ fontWeight: 600 }}>{d.client?.name}</td>
                      <td>{d.project?.name}</td>
                      <td>{formatINR(d.dealAmount)}</td>
                      <td style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{formatINR(d.subTotal)}</td>
                      <td style={{ color: 'var(--accent-success)', fontWeight: 600 }}>{formatINR(collected)}</td>
                      <td style={{ color: balance > 0 ? 'var(--accent-danger)' : 'var(--accent-success)', fontWeight: 600 }}>
                        {formatINR(balance)}
                      </td>
                      <td><StatusBadge status={d.registryStatus} type="registry" /></td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/deals/${d.id}`} className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                          Manage →
                        </Link>
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
    </div>
  )
}

export default Deals
