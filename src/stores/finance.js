import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockDocumentos } from '@/data/mockData'

export const useFinanceStore = defineStore('finance', () => {
  const documentos = ref([...mockDocumentos])

  // --- API Fetchers Mock ---
  async function fetchEstadoFinanciero(deportistaId) {
    const docs = documentos.value.filter(d => d.deportistaId === deportistaId && d.estado === 'validado')
    const totalPendiente = docs.reduce((acc, d) => {
      return d.naturaleza === 'credito' ? acc + d.monto : acc - d.monto
    }, 0)

    return {
      totalPendiente,
      totalVencido: totalPendiente > 0 ? totalPendiente * 0.1 : 0, // Simulado
      cuentaAlDia: totalPendiente <= 0
    }
  }

  async function fetchCuentaCorriente(deportistaId) {
    return documentos.value.filter(d => d.deportistaId === deportistaId)
  }

  async function fetchCarteraVencida() {
    // Simular algunos deportistas con mora
    return documentos.value.filter(d => d.naturaleza === 'credito' && d.estado === 'validado')
  }

  async function fetchReporteRango(inicio, fin) {
    return documentos.value.filter(d => d.fecha >= inicio && d.fecha <= fin)
  }

  // --- Mutators Mock ---
  async function generarCargo(datos) {
    const newDoc = {
      id: Math.max(...documentos.value.map(d => d.id), 0) + 1,
      ...datos,
      naturaleza: 'credito',
      estado: 'validado',
      fecha: new Date().toISOString().split('T')[0]
    }
    documentos.value.push(newDoc)
    return { success: true, data: newDoc }
  }

  async function aplicarPagoBase(datos) {
    const newDoc = {
      id: Math.max(...documentos.value.map(d => d.id), 0) + 1,
      ...datos,
      naturaleza: 'debito',
      estado: 'validado',
      fecha: new Date().toISOString().split('T')[0],
      concepto: 'Pago Recibido'
    }
    documentos.value.push(newDoc)
    return { success: true, data: newDoc }
  }

  async function anularDocumento(id) {
    const doc = documentos.value.find(d => d.id === id)
    if (doc) doc.estado = 'anulado'
    return { success: true }
  }

  function getSaldoDeportista(deportistaId) {
    const docs = documentos.value.filter(d => d.deportistaId === deportistaId && d.estado === 'validado')
    return docs.reduce((acc, d) => {
      return d.naturaleza === 'credito' ? acc + d.monto : acc - d.monto
    }, 0)
  }

  function aplicarPago(deportistaId, amount, method, reference, comprobante = null) {
    const newDoc = {
      id: Math.max(...documentos.value.map(d => d.id), 0) + 1,
      deportistaId,
      monto: amount,
      tipoDocumento: 'pago',
      naturaleza: 'debito',
      estado: 'validado',
      fecha: new Date().toISOString().split('T')[0],
      concepto: `Pago ${method} - ${reference}`,
      comprobante
    }
    documentos.value.push(newDoc)
    return { success: true, data: newDoc, montoAplicado: amount }
  }

  async function ejecutarCalculoMora() {
    return { success: true, message: 'Cálculo de mora completado (Mock)' }
  }

  async function fetchInteligenciaFinanciera(filtros) {
    // Filtrado básico para el mock
    let filtered = documentos.value.filter(d => {
      if (filtros.fechaInicio && d.fecha < filtros.fechaInicio) return false
      if (filtros.fechaFin && d.fecha > filtros.fechaFin) return false
      if (filtros.tiposDocumento && !filtros.tiposDocumento.includes(d.tipoDocumento)) return false
      return true
    })

    const cargos = filtered.filter(d => d.naturaleza === 'credito')
    const abonos = filtered.filter(d => d.naturaleza === 'debito')

    const total_cargos = cargos.reduce((s, c) => s + c.monto, 0)
    const total_pagado = abonos.filter(a => a.tipoDocumento === 'pago').reduce((s, a) => s + a.monto, 0)
    const total_pendiente = cargos.reduce((s, c) => s + (c.saldo ?? c.monto), 0)
    const total_becas = abonos.filter(a => a.tipoDocumento === 'beca').reduce((s, a) => s + a.monto, 0)
    const total_descuentos = 0 // Placeholder para lógica futura

    return {
      success: true,
      data: {
        resumen: {
          total_cargos,
          total_pagado,
          total_pendiente,
          tasa_recaudo: total_cargos > 0 ? Math.round((total_pagado / total_cargos) * 100) : 0
        },
        beneficios: {
          total_becas,
          total_descuentos
        },
        detallado_cargos: cargos.map(c => ({
          id: c.id,
          tipo_documento: c.tipoDocumento,
          monto_original: c.monto,
          saldo_pendiente: c.saldo ?? c.monto,
          fecha: c.fecha
        })),
        distribucion_cartera: [
          { estado: 'Pagado', monto: total_pagado },
          { estado: 'Pendiente', monto: cargos.filter(c => c.estado === 'pendiente' || c.estado === 'parcial').reduce((s, c) => s + c.saldo, 0) },
          { estado: 'Vencido', monto: cargos.filter(c => c.estado === 'vencido').reduce((s, c) => s + c.saldo, 0) }
        ],
        tendencia_6_meses: [
          { mes: 'Oct', total_cargos: 1420000, total_pagado: 1200000 },
          { mes: 'Nov', total_cargos: 1580000, total_pagado: 1400000 },
          { mes: 'Dic', total_cargos: 1350000, total_pagado: 1100000 },
          { mes: 'Ene', total_cargos: 1890000, total_pagado: 1600000 },
          { mes: 'Feb', total_cargos: 1720000, total_pagado: 1500000 },
          { mes: 'Mar', total_cargos, total_pagado }
        ]
      }
    }
  }

  const getChargesByUser = computed(() => (deportistaId) => {
    return documentos.value
      .filter(d => d.deportistaId === deportistaId && d.naturaleza === 'credito')
      .map(d => ({
        id: d.id,
        concept: d.concepto,
        date: d.fecha,
        amount: d.monto,
        status: d.estado.charAt(0).toUpperCase() + d.estado.slice(1)
      }))
  })

  return {
    documentos,
    fetchEstadoFinanciero,
    fetchCuentaCorriente,
    fetchCarteraVencida,
    fetchReporteRango,
    fetchInteligenciaFinanciera,
    generarCargo,
    aplicarPagoBase,
    anularDocumento,
    ejecutarCalculoMora,
    getSaldoDeportista,
    aplicarPago,
    getChargesByUser
  }
})
