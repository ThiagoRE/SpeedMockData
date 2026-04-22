<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEnrollmentsStore } from '@/stores/enrollments'
import { useUsersStore } from '@/stores/users'
import { useSportsStore } from '@/stores/sports'
import Swal from 'sweetalert2'

const router = useRouter()
const enrollmentsStore = useEnrollmentsStore()
const usersStore = useUsersStore()
const sportsStore = useSportsStore()

const search = ref('')
const filterSede = ref('')
const filterEstado = ref('')

const formatDate = (d) => {
  if(!d) return ''
  return new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}

const getDeportistaName = (id) => usersStore.users.find(u => u.id === id)?.name || 'Desconocido'
const getSedeName = (id) => sportsStore.sedes.find(s => s.id === id)?.name || 'Sede N/A'

const filteredEnrollments = computed(() => {
  return enrollmentsStore.matriculas.filter(m => {
    const deportistaName = getDeportistaName(m.deportistaId).toLowerCase()
    const matchSearch = deportistaName.includes(search.value.toLowerCase()) || m.periodo.toLowerCase().includes(search.value.toLowerCase())
    const matchSede = !filterSede.value || m.sedeId === filterSede.value
    const matchEstado = !filterEstado.value || m.estado === filterEstado.value
    return matchSearch && matchSede && matchEstado
  }).sort((a,b) => b.id - a.id)
})

function createNew() {
  router.push({ name: 'EnrollmentCreate' })
}

function reEnroll(deportistaId) {
  router.push({ name: 'EnrollmentCreate', params: { deportistaId } })
}

function cancelEnrollment(id) {
  Swal.fire({
      title: '¿Cancelar matrícula?',
      text: "Esto anulará los documentos pendientes asociados. No se puede revertir.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, cancelar matrícula',
      cancelButtonText: 'No'
  }).then((result) => {
      if (result.isConfirmed) {
          enrollmentsStore.cancelarMatricula(id)
          Swal.fire('Cancelada', 'La matrícula y sus créditos pendientes han sido anulados.', 'success')
      }
  })
}

const showBenefitsModal = ref(false)
const selectedMatricula = ref(null)
const currentBeneficios = ref([])
const newBeneficio = ref({
  tipo: 'beca',
  metodo: 'porcentual',
  valor: 0,
  meses_aplicacion: [],
  aplica_a_inscripcion: false
})

async function openBenefitsModal(matricula) {
  selectedMatricula.value = matricula
  showBenefitsModal.value = true
  newBeneficio.value = {
    tipo: 'beca',
    metodo: 'porcentual',
    valor: 0,
    meses_aplicacion: [],
    aplica_a_inscripcion: false
  }
  const res = await enrollmentsStore.fetchBeneficios(matricula.id)
  if (res.success) currentBeneficios.value = res.data
}

async function handleAnularBeneficio(id) {
  const result = await Swal.fire({
    title: '¿Anular beneficio?',
    text: "Se anularán los documentos financieros vinculados. Esta acción no se puede deshacer.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, anular',
    cancelButtonText: 'Cancelar'
  })

  if (result.isConfirmed) {
    const res = await enrollmentsStore.anularBeneficio(id)
    if (res.success) {
      Swal.fire('Anulado', 'El beneficio ha sido anulado con éxito.', 'success')
      const res2 = await enrollmentsStore.fetchBeneficios(selectedMatricula.value.id)
      if (res2.success) currentBeneficios.value = res2.data
      await enrollmentsStore.fetchMatriculas() // Refrescar lista global
    } else {
      Swal.fire('Error', res.message, 'error')
    }
  }
}

