import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// --- PDF Helpers ---
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return [r, g, b]
}

function rr(doc, x, y, w, h, r, style) {
  doc.roundedRect(x, y, w, h, r, r, style)
}

// Glass card with shadow
function glassCard(doc, x, y, w, h, radius) {
  const rd = radius || 4
  doc.setFillColor(218, 223, 233)
  rr(doc, x + 0.4, y + 0.4, w, h, rd, 'F')
  doc.setFillColor(255, 255, 255)
  rr(doc, x, y, w, h, rd, 'F')
  doc.setDrawColor(228, 233, 243)
  doc.setLineWidth(0.25)
  rr(doc, x, y, w, h, rd, 'S')
}

// Vector Donut chart via math
function drawDonutChart(doc, cx, cy, radius, innerRadius, items, totalLabel, totalValue) {
  let startAngle = -90 // Start at 12 o'clock
  const ttl = items.reduce((s, it) => s + it.value, 0) || 1
  const PI = Math.PI

  items.forEach(it => {
    if (it.value <= 0) return
    const [r, g, b] = hexToRgb(it.color)
    doc.setFillColor(r, g, b)
    doc.setDrawColor(r, g, b)
    doc.setLineWidth(0.1) // minimal stroke to eliminate anti-alias seams
    
    const sliceAngle = (it.value / ttl) * 360
    const endAngle = startAngle + sliceAngle
    const step = 2
    let lastX = cx + radius * Math.cos(startAngle * PI / 180)
    let lastY = cy + radius * Math.sin(startAngle * PI / 180)
    
    for (let a = startAngle + step; a < endAngle; a += step) {
      let rad = a * PI / 180
      let currX = cx + radius * Math.cos(rad)
      let currY = cy + radius * Math.sin(rad)
      doc.triangle(cx, cy, lastX, lastY, currX, currY, 'FD')
      lastX = currX
      lastY = currY
    }
    // final closure triangle
    let radEnd = endAngle * PI / 180
    doc.triangle(cx, cy, lastX, lastY, cx + radius * Math.cos(radEnd), cy + radius * Math.sin(radEnd), 'FD')
    startAngle = endAngle
  })

  // Inner white circle (donut hole)
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(255, 255, 255)
  doc.circle(cx, cy, innerRadius, 'FD')

  // Core metrics
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  doc.setTextColor(15, 23, 42)
  doc.text(totalLabel, cx, cy - 1, { align: 'center' })
  doc.setFontSize(9)
  doc.text(totalValue, cx, cy + 3.5, { align: 'center' })
}

// Bar chart inside a card
function drawBarChart(doc, x, y, w, h, data) {
  const maxRaw = Math.max(...data.values1.map((v, i) => v + data.values2[i]), 1)
  const order = Math.pow(10, Math.floor(Math.log10(maxRaw)))
  let topTick = Math.ceil(maxRaw / order) * order
  if (topTick < maxRaw * 1.1) topTick += order / 2

  const ySteps = 4
  const axisPad = 15 // Space for Y labels
  const chartX = x + axisPad
  const chartW = w - axisPad

  // Draw grid & Y labels
  doc.setDrawColor(240, 243, 248)
  doc.setLineWidth(0.15)
  doc.setFontSize(5)
  doc.setTextColor(148, 163, 184)
  doc.setFont('helvetica', 'normal')

  for (let i = 0; i <= ySteps; i++) {
    const val = (topTick / ySteps) * i
    const yPos = y + h - (h / ySteps) * i
    doc.text(val.toString(), chartX - 2, yPos + 1.5, { align: 'right' })
    doc.setLineDashPattern(i === 0 ? [] : [1, 1.5], 0)
    doc.line(chartX, yPos, chartX + chartW, yPos)
  }
  doc.setLineDashPattern([], 0)

  const gap = chartW / data.labels.length
  const colW = gap * 0.45
  const blockGap = 0.6 // Gap between stacked bars

  data.labels.forEach((lbl, i) => {
    const v1 = data.values1[i], v2 = data.values2[i]
    const h1 = (v1 / topTick) * h
    const h2 = (v2 / topTick) * h
    const cx = chartX + gap * i + gap / 2 - colW / 2
    
    const items = []
    if (v1 > 0) items.push({ h: h1, color: [34, 197, 94] })
    if (v2 > 0) items.push({ h: h2, color: [239, 68, 68] })
    
    let currentY = y + h
    
    items.forEach((item, idx) => {
      doc.setFillColor(...item.color)
      let itemY = currentY - item.h
      let itemH = item.h
      
      if (idx > 0 && itemH > blockGap) {
        itemH -= blockGap
      }
      
      const isOnly = items.length === 1
      const isBottom = idx === 0
      const isTop = idx === items.length - 1
      
      // Crucial fix: Don't let radius be larger than half the height/width, or jsPDF draws a square.
      const r = Math.min(1.2, colW / 2, itemH / 2)

      if (isOnly) {
         rr(doc, cx, itemY, colW, itemH, r, 'F')
      } else if (isBottom) {
         rr(doc, cx, itemY, colW, itemH, r, 'F')
         doc.rect(cx, itemY, colW, r, 'F') // Square top corners perfectly
      } else if (isTop) {
         rr(doc, cx, itemY, colW, itemH, r, 'F')
         doc.rect(cx, itemY + itemH - r, colW, r, 'F') // Square bottom corners perfectly
      } else {
         doc.rect(cx, itemY, colW, itemH, 'F')
      }
      
      currentY -= item.h
    })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5)
    doc.setTextColor(148, 163, 184)
    doc.text(lbl, cx + colW / 2, y + h + 4, { align: 'center' })
  })

  // Top-Right Legend
  doc.setFontSize(5)
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  const lgY = y - 3
  doc.setFillColor(34, 197, 94); doc.rect(x + w - 45, lgY - 2, 2, 2, 'F')
  doc.text('Recaudado (Filtrado)', x + w - 41, lgY)
  doc.setFillColor(239, 68, 68); doc.rect(x + w - 20, lgY - 2, 2, 2, 'F')
  doc.text('Pendiente (Filtrado)', x + w - 16, lgY)
}

