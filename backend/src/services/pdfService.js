const PDFDocument = require('pdfkit');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatINR = (amount) => {
  if (amount === null || amount === undefined) return '—';
  const num = parseFloat(amount);
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const formatCash = (amount) => {
  if (amount === null || amount === undefined) return '—';
  const num = Math.round(parseFloat(amount));
  return `${num}=00`;
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const drawHeader = (doc, title, subtitle) => {
  doc.rect(0, 0, doc.page.width, 80).fill('#0f1629');
  doc.fillColor('#4f8ef7').fontSize(18).font('Helvetica-Bold').text('Property Collection Management System', 40, 20);
  doc.fillColor('#ffffff').fontSize(13).font('Helvetica-Bold').text(title, 40, 42);
  if (subtitle) doc.fillColor('#8892b0').fontSize(10).font('Helvetica').text(subtitle, 40, 60);
  doc.fillColor('#000000');
  doc.moveDown(5);
};

const drawTableHeader = (doc, columns, y) => {
  doc.rect(40, y, doc.page.width - 80, 24).fill('#1a2340');
  doc.fillColor('#4f8ef7').fontSize(9).font('Helvetica-Bold');
  let x = 45;
  columns.forEach(col => {
    doc.text(col.label, x, y + 7, { width: col.width, align: col.align || 'left' });
    x += col.width;
  });
  doc.fillColor('#000000');
  return y + 24;
};

const drawTableRow = (doc, columns, values, y, isEven) => {
  if (isEven) doc.rect(40, y, doc.page.width - 80, 22).fill('#f8f9ff');
  doc.fillColor('#1a2340').fontSize(9).font('Helvetica');
  let x = 45;
  columns.forEach((col, i) => {
    doc.text(String(values[i] ?? '—'), x, y + 6, { width: col.width, align: col.align || 'left' });
    x += col.width;
  });
  doc.fillColor('#000000');
  return y + 22;
};

const drawFooter = (doc) => {
  const y = doc.page.height - 40;
  doc.rect(0, y - 10, doc.page.width, 50).fill('#f0f4ff');
  doc.fillColor('#8892b0').fontSize(8).font('Helvetica')
    .text(`Generated on: ${new Date().toLocaleString('en-IN')}   |   Property Collection Management System   |   Confidential`, 40, y, { align: 'center' });
};

// ─── Report Generators ────────────────────────────────────────────────────────

const generateMonthlyProjectionPDF = (data, month, year, projectName) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const monthName = new Date(year, month - 1, 1).toLocaleString('en-IN', { month: 'long' });
    drawHeader(doc, `Monthly Projection Report — ${monthName} ${year}`, `Project: ${projectName}`);

    const columns = [
      { label: 'Unit', width: 60 },
      { label: 'Client Name', width: 120 },
      { label: 'Payment Type', width: 110 },
      { label: 'Due Date', width: 80 },
      { label: 'Expected Amount', width: 100, align: 'right' },
      { label: 'Category', width: 70 }
    ];

    let y = 110;
    y = drawTableHeader(doc, columns, y);

    data.forEach((row, i) => {
      if (y > doc.page.height - 80) { doc.addPage(); y = 50; y = drawTableHeader(doc, columns, y); }
      y = drawTableRow(doc, columns, [
        row.unitNumber, row.clientName, row.paymentType,
        formatDate(row.dueDate),
        row.isCash ? formatCash(row.expectedAmount) : formatINR(row.expectedAmount),
        row.category
      ], y, i % 2 === 0);
    });

    // Totals
    const bankingTotal = data.filter(r => !r.isCash).reduce((s, r) => s + parseFloat(r.expectedAmount || 0), 0);
    const cashTotal = data.filter(r => r.isCash).reduce((s, r) => s + parseFloat(r.expectedAmount || 0), 0);
    y += 10;
    doc.rect(40, y, doc.page.width - 80, 30).fill('#e8f0fe');
    doc.fillColor('#1a2340').fontSize(10).font('Helvetica-Bold')
      .text(`Total Banking: ${formatINR(bankingTotal)}`, 45, y + 8)
      .text(`Total Cash: ${formatCash(cashTotal)}`, 280, y + 8);

    drawFooter(doc);
    doc.end();
  });
};

