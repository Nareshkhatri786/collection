import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'

export const useApi = (url, options = {}) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async (params = {}) => {
    if (!url) { setLoading(false); return }
    try {
      setLoading(true)
      setError(null)
      const res = await api.get(url, { params: { ...options.params, ...params } })
      setData(res.data.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => { fetchData() }, [fetchData])

  return { data, loading, error, refetch: fetchData, setData }
}

export default useApi
