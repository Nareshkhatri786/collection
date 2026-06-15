import React, { useEffect } from 'react'
import { formatINR } from '../../utils/cashFormat'
import FormField from '../ui/FormField'

const PRESETS = [
  'Booking Amount',
  'Agreement Amount',
  'Slab 1',
  'Slab 2',
  'Slab 3',
  'Maintenance Deposit',
  'Stamp+Reg+GST'
]

const Step5_MarginSched = ({ formData, update, onNext, onPrev }) => {
  const { ownMargin, marginSchedule = [] } = formData
  const targetAmount = parseFloat(ownMargin) || 0

  // If schedule is empty, initialize it with a default row or just let the user add
  useEffect(() => {
    if (marginSchedule.length === 0 && targetAmount > 0) {
      update({
        marginSchedule: [{ description: 'Booking Amount', dueDate: new Date().toISOString().split('T')[0], amount: '' }]
      })
    }
  }, [])

  const addRow = (description = '') => {
    const newRow = {
      description,
      dueDate: new Date().toISOString().split('T')[0],
      amount: ''
    }
    update({ marginSchedule: [...marginSchedule, newRow] })
  }

  const removeRow = (index) => {
    const updated = marginSchedule.filter((_, i) => i !== index)
    update({ marginSchedule: updated })
  }

  const handleChange = (index, field, value) => {
    const updated = marginSchedule.map((row, i) => {
      if (i === index) {
        return { ...row, [field]: value }
      }
      return row
    })
    update({ marginSchedule: updated })
  }

  const totalAmount = marginSchedule.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0)
  const diff = Math.abs(totalAmount - targetAmount)
  const isValid = diff <= 2 // Allow 2 Rupee tolerance for rounding

  const validate = () => {
    if (marginSchedule.length === 0) {
      alert('Please add at least one installment in the margin schedule.')
      return false
    }
    for (let i = 0; i < marginSchedule.length; i++) {
      const row = marginSchedule[i]
      if (!row.description.trim()) {
        alert(`Description is required for row ${i + 1}`)
        return false
      }
      if (!row.dueDate) {
        alert(`Due Date is required for row ${i + 1}`)
        return false
      }
      const val = parseFloat(row.amount)
      if (isNaN(val) || val <= 0) {
        alert(`Amount must be greater than 0 for row ${i + 1}`)
        return false
      }
    }
    if (!isValid) {
      alert(`Total scheduled amount (${formatINR(totalAmount)}) must equal Own Margin target (${formatINR(targetAmount)})`)
      return false
    }
    return true
  }

  return (
    <div>
      <h3 style={{ marginBottom: '20px', color: 'var(--accent-primary)' }}>Step 5 — Margin Payment Schedule</h3>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(79,142,247,0.06)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Target Own Margin:</span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-primary)', marginLeft: '12px' }}>{formatINR(targetAmount)}</span>
        </div>
        <div>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Scheduled Total:</span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: totalAmount > targetAmount ? 'var(--accent-danger)' : totalAmount === targetAmount ? 'var(--accent-success)' : 'var(--accent-warning)', marginLeft: '12px' }}>{formatINR(totalAmount)}</span>
        </div>
      </div>

      <div style={{ marginBottom: '18px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginRight: '10px' }}>Presets:</span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => addRow(preset)}
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              + {preset}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container" style={{ marginBottom: '20px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Description</th>
              <th style={{ width: '30%' }}>Due Date</th>
              <th style={{ width: '20%' }}>Amount (₹)</th>
              <th style={{ width: '10%', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {marginSchedule.map((row, idx) => (
              <tr key={idx}>
                <td>
                  <input
                    type="text"
                    className="form-input"
                    value={row.description}
                    onChange={(e) => handleChange(idx, 'description', e.target.value)}
                    placeholder="e.g. Booking Amount"
                    style={{ width: '100%' }}
                  />
                </td>
                <td>
                  <input
                    type="date"
                    className="form-input"
                    value={row.dueDate}
                    onChange={(e) => handleChange(idx, 'dueDate', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-input"
                    value={row.amount}
                    onChange={(e) => handleChange(idx, 'amount', e.target.value)}
                    placeholder="0"
                    style={{ width: '100%' }}
                  />
                  {row.amount && (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', textAlign: 'right' }}>
                      {formatINR(row.amount)}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeRow(idx)}
                    style={{ padding: '6px 10px' }}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            {marginSchedule.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                  No installments scheduled. Click "Add Row" or a preset to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '24px' }}>
        <button type="button" className="btn btn-secondary" onClick={() => addRow('')}>
          ➕ Add Installment Row
        </button>
      </div>

      {marginSchedule.length > 0 && (
        <div className={`validation-bar ${isValid ? 'valid' : 'invalid'}`} style={{ marginBottom: '24px' }}>
          <span style={{ fontSize: '20px' }}>{isValid ? '✅' : '⚠️'}</span>
          <div>
            <div>{isValid ? 'Margin schedule sum matches target Own Margin!' : 'Amounts do not match'}</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>
              Scheduled: <strong>{formatINR(totalAmount)}</strong> vs Target: <strong>{formatINR(targetAmount)}</strong>
              {!isValid && ` (difference: ${formatINR(diff)})`}
            </div>
          </div>
        </div>
      )}

      <div className="wizard-footer">
        <button onClick={onPrev} className="btn btn-ghost">← Back</button>
        <button onClick={() => { if (validate()) onNext() }} className="btn btn-primary btn-lg" disabled={!isValid}>
          Next: Loan Schedule →
        </button>
      </div>
    </div>
  )
}

export default Step5_MarginSched
