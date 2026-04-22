import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockMatriculas } from '@/data/mockData'

export const useEnrollmentsStore = defineStore('enrollments', () => {
  const matriculas = ref([...mockMatriculas])
  const beneficios = ref([]) // Simulado

  // --- Getters ---
  const getByDeportista = computed(() => (deportistaId) => matriculas.value.filter(m => m.deportistaId === deportistaId))
  
  const getActiva = computed(() => (deportistaId) => {
    return matriculas.value.find(m => m.deportistaId === deportistaId && m.estado === 'activa')
  })

  // --- API Mock ---
  async function fetchMatriculas() {
    // Ya inicializado
  }

  async function crearMatricula(datos) {
    const { 
      deportistaId, sedeId, periodo, fechaInscripcion, fechaInicio, 
      duracionMeses, montoInscripcion, montoMensualidad, beneficios: nuevosBeneficios 
    } = datos
    
    const newMatricula = {
       id: Math.max(...matriculas.value.map(m => m.id), 0) + 1,
       deportistaId,
       sedeId,
       periodo,
       fechaInscripcion,
       fechaInicio,
       duracionMeses,
       montoInscripcion,
       montoMensualidad,
       estado: 'activa',
       beneficios: nuevosBeneficios || []
    }

    matriculas.value.push(newMatricula)
    
    // Simular creación de documentos financieros si el store de finanzas está disponible
    // (Opcional, pero bueno para coherencia)
    
    return { success: true, data: newMatricula }
  }

  async function fetchBeneficios(matriculaId) {
    const m = matriculas.value.find(x => x.id === matriculaId)
    return { success: true, data: m?.beneficios || [] }
  }

  async function agregarBeneficio(matriculaId, payload) {
    const m = matriculas.value.find(x => x.id === matriculaId)
    if (m) {
      if (!m.beneficios) m.beneficios = []
      const newB = { ...payload, id: Math.random(), estado: 'activo' }
      m.beneficios.push(newB)
      return { success: true, data: newB }
    }
    return { success: false }
  }

  async function anularBeneficio(id) {
    // Buscar en todas las matrículas
    matriculas.value.forEach(m => {
      if (m.beneficios) {
        const b = m.beneficios.find(x => x.id === id)
        if (b) b.estado = 'anulado'
      }
    })
    return { success: true }
  }

  async function cancelarMatricula(id) {
    const m = matriculas.value.find(x => x.id === id)
    if (m) m.estado = 'cancelada'
    return { success: true }
  }

  return {
    matriculas,
    getByDeportista, getActiva,
    fetchMatriculas, crearMatricula, cancelarMatricula,
    fetchBeneficios, agregarBeneficio, anularBeneficio
  }
})
