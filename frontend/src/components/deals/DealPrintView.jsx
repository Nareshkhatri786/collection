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
        @media print {
          body * { visibility: hidden !important; }
          #deal-print-area, #deal-print-area * { visibility: visible !important; }
          #deal-print-area {
            display: block !important;
            position: fixed !important;
            top: 0; left: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            font-family: 'Arial', sans-serif;
            font-size: 11pt;
            padding: 24px 32px;
            box-sizing: border-box;
          }
          .print-page-break { page-break-before: always; }
          .no-print { display: none !important; }
        }

        #deal-print-area {
          font-family: 'Arial', sans-serif;
          font-size: 11pt;
          color: #111;
          line-height: 1.5;
        }
        #deal-print-area .print-header {
          text-align: center;
          border-bottom: 3px double #333;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        #deal-print-area .print-header h1 {
          font-size: 20pt;
          font-weight: 900;
          margin: 0 0 2px;
          letter-spacing: 1px;
        }
        #deal-print-area .print-header p {
          margin: 2px 0;
          font-size: 10pt;
          color: #555;
        }
        #deal-print-area .print-title {
          text-align: center;
          font-size: 14pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          border: 2px solid #333;
          padding: 8px;
          margin: 16px 0;
          background: #f5f5f5;
        }
        #deal-print-area .print-section-title {
          font-size: 11pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 1.5px solid #333;
          padding-bottom: 4px;
          margin: 18px 0 10px;
        }
        #deal-print-area .print-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px 24px;
        }
        #deal-print-area .print-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px dotted #ccc;
          padding: 3px 0;
        }
        #deal-print-area .print-row .lbl { color: #555; font-size: 10pt; }
        #deal-print-area .print-row .val { font-weight: 600; font-size: 10pt; }
        #deal-print-area .print-total-row {
          display: flex;
          justify-content: space-between;
          border-top: 2px solid #333;
          border-bottom: 2px solid #333;
          padding: 6px 0;
          margin-top: 6px;
          font-size: 12pt;
          font-weight: 800;
        }
        #deal-print-area table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9.5pt;
          margin-top: 6px;
        }
        #deal-print-area table th {
          background: #eee;
          border: 1px solid #ccc;
          padding: 5px 8px;
          text-align: left;
          font-weight: 700;
        }
        #deal-print-area table td {
          border: 1px solid #ddd;
          padding: 4px 8px;
        }
        #deal-print-area table tr:nth-child(even) td { background: #fafafa; }
        #deal-print-area .print-sign-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          margin-top: 40px;
          text-align: center;
        }
        #deal-print-area .print-sign-box {
          border-top: 1.5px solid #333;
          padding-top: 6px;
          font-size: 9.5pt;
          color: #555;
        }
        #deal-print-area .badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 3px;
          font-size: 9pt;
          font-weight: 700;
        }
        #deal-print-area .badge-green { background: #d4edda; color: #155724; }
        #deal-print-area .badge-blue  { background: #d1ecf1; color: #0c5460; }
        #deal-print-area .badge-orange{ background: #fff3cd; color: #856404; }
      `}</style>

      {/* ── HEADER ── */}
      <div className="print-header">
        <h1>Property Collection</h1>
        <p>Management System — Official Booking Record</p>
        <p style={{ fontSize: '9pt' }}>Printed on: {today}</p>
      </div>

      <div className="print-title">Booking Acknowledgement / Deal Summary</div>

      {/* ── DEAL REFERENCE ── */}
      <div className="print-grid-2">
        <div className="print-row"><span className="lbl">Booking ID</span><span className="val">#{deal.id}</span></div>
        <div className="print-row"><span className="lbl">Registry Status</span>
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
      <div className="print-section-title">🏢 Project & Unit Details</div>
      <div className="print-grid-2">
        <div className="print-row"><span className="lbl">Project Name</span><span className="val">{deal.project?.name}</span></div>
        <div className="print-row"><span className="lbl">Developer</span><span className="val">{deal.project?.developerName}</span></div>
        <div className="print-row"><span className="lbl">Location</span><span className="val">{deal.project?.location}</span></div>
        <div className="print-row"><span className="lbl">Unit Number</span><span className="val">{deal.unit?.unitNumber}</span></div>
        <div className="print-row"><span className="lbl">Unit Type</span><span className="val">{deal.unit?.unitType?.typeName || '—'}</span></div>
        <div className="print-row"><span className="lbl">Floor</span><span className="val">{deal.unit?.floor ?? '—'}</span></div>
        {deal.unit?.carpetArea && (
          <div className="print-row"><span className="lbl">Area (Sq Yards)</span><span className="val">{deal.unit.carpetArea} Sq Yd</span></div>
        )}
      </div>

      {/* ── CLIENT ── */}
      <div className="print-section-title">👤 Client Details</div>
      <div className="print-grid-2">
        <div className="print-row"><span className="lbl">Full Name</span><span className="val">{deal.client?.name}</span></div>
        <div className="print-row"><span className="lbl">Mobile</span><span className="val">{deal.client?.mobile}</span></div>
        <div className="print-row"><span className="lbl">Email</span><span className="val">{deal.client?.email || '—'}</span></div>
        <div className="print-row"><span className="lbl">PAN Number</span><span className="val">{deal.client?.pan || '—'}</span></div>
        <div className="print-row"><span className="lbl">Aadhar</span><span className="val">{deal.client?.aadhar || '—'}</span></div>
        <div className="print-row"><span className="lbl">Address</span><span className="val">{deal.client?.address || '—'}</span></div>
      </div>

      {/* ── FINANCIALS ── */}
      <div className="print-section-title">💰 Financial Summary</div>
      <div className="print-grid-2">
        <div className="print-row"><span className="lbl">Deal / Agreement Amount</span><span className="val">{fmt(deal.dealAmount)}</span></div>
        <div className="print-row"><span className="lbl">Stamp Duty</span><span className="val">{fmt(deal.stampDuty)}</span></div>
        <div className="print-row"><span className="lbl">GST ({deal.gstRate}%)</span><span className="val">{fmt(deal.gstAmount)}</span></div>
        <div className="print-row"><span className="lbl">Maintenance Deposit</span><span className="val">{fmt(deal.maintenanceDeposit)}</span></div>
        {deal.extraWork > 0 && <div className="print-row"><span className="lbl">Extra Work</span><span className="val">{fmt(deal.extraWork)}</span></div>}
        {deal.otherCharges > 0 && <div className="print-row"><span className="lbl">Other Charges</span><span className="val">{fmt(deal.otherCharges)}</span></div>}
      </div>
      <div className="print-total-row">
        <span>TOTAL AGREEMENT VALUE (Sub-Total)</span>
        <span>{fmt(deal.subTotal)}</span>
      </div>
      <div style={{ marginTop: '10px' }} className="print-grid-2">
        <div className="print-row"><span className="lbl">Own Margin (Client Payment)</span><span className="val">{fmt(deal.ownMargin)}</span></div>
        <div className="print-row"><span className="lbl">Home Loan Amount</span><span className="val">{fmt(deal.loanAmount)}</span></div>
        {deal.loanBank && <div className="print-row"><span className="lbl">Loan Bank</span><span className="val">{deal.loanBank}</span></div>}
        {deal.totalCash > 0 && <div className="print-row"><span className="lbl">Cash Amount</span><span className="val">{fmt(deal.totalCash)}</span></div>}
      </div>

      {/* ── COLLECTION SUMMARY ── */}
      {summary && (
        <>
          <div className="print-section-title">📊 Collection Status</div>
          <div className="print-grid-2">
            <div className="print-row"><span className="lbl">Total Received (Own Margin)</span><span className="val">{fmt(summary.totalMarginReceived)}</span></div>
            <div className="print-row"><span className="lbl">Outstanding Margin</span><span className="val">{fmt(summary.marginOutstanding)}</span></div>
            <div className="print-row"><span className="lbl">Loan Disbursed</span><span className="val">{fmt(summary.totalLoanDisbursed)}</span></div>
            <div className="print-row"><span className="lbl">Loan Outstanding</span><span className="val">{fmt(summary.loanOutstanding)}</span></div>
          </div>
        </>
      )}

      {/* ── MARGIN SCHEDULE ── */}
      {marginSchedule.length > 0 && (
        <>
          <div className="print-section-title print-page-break">💳 Own Margin Payment Schedule</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Received Date</th>
                <th>Received Amount</th>
              </tr>
            </thead>
            <tbody>
              {marginSchedule.map((m, i) => (
                <tr key={m.id}>
                  <td>{i + 1}</td>
                  <td>{m.description}</td>
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
        </>
      )}

      {/* ── LOAN SCHEDULE ── */}
      {loanSchedule.length > 0 && (
        <>
          <div className="print-section-title">🏦 Home Loan Disbursement Schedule</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Stage</th>
                <th>Expected Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Disbursed Date</th>
                <th>Disbursed Amount</th>
              </tr>
            </thead>
            <tbody>
              {loanSchedule.map((l, i) => (
                <tr key={l.id}>
                  <td>{i + 1}</td>
                  <td>{l.stageDescription}</td>
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
        </>
      )}

      {/* ── CASH SCHEDULE ── */}
      {cashSchedule.length > 0 && (
        <>
          <div className="print-section-title">💵 Cash Schedule</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {cashSchedule.map((c, i) => (
                <tr key={c.id}>
                  <td>{i + 1}</td>
                  <td>{c.description}</td>
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
        </>
      )}

      {/* ── DECLARATION ── */}
      <div style={{ marginTop: '30px', padding: '12px', border: '1px solid #ccc', background: '#f9f9f9', fontSize: '9.5pt', color: '#555' }}>
        <strong>Declaration:</strong> This document is a computer-generated booking summary for internal records only. 
        The figures mentioned above are as entered in the Property Collection Management System. 
        This is not a legal sale agreement. For legal purposes, please refer to the registered sale deed / agreement.
      </div>

      {/* ── SIGNATURES ── */}
      <div className="print-sign-row">
        <div className="print-sign-box">
          <div style={{ height: '50px' }}></div>
          Client Signature<br /><strong>{deal.client?.name}</strong>
        </div>
        <div className="print-sign-box">
          <div style={{ height: '50px' }}></div>
          Developer / Builder<br /><strong>{deal.project?.developerName}</strong>
        </div>
        <div className="print-sign-box">
          <div style={{ height: '50px' }}></div>
          Authorized Signatory<br /><strong>Property Collection CRM</strong>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '9pt', color: '#999', borderTop: '1px solid #eee', paddingTop: '10px' }}>
        Printed from Property Collection Management System — {today} | Booking ID: #{deal.id}
      </div>
    </div>
  )
}

export default DealPrintView