const generateMonthEndAchievementPDF = (data, month, year, projectName) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const monthName = new Date(year, month - 1, 1).toLocaleString('en-IN', { month: 'long' });
    drawHeader(doc, `Month-End Achievement Report — ${monthName} ${year}`, `Project: ${projectName}`);

    let y = 110;
    const metrics = [
      ['Total Expected (Banking)', formatINR(data.totalExpected)],
      ['Total Expected (Cash)', formatCash(data.totalExpectedCash)],
      ['Total Received (Banking)', formatINR(data.totalReceived)],
      ['Total Received (Cash)', formatCash(data.totalReceivedCash)],
      ['Pending / Overdue', formatINR(data.pending)],
      ['Collection Achievement', `${data.collectionPct}%`]
    ];

    metrics.forEach(([label, value], i) => {
      doc.rect(40, y, doc.page.width - 80, 32).fill(i % 2 === 0 ? '#f8f9ff' : '#ffffff');
      doc.fillColor('#1a2340').fontSize(11).font('Helvetica-Bold').text(label, 55, y + 9);
      doc.fillColor('#4f8ef7').fontSize(12).font('Helvetica-Bold').text(value, 350, y + 9, { align: 'right', width: 180 });
      y += 32;
    });

    // Pending items
    if (data.pendingItems?.length) {
      y += 20;
      doc.fillColor('#1a2340').fontSize(11).font('Helvetica-Bold').text('Pending Items:', 40, y);
      y += 20;
      const cols = [{ label: 'Unit', width: 70 }, { label: 'Client', width: 130 }, { label: 'Description', width: 160 }, { label: 'Amount', width: 100, align: 'right' }];
      y = drawTableHeader(doc, cols, y);
      data.pendingItems.forEach((item, i) => {
        if (y > doc.page.height - 80) { doc.addPage(); y = 50; }
        y = drawTableRow(doc, cols, [item.unitNumber, item.clientName, item.description, formatINR(item.amount)], y, i % 2 === 0);
      });
    }

    drawFooter(doc);
    doc.end();
  });
};

const generateUnitWiseStatusPDF = (data, projectName) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawHeader(doc, 'Unit-Wise Complete Status Report', `Project: ${projectName}`);

    const columns = [
      { label: 'Unit', width: 60 }, { label: 'Client', width: 110 },
      { label: 'Deal Value', width: 90, align: 'right' }, { label: 'Collected', width: 90, align: 'right' },
      { label: 'Balance', width: 90, align: 'right' }, { label: 'Next Due', width: 80 },
      { label: 'Next Amount', width: 85, align: 'right' }, { label: 'Registry', width: 75 }
    ];

    let y = 110;
    y = drawTableHeader(doc, columns, y);

    data.forEach((row, i) => {
      if (y > doc.page.height - 80) { doc.addPage(); y = 50; y = drawTableHeader(doc, columns, y); }
      y = drawTableRow(doc, columns, [
        row.unitNumber, row.clientName,
        formatINR(row.totalDealValue), formatINR(row.totalCollected),
        formatINR(row.balance), formatDate(row.nextDueDate),
        row.nextDueAmount ? formatINR(row.nextDueAmount) : '—',
        row.registryStatus
      ], y, i % 2 === 0);
    });

    drawFooter(doc);
    doc.end();
  });
};

const generateExtraWorkPDF = (data, projectName) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawHeader(doc, 'Extra Work — Projection vs Actual', `Project: ${projectName}`);

    const columns = [
      { label: 'Unit', width: 80 }, { label: 'Client', width: 130 },
      { label: 'Committed (=)', width: 110, align: 'right' },
      { label: 'Received (=)', width: 110, align: 'right' },
      { label: 'Balance (=)', width: 110, align: 'right' }
    ];

    let y = 110;
    y = drawTableHeader(doc, columns, y);

    data.forEach((row, i) => {
      if (y > doc.page.height - 80) { doc.addPage(); y = 50; y = drawTableHeader(doc, columns, y); }
      y = drawTableRow(doc, columns, [
        row.unitNumber, row.clientName,
        formatCash(row.cashCommitted), formatCash(row.cashReceived), formatCash(row.balance)
      ], y, i % 2 === 0);
    });

    // Summary row
    const totalCommitted = data.reduce((s, r) => s + parseFloat(r.cashCommitted || 0), 0);
    const totalReceived = data.reduce((s, r) => s + parseFloat(r.cashReceived || 0), 0);
    const totalBalance = data.reduce((s, r) => s + parseFloat(r.balance || 0), 0);
    y += 10;
    doc.rect(40, y, doc.page.width - 80, 28).fill('#e8f0fe');
    doc.fillColor('#1a2340').fontSize(10).font('Helvetica-Bold')
      .text('TOTAL', 45, y + 8)
      .text(formatCash(totalCommitted), 210, y + 8, { width: 110, align: 'right' })
      .text(formatCash(totalReceived), 320, y + 8, { width: 110, align: 'right' })
      .text(formatCash(totalBalance), 430, y + 8, { width: 110, align: 'right' });

    drawFooter(doc);
    doc.end();
  });
};

module.exports = { generateMonthlyProjectionPDF, generateMonthEndAchievementPDF, generateUnitWiseStatusPDF, generateExtraWorkPDF };
