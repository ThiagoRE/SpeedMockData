import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockBecas } from '@/data/mockData'
import { useFinanceStore } from './finance'

export const useScholarshipsStore = defineStore('scholarships', () => {
  const becas = ref([...mockBecas.map(b => ({ ...b }))])

  // --- Getters ---
  const getByDeportista = computed(() => (deportistaId) => becas.value.filter(b => b.deportistaId === deportistaId))
  const becasActivas = computed(() => becas.value.filter(b => b.estado === 'activa'))

  // --- Actions ---
  function nextId() {
    return Math.max(0, ...becas.value.map(b => b.id)) + 1
  }

  function crearBeca(datos) {
    const beca = {
      id: nextId(),
      ...datos,
      estado: 'activa'
    }
    becas.value.push(beca)
    generarDebitosBeca(beca)
    return beca
  }

  function suspenderBeca(id) {
    const beca = becas.value.find(b => b.id === id)
    if (beca) beca.estado = 'suspendida'
  }
  
  const formatMonth = (date) => {
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      return months[date.getMonth()];
  }

  function generarDebitosBeca(beca) {
    const financeStore = useFinanceStore()
    
    // We get all pending/unpaid monthly credits for this athlete
    const creditosMensualidad = financeStore.getCreditosByDeportista(beca.deportistaId)
      .filter(c => c.tipoDocumento === 'mensualidad' && c.estado !== 'anulado' && c.saldo > 0)

    const fInicio = new Date(beca.fechaInicio)
    const fFin = new Date(beca.fechaFin)

    if (beca.tipoPeriodicidad === 'mensual') {
      for (const credito of creditosMensualidad) {
        // Here we ideally check if the charge date falls between beca start/end
        const cDate = new Date(credito.fecha)
        if (cDate >= fInicio && cDate <= fFin) {
          
          // Let's check if there is already a debit for this beca and this credit to avoid duplicates
          const exists = financeStore.debitos.find(d => 
             d.tipoDocumento === 'beca' && 
             d.documentoCreditoId === credito.id
          )
          
          if(!exists){
              const montoBeca = beca.tipoValor === 'porcentaje'
                ? Math.round(credito.monto * (beca.valor / 100))
                : Math.min(beca.valor, credito.saldo)
    
              financeStore.crearDebito({
                deportistaId: beca.deportistaId,
                tipoDocumento: 'beca',
                concepto: `${beca.concepto} - ${formatMonth(cDate)}`,
                monto: montoBeca,
                documentoCreditoId: credito.id,
                numeroDocumentoCredito: credito.numeroDocumento
              })
          }
        }
      }
    } else if (beca.tipoPeriodicidad === 'anual') {
      // Un único débito anual pero lo aplicamos de manera distribuida como un prepago/pago
      const isPercentage = beca.tipoValor === 'porcentaje'
      
      // If percentage on annual, it might mean we sum all months in the year period and apply.
      // If flat amount, we apply distribute over debts.
      if(!isPercentage) {
          financeStore.aplicarPago(beca.deportistaId, beca.valor, 'Beca Anual', `BEC-ANUAL-${Date.now()}`)
      } else {
         // Percentage annual -> apply that percent to all valid invoices within the year
         for (const credito of creditosMensualidad) {
            const cDate = new Date(credito.fecha)
            if (cDate >= fInicio && cDate <= fFin) {
                const exists = financeStore.debitos.find(d => 
                     d.tipoDocumento === 'beca' && 
                     d.documentoCreditoId === credito.id
                  )
                  if(!exists){
                      const montoBeca = Math.round(credito.monto * (beca.valor / 100))
                      financeStore.crearDebito({
                        deportistaId: beca.deportistaId,
                        tipoDocumento: 'beca',
                        concepto: `${beca.concepto} - ${formatMonth(cDate)}`,
                        monto: montoBeca,
                        documentoCreditoId: credito.id,
                        numeroDocumentoCredito: credito.numeroDocumento
                      })
                  }
            }
         }
      }
    }
  }

  function generarTodosLosDebitosParaBecasActivas() {
      becasActivas.value.forEach(b => generarDebitosBeca(b))
  }

  return {
    becas,
    getByDeportista, becasActivas,
    crearBeca, suspenderBeca, generarDebitosBeca, generarTodosLosDebitosParaBecasActivas
  }
})
