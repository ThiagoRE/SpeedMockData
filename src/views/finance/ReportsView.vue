<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { useConfigStore } from '@/stores/config'
import { useEnrollmentsStore } from '@/stores/enrollments'
import { mockUsers, mockSedes, mockCategories } from '@/data/mockData'
import VueApexCharts from 'vue3-apexcharts'
import Swal from 'sweetalert2'
import ExcelJS from 'exceljs'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { generateFinancialReportPDF } from '@/utils/pdfLayouts'

const finance = useFinanceStore()
const configStore = useConfigStore()
const enrollmentsStore = useEnrollmentsStore()
const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)

// --- Filter States ---
const isFiltersOpen = ref(false)
const today = new Date()
const lastMonth = new Date()
lastMonth.setMonth(today.getMonth() - 1)

const filterDocs = ref({
  startDate: lastMonth.toISOString().split('T')[0],
  endDate: today.toISOString().split('T')[0],
  deportistaId: null,
  sedes: [],
  categorias: [],
  tiposDocumento: ['matricula', 'mensualidad', 'producto', 'torneo', 'multa', 'pago', 'beca']
})

// Validation for max 1 month range
watch([() => filterDocs.value.startDate, () => filterDocs.value.endDate], ([newStart, newEnd]) => {
  const start = new Date(newStart)
  const end = new Date(newEnd)

  // Diff in days
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays > 31) {
    Swal.fire({
      icon: 'warning',
      title: 'Rango excedido',
      text: 'El rango máximo de generación es de un mes. Se ajustará automáticamente.',
      timer: 2000,
      showConfirmButton: false
    })

    // Adjust start to be 1 month before end
    const adjStart = new Date(end)
    adjStart.setMonth(end.getMonth() - 1)
    filterDocs.value.startDate = adjStart.toISOString().split('T')[0]
  }
})

const athleteSearchDoc = ref('')
const selectedAthlete = computed(() => {
  if (!filterDocs.value.deportistaId) return null
  return mockUsers.find(u => u.id === filterDocs.value.deportistaId)
})

function searchAthlete() {
  const doc = athleteSearchDoc.value.trim()
  if (!doc) {
    filterDocs.value.deportistaId = null
    return
  }
  const found = mockUsers.find(u => u.documentNumber === doc || u.document === doc)
  if (found) {
    filterDocs.value.deportistaId = found.id
  } else {
    filterDocs.value.deportistaId = null
    Swal.fire({
      icon: 'error',
      title: 'No encontrado',
      text: 'No se encontró ningún deportista con ese documento.',
      timer: 2000,
      showConfirmButton: false
    })
  }
}

function clearAthleteFilter() {
  filterDocs.value.deportistaId = null
  athleteSearchDoc.value = ''
}

const deportistasDropdown = computed(() => mockUsers.filter(u => u.role === 'deportista'))
const sedesDropdown = mockSedes
const categoriasDropdown = mockCategories

// Concept checks
const hasType = (t) => filterDocs.value.tiposDocumento.includes(t)
const toggleType = (t) => {
  const i = filterDocs.value.tiposDocumento.indexOf(t)
  if (i > -1) filterDocs.value.tiposDocumento.splice(i, 1)
  else filterDocs.value.tiposDocumento.push(t)
}

function toggleArrayFilter(field, id) {
  const arr = filterDocs.value[field]
  const i = arr.indexOf(id)
  if (i > -1) arr.splice(i, 1)
  else arr.push(id)
}

function matchesFilters(d) {
  // Date check
  if (d.fecha < filterDocs.value.startDate || d.fecha > filterDocs.value.endDate) return false

  // Type check
  if (!filterDocs.value.tiposDocumento.includes(d.tipoDocumento)) return false

  // Deportista check
  if (filterDocs.value.deportistaId && d.deportistaId !== filterDocs.value.deportistaId) return false

  // Determine Sede and Categoria
  let dSedeId = null
  let dCategoryId = null

  const user = mockUsers.find(u => u.id === d.deportistaId)
  if (user) dCategoryId = user.categoryId

  if (d.matriculaId) {
    const matricula = enrollmentsStore.matriculas.find(m => m.id === d.matriculaId)
    if (matricula) dSedeId = matricula.sedeId
  } else if (user) {
    // try to get active enrollment
    const enrollment = enrollmentsStore.getActiva(user.id)
    if (enrollment) dSedeId = enrollment.sedeId
  }

  // Sede check
  if (filterDocs.value.sedes.length > 0 && !filterDocs.value.sedes.includes(dSedeId)) return false

  // Categoria check
  if (filterDocs.value.categorias.length > 0 && !filterDocs.value.categorias.includes(dCategoryId)) return false

  return true
}

