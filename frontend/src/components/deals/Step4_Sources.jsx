import React from 'react'
import { formatINR } from '../../utils/cashFormat'
import FormField from '../ui/FormField'

const Step4_Sources = ({ formData, update, onNext, onPrev }) => {
  const { subTotal, ownMargin, loanAmount, loanBank } = formData
  const marginNum = parseFloat(ownMargin) || 0
  const loanNum = parseFloat(loanAmount) || 0
  const sum = marginNum + loanNum
  const diff = Math.abs(sum - (parseFloat(subTotal) || 0))
  const isValid = diff <= 2
  const hasValues = marginNum > 0 || loanNum > 0

  const validate = () => {
    if (!ownMargin || parseFloat(ownMargin) < 0) { alert('Own Margin must be 0 or greater'); return false }
    if (!loanAmount || parseFloat(loanAmount) < 0) { alert('Loan Amount must be 0 or greater'); return false }
    if (!isValid) { alert(`Own Margin + Loan (${formatINR(sum)}) must equal Sub Total (${formatINR(subTotal)})`); return false }
    return true
  }

  return (
    <div>
      <h3 style={{ marginBottom: '20px', color: 'var(--accent-primary)' }}>Step 4 — How Client Will Pay</h3>

      <div style={{ background: 'rgba(79,142,247,0.06)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: '24px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total to be arranged:</span>
        <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-primary)', marginLeft: '12px' }}>{formatINR(subTotal)}</span>
      </div>

      <div className="form-row-2">
        <FormField label="Own Margin (Self-funded)" required hint="Amount client will pay from own funds">
          <input className="form-input" type="number" value={ownMargin} onChange={e => update({ ownMargin: e.target.value })} placeholder="e.g. 135705" min="0" />
          {ownMargin && <div className="form-hint" style={{ color: 'var(--accent-success)' }}>{formatINR(ownMargin)}</div>}
        </FormField>
        <FormField label="Home Loan Amount" required hint="Amount from bank loan">
          <input className="form-input" type="number" value={loanAmount} onChange={e => update({ loanAmount: e.target.value })} placeholder="e.g. 390000" min="0" />
          {loanAmount && <div className="form-hint" style={{ color: 'var(--accent-info)' }}>{formatINR(loanAmount)}</div>}
        </FormField>
      </div>

      <FormField label="Loan Bank Name" hint="e.g. SBI, HDFC, ICICI">
        <input className="form-input" value={loanBank} onChange={e => update({ loanBank: e.target.value })} placeholder="Bank name (optional)" />
      </FormField>

      {/* Validation indicator */}
      {hasValues && (
        <div className={`validation-bar ${isValid ? 'valid' : 'invalid'}`}>
          <span style={{ fontSize: '20px' }}>{isValid ? '✅' : '❌'}</span>
          <div>
            <div>{isValid ? 'Amounts match — you can proceed!' : 'Amounts do not match'}</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>
              {formatINR(marginNum)} (margin) + {formatINR(loanNum)} (loan) = <strong>{formatINR(sum)}</strong>
              {!isValid && ` vs Sub Total: ${formatINR(subTotal)} (difference: ${formatINR(diff)})`}
            </div>
          </div>
        </div>
      )}

      <div className="wizard-footer">
        <button onClick={onPrev} className="btn btn-ghost">← Back</button>
        <button onClick={() => { if (validate()) onNext() }} className="btn btn-primary btn-lg" disabled={hasValues && !isValid}>
          Next: Margin Schedule →
        </button>
      </div>
    </div>
  )
}

export default Step4_Sources
