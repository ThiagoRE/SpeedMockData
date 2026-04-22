<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUsersStore } from '@/stores/users'
import { useSportsStore } from '@/stores/sports'
import { useEnrollmentsStore } from '@/stores/enrollments'
import { useConfigStore } from '@/stores/config'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const usersStore = useUsersStore()
const sportsStore = useSportsStore()
const enrollmentsStore = useEnrollmentsStore()
const configStore = useConfigStore()

const currentStep = ref(1)
const deportista = ref(null)
const selectedDeportistaId = ref('')

const form = ref({
  sedeId: '',
  tipo: 'inscripcion',
  periodo: '',
  fechaInscripcion: new Date().toISOString().split('T')[0],
  fechaInicio: new Date().toISOString().split('T')[0],
  duracionMeses: 6,
  montoInscripcion: 0,
  montoMensualidad: 0,
  beneficios: [] // { tipo, metodo, valor, meses_aplicacion: [], aplica_a_inscripcion }
})

onMounted(async () => {
  await configStore.init()
  form.value.periodo = configStore.config.matricula?.periodoActual || ''
  
  if (sportsStore.sedes.length > 0) {
    form.value.sedeId = sportsStore.sedes[0].id
    updateTarifasBase()
  }

  if (route.params.deportistaId) {
    const depId = Number(route.params.deportistaId)
    const user = usersStore.deportistas.find(d => d.id === depId)
    if (!user) {
      Swal.fire({ icon: 'error', title: 'Deportista no encontrado', text: 'Serás redirigido.' })
        .then(() => router.push('/athletes'))
      return
    }
    deportista.value = user
    currentStep.value = 1
  } else {
    currentStep.value = 0
  }
})

function updateTarifasBase() {
  const sede = sportsStore.sedes.find(s => s.id === form.value.sedeId)
  if (!sede || !sede.tarifasMatricula) return
  
  const tarifas = sede.tarifasMatricula
  const aplicaCobroInscripcion = configStore.config.matricula?.valor_inscripcion !== false

  form.value.montoInscripcion = aplicaCobroInscripcion 
    ? (form.value.tipo === 'inscripcion' ? (tarifas.tarifaInscripcion || 0) : (tarifas.tarifaRenovacion || 0))
    : 0
    
  form.value.montoMensualidad = tarifas.tarifaMensual || 0
}

const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)

const selectedSede = computed(() => sportsStore.sedes.find(s => s.id === form.value.sedeId))

const proyeccion = computed(() => {
  let totalInscripcion = form.value.montoInscripcion
  let totalMensualidades = form.value.montoMensualidad * form.value.duracionMeses
  let totalBeneficios = 0

  form.value.beneficios.forEach(b => {
    // Aplicar a meses
    b.meses_aplicacion.forEach(mNum => {
      if (mNum <= form.value.duracionMeses) {
        const desc = b.metodo === 'porcentual' ? (form.value.montoMensualidad * (b.valor / 100)) : b.valor
        totalBeneficios += Math.round(desc) // REDONDEO COP
      }
    })
    // Aplicar a inscripción
    if (b.aplica_a_inscripcion) {
      const desc = b.metodo === 'porcentual' ? (form.value.montoInscripcion * (b.valor / 100)) : b.valor
      totalBeneficios += Math.round(desc) // REDONDEO COP
    }
  })

  return {
    subtotal: Math.round(totalInscripcion + totalMensualidades),
    descuentos: Math.round(totalBeneficios),
    neto: Math.round((totalInscripcion + totalMensualidades) - totalBeneficios)
  }
})

function addBeneficio() {
  form.value.beneficios.push({
    tipo: 'beca',
    metodo: 'porcentual',
    valor: 10,
    meses_aplicacion: Array.from({ length: form.value.duracionMeses }, (_, i) => i + 1),
    aplica_a_inscripcion: false
  })
}

function removeBeneficio(index) {
  form.value.beneficios.splice(index, 1)
}

function toggleMesBeneficio(b, num) {
  const pos = b.meses_aplicacion.indexOf(num)
  if (pos === -1) b.meses_aplicacion.push(num)
  else b.meses_aplicacion.splice(pos, 1)
}

