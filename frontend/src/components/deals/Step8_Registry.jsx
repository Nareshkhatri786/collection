import React from 'react'
import { formatINR, formatCash } from '../../utils/cashFormat'
import FormField from '../ui/FormField'

const Step8_Registry = ({ formData, update, onPrev, onSubmit, saving }) => {
  const {
    project,
    unit,
    client,
    newClient,
    clientName,
    clientMobile,
    dealAmount,
    subTotal,
    ownMargin,
    loanAmount,
    totalCash,
    possessionDate,
    registryTargetDate,
    notes,
    marginSchedule,
    loanSchedule,
    cashSchedule
  } = formData

  const isUnderConstruction = project?.status === 'UNDER_CONSTRUCTION'

  const validateAndSubmit = () => {
    if (!registryTargetDate) {
      alert('Registry Target Date is required.')
      return
    }
    if (isUnderConstruction && !possessionDate) {
      alert('Possession Date is required for projects under construction.')
      return
    }
    onSubmit()
  }

  return (
    <div>
      <h3 style={{ marginBottom: '20px', color: 'var(--accent-primary)' }}>Step 8 — Timeline & Final Review</h3>

      <div className="form-row-2">
        {isUnderConstruction && (
          <FormField label="Target Possession Date" required hint="Pre-filled from project details (change if different for this unit)">
            <input
              type="date"
              className="form-input"
              value={possessionDate}
              onChange={(e) => update({ possessionDate: e.target.value })}
            />
          </FormField>
        )}
        <FormField label="Registry Target Date" required hint="Expected property registration date">
          <input
            type="date"
            className="form-input"
            value={registryTargetDate}
            onChange={(e) => update({ registryTargetDate: e.target.value })}
          />
        </FormField>
      </div>

      <FormField label="Deal Notes / Special Terms" hint="Any custom conditions agreed with client">
        <textarea
          className="form-textarea"
          rows="4"
          value={notes}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="Enter notes, payment terms, or custom agreements here..."
        />
      </FormField>

      <hr style={{ margin: '24px 0', border: '0', borderTop: '1px solid var(--border-primary)' }} />

      <h4 style={{ marginBottom: '16px', color: 'var(--accent-secondary)' }}>Deal Summary Preview</h4>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Left Side: Client & Property */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
          <h5 style={{ color: 'var(--accent-primary)', marginBottom: '12px' }}>Client & Property</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Client:</span>{' '}
              <strong>{newClient ? `${clientName} (New)` : client?.name}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Mobile:</span>{' '}
              <span>{newClient ? clientMobile : client?.mobile}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Project:</span>{' '}
              <strong>{project?.name}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Unit Selected:</span>{' '}
              <strong style={{ color: 'var(--accent-info)' }}>{unit?.unitNumber}</strong> ({unit?.unitType?.typeName || 'Plot'})
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Project Status:</span>{' '}
              <span style={{ color: isUnderConstruction ? 'var(--accent-warning)' : 'var(--accent-success)' }}>
                {isUnderConstruction ? '🏗️ Under Construction' : '🏢 Ready'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Financials */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
          <h5 style={{ color: 'var(--accent-gold)', marginBottom: '12px' }}>Financial Breakdown</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Deal Amount (Base):</span>{' '}
              <strong>{formatINR(dealAmount)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Sub Total (Agreement Value):</span>{' '}
              <strong style={{ color: 'var(--accent-primary)' }}>{formatINR(subTotal)}</strong>
            </div>
            <div style={{ paddingLeft: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              • Own Margin: {formatINR(ownMargin)} ({marginSchedule.length} payments)
              <br />
              • Home Loan: {formatINR(loanAmount)} ({loanSchedule.length} stages)
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Cash Components:</span>{' '}
              <strong style={{ color: 'var(--accent-gold)' }}>{formatCash(totalCash)}</strong> ({cashSchedule.length} payments)
            </div>
          </div>
        </div>
      </div>

      <div className="wizard-footer">
        <button onClick={onPrev} className="btn btn-ghost" disabled={saving}>← Back</button>
        <button
          onClick={validateAndSubmit}
          className="btn btn-primary btn-lg"
          style={{ background: 'var(--gradient-brand)', border: 'none' }}
          disabled={saving}
        >
          {saving ? 'Saving Booking... ⏳' : 'Confirm & Save Deal 🎉'}
        </button>
      </div>
    </div>
  )
}

export default Step8_Registry
