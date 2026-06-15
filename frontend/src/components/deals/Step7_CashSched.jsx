import React, { useEffect } from 'react'
import { formatCash, formatINR } from '../../utils/cashFormat'
import FormField from '../ui/FormField'

const PRESETS = [
  'Extra Work Advance',
  'Extra Work Stage 1',
  'Extra Work Stage 2',
  'Other Charges',
  'Final Cash Installment'
]

const Step7_CashSched = ({ formData, update, onNext, onPrev }) => {
  const { totalCash, cashSchedule = [] } = formData
  const targetAmount = parseFloat(totalCash) || 0
  const isNoCash = targetAmount === 0

  // Auto-initialize if cash is required and schedule is empty
  useEffect(() => {
    if (!isNoCash && cashSchedule.length === 0) {
      update({
        cashSchedule: [{ description: 'Extra Work Advance', dueDate: new Date().toISOString().split('T')[0], amount: '' }]
      })
    }
  }, [isNoCash])

  const addRow = (description = '') => {
    const newRow = {
      description,
      dueDate: new Date().toISOString().split('T')[0],
      amount: ''
    }
    update({ cashSchedule: [...cashSchedule, newRow] })
  }

  const removeRow = (index) => {
    const updated = cashSchedule.filter((_, i) => i !== index)
    update({ cashSchedule: updated })
  }

  const handleChange = (index, field, value) => {
    const updated = cashSchedule.map((row, i) => {
      if (i === index) {
        return { ...row, [field]: value }
      }
      return row
    })
    update({ cashSchedule: updated })
  }

  const totalAmount = isNoCash ? 0 : cashSchedule.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0)
  const diff = Math.abs(totalAmount - targetAmount)
  const isValid = isNoCash || diff <= 2

  const validate = () => {
    if (isNoCash) return true

    if (cashSchedule.length === 0) {
      alert('Please add at least one installment in the cash schedule.')
      return false
    }
    for (let i = 0; i < cashSchedule.length; i++) {
      const row = cashSchedule[i]
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
      alert(`Total scheduled cash amount (${formatCash(totalAmount)}) must equal Cash target (${formatCash(targetAmount)})`)
      return false
    }
    return true
  }

  return (
    <div>
      <h3 style={{ marginBottom: '20px', color: 'var(--accent-gold)' }}>Step 7 — Cash Payment Schedule</h3>

      {isNoCash ? (
        <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(245,166,35,0.06)', border: '1px dashed var(--accent-gold)', borderRadius: 'var(--radius-lg)', marginBottom: '24px' }}>
          <span style={{ fontSize: '32px' }}>🪙</span>
          <h4 style={{ color: 'var(--accent-gold)', marginTop: '12px', marginBottom: '8px' }}>No Cash Components Required</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '400px', margin: '0 auto' }}>
            No Extra Work or Other Charges were added in Step 3. You can skip the cash schedule and proceed.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.15)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: '24px' }}>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Target Cash:</span>
              <span className="cash-amount" style={{ fontSize: '20px', fontWeight: 700, marginLeft: '12px' }}>{formatCash(targetAmount)}</span>
            </div>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Scheduled Total:</span>
              <span className="cash-amount" style={{ fontSize: '20px', fontWeight: 700, color: totalAmount > targetAmount ? 'var(--accent-danger)' : totalAmount === targetAmount ? 'var(--accent-success)' : 'var(--accent-warning)', marginLeft: '12px' }}>{formatCash(totalAmount)}</span>
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
                  style={{ fontSize: '11px', padding: '4px 8px', borderColor: 'rgba(245,166,35,0.2)' }}
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
                  <th style={{ width: '20%' }}>Amount (Plain Number)</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {cashSchedule.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        value={row.description}
                        onChange={(e) => handleChange(idx, 'description', e.target.value)}
                        placeholder="e.g. Extra Work Advance"
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
                        style={{ width: '100%', fontFamily: 'monospace', color: 'var(--accent-gold)' }}
                      />
                      {row.amount && (
                        <div className="cash-amount" style={{ fontSize: '12px', marginTop: '2px', textAlign: 'right' }}>
                          {formatCash(row.amount)}
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
                {cashSchedule.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                      No cash installments scheduled. Click "Add Row" or a preset to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => addRow('')}>
              ➕ Add Cash Installment Row
            </button>
          </div>

          {cashSchedule.length > 0 && (
            <div className={`validation-bar ${isValid ? 'valid' : 'invalid'}`} style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '20px' }}>{isValid ? '✅' : '⚠️'}</span>
              <div>
                <div>{isValid ? 'Cash schedule sum matches target Cash!' : 'Amounts do not match'}</div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>
                  Scheduled: <strong className="cash-amount">{formatCash(totalAmount)}</strong> vs Target: <strong className="cash-amount">{formatCash(targetAmount)}</strong>
                  {!isValid && ` (difference: ${formatINR(diff)})`}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="wizard-footer">
        <button onClick={onPrev} className="btn btn-ghost">← Back</button>
        <button onClick={() => { if (validate()) onNext() }} className="btn btn-primary btn-lg" disabled={!isValid}>
          Next: Registry Timeline →
        </button>
      </div>
    </div>
  )
}

export default Step7_CashSched