const filteredCreditos = computed(() => {
  return finance.documentos.filter(d => d.naturaleza === 'credito' && matchesFilters(d))
})

const filteredDebitos = computed(() => {
  return finance.documentos.filter(d => d.naturaleza === 'debito' && matchesFilters(d))
})

function buildFiltersString() {
  const parts = []
  parts.push(`Desde: ${filterDocs.value.startDate}`)
  parts.push(`Hasta: ${filterDocs.value.endDate}`)
  if (selectedAthlete.value) parts.push(`Deportista: ${selectedAthlete.value.name}`)
  if (filterDocs.value.sedes.length) parts.push(`Sedes: ${filterDocs.value.sedes.length}`)
  if (filterDocs.value.categorias.length) parts.push(`Categorías: ${filterDocs.value.categorias.length}`)
  return parts.join(' | ')
}

async function generatePDFBlob() {
  const pending = filteredCreditos.value.filter(c => c.estado === 'pendiente' || c.estado === 'parcial').reduce((s, c) => s + c.saldo, 0)
  const vencido = filteredCreditos.value.filter(c => c.estado === 'vencido').reduce((s, c) => s + c.saldo, 0)

  const reportData = {
    branding: configStore.branding,
    startDate: filterDocs.value.startDate,
    endDate: filterDocs.value.endDate,
    todayDate: new Date().toLocaleDateString('es-CO'),
    filtersString: buildFiltersString(),
    totalCharges: totalCharges.value,
    totalPaid: totalPaid.value,
    totalPending: totalPending.value,
    collectionRate: collectionRate.value,
    trendData: {
      labels: ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'],
      values1: [1420000, 1580000, 1350000, 1890000, 1720000, totalPaid.value],
      values2: [80000, 120000, 90000, 150000, 210000, totalPending.value]
    },
    distributionItems: [
      { label: 'Recaudado', value: totalPaid.value, color: '#22c55e' },
      { label: 'Pendiente', value: pending, color: '#facc15' },
      { label: 'Vencido', value: vencido, color: '#ef4444' }
    ],
    tableData: doubleEntryTable.value.map(e => [
      e.origin.toUpperCase(), e.account, formatCurrency(e.paid), formatCurrency(e.pending)
    ]),
    formatCurrency
  }
  return await generateFinancialReportPDF(reportData)
}

const reportData = ref({
  resumen: { total_cargos: 0, total_pagado: 0, total_pendiente: 0, tasa_recaudo: 0 },
  beneficios: { total_becas: 0, total_descuentos: 0 },
  detallado_cargos: [],
  distribucion_cartera: [],
  tendencia_6_meses: []
})

async function applyFilters() {
  try {
    const res = await finance.fetchInteligenciaFinanciera({
      fechaInicio: filterDocs.value.startDate,
      fechaFin: filterDocs.value.endDate,
      documentoDeportista: selectedAthlete.value?.documentNumber,
      sedes: filterDocs.value.sedes,
      categorias: filterDocs.value.categorias,
      tiposDocumento: filterDocs.value.tiposDocumento
    })
    if (res.success) {
      reportData.value = res.data
    }
  } catch (err) {
    Swal.fire('Error', 'No se pudieron cargar los datos del reporte', 'error')
  }
}

// Watchers for automatic update
watch(filterDocs, () => applyFilters(), { deep: true })
onMounted(() => applyFilters())

const totalCharges = computed(() => reportData.value.resumen?.total_cargos || 0)
const totalPaid = computed(() => reportData.value.resumen?.total_pagado || 0)
const totalPending = computed(() => reportData.value.resumen?.total_pendiente || 0)
const collectionRate = computed(() => reportData.value.resumen?.tasa_recaudo || 0)

// Charts Logic
const revenueTrendChart = computed(() => {
  const trend = reportData.value.tendencia_6_meses || []
  return {
    series: [
      { name: 'Cargos', data: trend.map(t => t.total_cargos) },
      { name: 'Recaudado', data: trend.map(t => t.total_pagado) }
    ],
    options: {
      chart: { type: 'bar', stacked: false, toolbar: { show: false }, background: 'transparent', fontFamily: 'Inter, Helvetica, Arial, sans-serif' },
      colors: ['#3b82f6', '#22c55e'],
      plotOptions: { bar: { borderRadius: 6, columnWidth: '50%' } },
      dataLabels: { enabled: false },
      legend: { position: 'top', horizontalAlign: 'right', fontWeight: 900, fontSize: '10px' },
      xaxis: {
        categories: trend.map(t => t.mes),
        axisBorder: { show: false },
        labels: { style: { fontWeight: 700, colors: '#94a3b8' } }
      },
      yaxis: { labels: { formatter: (v) => formatCurrency(v), style: { colors: '#94a3b8' } } },
      grid: { borderColor: '#e2e8f0', strokeDashArray: 4 },
      tooltip: { theme: 'dark', y: { formatter: (v) => formatCurrency(v) } }
    }
  }
})

