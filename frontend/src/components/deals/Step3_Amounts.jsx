import React, { useEffect } from 'react'
import { calculateDealFinancials } from '../../utils/gstCalc'
import { formatINR, formatCash } from '../../utils/cashFormat'
import FormField from '../ui/FormField'
import StatusBadge from '../ui/StatusBadge'

const Step3_Amounts = ({ formData, update, onNext, onPrev }) => {
  const { project, dealAmount, maintenanceDeposit, gstOverridden, gstAmount, extraWork, otherCharges } = formData

  // Recalculate whenever key values change
  useEffect(() => {
    if (!dealAmount || !project) return
    const maintNum = parseFloat(maintenanceDeposit || project?.maintenanceDeposit || 0)
    const { stampDuty, gstRate, gstAmount: gstCalc, subTotal } = calculateDealFinancials(
      project.status, parseFloat(dealAmount), maintNum,
      gstOverridden ? parseFloat(gstAmount || 0) : null
    )
    const totalCash = (parseFloat(extraWork || 0)) + (parseFloat(otherCharges || 0))
    update({ stampDuty, gstRate, gstAmountCalc: gstOverridden ? parseFloat(gstAmount || 0) : gstCalc, subTotal, totalCash })
  }, [dealAmount, maintenanceDeposit, gstOverridden, gstAmount, extraWork, otherCharges])

  const validate = () => {
    if (!dealAmount || parseFloat(dealAmount) <= 0) { alert('Deal amount must be greater than 0'); return false }
    return true
  }

  return (
    <div>
      <h3 style={{ marginBottom: '20px', color: 'var(--accent-primary)' }}>Step 3 — Deal Amounts</h3>

      {/* Project & Unit summary */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '24px', fontSize: '13px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <span>🏗️ <strong>{project?.name}</strong></span>
        <span>🏢 Unit: <strong>{formData.unit?.unitNumber}</strong> — {formData.unit?.unitType?.typeName}</span>
        <span>📐 {formData.unit?.carpetArea} sq ft | Floor {formData.unit?.floor}</span>
        <StatusBadge status={project?.status} type="project" />
      </div>

      {/* Banking Section */}
      <div style={{ background: 'rgba(79,142,247,0.04)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '20px' }}>
        <h4 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>🏦 Banking Amounts (Cheque / NEFT / Online)</h4>
        <div className="form-row-2">
          <FormField label="Deal Amount (Registry Value)" required>
            <input className="form-input" type="number" value={dealAmount} onChange={e => update({ dealAmount: e.target.value })} placeholder="e.g. 445000" min="1" />
          </FormField>
          <FormField label="Maintenance Deposit">
            <input className="form-input" type="number" value={maintenanceDeposit || project?.maintenanceDeposit || ''} onChange={e => update({ maintenanceDeposit: e.target.value })} placeholder={`Default: ${formatINR(project?.maintenanceDeposit)}`} />
          </FormField>
        </div>
        <div className="form-row-3">
          <FormField label={`Stamp Duty (5.9%)`} hint="Auto-calculated">
            <div className="calc-field">{formatINR(formData.stampDuty)}</div>
          </FormField>
          <FormField label={`GST${gstOverridden ? ' (Manual)' : ` (${formData.gstRate}%)`}`} hint={gstOverridden ? 'Override active' : 'Auto-calculated'}>
            {gstOverridden ? (
              <input className="form-input" type="number" value={gstAmount} onChange={e => update({ gstAmount: e.target.value })} placeholder="Enter GST amount" />
            ) : (
              <div className="calc-field">{formatINR(formData.gstAmountCalc)}</div>
            )}
          </FormField>
          <FormField label="GST Override" hint="Toggle to set manually">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 0' }}>
              <input type="checkbox" checked={gstOverridden} onChange={e => update({ gstOverridden: e.target.checked })} style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }} />
              <span style={{ fontSize: '13px' }}>Override GST manually</span>
            </label>
          </FormField>
        </div>
        <div style={{ background: 'rgba(79,142,247,0.08)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '14px' }}>Banking Sub Total</span>
          <span style={{ fontWeight: 800, fontSize: '20px', color: 'var(--accent-primary)' }}>{formatINR(formData.subTotal)}</span>
        </div>
      </div>

      {/* Cash Section */}
      <div style={{ background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
        <h4 style={{ color: 'var(--accent-gold)', marginBottom: '4px' }}>💵 Cash Amounts (= Notation)</h4>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>These amounts are collected in cash and kept completely separate from banking transactions.</p>
        <div className="form-row-2">
          <FormField label="Extra Work (=)" hint="Labour work amount">
            <input className="form-input" type="number" value={extraWork} onChange={e => update({ extraWork: e.target.value })} placeholder="e.g. 21500" min="0" />
            {extraWork && <div className="form-hint cash-amount" style={{ marginTop: '4px' }}>{formatCash(extraWork)}</div>}
          </FormField>
          <FormField label="Other Charges (=)" hint="Fixed by developer">
            <input className="form-input" type="number" value={otherCharges} onChange={e => update({ otherCharges: e.target.value })} placeholder="e.g. 3000" min="0" />
            {otherCharges && <div className="form-hint cash-amount" style={{ marginTop: '4px' }}>{formatCash(otherCharges)}</div>}
          </FormField>
        </div>
        <div style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 'var(--radius-md)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent-gold)' }}>Total Cash</span>
          <span className="cash-amount" style={{ fontSize: '20px' }}>{formatCash(formData.totalCash)}</span>
        </div>
      </div>

      {/* Grand Summary */}
      <div className="summary-box" style={{ marginTop: '20px' }}>
        <div className="summary-box-header">📊 Grand Summary</div>
        <div className="summary-row"><span className="summary-label">Banking Sub Total</span><span className="summary-value">{formatINR(formData.subTotal)}</span></div>
        <div className="summary-row"><span className="summary-label text-gold">Cash Total (=)</span><span className="cash-amount">{formatCash(formData.totalCash)}</span></div>
      </div>

      <div className="wizard-footer">
        <button onClick={onPrev} className="btn btn-ghost">← Back</button>
        <button onClick={() => { if (validate()) onNext() }} className="btn btn-primary btn-lg">Next: Payment Sources →</button>
      </div>
    </div>
  )
}

export default Step3_Amounts
