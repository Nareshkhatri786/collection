import React from 'react'

const Pagination = ({ page, pages, total, limit, onChange }) => {
  if (pages <= 1) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--border-card)', fontSize: '13px', color: 'var(--text-secondary)' }}>
      <span>Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}</span>
      <div style={{ display: 'flex', gap: '4px' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => onChange(page - 1)} disabled={page <= 1}>← Prev</button>
        {Array.from({ length: Math.min(5, pages) }, (_, i) => {
          const p = Math.max(1, Math.min(page - 2, pages - 4)) + i
          return (
            <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`} onClick={() => onChange(p)}>{p}</button>
          )
        })}
        <button className="btn btn-ghost btn-sm" onClick={() => onChange(page + 1)} disabled={page >= pages}>Next →</button>
      </div>
    </div>
  )
}

export default Pagination
