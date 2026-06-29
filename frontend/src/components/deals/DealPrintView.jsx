import React from 'react'
import { formatINR } from '../../utils/cashFormat'

// ─────────────────────────────────────────────────────────────────────────────
// DealPrintView  —  rendered off-screen, printed via window.print()
// ─────────────────────────────────────────────────────────────────────────────
const DealPrintView = ({ deal, summary }) => {
  if (!deal) return null

  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  const fmt = (v) => v ? formatINR(v) : '₹0'

  const marginSchedule = deal.marginSchedule || []
  const loanSchedule   = deal.loanSchedule   || []
  const cashSchedule   = deal.cashSchedule   || []

  return (
    <div id="deal-print-area" style={{ display: 'none' }}>
      <style>{`
        /* Reset margins and default browser headers/footers */
        @page {
          size: A4;
          margin: 15mm 15mm 15mm 15mm;
        }

        @media print {
          body * { visibility: hidden !important; }
          #deal-print-area, #deal-print-area * { visibility: visible !important; }
          #deal-print-area {
            display: block !important;
            position: absolute !important;
            top: 0; left: 0;
            width: 100%;
            background: white !important;
            color: #000 !important;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 10pt;
            box-sizing: border-box;
            line-height: 1.4;
          }
          .print-page-break { 
            page-break-before: always; 
            margin-top: 20px;
          }
          .no-print { display: none !important; }
        }

        #deal-print-area {
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #222;
        }
        
        #deal-print-area .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }

        #deal-print-area .header-table td {
          border: none !important;
          padding: 0 !important;
          background: none !important;
        }

        #deal-print-area .brand-title {
          font-size: 24pt;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          line-height: 1;
        }

        #deal-print-area .brand-subtitle {
          font-size: 9.5pt;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 4px 0 0 0;
        }

        #deal-print-area .header-meta {
          text-align: right;
          font-size: 9pt;
          color: #475569;
        }

        #deal-print-area .header-divider {
          height: 4px;
          background: linear-gradient(to right, #0f172a, #3b82f6);
          margin-bottom: 20px;
          border-radius: 2px;
        }

        #deal-print-area .print-title {
          text-align: center;
          font-size: 12pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          border: 1.5px solid #0f172a;
          padding: 6px;
          margin-bottom: 20px;
          background: #f8fafc;
          color: #0f172a;
        }

        #deal-print-area .print-section-title {
          font-size: 10.5pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          border-bottom: 1.5px solid #cbd5e1;
          padding-bottom: 4px;
          margin: 18px 0 10px;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        #deal-print-area .print-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px 24px;
        }

        #deal-print-area .print-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px dashed #e2e8f0;
          padding: 4px 0;
        }

        #deal-print-area .print-row .lbl { 
          color: #64748b; 
          font-size: 9pt; 
        }

        #deal-print-area .print-row .val { 
          font-weight: 600; 
          font-size: 9pt;
          color: #0f172a;
        }

        #deal-print-area .print-total-row {
          display: flex;
          justify-content: space-between;
          border: 1.5px solid #0f172a;
          padding: 8px 12px;
          margin-top: 10px;
          font-size: 11pt;
          font-weight: 800;
          background: #f8fafc;
          color: #0f172a;
          border-radius: 4px;
        }

        #deal-print-area table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9pt;
          margin-top: 6px;
        }

        #deal-print-area table th {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 6px 8px;
          text-align: left;
          font-weight: 700;
          color: #1e293b;
        }

        #deal-print-area table td {
          border: 1px solid #e2e8f0;
          padding: 5px 8px;
          color: #334155;
        }

        #deal-print-area table tr:nth-child(even) td { 
          background: #f8fafc; 
        }

        #deal-print-area .print-sign-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 30px;
          margin-top: 50px;
          text-align: center;
        }

        #deal-print-area .print-sign-box {
          border-top: 1.5px solid #94a3b8;
          padding-top: 8px;
          font-size: 9pt;
          color: #475569;
        }

        #deal-print-area .badge {
          display: inline-block;
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 8pt;
          font-weight: 700;
          text-transform: uppercase;
        }
        #deal-print-area .badge-green { background: #dcfce7; color: #166534; }
        #deal-print-area .badge-blue  { background: #dbeafe; color: #1e40af; }
        #deal-print-area .badge-orange{ background: #fef3c7; color: #92400e; }
      `}</style>

      {/* ── HEADER BLOCK ── */}
      <table className="header-table">
        <tbody>
          <tr>
            <td>
              <div className="brand-title">Property Collection</div>
              <div className="brand-subtitle">Management System — Booking Summary</div>
            </td>
            <td className="header-meta">
              <strong>Print Date:</strong> {today}<br />
              <strong>Booking Reference:</strong> #{deal.id}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="header-divider"></div>

      <div className="print-title">Booking Acknowledgement & Deal Terms Sheet</div>

      {/* ── DEAL REFERENCE ── */}
      <div className="print-grid-2">
        <div className="print-row"><span className="lbl">Booking ID</span><span className="val">#{deal.id}</span></div>
        <div className="print-row">
          <span className="lbl">Registry Status</span>
          <span className="val">
            <span className={`badge ${deal.registryStatus === 'DONE' ? 'badge-green' : deal.registryStatus === 'IN_PROCESS' ? 'badge-blue' : 'badge-orange'}`}>
              {deal.registryStatus?.replace(/_/g, ' ')}
            </span>
          </span>
        </div>
        <div className="print-row"><span className="lbl">Possession Date</span><span className="val">{fmtDate(deal.possessionDate)}</span></div>
        <div className="print-row"><span className="lbl">Registry Target</span><span className="val">{fmtDate(deal.registryTargetDate)}</span></div>
      </div>

      {/* ── PROJECT & UNIT ── */}
      <div className="print-section-title">🏢 Project & Inventory Details</div>
      <div className="print-grid-2">
        <div className="print-row"><span className="lbl">Project Name</span><span className="val">{deal.project?.name}</span></div>
        <div className="print-row"><span className="lbl">Developer Group</span><span className="val">{deal.project?.developerName}</span></div>
        <div className="print-row"><span className="lbl">Location</span><span className="val">{deal.project?.location}</span></div>
        <div className="print-row"><span className="lbl">Unit Number</span><span className="val" style={{ fontWeight: 800 }}>{deal.unit?.unitNumber}</span></div>
        <div className="print-row"><span className="lbl">Unit Type / Configuration</span><span className="val">{deal.unit?.unitType?.typeName || '—'}</span></div>
        <div className="print-row"><span className="lbl">Floor Level</span><span className="val">{deal.unit?.floor ?? '—'}</span></div>
        {deal.unit?.carpetArea && (
          <div className="print-row"><span className="lbl">Super Built-Up Area (Sq Yards)</span><span className="val" style={{ fontWeight: 700 }}>{deal.unit.carpetArea} Sq Yd</span></div>
        )}
      </div>

      {/* ── CLIENT ── */}
      <div className="print-section-title">👤 Buyer (Client) Details</div>
      <div className="print-grid-2">
        <div className="print-row"><span className="lbl">Full Name</span><span className="val">{deal.client?.name}</span></div>
        <div className="print-row"><span className="lbl">Contact Mobile</span><span className="val">{deal.client?.mobile}</span></div>
        <div className="print-row"><span className="lbl">Email Address</span><span className="val">{deal.client?.email || '—'}</span></div>
        <div className="print-row"><span className="lbl">PAN Number</span><span className="val">{deal.client?.pan || '—'}</span></div>
        <div className="print-row"><span className="lbl">Aadhar Number</span><span className="val">{deal.client?.aadhar || '—'}</span></div>
        <div className="print-row"><span className="lbl">Permanent Address</span><span className="val" style={{ fontSize: '8.5pt', maxWidth: '70%', textAlign: 'right' }}>{deal.client?.address || '—'}</span></div>
      </div>

      {/* ── FINANCIALS ── */}
      <div className="print-section-title">💰 Cost Breakdown & Financial Terms</div>
      <div className="print-grid-2">
        <div className="print-row"><span className="lbl">Deal / Agreement Price</span><span className="val">{fmt(deal.dealAmount)}</span></div>
        <div className="print-row"><span className="lbl">Stamp Duty Charges</span><span className="val">{fmt(deal.stampDuty)}</span></div>
        <div className="print-row"><span className="lbl">GST Amount ({deal.gstRate}%)</span><span className="val">{fmt(deal.gstAmount)}</span></div>
        <div className="print-row"><span className="lbl">Maintenance Deposit</span><span className="val">{fmt(deal.maintenanceDeposit)}</span></div>
        {deal.extraWork > 0 && <div className="print-row"><span className="lbl">Extra Work Charges</span><span className="val">{fmt(deal.extraWork)}</span></div>}
        {deal.otherCharges > 0 && <div className="print-row"><span className="lbl">Other Incidentals</span><span className="val">{fmt(deal.otherCharges)}</span></div>}
      </div>
      
      <div className="print-total-row">
        <span>Total Agreement Value (Sub-Total)</span>
        <span>{fmt(deal.subTotal)}</span>
      </div>

      <div style={{ marginTop: '10px' }} className="print-grid-2">
        <div className="print-row"><span className="lbl">Own Margin (Paid by Client)</span><span className="val">{fmt(deal.ownMargin)}</span></div>
        <div className="print-row"><span className="lbl">Home Loan Component</span><span className="val">{fmt(deal.loanAmount)}</span></div>
        {deal.loanBank && <div className="print-row"><span className="lbl">Loan Arranged Via Bank</span><span className="val">{deal.loanBank}</span></div>}
        {deal.totalCash > 0 && <div className="print-row"><span className="lbl">Cash Payment Term</span><span className="val">{fmt(deal.totalCash)}</span></div>}
      </div>

      {/* ── MARGIN SCHEDULE ── */}
      {marginSchedule.length > 0 && (
        <div className="print-page-break">
          <div className="print-section-title">💳 Own Margin Collection Milestones</div>
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>Sr.</th>
                <th>Milestone / Description</th>
                <th>Due Date</th>
                <th>Required Amount</th>
                <th>Milestone Status</th>
                <th>Received Date</th>
                <th>Received Amount</th>
              </tr>
            </thead>
            <tbody>
              {marginSchedule.map((m, i) => (
                <tr key={m.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{m.description}</td>
                  <td>{fmtDate(m.dueDate)}</td>
                  <td>{fmt(m.amount)}</td>
                  <td>
                    <span className={`badge ${m.status === 'RECEIVED' ? 'badge-green' : m.status === 'PARTIAL' ? 'badge-blue' : 'badge-orange'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td>{fmtDate(m.receivedDate)}</td>
                  <td>{m.receivedAmount ? fmt(m.receivedAmount) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── LOAN SCHEDULE ── */}
      {loanSchedule.length > 0 && (
        <div>
          <div className="print-section-title">🏦 Bank Loan Disbursement Stages</div>
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>Sr.</th>
                <th>Disbursement Stage</th>
                <th>Target Date</th>
                <th>Expected Amount</th>
                <th>Status</th>
                <th>Disbursed Date</th>
                <th>Disbursed Amount</th>
              </tr>
            </thead>
            <tbody>
              {loanSchedule.map((l, i) => (
                <tr key={l.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{l.stageDescription}</td>
                  <td>{fmtDate(l.expectedDate)}</td>
                  <td>{fmt(l.amount)}</td>
                  <td>
                    <span className={`badge ${l.status === 'DISBURSED' ? 'badge-green' : 'badge-orange'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td>{fmtDate(l.disbursedDate)}</td>
                  <td>{l.disbursedAmount ? fmt(l.disbursedAmount) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── CASH SCHEDULE ── */}
      {cashSchedule.length > 0 && (
        <div>
          <div className="print-section-title">💵 Cash Schedule Milestones</div>
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>Sr.</th>
                <th>Description / Milestone</th>
                <th>Due Date</th>
                <th>Required Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {cashSchedule.map((c, i) => (
                <tr key={c.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{c.description}</td>
                  <td>{fmtDate(c.dueDate)}</td>
                  <td>{fmt(c.amount)}</td>
                  <td>
                    <span className={`badge ${c.status === 'RECEIVED' ? 'badge-green' : 'badge-orange'}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── DECLARATION ── */}
      <div style={{ marginTop: '20px', padding: '10px 14px', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '4px', fontSize: '8.5pt', color: '#475569', lineHeight: 1.5 }}>
        <strong>Information Disclaimer:</strong> This document is generated directly from the Property Collection Management System for developer review and confirmation of commercial terms. All milestones, pricing components, and buyer details shown here are subject to physical verification of the builder-buyer agreement and actual bank realization logs.
      </div>

      {/* ── SIGNATURES ── */}
      <div className="print-sign-row">
        <div className="print-sign-box">
          <div style={{ height: '40px' }}></div>
          Buyer Signature<br /><strong style={{ color: '#0f172a' }}>{deal.client?.name}</strong>
        </div>
        <div className="print-sign-box">
          <div style={{ height: '40px' }}></div>
          Developer Group Rep<br /><strong style={{ color: '#0f172a' }}>{deal.project?.developerName}</strong>
        </div>
        <div className="print-sign-box">
          <div style={{ height: '40px' }}></div>
          Verified By (CRM)<br /><strong>Property Collection Team</strong>
        </div>
      </div>
    </div>
  )
}

export default DealPrintView