const portfolioCompositionChart = computed(() => {
  const dist = reportData.value.distribucion_cartera || []
  return {
    series: dist.map(d => d.monto),
    options: {
      chart: { type: 'donut', background: 'transparent' },
      labels: dist.map(d => d.estado),
      colors: ['#22c55e', '#facc15', '#ef4444', '#94a3b8'],
      stroke: { show: false },
      legend: { position: 'bottom', fontWeight: 700, fontSize: '10px' },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              total: { show: true, label: 'CARTERA', formatter: () => formatCurrency(totalCharges.value) }
            }
          }
        }
      },
      dataLabels: { enabled: false },
      tooltip: { theme: 'dark', y: { formatter: (v) => formatCurrency(v) } }
    }
  }
})

// Double-entry table logic
const doubleEntryTable = computed(() => {
  const entries = {}
  const list = reportData.value.detallado_cargos || []
  list.forEach(c => {
    const key = c.tipo_documento
    if (!entries[key]) entries[key] = { origin: key, account: '110505 - CAJA', total: 0, count: 0, paid: 0, pending: 0 }
    entries[key].total += c.monto_original
    entries[key].count++
    const amountPaid = c.monto_original - (c.saldo_pendiente || 0)
    entries[key].paid += amountPaid
    entries[key].pending += c.saldo_pendiente || 0
  })
  return Object.values(entries)
})

const chargesByType = computed(() => {
  return doubleEntryTable.value.map(e => ({ type: e.origin, total: e.total, count: e.count }))
})

// Export Functions
function getDetailedData() {
  const union = [...filteredCreditos.value, ...filteredDebitos.value].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
  return union.map(d => {
    const user = mockUsers.find(u => u.id === d.deportistaId)
    return {
      'ID Documento': d.numeroDocumento,
      'Usuario': user ? user.name : `ID: ${d.deportistaId}`,
      'Naturaleza': d.naturaleza.toUpperCase(),
      'Generación': d.fecha,
      'Concepto': d.concepto || d.tipoDocumento,
      'Monto Original': d.monto,
      'Abonado': d.monto - (d.saldo ?? d.monto),
      'Restante': d.saldo ?? 0,
      'Estado': d.estado.toUpperCase()
    }
  })
}





