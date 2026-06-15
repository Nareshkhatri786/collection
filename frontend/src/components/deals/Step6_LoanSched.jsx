import React, { useEffect } from 'react'
import { formatINR } from '../../utils/cashFormat'
import FormField from '../ui/FormField'

const PRESETS = [
  'On Agreement',
  'On Plinth',
  'On Slab 1',
  'On Slab 3',
  'On Brickwork',
  'On Plaster',
  'On Possession'
]

const Step6_LoanSched = ({ formData, update, onNext, onPrev }) => {
  const { loanAmount, loanSchedule = [] } = formData
  const targetAmount = parseFloat(loanAmount) || 0
  const isNoLoan = targetAmount === 0

  // Auto-initialize if loan is present and schedule is empty
  useEffect(() => {
    if (!isNoLoan && loanSchedule.length === 0) {
      update({
        loanSchedule: [{ stageDescription: 'On Agreement', expectedDate: new Date().toISOString().split('T')[0], amount: '' }]
      })
    }
  }, [isNoLoan])

  const addRow = (stageDescription = '') => {
    const newRow = {
      stageDescription,
      expectedDate: new Date().toISOString().split('T')[0],
      amount: ''
    }
    update({ loanSchedule: [...loanSchedule, newRow] })
  }

  const removeRow = (index) => {
    const updated = loanSchedule.filter((_, i) => i !== index)
    update({ loanSchedule: updated })
  }

  const handleChange = (index, field, value) => {
    const updated = loanSchedule.map((row, i) => {
      if (i === index) {
        return { ...row, [field]: value }
      }
      return row
    })
    update({ loanSchedule: updated })
  }

  const totalAmount = isNoLoan ? 0 : loanSchedule.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0)
  const diff = Math.abs(totalAmount - targetAmount)
  const isValid = isNoLoan || diff <= 2

  const validate = () => {
    if (isNoLoan) return true

    if (loanSchedule.length === 0) {
      alert('Please add at least one disbursement in the loan schedule.')
      return false
    }
    for (let i = 0; i < loanSchedule.length; i++) {
      const row = loanSchedule[i]
      if (!row.stageDescription.trim()) {
        alert(`Stage Description is required for row ${i + 1}`)
        return false
      }
      if (!row.expectedDate) {
        alert(`Expected Date is required for row ${i + 1}`)
        return false
      }
      const val = parseFloat(row.amount)
      if (isNaN(val) || val <= 0) {
        alert(`Amount must be greater than 0 for row ${i + 1}`)
        return false
      }
    }
    if (!isValid) {
      alert(`Total scheduled amount (${formatINR(totalAmount)}) must equal Loan target (${formatINR(targetAmount)})`)
      return false
    }
    return true
  }

  return (
    <div>
      <h3 style={{ marginBottom: '20px', color: 'var(--accent-primary)' }}>Step 6 — Loan Disbursement Schedule</h3>

      {isNoLoan ? (
        <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(52,211,153,0.06)', border: '1px dashed var(--accent-success)', borderRadius: 'var(--radius-lg)', marginBottom: '24px' }}>
          <span style={{ fontSize: '32px' }}>🏦</span>
          <h4 style={{ color: 'var(--accent-success)', marginTop: '12px', marginBottom: '8px' }}>No Home Loan Required</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '400px', margin: '0 auto' }}>
            You specified ₹0 for the Home Loan Amount in Step 4. You can skip this schedule and proceed directly.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(79,142,247,0.06)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: '24px' }}>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Target Loan Amount:</span>
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
                  <th style={{ width: '40%' }}>Stage Description</th>
                  <th style={{ width: '30%' }}>Expected Date</th>
                  <th style={{ width: '20%' }}>Amount (₹)</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loanSchedule.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        value={row.stageDescription}
                        onChange={(e) => handleChange(idx, 'stageDescription', e.target.value)}
                        placeholder="e.g. On Plinth completion"
                        style={{ width: '100%' }}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        className="form-input"
                        value={row.expectedDate}
                        onChange={(e) => handleChange(idx, 'expectedDate', e.target.value)}
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
                {loanSchedule.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                      No disbursements scheduled. Click "Add Row" or a preset to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => addRow('')}>
              ➕ Add Disbursement Row
            </button>
          </div>

          {loanSchedule.length > 0 && (
            <div className={`validation-bar ${isValid ? 'valid' : 'invalid'}`} style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '20px' }}>{isValid ? '✅' : '⚠️'}</span>
              <div>
                <div>{isValid ? 'Loan schedule sum matches target Loan Amount!' : 'Amounts do not match'}</div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>
                  Scheduled: <strong>{formatINR(totalAmount)}</strong> vs Target: <strong>{formatINR(targetAmount)}</strong>
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
          Next: Cash Schedule →
        </button>
      </div>
    </div>
  )
}

export default Step6_LoanSched