async function saveBeneficio() {
  if (newBeneficio.value.valor <= 0) {
    return Swal.fire('Error', 'El valor debe ser mayor a 0', 'warning')
  }
  if (!newBeneficio.value.aplica_a_inscripcion && newBeneficio.value.meses_aplicacion.length === 0) {
    return Swal.fire('Error', 'Selecciona al menos un mes de aplicación o inscripción', 'warning')
  }

  try {
    const res = await enrollmentsStore.agregarBeneficio(selectedMatricula.value.id, newBeneficio.value)
    if (res.success) {
      Swal.fire('¡Éxito!', 'Beneficio agregado correctamente.', 'success')
      const res2 = await enrollmentsStore.fetchBeneficios(selectedMatricula.value.id)
      if (res2.success) currentBeneficios.value = res2.data
      await enrollmentsStore.fetchMatriculas() // Refrescar lista global
      // Reset form
      newBeneficio.value = { tipo: 'beca', metodo: 'porcentual', valor: 0, meses_aplicacion: [], aplica_a_inscripcion: false }
    } else {
      Swal.fire('Error', res.message, 'error')
    }
  } catch (err) {
    Swal.fire('Error', err.message, 'error')
  }
}

function toggleMes(num) {
  const pos = newBeneficio.value.meses_aplicacion.indexOf(num)
  if (pos === -1) newBeneficio.value.meses_aplicacion.push(num)
  else newBeneficio.value.meses_aplicacion.splice(pos, 1)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-text-main tracking-tight">Gestión de Matrículas</h1>
        <p class="text-sm text-text-muted mt-1 font-medium">Control de subscripciones y afiliaciones de deportistas</p>
      </div>
      <button @click="createNew"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all font-semibold text-xs tracking-widest shadow-lg shadow-primary-500/25 hover:scale-105 active:scale-95">
        <font-awesome-icon icon="plus" /> Nueva Matrícula
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="relative flex-1 group">
        <font-awesome-icon icon="magnifying-glass"
          class="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted text-sm opacity-50 group-focus-within:opacity-100 transition-opacity" />
        <input v-model="search" type="text" placeholder="Buscar por deportista o periodo..."
          class="w-full pl-12 pr-5 py-3 rounded-2xl border border-border-subtle bg-surface-100 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none text-sm font-semibold text-text-main transition-all placeholder-text-muted/40 shadow-sm" />
      </div>
      <div class="relative group">
        <select v-model="filterSede"
          class="appearance-none pl-5 pr-12 py-3 rounded-2xl border border-border-subtle text-sm font-semibold tracking-tighter focus:border-primary-500 outline-none bg-surface-100 text-text-main shadow-sm transition-all hover:bg-surface-200">
          <option value="">Todas las Sedes</option>
          <option v-for="sede in sportsStore.sedes" :key="sede.id" :value="sede.id">{{sede.name}}</option>
        </select>
        <font-awesome-icon icon="chevron-down"
          class="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] text-text-muted pointer-events-none opacity-50" />
      </div>
      <div class="relative group">
        <select v-model="filterEstado"
          class="appearance-none pl-5 pr-12 py-3 rounded-2xl border border-border-subtle text-sm font-semibold tracking-tighter focus:border-primary-500 outline-none bg-surface-100 text-text-main shadow-sm transition-all hover:bg-surface-200">
          <option value="">Todos los Estados</option>
          <option value="activa">Activas</option>
          <option value="vencida">Vencidas</option>
          <option value="cancelada">Canceladas</option>
        </select>
        <font-awesome-icon icon="chevron-down"
          class="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] text-text-muted pointer-events-none opacity-50" />
      </div>
    </div>

    <!-- Table -->
    <div
      class="bg-surface-100 rounded-2xl shadow-sm border border-border-subtle overflow-hidden transition-colors duration-300">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-surface-50 border-b border-border-subtle">
            <tr>
              <th class="text-left text-xs font-semibold text-text-muted px-6 py-4">Deportista</th>
              <th class="text-left text-xs font-semibold text-text-muted px-6 py-4">Sede / Tipo</th>
              <th class="text-left text-xs font-semibold text-text-muted px-6 py-4">Periodo</th>
              <th class="text-left text-xs font-semibold text-text-muted px-6 py-4">Vigencia</th>
              <th class="text-left text-xs font-semibold text-text-muted px-6 py-4">Estado</th>
              <th class="text-right text-xs font-semibold text-text-muted px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-subtle">
            <template v-if="filteredEnrollments.length > 0">
              <tr v-for="m in filteredEnrollments" :key="m.id" class="hover:bg-surface-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="font-bold text-text-main text-sm">{{ getDeportistaName(m.deportistaId) }}</div>
                  <div class="text-[10px] font-mono text-text-muted mt-1">MAT-{{ String(m.id).padStart(4,'0') }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm font-semibold text-text-main">{{ getSedeName(m.sedeId) }}</div>
                  <div class="text-xs text-text-muted capitalize">{{ m.tipo }}</div>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 bg-surface-200 border border-border-subtle rounded-lg text-xs font-bold text-text-main">{{m.periodo}}</span>
                </td>
                <td class="px-6 py-4">
                  <div class="text-xs text-text-main font-semibold">{{formatDate(m.fechaInicio)}}</div>
                  <div class="text-[10px] text-text-muted uppercase tracking-wider">Hta: {{formatDate(m.fechaFin)}}</div>
                </td>
                <td class="px-6 py-4">
                   <span v-if="m.estado === 'activa'" class="px-2.5 py-1 bg-success-100 text-success-700 font-bold text-xs rounded-full border border-success-200">Activa</span>
                   <span v-else-if="m.estado === 'vencida'" class="px-2.5 py-1 bg-warning-100 text-warning-700 font-bold text-xs rounded-full border border-warning-200">Vencida</span>
                   <span v-else class="px-2.5 py-1 bg-danger-100 text-danger-700 font-bold text-xs rounded-full border border-danger-200">Cancelada</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button @click="openBenefitsModal(m)" title="Gestionar Beneficios"
                      class="p-2 rounded-lg hover:bg-accent-50 text-accent-600 transition-colors">
                      <font-awesome-icon icon="tags" class="text-sm" />
                    </button>
                    <button @click="reEnroll(m.deportistaId)" title="Nueva Matrícula o Renovación"
                      class="p-2 rounded-lg hover:bg-primary-50 text-primary-500 transition-colors">
                      <font-awesome-icon icon="rotate-right" class="text-sm" />
                    </button>
                    <button v-if="m.estado === 'activa'" @click="cancelEnrollment(m.id)" title="Cancelar Matrícula"
                      class="p-2 rounded-lg hover:bg-danger-50 text-danger-500 transition-colors">
                      <font-awesome-icon icon="ban" class="text-sm" />
                    </button>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="6" class="px-6 py-12 text-center text-text-muted">
                 No se encontraron matrículas con los filtros seleccionados
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL BENEFICIOS -->
    <Teleport to="body">
      <div v-if="showBenefitsModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm" @click="showBenefitsModal = false"></div>
        
        <div class="relative bg-surface-100 w-full max-w-2xl rounded-3xl shadow-2xl border border-border-subtle animate-fade-in overflow-hidden">
          <!-- Header -->
          <div class="px-6 py-5 border-b border-border-subtle flex items-center justify-between bg-surface-50">
            <div>
              <h3 class="text-lg font-bold text-text-main">Gestión de Beneficios</h3>
              <p class="text-xs text-text-muted font-medium">MAT-{{ String(selectedMatricula?.id).padStart(4,'0') }} - {{ getDeportistaName(selectedMatricula?.deportistaId) }}</p>
            </div>
            <button @click="showBenefitsModal = false" class="p-2 hover:bg-surface-200 rounded-xl transition-colors text-text-muted">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>

          <div class="p-6 space-y-6">
            <!-- Beneficios Actuales -->
            <div class="space-y-3">
              <h4 class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Beneficios Activos</h4>
              <div v-if="currentBeneficios.length > 0" class="space-y-2">
                <div v-for="b in currentBeneficios" :key="b.id" 
                  class="flex items-center justify-between p-3 bg-surface-200 rounded-xl border border-border-subtle group">
                  <div class="flex items-center gap-3">
                    <div :class="['w-8 h-8 rounded-lg flex items-center justify-center', b.tipo_beneficio === 'beca' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600']">
                      <font-awesome-icon :icon="b.tipo_beneficio === 'beca' ? 'graduation-cap' : 'tag'" class="text-xs" />
                    </div>
                    <div>
                      <p class="text-sm font-bold text-text-main capitalize">{{b.tipo_beneficio}} ({{b.metodo_aplicacion === 'porcentual' ? b.valor_beneficio + '%' : formatCurrency(b.valor_beneficio)}})</p>
                      <p class="text-[10px] text-text-muted">
                        {{ b.aplica_inscripcion ? 'Incluye Inscripción' : '' }} 
                        {{ b.meses?.length > 0 ? '• ' + b.meses.length + ' meses' : '' }}
                      </p>
                    </div>
                  </div>
                  <button v-if="b.estado === 'activo'" @click="handleAnularBeneficio(b.id)" class="p-2 opacity-0 group-hover:opacity-100 text-danger-500 hover:bg-danger-50 rounded-lg transition-all">
                    <font-awesome-icon icon="trash-can" class="text-xs" />
                  </button>
                  <span v-else class="text-[10px] font-bold text-danger-500 px-2 py-0.5 bg-danger-50 rounded border border-danger-100">Anulado</span>
                </div>
              </div>
              <div v-else class="text-center py-6 bg-surface-50 border border-dashed border-border-subtle rounded-xl">
                <p class="text-xs text-text-muted font-medium italic">No hay beneficios registrados para esta matrícula.</p>
              </div>
            </div>

            <!-- Agregar Nuevo Beneficio -->
            <div class="p-5 bg-surface-200 rounded-2xl border border-border-subtle space-y-4">
              <h4 class="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                <font-awesome-icon icon="plus" class="text-[8px]" /> Nuevo Beneficio Especial
              </h4>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-bold text-text-muted uppercase">Tipo</label>
                  <select v-model="newBeneficio.tipo" class="w-full px-3 py-2 bg-surface-50 border border-border-subtle rounded-xl text-sm font-bold outline-none focus:border-primary-500 transition-all">
                    <option value="beca">Beca estudiantil</option>
                    <option value="descuento">Descuento comercial</option>
                  </select>
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-bold text-text-muted uppercase">Método</label>
                  <select v-model="newBeneficio.metodo" class="w-full px-3 py-2 bg-surface-50 border border-border-subtle rounded-xl text-sm font-bold outline-none focus:border-primary-500 transition-all">
                    <option value="porcentual">Porcentual (%)</option>
                    <option value="fijo">Valor Fijo ($)</option>
                  </select>
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-bold text-text-muted uppercase">Valor</label>
                  <input v-model.number="newBeneficio.valor" type="number" class="w-full px-3 py-2 bg-surface-50 border border-border-subtle rounded-xl text-sm font-bold outline-none focus:border-primary-500 transition-all">
                </div>
                <div class="flex items-end pb-1.5">
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" v-model="newBeneficio.aplica_a_inscripcion" class="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 bg-surface-50 border-border-subtle transition-all">
                    <span class="text-[10px] font-bold text-text-main uppercase group-hover:text-primary-600 transition-colors">Aplica a Inscripción</span>
                  </label>
                </div>
              </div>

              <div class="space-y-2">
                <p class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Meses de aplicación (Vigencia)</p>
                <div class="flex flex-wrap gap-2">
                  <button v-for="mIdx in selectedMatricula?.duracion_meses || 12" :key="mIdx" 
                    @click="toggleMes(mIdx)"
                    :class="['w-9 h-9 rounded-xl text-[10px] font-black transition-all border', newBeneficio.meses_aplicacion.includes(mIdx) ? 'bg-primary-600 text-white border-primary-500 shadow-lg shadow-primary-500/30 scale-105' : 'bg-surface-50 text-text-muted border-border-subtle hover:bg-surface-100']">
                    M{{ mIdx }}
                  </button>
                </div>
              </div>

              <button @click="saveBeneficio" class="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary-500/20 active:scale-[0.98]">
                <font-awesome-icon icon="check" class="mr-2" /> Aplicar Beneficio Seleccionado
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>