/**
 * Generates the glassmorphism financial report PDF.
 * @param {Object} reportData - Extracted presentation data
 */
export async function generateFinancialReportPDF(reportData) {
  const {
    branding, startDate, endDate, todayDate, filtersString,
    totalCharges, totalPaid, totalPending, collectionRate,
    trendData, distributionItems, tableData,
    formatCurrency
  } = reportData

  const doc = new jsPDF()
  const W = doc.internal.pageSize.width
  const H = doc.internal.pageSize.height
  
  const now = new Date()
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateTimeStamp = `${todayDate} ${timeStr}`
  const b = branding
  const primary = b.colorPrimario || '#1e293b'
  const [pr, pg, pb] = hexToRgb(primary)
  const mx = 10
  const cw = W - mx * 2
  const cp = 5

  // Page background
  doc.setFillColor(243, 245, 249)
  doc.rect(0, 0, W, H, 'F')

  // ── HEADER CARD ──
  const hH = 26
  doc.setFillColor(pr, pg, pb)
  rr(doc, mx, mx, cw, hH, 5, 'F')

  if (b.logo) {
    try {
      doc.setFillColor(255, 255, 255)
      rr(doc, mx + 4, mx + 3, 20, 20, 3, 'F')
      doc.addImage(b.logo, 'PNG', mx + 5.5, mx + 4.5, 17, 17)
      doc.setDrawColor(255, 255, 255); doc.setLineWidth(1.2)
      rr(doc, mx + 4, mx + 3, 20, 20, 3, 'S')
    } catch(e) {}
  }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(255,255,255)
  doc.text(b.nombre || 'Institución Deportiva', mx + 28, mx + 11)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(255,255,255)
  doc.text('Reporte de Inteligencia Financiera', mx + 28, mx + 17)
  doc.setFontSize(5.5)
  doc.setFontSize(6)
  doc.text(`Período: ${startDate}  /  ${endDate}`, W - mx - 4, mx + 10, { align: 'right' })
  doc.setFontSize(4.5)
  doc.text(`Generado: ${dateTimeStamp}`, W - mx - 4, mx + 15, { align: 'right' })

  // ── KPI CARDS ──
  const ky = mx + hH + 4
  const kg = 3
  const kw = (cw - kg * 3) / 4
  const kh = 22
  const kpis = [
    { label: 'TOTAL LIBROS', value: formatCurrency(totalCharges), sub: 'Cargos generados', color: '#6366f1' },
    { label: 'RECAUDADO', value: formatCurrency(totalPaid), sub: 'Ingresos en caja', color: '#22c55e' },
    { label: 'PENDIENTE', value: formatCurrency(totalPending), sub: 'Cartera activa', color: '#f59e0b' },
    { label: 'EFICACIA', value: `${collectionRate}%`, sub: 'Tasa de cobro', color: '#06b6d4' }
  ]
  kpis.forEach((k, i) => {
    const kx = mx + (kw + kg) * i
    const [cr, cg, cb] = hexToRgb(k.color)
    
    // 1. Shadow
    doc.setFillColor(218, 223, 233)
    rr(doc, kx + 0.4, ky + 0.4, kw, kh, 4, 'F')
    
    // 2. Base Colored Card (acts as perfect left rounded accent edge)
    doc.setFillColor(cr, cg, cb)
    rr(doc, kx, ky, kw, kh, 4, 'F')
    
    // 3. White Area offset (exposing left accent)
    const ax = 2.5 // accent width
    doc.setFillColor(255, 255, 255)
    rr(doc, kx + ax, ky, kw - ax, kh, 4, 'F')
    doc.rect(kx + ax, ky, 4, kh, 'F') // Square off white card's exposed left curves
    
    // 4. Border Frame
    doc.setDrawColor(228, 233, 243)
    doc.setLineWidth(0.25)
    rr(doc, kx, ky, kw, kh, 4, 'S')
    doc.setFont('helvetica', 'normal'); doc.setFontSize(5); doc.setTextColor(148,163,184)
    doc.text(k.label, kx + cp + 1, ky + 5)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(15,23,42)
    doc.text(k.value, kx + cp + 1, ky + 13)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(4.5); doc.setTextColor(170,180,195)
    doc.text(k.sub, kx + cp + 1, ky + 18)
  })

  // ── CHART CARDS ROW ──
  const cy = ky + kh + 4
  const cg2 = 3
  const clw = cw * 0.62
  const crw = cw - clw - cg2
  const ch = 56

  // Left: Bar chart card
  glassCard(doc, mx, cy, clw, ch, 4)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(15,23,42)
  doc.text('Tendencia de Ingresos', mx + cp, cy + 7)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(5); doc.setTextColor(148,163,184)
  doc.text('Últimos 6 meses: Recaudado vs Pendiente', mx + cp, cy + 12)
  drawBarChart(doc, mx + cp + 2, cy + 17, clw - cp * 2 - 4, 30, trendData)

  // Right: Distribution card
  const rx = mx + clw + cg2
  glassCard(doc, rx, cy, crw, ch, 4)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(15,23,42)
  doc.text('Estado de Cartera', rx + cp, cy + 7)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(5); doc.setTextColor(148,163,184)
  doc.text('Distribución de saldos acumulados', rx + cp, cy + 12)

  // Donut render
  const dItems = distributionItems
  const donutCy = cy + 30
  const donutCx = rx + crw / 2
  drawDonutChart(doc, donutCx, donutCy, 14, 10, dItems, 'TOTAL CARTERA', formatCurrency(totalCharges))

  // Distribution legend (bottom)
  const activeD = dItems.filter(d => d.value > 0)
  const legW = activeD.length * 20
  let lx = donutCx - legW / 2 + 3
  const ly = cy + ch - 5
  activeD.forEach(d => {
    const [cr2, cg3, cb2] = hexToRgb(d.color)
    doc.setFillColor(cr2, cg3, cb2); rr(doc, lx, ly, 2.5, 2.5, 0.5, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(15,23,42)
    doc.text(d.label, lx + 4, ly + 2)
    lx += 20
  })

  // ── TABLE CARD ──
  const ty = cy + ch + 4
  const tableCardH = H - ty - mx - 8
  glassCard(doc, mx, ty, cw, tableCardH, 4)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(15,23,42)
  doc.text('Detalle Contable', mx + cp, ty + 7)

  autoTable(doc, {
    startY: ty + 11,
    head: [['PROCEDENCIA', 'CUENTA', 'RECAUDADO', 'POR COBRAR']],
    body: tableData,
    theme: 'plain',
    headStyles: { fillColor: [249,250,252], textColor: [148,163,184], fontStyle: 'bold', fontSize: 5.5, cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 } },
    bodyStyles: { fontSize: 7, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }, textColor: [71,85,105] },
    styles: { font: 'helvetica', lineWidth: 0, lineColor: [240,243,248] },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [15,23,42] },
      2: { halign: 'right', fontStyle: 'bold', textColor: [34,197,94] },
      3: { halign: 'right', textColor: [239,68,68] }
    },
    didParseCell: (data) => {
      if (data.section === 'body') { data.cell.styles.lineWidth = { bottom: 0.2 }; data.cell.styles.lineColor = [240,243,248] }
      if (data.section === 'head') { data.cell.styles.lineWidth = { bottom: 0.3 }; data.cell.styles.lineColor = [226,232,240] }
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        doc.setFillColor(243, 245, 249); doc.rect(0, 0, W, H, 'F')
        glassCard(doc, mx, mx, cw, H - mx * 2 - 8, 4)
      }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(4.5); doc.setTextColor(180,190,205)
      doc.text(`${filtersString}  ·  Generado: ${dateTimeStamp}`, mx, H - 5, { maxWidth: cw - 20 })
      doc.setFont('helvetica', 'bold'); doc.setFontSize(5); doc.setTextColor(pr,pg,pb)
      doc.text(`${data.pageNumber}`, W - mx, H - 5, { align: 'right' })
    },
    margin: { left: mx + 4, right: mx + 4, bottom: mx + 10 }
  })
  
  return doc.output('blob')
}
