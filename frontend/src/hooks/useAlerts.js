import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'

export const useAlerts = () => {
  const [counts, setCounts] = useState({ total: 0, OVERDUE: 0, DUE_SOON: 0, POSSESSION_NEAR: 0, REGISTRY_DUE: 0, GST_REVIEW: 0 })
  const [loading, setLoading] = useState(false)

  const fetchCounts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/alerts/count')
      setCounts(res.data.data)
    } catch { /* silently fail */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchCounts()
    const interval = setInterval(fetchCounts, 5 * 60 * 1000) // refresh every 5 min
    return () => clearInterval(interval)
  }, [fetchCounts])

  return { counts, loading, refresh: fetchCounts }
}

export default useAlerts