function nextStep() {
  if (currentStep.value === 0) {
     if (!selectedDeportistaId.value) {
         Swal.fire({ icon: 'warning', title: 'Selecciona un deportista' })
         return
     }
     deportista.value = usersStore.deportistas.find(d => d.id === Number(selectedDeportistaId.value))
     currentStep.value++
     return
  }
  if (currentStep.value === 1) {
    if (!form.value.sedeId) {
      Swal.fire({ icon: 'warning', title: 'Selecciona una sede' })
      return
    }
    updateTarifasBase()
  }
  currentStep.value++
}

function prevStep() {
  currentStep.value--
}

async function confirmEnrollment() {
  try {
    const res = await enrollmentsStore.crearMatricula({
        ...form.value,
        deportistaId: deportista.value.id
    })
    
    if (res.success) {
      Swal.fire({ icon: 'success', title: 'Matrícula Generada', text: 'Se ha procesado exitosamente la matrícula y sus beneficios.', timer: 2000, showConfirmButton: false })
      .then(() => router.push({ name: 'CurrentAccount', params: { id: deportista.value.id } }))
    }
  } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.message })
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-8 pb-10">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-text-main">Matricular Deportista</h1>
        <p v-if="deportista" class="text-sm text-text-muted mt-1 font-medium">Deportista: <span class="text-primary-600 dark:text-primary-400 font-bold">{{ deportista.name }}</span></p>
        <p v-else class="text-sm text-text-muted mt-1 font-medium">Selecciona un deportista para continuar</p>
      </div>
      
      <!-- Stepper -->
      <div class="flex items-center gap-2">
        <div v-if="currentStep === 0" class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-primary-600 text-white">0</div>
        <div v-if="currentStep === 0" class="h-1 w-8 rounded-full bg-primary-600"></div>
        <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors', currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-surface-200 text-text-muted']">1</div>
        <div :class="['h-1 w-8 rounded-full transition-colors', currentStep >= 2 ? 'bg-primary-600' : 'bg-surface-200']"></div>
        <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors', currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-surface-200 text-text-muted']">2</div>
        <div :class="['h-1 w-8 rounded-full transition-colors', currentStep >= 3 ? 'bg-primary-600' : 'bg-surface-200']"></div>
        <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors', currentStep >= 3 ? 'bg-primary-600 text-white' : 'bg-surface-200 text-text-muted']">3</div>
      </div>
    </div>

    <!-- Step 0: Pick User -->
    <div v-if="currentStep === 0" class="bg-surface-100 p-8 rounded-3xl border border-border-subtle shadow-sm animate-fade-in space-y-6">
       <h2 class="text-lg font-bold text-text-main">Identificación del Deportista</h2>
       <div class="space-y-2">
           <label class="text-[10px] font-bold text-text-muted tracking-widest block uppercase">Seleccionar Deportista</label>
           <select v-model="selectedDeportistaId" class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 outline-none transition-all text-sm font-bold">
               <option value="" disabled>-- Selecciona un Deportista --</option>
               <option v-for="dep in usersStore.deportistas" :key="dep.id" :value="dep.id">{{dep.name}} ({{dep.email}})</option>
           </select>
       </div>
       <div class="mt-6 flex justify-end">
           <button @click="nextStep" class="px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 active:scale-95 transition-all shadow-lg shadow-primary-500/20">Continuar Configuración <font-awesome-icon icon="arrow-right" class="ml-2" /></button>
       </div>
    </div>

    <!-- Step 1: Base settings -->
    <div v-if="currentStep === 1" class="bg-surface-100 p-8 rounded-3xl border border-border-subtle shadow-sm animate-fade-in space-y-6">
       <h2 class="text-lg font-bold text-text-main">Configuración Base</h2>
       <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
              <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block uppercase">Sede</label>
              <select v-model="form.sedeId" @change="updateTarifasBase" class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 outline-none transition-all text-sm font-bold">
                  <option v-for="s in sportsStore.sedes" :key="s.id" :value="s.id">{{s.name}}</option>
              </select>
          </div>
          <div>
              <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block uppercase">Tipo</label>
              <select v-model="form.tipo" @change="updateTarifasBase" class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 outline-none transition-all text-sm font-bold">
                  <option value="inscripcion">Inscripción Nueva</option>
                  <option value="renovacion">Renovación</option>
              </select>
          </div>
          <div>
              <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block uppercase">Periodo</label>
              <input v-model="form.periodo" type="text" class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 outline-none transition-all text-sm font-bold" placeholder="Ej: 2026-I">
          </div>
          <div>
              <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block uppercase">Duración (Meses)</label>
              <input v-model.number="form.duracionMeses" type="number" min="1" max="12" class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 outline-none transition-all text-sm font-bold">
          </div>
          <div v-show="configStore.config.matricula?.valor_inscripcion !== false">
              <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block uppercase">Monto Inscripción</label>
              <input v-model.number="form.montoInscripcion" type="number" class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 outline-none transition-all text-sm font-bold">
          </div>
          <div>
              <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block uppercase">Monto Mensualidad</label>
              <input v-model.number="form.montoMensualidad" type="number" class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 outline-none transition-all text-sm font-bold">
          </div>
          <div>
              <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block uppercase">Fecha de Inicio</label>
              <input v-model="form.fechaInicio" type="date" class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 outline-none transition-all text-sm font-bold">
          </div>
       </div>
       
       <div class="mt-6 flex justify-end">
           <button @click="nextStep" class="px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 active:scale-95 transition-all shadow-lg shadow-primary-500/20">Siguiente <font-awesome-icon icon="arrow-right" class="ml-2" /></button>
       </div>
    </div>

    <!-- Step 2: Beneficios -->
    <div v-if="currentStep === 2" class="bg-surface-100 p-8 rounded-3xl border border-border-subtle shadow-sm animate-fade-in space-y-6">
       <div class="flex items-center justify-between">
           <h2 class="text-lg font-bold text-text-main">Gestión de Beneficios</h2>
           <button @click="addBeneficio" class="px-4 py-2 bg-accent-600 text-white text-xs font-bold rounded-xl hover:bg-accent-700 transition-all shadow-md">
             <font-awesome-icon icon="plus" class="mr-2" /> Agregar Beneficio
           </button>
       </div>
       
       <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div class="lg:col-span-2 space-y-4">
                <div v-for="(b, idx) in form.beneficios" :key="idx" class="p-5 bg-surface-50 border border-border-subtle rounded-2xl space-y-4 relative group">
                  <button @click="removeBeneficio(idx)" class="absolute top-4 right-4 text-text-muted hover:text-danger-500 transition-colors">
                    <font-awesome-icon icon="trash" />
                  </button>
                  
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div class="col-span-1">
                      <label class="text-[9px] font-bold text-text-muted uppercase tracking-widest">Tipo</label>
                      <select v-model="b.tipo" class="w-full bg-transparent border-b border-border-subtle text-sm font-bold py-1 outline-none">
                        <option value="beca">Beca</option>
                        <option value="descuento">Descuento</option>
                      </select>
                    </div>
                    <div class="col-span-1">
                      <label class="text-[9px] font-bold text-text-muted uppercase tracking-widest">Método</label>
                      <select v-model="b.metodo" class="w-full bg-transparent border-b border-border-subtle text-sm font-bold py-1 outline-none">
                        <option value="porcentual">Porcentual (%)</option>
                        <option value="fijo">Valor Fijo ($)</option>
                      </select>
                    </div>
                    <div class="col-span-1">
                      <label class="text-[9px] font-bold text-text-muted uppercase tracking-widest">Valor</label>
                      <input v-model.number="b.valor" type="number" class="w-full bg-transparent border-b border-border-subtle text-sm font-bold py-1 outline-none">
                    </div>
                    <div class="col-span-1 flex items-end pb-1">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" v-model="b.aplica_a_inscripcion">
                        <span class="text-[10px] font-bold text-text-main uppercase">Inscripción</span>
                      </label>
                    </div>
                  </div>

                  <div class="space-y-2">
                    <p class="text-[9px] font-bold text-text-muted uppercase tracking-widest">Meses de aplicación</p>
                    <div class="flex flex-wrap gap-2">
                      <button v-for="mIdx in form.duracionMeses" :key="mIdx" 
                        @click="toggleMesBeneficio(b, mIdx)"
                        :class="['w-8 h-8 rounded-lg text-[10px] font-bold transition-all', b.meses_aplicacion.includes(mIdx) ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20' : 'bg-surface-200 text-text-muted hover:bg-surface-300']">
                        M{{ mIdx }}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div v-if="form.beneficios.length === 0" class="text-center py-10 border-2 border-dashed border-border-subtle rounded-3xl">
                  <font-awesome-icon icon="tags" class="text-3xl text-text-muted/30 mb-2" />
                  <p class="text-sm text-text-muted font-medium">No se han aplicado beneficios aún.</p>
                </div>
           </div>
           
           <div class="bg-surface-200 rounded-3xl border border-border-subtle p-6 h-fit sticky top-6">
               <h3 class="text-sm font-bold text-text-main mb-4 border-b border-border-subtle pb-2">Resumen Financiero</h3>
               <div class="space-y-4">
                  <div class="flex justify-between text-sm">
                      <span class="text-text-muted font-bold">Subtotal Bruto:</span>
                      <span class="font-bold text-text-main">{{formatCurrency(proyeccion.subtotal)}}</span>
                  </div>
                  <div class="flex justify-between text-sm p-2 bg-success-500/10 rounded-lg">
                      <span class="text-success-600 font-bold">Beneficios:</span>
                      <span class="font-bold text-success-700">- {{formatCurrency(proyeccion.descuentos)}}</span>
                  </div>
                  
                  <div class="flex justify-between items-center text-xl font-black border-t border-border-subtle pt-4 mt-4">
                      <span class="text-primary-600 leading-tight">Total <br><span class="text-[10px] tracking-widest uppercase">A Cargo</span></span>
                      <span>{{formatCurrency(proyeccion.neto)}}</span>
                  </div>
               </div>
           </div>
       </div>

       <div class="mt-6 flex justify-between">
           <button @click="prevStep" class="px-6 py-3 bg-surface-200 text-text-main rounded-2xl font-bold hover:bg-surface-300 transition-all"><font-awesome-icon icon="arrow-left" class="mr-2" /> Anterior</button>
           <button @click="nextStep" class="px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 active:scale-95 transition-all shadow-lg shadow-primary-500/20">Siguiente <font-awesome-icon icon="arrow-right" class="ml-2" /></button>
       </div>
    </div>

    <!-- Step 3: Confirmación -->
    <div v-if="currentStep === 3" class="bg-surface-100 p-8 rounded-3xl border border-border-subtle shadow-sm animate-fade-in space-y-6">
       <h2 class="text-lg font-bold text-text-main">Confirmar Matrícula</h2>
       
       <div class="bg-warning-50 border border-warning-200 p-6 rounded-2xl">
            <div class="flex gap-4">
                <font-awesome-icon icon="circle-info" class="text-warning-600 text-xl mt-1" />
                <div class="space-y-3">
                   <p class="text-sm font-bold text-warning-800">Verificación de Obligaciones Financieras</p>
                   <p class="text-[11px] font-bold text-warning-700/80 leading-relaxed">
                      Al confirmar esta operación, el sistema generará:
                   </p>
                   <ul class="text-[11px] font-bold text-warning-700/80 list-disc ml-4 space-y-1">
                      <li v-if="form.montoInscripcion > 0">1 cargo de {{form.tipo === 'inscripcion' ? 'inscripción' : 'renovación'}} por {{formatCurrency(form.montoInscripcion)}}.</li>
                      <li>{{form.duracionMeses}} mensualidades de {{formatCurrency(form.montoMensualidad)}} cada una.</li>
                      <li v-if="form.beneficios.length > 0">{{form.beneficios.length}} beneficios aplicados con sus respectivos documentos de crédito.</li>
                   </ul>
                </div>
            </div>
       </div>

       <div class="mt-6 flex justify-between">
           <button @click="prevStep" class="px-6 py-3 bg-surface-200 text-text-main rounded-2xl font-bold hover:bg-surface-300 transition-all"><font-awesome-icon icon="arrow-left" class="mr-2" /> Anterior</button>
           <button @click="confirmEnrollment" class="px-6 py-3 bg-success-600 text-white rounded-2xl font-bold hover:bg-success-700 active:scale-95 transition-all shadow-lg shadow-success-500/20"> Confirmar y Matricular <font-awesome-icon icon="check" class="ml-2" /></button>
       </div>
    </div>

  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
