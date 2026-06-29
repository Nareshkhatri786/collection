import React from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const formatINR = (amount) => {
  if (amount == null) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Opens a browser print window with a policy-compliant receipt/voucher
 * @param {'margin'|'loan'|'cash'|'labour'} type
 * @param {number} id
 */
const openReceiptWindow = async (type, id) => {
  try {
    const res = await api.get(`/vouchers/${type}/${id}`)
    const d = res.data.data

    const isPayment = d.voucherType === 'PAYMENT'
    const dateStr = d.voucherDate
      ? new Date(d.voucherDate).toLocaleString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      : '—'

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${d.voucherNumber} | ${isPayment ? 'Cash Voucher' : 'Receipt'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; background: #fff; color: #111; font-size: 13px; }
    .page { width: 700px; margin: 40px auto; padding: 40px 48px; border: 2px solid #1a1a2e; border-radius: 8px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .brand { font-size: 22px; font-weight: 700; color: #1a1a2e; letter-spacing: -0.5px; }
    .brand small { display: block; font-size: 11px; font-weight: 400; color: #666; margin-top: 2px; }
    .badge-type { padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
    .badge-receipt { background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; }
    .badge-payment { background: #fff3e0; color: #e65100; border: 1px solid #ffcc80; }
    .voucher-title { text-align: center; margin: 20px 0; padding: 16px; background: #f8f9ff; border-radius: 6px; border-left: 4px solid #1a1a2e; }
    .voucher-title h1 { font-size: 18px; font-weight: 700; color: #1a1a2e; }
    .voucher-title .vno { font-size: 13px; color: #555; margin-top: 4px; font-family: monospace; letter-spacing: 1px; }
    .divider { border: none; border-top: 1px solid #e0e0e0; margin: 20px 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin-bottom: 20px; }
    .field { display: flex; flex-direction: column; gap: 2px; }
    .field label { font-size: 10px; font-weight: 600; text-transform: uppercase; color: #888; letter-spacing: 0.5px; }
    .field span { font-size: 13px; font-weight: 500; color: #111; }
    .amount-box { background: #1a1a2e; color: #fff; border-radius: 8px; padding: 16px 24px; text-align: center; margin: 24px 0; }
    .amount-box .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7; }
    .amount-box .value { font-size: 28px; font-weight: 700; margin-top: 4px; letter-spacing: -0.5px; }
    .policy-footer { background: #f5f5f5; border: 1px solid #ddd; border-radius: 6px; padding: 14px 18px; margin-top: 28px; }
    .policy-footer p { font-size: 11px; color: #555; line-height: 1.6; }
    .policy-footer strong { color: #333; }
    .sig-row { display: flex; justify-content: space-between; margin-top: 36px; }
    .sig-box { text-align: center; }
    .sig-box .line { width: 160px; border-top: 1px solid #999; margin-bottom: 6px; }
    .sig-box span { font-size: 11px; color: #666; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { border: 2px solid #1a1a2e !important; margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand">
        ${d.project?.developerName || 'Property Management'}
        <small>${d.project?.name || ''}</small>
      </div>
      <span class="badge-type ${isPayment ? 'badge-payment' : 'badge-receipt'}">
        ${isPayment ? '💸 Cash Payment Voucher' : '🧾 Collection Receipt'}
      </span>
    </div>

    <div class="voucher-title">
      <h1>${isPayment ? 'CASH PAYMENT VOUCHER' : 'CASH COLLECTION RECEIPT'}</h1>
      <div class="vno">${d.voucherNumber}</div>
    </div>

    <hr class="divider"/>

    <div class="grid">
      <div class="field">
        <label>Date &amp; Time</label>
        <span>${dateStr}</span>
      </div>
      <div class="field">
        <label>Voucher / Receipt No.</label>
        <span style="font-family:monospace;color:#1a1a2e;font-weight:700;">${d.voucherNumber}</span>
      </div>
      <div class="field">
        <label>Client Name</label>
        <span>${d.client?.name || '—'}</span>
      </div>
      <div class="field">
        <label>Mobile</label>
        <span>${d.client?.mobile || '—'}</span>
      </div>
      <div class="field">
        <label>Unit Number</label>
        <span>${d.unit?.unitNumber || '—'}</span>
      </div>
      <div class="field">
        <label>Project</label>
        <span>${d.project?.name || '—'}</span>
      </div>
      <div class="field">
        <label>Payment Type</label>
        <span>${d.milestoneType || '—'}</span>
      </div>
      <div class="field">
        <label>Payment Mode</label>
        <span>${d.paymentMode || '—'}</span>
      </div>
      ${d.referenceNumber ? `
      <div class="field">
        <label>Cheque / UTR / Reference</label>
        <span style="font-family:monospace;">${d.referenceNumber}</span>
      </div>` : ''}
      <div class="field">
        <label>Purpose / Milestone</label>
        <span>${d.description || '—'}</span>
      </div>
    </div>

    <div class="amount-box">
      <div class="label">${isPayment ? 'Amount Paid' : 'Amount Received'}</div>
      <div class="value">${formatINR(d.amount)}</div>
    </div>

    <div class="policy-footer">
      <p><strong>📋 Digital Document Policy:</strong> This is a system-generated document. Physical signature is not required. 
      User authentication, login records, approval records, timestamps, and audit logs serve as digital approval and are legally 
      equivalent to a manual signature under applicable digital transaction laws.</p>
      <p style="margin-top:8px;"><strong>Created by:</strong> ${d.createdBy || 'System'} &nbsp;|&nbsp; 
      <strong>Generated on:</strong> ${new Date().toLocaleString('en-IN')} &nbsp;|&nbsp;
      <strong>System Audit Trail:</strong> Enabled ✓</p>
    </div>

    <div class="sig-row">
      <div class="sig-box">
        <div class="line"></div>
        <span>Received By / ${isPayment ? 'Paid By' : 'Prepared By'}</span>
      </div>
      <div class="sig-box">
        <div class="line"></div>
        <span>${isPayment ? 'Approved By (Manager / Admin)' : 'Authorised Signatory'}</span>
      </div>
    </div>
  </div>

  <div class="no-print" style="text-align:center;padding:20px;">
    <button onclick="window.print()" style="padding:10px 28px;background:#1a1a2e;color:#fff;border:none;border-radius:6px;font-size:14px;cursor:pointer;font-weight:600;">
      🖨️ Print / Save as PDF
    </button>
    <button onclick="window.close()" style="margin-left:12px;padding:10px 18px;background:#eee;color:#333;border:none;border-radius:6px;font-size:14px;cursor:pointer;">
      ✕ Close
    </button>
  </div>

  <script>
    // Auto print trigger - remove if you don't want auto-print
    // window.onload = () => setTimeout(() => window.print(), 500);
  </script>
</body>
</html>`

    const win = window.open('', '_blank', 'width=820,height=900,scrollbars=yes')
    if (!win) {
      toast.error('Popup blocked! Please allow popups for this site.')
      return
    }
    win.document.write(html)
    win.document.close()
  } catch (err) {
    console.error('Receipt error:', err)
    toast.error(err.response?.data?.error || 'Could not generate receipt. Please try again.')
  }
}

/**
 * Receipt Button Component
 * Usage: <ReceiptButton type="margin" id={item.id} label="🧾 Receipt" />
 */
const ReceiptButton = ({ type, id, label, className = '', style = {} }) => {
  return (
    <button
      className={`btn btn-sm ${className}`}
      style={{
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        color: '#fff',
        border: 'none',
        fontSize: '11px',
        padding: '4px 10px',
        borderRadius: '6px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        ...style
      }}
      onClick={() => openReceiptWindow(type, id)}
      title="Open system-generated receipt"
    >
      {label || '🧾 Receipt'}
    </button>
  )
}

export { ReceiptButton, openReceiptWindow }
export default ReceiptButton