async function generateExcelBlob() {
  const data = getDetailedData()
  const b = configStore.branding
  const today = new Date().toLocaleDateString('es-CO')
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const workbook = new ExcelJS.Workbook()
  workbook.creator = b.nombre || 'Institución'
  const sheet = workbook.addWorksheet('Detalle')

  // Clean aesthetic: hide grid lines
  sheet.views = [{ showGridLines: false }]

  const primaryColor = (b.colorPrimario || '#1e293b').replace('#', '')

  // Set column widths properly
  sheet.columns = [
    { width: 18 }, { width: 28 }, { width: 14 }, { width: 16 },
    { width: 22 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }
  ]

  // 1. Premium Header Banner
  sheet.mergeCells('A1:I4')
  const headerCell = sheet.getCell('A1')
  headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + primaryColor } }
  headerCell.value = `${b.nombre || 'Institución Deportiva'}\nReporte de Inteligencia Financiera\nGenerado: ${today}  /  ${timeStr}`
  headerCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } }
  headerCell.alignment = { vertical: 'middle', horizontal: 'right', wrapText: true, indent: 1 }

  // 1.1 Insert Logo if present
  if (b.logo) {
    try {
      const base64Data = b.logo.includes(',') ? b.logo.split(',')[1] : b.logo;
      const ext = b.logo.includes('jpeg') || b.logo.includes('jpg') ? 'jpeg' : 'png';
      const imageId = workbook.addImage({ base64: base64Data, extension: ext });
      sheet.addImage(imageId, {
        tl: { col: 0.3, row: 0.15 },
        ext: { width: 56, height: 56 }
      });
    } catch (e) { }
  }

  // 2. Spacer row
  sheet.getRow(5).height = 10

  // 3. Table Headers & Data
  if (data.length > 0) {
    const headers = Object.keys(data[0])

    // Explicitly add Header Row
    const headerRow = sheet.addRow(headers.map(h => h.toUpperCase()))
    headerRow.height = 25
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F5F9' } }
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF475569' } }
      cell.border = { bottom: { style: 'medium', color: { argb: 'FFE2E8F0' } } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    // Data population with premium styles using robust addRow()
    data.forEach((item) => {
      const rowData = headers.map(h => item[h] !== null && item[h] !== undefined ? item[h] : '')
      const row = sheet.addRow(rowData)
      row.height = 20

      row.eachCell((cell, colNumber) => {
        const h = headers[colNumber - 1]
        cell.font = { name: 'Arial', size: 9, color: { argb: 'FF1E293B' } }
        cell.alignment = { vertical: 'middle', horizontal: colNumber > 5 ? 'right' : 'center' }
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFF1F5F9' } } }

        // Apply native Excel format to money columns
        if (h === 'Monto Original' || h === 'Abonado' || h === 'Restante') {
          cell.numFmt = '"$"#,##0.00;[Red]\-"$"#,##0.00'
        }
      })
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

function generateCSVBlob() {
  const data = getDetailedData()
  const b = configStore.branding
  const today = new Date().toLocaleDateString('es-CO')

  if (data.length === 0) return new Blob([''], { type: 'text/csv' })
  const headers = Object.keys(data[0])
  const rows = data.map(obj => headers.map(h => `"${(obj[h] || '').toString().replace(/"/g, '""')}"`).join(','))

  const csvContent = [
    headers.join(','),
    ...rows,
    '',
    `"Detallado Transaccional","${today}","${b.nombre || 'Institución Deportiva'}"`
  ].join('\n')

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
}

async function downloadPDF() {
  const pending = filteredCreditos.value.filter(c => c.estado === 'pendiente' || c.estado === 'parcial').reduce((s, c) => s + c.saldo, 0)
  const vencido = filteredCreditos.value.filter(c => c.estado === 'vencido').reduce((s, c) => s + c.saldo, 0)

  const reportData = {
    branding: configStore.branding,
    startDate: filterDocs.value.startDate,
    endDate: filterDocs.value.endDate,
    todayDate: new Date().toLocaleDateString('es-CO'),
    filtersString: buildFiltersString(),
    totalCharges: totalCharges.value,
    totalPaid: totalPaid.value,
    totalPending: totalPending.value,
    collectionRate: collectionRate.value,
    trendData: {
      labels: ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'],
      values1: [1420000, 1580000, 1350000, 1890000, 1720000, totalPaid.value],
      values2: [80000, 120000, 90000, 150000, 210000, totalPending.value]
    },
    distributionItems: [
      { label: 'Recaudado', value: totalPaid.value, color: '#22c55e' },
      { label: 'Pendiente', value: pending, color: '#facc15' },
      { label: 'Vencido', value: vencido, color: '#ef4444' }
    ],
    tableData: doubleEntryTable.value.map(e => [
      e.origin.toUpperCase(), e.account, formatCurrency(e.paid), formatCurrency(e.pending)
    ]),
    formatCurrency
  }

  const blob = await generateFinancialReportPDF(reportData)
  saveAs(blob, `Reporte_Auditoria_${new Date().toLocaleDateString('es-CO').replace(/\//g, '-')}.pdf`)
}

async function promptDetailedDownload() {
  const { isConfirmed, isDenied, value } = await Swal.fire({
    title: 'Opciones de Exportación',
    text: '¿Cómo deseas descargar el detallado?',
    icon: 'question',
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: 'Paquete ZIP Completo',
    denyButtonText: 'Solo Detalle',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#10b981',
    denyButtonColor: '#3b82f6',
    cancelButtonColor: '#6b7280',
    background: '#1e293b',
    color: '#f1f5f9',
  })

  if (!isConfirmed && !isDenied) return

  const formatResult = await Swal.fire({
    title: 'Formato de Datos',
    text: 'Selecciona el tipo de archivo de detalle:',
    icon: 'info',
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: 'Excel (.xlsx)',
    denyButtonText: 'CSV (.csv)',
    cancelButtonText: 'Cancelar',
    background: '#1e293b',
    color: '#f1f5f9',
  })

  if (!formatResult.isConfirmed && !formatResult.isDenied) return

  const today = new Date().toLocaleDateString('es-CO').replace(/\//g, '-')

  // Decide Data blob
  let dataBlob = null
  let dataExt = ''
  if (formatResult.isConfirmed) {
    dataBlob = await generateExcelBlob()
    dataExt = 'xlsx'
  } else {
    dataBlob = generateCSVBlob()
    dataExt = 'csv'
  }

  // If returning zip
  if (isConfirmed) {
    const zip = new JSZip()
    zip.file(`Reporte_PDF_${today}.pdf`, await generatePDFBlob())
    zip.file(`Detallado_Finanzas_${today}.${dataExt}`, dataBlob)

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    saveAs(zipBlob, `Paquete_Financiero_${today}.zip`)
  } else {
    // Download only the detailed one
    saveAs(dataBlob, `Detallado_Finanzas_${today}.${dataExt}`)
  }
}
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
      <div>
        <h1 class="text-3xl font-bold text-text-main tracking-tighter">Inteligencia Financiera</h1>
        <p class="text-sm text-text-muted mt-1 font-medium italic opacity-70">Resumen contable y análisis evolutivo de
          ingresos</p>
      </div>
      <div class="flex gap-3">
        <button @click="downloadPDF"
          class="px-5 py-2.5 bg-surface-100 border border-border-subtle rounded-xl text-xs font-bold text-text-muted hover:bg-surface-200 transition-all shadow-xs">
          Exportar PDF
        </button>
        <button @click="promptDetailedDownload"
          class="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all">
          Descargar Detallado
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="rounded-[2rem] border border-border-subtle shadow-sm overflow-hidden bg-surface-100 relative">
      <!-- Gradient accent bar -->
      <div
        class="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-primary-600 via-primary-400 to-primary-600 opacity-50">
      </div>

      <!-- Header Row: Dates + Toggle -->
      <div class="px-6 py-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div class="flex items-center gap-5">
          <div class="flex flex-col gap-1.5">
            <span class="text-[9px] font-bold text-text-muted tracking-[0.2em] uppercase opacity-60">Desde</span>
            <div class="relative">
              <input type="date" v-model="filterDocs.startDate"
                class="pl-3 pr-2 py-2 bg-surface-50 border border-border-subtle rounded-xl text-xs font-bold text-text-main outline-hidden focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50 transition-all w-[150px]">
            </div>
          </div>
          <div class="flex items-center text-text-muted opacity-30 pt-5">
            <font-awesome-icon icon="arrow-right" class="text-[10px]" />
          </div>
          <div class="flex flex-col gap-1.5">
            <span class="text-[9px] font-bold text-text-muted tracking-[0.2em] uppercase opacity-60">Hasta</span>
            <div class="relative">
              <input type="date" v-model="filterDocs.endDate"
                class="pl-3 pr-2 py-2 bg-surface-50 border border-border-subtle rounded-xl text-xs font-bold text-text-main outline-hidden focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50 transition-all w-[150px]">
            </div>
          </div>
        </div>

        <button @click="isFiltersOpen = !isFiltersOpen"
          class="px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2.5 border"
          :class="isFiltersOpen
            ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/20'
            : 'bg-surface-50 text-text-main border-border-subtle hover:bg-surface-200 hover:border-primary-500/30'">
          <font-awesome-icon icon="filter" class="text-[10px]"
            :class="isFiltersOpen ? 'text-white/80' : 'text-primary-500'" />
          <span>{{ isFiltersOpen ? 'Ocultar filtros' : 'Filtros avanzados' }}</span>
          <font-awesome-icon icon="chevron-down"
            class="text-[10px] transition-transform duration-500 ease-[cubic-bezier(.4,0,.2,1)]"
            :class="[isFiltersOpen ? 'rotate-180 text-white/60' : 'text-text-muted']" />
        </button>
      </div>

      <!-- Accordion Body -->
      <Transition name="accordion">
        <div v-if="isFiltersOpen">
          <div class="px-6 pb-6 pt-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

            <!-- 1. Deportista Search Card -->
            <div
              class="bg-surface-50/80 rounded-2xl border border-border-subtle p-4 space-y-3 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div
                class="absolute top-0 left-0 w-1 h-full bg-primary-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity">
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-lg bg-primary-500/10 flex items-center justify-center">
                    <font-awesome-icon icon="id-card" class="text-[10px] text-primary-600" />
                  </div>
                  <span class="text-[10px] font-bold text-text-main tracking-wide uppercase">Deportista</span>
                </div>
                <button v-if="filterDocs.deportistaId" @click="clearAthleteFilter"
                  class="text-[9px] font-bold text-danger-500 hover:text-danger-600 transition-colors flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-danger-50">
                  <font-awesome-icon icon="xmark" class="text-[8px]" /> Limpiar
                </button>
              </div>
              <div class="flex gap-2">
                <input type="text" v-model="athleteSearchDoc" @keyup.enter="searchAthlete"
                  placeholder="Nro. de documento..."
                  class="flex-1 px-3 py-2 bg-white dark:bg-surface-900 border border-border-subtle rounded-xl text-xs font-medium text-text-main outline-hidden focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50 placeholder:text-text-muted/40 transition-all">
                <button @click="searchAthlete"
                  class="px-3 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-sm hover:shadow-md active:scale-95">
                  <font-awesome-icon icon="magnifying-glass" class="text-[10px]" />
                </button>
              </div>
              <Transition name="accordion">
                <div v-if="selectedAthlete"
                  class="p-3 bg-white dark:bg-surface-900 border border-primary-500/20 rounded-2xl flex items-center gap-3 shadow-xs">
                  <img :src="selectedAthlete.profileImage"
                    class="w-9 h-9 rounded-full object-cover ring-2 ring-primary-500/20">
                  <div class="flex-1 min-w-0">
                    <p class="text-[11px] font-bold text-text-main truncate">{{ selectedAthlete.name }}</p>
                    <p class="text-[9px] font-medium text-text-muted opacity-50">{{ selectedAthlete.documentNumber }}
                    </p>
                  </div>
                  <font-awesome-icon icon="circle-check" class="text-primary-500 text-sm" />
                </div>
              </Transition>
            </div>

            <!-- 2. Sedes Card -->
            <div
              class="bg-surface-50/80 rounded-2xl border border-border-subtle p-4 space-y-3 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div
                class="absolute top-0 left-0 w-1 h-full bg-primary-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity">
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-lg bg-primary-500/10 flex items-center justify-center">
                    <font-awesome-icon icon="building" class="text-[10px] text-primary-600" />
                  </div>
                  <span class="text-[10px] font-bold text-text-main tracking-wide uppercase">Sedes</span>
                  <span v-if="filterDocs.sedes.length"
                    class="text-[9px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-md">{{
                      filterDocs.sedes.length }}</span>
                </div>
                <button v-if="filterDocs.sedes.length" @click="filterDocs.sedes = []"
                  class="text-[9px] font-bold text-danger-500 hover:text-danger-600 transition-colors flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-danger-50">
                  <font-awesome-icon icon="xmark" class="text-[8px]" /> Limpiar
                </button>
              </div>
              <div class="flex flex-col gap-1 max-h-28 overflow-y-auto custom-scrollbar">
                <label v-for="s in sedesDropdown" :key="s.id"
                  class="flex items-center gap-2.5 cursor-pointer px-3 py-2 rounded-xl transition-all"
                  :class="filterDocs.sedes.includes(s.id) ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-surface-100'">
                  <input type="checkbox" :checked="filterDocs.sedes.includes(s.id)"
                    @change="toggleArrayFilter('sedes', s.id)"
                    class="w-3.5 h-3.5 rounded border-border-subtle text-primary-600 focus:ring-primary-500/20 transition-all shrink-0">
                  <span class="text-[11px] font-semibold transition-colors truncate"
                    :class="filterDocs.sedes.includes(s.id) ? 'text-primary-700' : 'text-text-main'">{{ s.name }}</span>
                </label>
              </div>
            </div>

            <!-- 3. Categorías Card -->
            <div
              class="bg-surface-50/80 rounded-2xl border border-border-subtle p-4 space-y-3 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div
                class="absolute top-0 left-0 w-1 h-full bg-primary-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity">
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-lg bg-primary-500/10 flex items-center justify-center">
                    <font-awesome-icon icon="sitemap" class="text-[10px] text-primary-600" />
                  </div>
                  <span class="text-[10px] font-bold text-text-main tracking-wide uppercase">Categorías</span>
                  <span v-if="filterDocs.categorias.length"
                    class="text-[9px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-md">{{
                      filterDocs.categorias.length }}</span>
                </div>
                <button v-if="filterDocs.categorias.length" @click="filterDocs.categorias = []"
                  class="text-[9px] font-bold text-danger-500 hover:text-danger-600 transition-colors flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-danger-50">
                  <font-awesome-icon icon="xmark" class="text-[8px]" /> Limpiar
                </button>
              </div>
              <div class="flex flex-col gap-1 max-h-28 overflow-y-auto custom-scrollbar">
                <label v-for="c in categoriasDropdown" :key="c.id"
                  class="flex items-center gap-2.5 cursor-pointer px-3 py-2 rounded-xl transition-all"
                  :class="filterDocs.categorias.includes(c.id) ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-surface-100'">
                  <input type="checkbox" :checked="filterDocs.categorias.includes(c.id)"
                    @change="toggleArrayFilter('categorias', c.id)"
                    class="w-3.5 h-3.5 rounded border-border-subtle text-primary-600 focus:ring-primary-500/20 transition-all shrink-0">
                  <span class="text-[11px] font-semibold transition-colors truncate"
                    :class="filterDocs.categorias.includes(c.id) ? 'text-primary-700' : 'text-text-main'">{{ c.name
                    }}</span>
                </label>
              </div>
            </div>

            <!-- 4. Conceptos (Pill Toggles) -->
            <div
              class="bg-surface-50/80 rounded-2xl border border-border-subtle p-4 space-y-3 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div
                class="absolute top-0 left-0 w-1 h-full bg-primary-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity">
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-lg bg-primary-500/10 flex items-center justify-center">
                    <font-awesome-icon icon="receipt" class="text-[10px] text-primary-600" />
                  </div>
                  <span class="text-[10px] font-bold text-text-main tracking-wide uppercase">Conceptos</span>
                </div>
                <button v-if="filterDocs.tiposDocumento.length < 7"
                  @click="filterDocs.tiposDocumento = ['matricula', 'mensualidad', 'producto', 'torneo', 'multa', 'pago', 'beca']"
                  class="text-[9px] font-bold text-primary-500 hover:text-primary-600 transition-colors flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-primary-50">
                  <font-awesome-icon icon="check" class="text-[8px]" /> Todos
                </button>
              </div>
              <div class="flex flex-wrap gap-1.5">
                <button v-for="tipo in [
                  { key: 'matricula', label: 'Matrícula', icon: 'file-signature' },
                  { key: 'mensualidad', label: 'Mensualidad', icon: 'calendar-days' },
                  { key: 'producto', label: 'Producto', icon: 'cart-shopping' },
                  { key: 'torneo', label: 'Torneo', icon: 'trophy' },
                  { key: 'beca', label: 'Beca', icon: 'star' },
                  { key: 'pago', label: 'Pago', icon: 'money-bill-wave' },
                  { key: 'multa', label: 'Multa', icon: 'triangle-exclamation' }
                ]" :key="tipo.key" @click="toggleType(tipo.key)"
                  class="px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-200 flex items-center gap-1.5 border active:scale-95"
                  :class="hasType(tipo.key)
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-500/20'
                    : 'bg-white dark:bg-surface-900 text-text-muted border-border-subtle hover:border-primary-400 hover:text-primary-600'">
                  <font-awesome-icon :icon="tipo.icon" class="text-[8px]" />
                  {{ tipo.label }}
                </button>
              </div>
            </div>

          </div>
        </div>
      </Transition>
    </div>

    <!-- KPIs Principales -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        class="bg-surface-100 rounded-3xl border border-border-subtle shadow-xs p-6 group hover:shadow-xl transition-all relative overflow-hidden">
        <p class="text-[10px] font-bold text-text-muted tracking-widest opacity-60 mb-2">Total en Libros</p>
        <p class="text-3xl font-bold text-text-main tabular-nums tracking-tighter">{{ formatCurrency(totalCharges) }}
        </p>
        <div class="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-primary-500">
          <font-awesome-icon icon="book" />
          <span>Devengado bruto proyectado</span>
        </div>
      </div>
      <div
        class="bg-surface-100 rounded-3xl border border-border-subtle shadow-xs p-6 group hover:shadow-xl transition-all">
        <p class="text-[10px] font-bold text-text-muted tracking-widest opacity-60 mb-2">Recaudado (Caja)</p>
        <p class="text-3xl font-bold text-success-600 dark:text-success-400 tabular-nums tracking-tighter">{{
          formatCurrency(totalPaid) }}</p>
        <div class="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-success-600">
          <font-awesome-icon icon="check-circle" />
          <span>{{ collectionRate }}% de efectividad</span>
        </div>
      </div>
      <div
        class="bg-surface-100 rounded-3xl border border-border-subtle shadow-xs p-6 group hover:shadow-xl transition-all">
        <p class="text-[10px] font-bold text-text-muted tracking-widest opacity-60 mb-2">CxC / Cartera</p>
        <p class="text-3xl font-bold text-danger-600 dark:text-danger-400 tabular-nums tracking-tighter">{{
          formatCurrency(totalPending) }}</p>
        <div class="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-danger-500">
          <font-awesome-icon icon="triangle-exclamation" />
          <span>Saldos pendientes de cobro</span>
        </div>
      </div>
      <div
        class="bg-surface-100 rounded-3xl border border-border-subtle shadow-xs p-6 group hover:shadow-xl transition-all">
        <div class="flex justify-between items-center mb-3">
          <p class="text-[10px] font-bold text-text-muted tracking-widest opacity-60">Beneficios Otorgados</p>
          <span class="text-xs font-bold text-accent-600">{{ formatCurrency((reportData.beneficios?.total_becas || 0) +
            (reportData.beneficios?.total_descuentos || 0)) }}</span>
        </div>
        <div class="space-y-2">
          <div class="flex justify-between text-[9px] font-bold uppercase tracking-tight">
            <span class="text-blue-500">Becas: {{ formatCurrency(reportData.beneficios?.total_becas || 0) }}</span>
            <span class="text-green-500">Dctos: {{ formatCurrency(reportData.beneficios?.total_descuentos || 0) }}</span>
          </div>
          <div class="w-full bg-surface-200 dark:bg-surface-900 rounded-full h-2 overflow-hidden flex shadow-inner">
            <div class="bg-blue-500 h-full transition-all"
              :style="{ width: ((reportData.beneficios?.total_becas || 0) / ((reportData.beneficios?.total_becas || 0) + (reportData.beneficios?.total_descuentos || 0) || 1) * 100) + '%' }">
            </div>
            <div class="bg-green-500 h-full transition-all"
              :style="{ width: ((reportData.beneficios?.total_descuentos || 0) / ((reportData.beneficios?.total_becas || 0) + (reportData.beneficios?.total_descuentos || 0) || 1) * 100) + '%' }">
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-surface-100 rounded-[2.5rem] border border-border-subtle shadow-sm p-8 group">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h3 class="text-lg font-bold text-text-main tracking-tight">Tendencia de Ingresos</h3>
            <p class="text-[10px] font-bold text-text-muted tracking-widest opacity-60">Últimos 6 meses: Recaudado vs
              Pendiente</p>
          </div>
        </div>
        <VueApexCharts ref="trendChartRef" height="300" :options="revenueTrendChart.options"
          :series="revenueTrendChart.series" />
      </div>

      <div class="bg-surface-100 rounded-[2.5rem] border border-border-subtle shadow-sm p-8 group flex flex-col">
        <div class="mb-8">
          <h3 class="text-lg font-bold text-text-main tracking-tight">Estado de Cartera</h3>
          <p class="text-[10px] font-bold text-text-muted tracking-widest opacity-60">Distribución de saldos acumulados
          </p>
        </div>
        <div class="flex-1 flex items-center justify-center">
          <VueApexCharts ref="compositionChartRef" height="280" width="100%"
            :options="portfolioCompositionChart.options" :series="portfolioCompositionChart.series" />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Double Entry Table -->
      <div
        class="bg-surface-100 rounded-[2.5rem] border border-border-subtle shadow-sm overflow-hidden transition-colors">
        <div class="px-8 py-6 border-b border-border-subtle bg-surface-50/50">
          <h3 class="text-sm font-bold text-text-main tracking-widest">Resumen por Cuenta Contable</h3>
          <p class="text-[10px] text-text-muted font-bold mt-1 opacity-60 italic tracking-tighter">Origen Pago → Centro
            de Costo</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-surface-50 border-b border-border-subtle">
                <th class="px-8 py-4 text-[10px] font-bold text-text-muted tracking-widest">Procedencia</th>
                <th class="px-8 py-4 text-[10px] font-bold text-text-muted tracking-widest">Detalle Contable</th>
                <th class="px-8 py-4 text-right text-[10px] font-bold text-text-muted tracking-widest">Efectivo</th>
                <th class="px-8 py-4 text-right text-[10px] font-bold text-text-muted tracking-widest">Por Cobrar</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-subtle">
              <tr v-for="e in doubleEntryTable" :key="e.origin" class="hover:bg-surface-50 transition-colors group">
                <td class="px-8 py-5 text-sm font-bold text-text-main group-hover:text-primary-600 transition-colors">{{
                  e.origin }}</td>
                <td class="px-8 py-5 text-[10px] font-mono text-text-muted opacity-50 tracking-tighter">{{ e.account }}
                </td>
                <td class="px-8 py-5 text-sm text-right font-bold text-success-600 tabular-nums">{{
                  formatCurrency(e.paid) }}</td>
                <td class="px-8 py-5 text-sm text-right font-bold text-danger-600 tabular-nums">{{
                  formatCurrency(e.pending) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Categories Summary -->
      <div class="bg-surface-100 rounded-[2.5rem] border border-border-subtle shadow-sm overflow-hidden p-4">
        <div class="grid grid-cols-2 gap-4 h-full">
          <div v-for="t in chargesByType" :key="t.type"
            class="bg-surface-50/50 border border-border-subtle rounded-3xl p-6 hover:bg-white hover:shadow-lg transition-all group overflow-hidden relative">
            <p class="text-[9px] font-bold text-text-muted tracking-widest opacity-60 mb-2 relative z-10">{{ t.type }}
            </p>
            <p class="text-xl font-bold text-text-main tabular-nums relative z-10">{{ formatCurrency(t.total) }}</p>
            <p class="text-[10px] font-bold text-text-muted mt-2 opacity-60 relative z-10">{{ t.count }} ítems</p>
            <!-- Watermark icon placeholder -->
            <font-awesome-icon icon="receipt"
              class="absolute -right-4 -bottom-4 text-4xl text-primary-500/5 rotate-12 group-hover:scale-150 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 500px;
  opacity: 1;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-8px);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-border-subtle, #e2e8f0);
  border-radius: 9999px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted, #94a3b8);
}
</style>
