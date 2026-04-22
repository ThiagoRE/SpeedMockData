<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUsersStore } from '@/stores/users'
import { useFinanceStore } from '@/stores/finance'
import { useSportsStore } from '@/stores/sports'
import { useHealthStore } from '@/stores/health'
import { mockSports } from '@/data/mockData'
import PerformanceRadarChart from '@/components/health/PerformanceRadarChart.vue'
import DigitalIDCard from '@/components/athletes/DigitalIDCard.vue'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const usersStore = useUsersStore()
const finance = useFinanceStore()
const sports = useSportsStore()
const healthStore = useHealthStore()

const userId = computed(() => Number(route.params.id))
const member = computed(() => usersStore.getUserById(userId.value))

const memberCharges = computed(() => finance.getChargesByUser(userId.value))
const pendingDebt = computed(() => memberCharges.value.filter(c => c.status === 'Pendiente' || c.status === 'Vencido').reduce((s, c) => s + c.amount, 0))
const paidTotal = computed(() => memberCharges.value.filter(c => c.status === 'Pagado').reduce((s, c) => s + c.amount, 0))

const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)
const getSportName = (id) => mockSports.find(s => s.id === id)?.name || ''
const getSportPseudonym = (id) => mockSports.find(s => s.id === id)?.studentPseudonym || 'Estudiante'
const getSportColor = (id) => mockSports.find(s => s.id === id)?.color || '#999'

const statusColors = {
  'Pagado': 'bg-success-100 dark:bg-success-950/30 text-success-700 dark:text-success-400',
  'Pendiente': 'bg-warning-100 dark:bg-warning-950/30 text-warning-700 dark:text-warning-400',
  'Vencido': 'bg-danger-100 dark:bg-danger-950/30 text-danger-700 dark:text-danger-400'
}

// Tabs Logic
const activeTab = ref('general')
const tabs = [
  { id: 'general', name: 'General', icon: 'user' },
  { id: 'salud', name: 'Salud & Nutrición', icon: 'heart-pulse' },
  { id: 'deporte', name: 'Deporte', icon: 'futbol' },
  { id: 'finanzas', name: 'Finanzas', icon: 'money-bill-wave' }
]

// Health & Biometrics
const healthRecord = computed(() => healthStore.getHealthByUserId(userId.value))
const measurements = computed(() => healthStore.getMeasurementsByUserId(userId.value))
const latestMeasurement = computed(() => healthStore.getLatestMeasurement(userId.value))
const latestTest = computed(() => healthStore.getLatestPhysicalTest(userId.value))
const injuries = computed(() => healthStore.getInjuriesByUserId(userId.value))
const activeInjuries = computed(() => healthStore.getActiveInjuriesByUserId(userId.value))

// Biometrics Trend Chart
const biometricsSeries = computed(() => {
  if (!measurements.value.length) return []
  return [
    { name: 'Peso (kg)', data: measurements.value.map(m => ({ x: m.date, y: m.weight })) },
    { name: 'Talla (m)', data: measurements.value.map(m => ({ x: m.date, y: m.height * 50 })) } // Scale for visibility
  ]
})

const biometricsOptions = computed(() => ({
  chart: { type: 'line', height: 350, toolbar: { show: false }, fontFamily: 'Outfit, sans-serif' },
  stroke: { curve: 'smooth', width: 3 },
  xaxis: { type: 'datetime' },
  yaxis: { show: false },
  colors: ['#3b82f6', '#10b981'],
  markers: { size: 5 }
}))

// Member assignment state
const showAssignmentModal = ref(false)
const assignmentForm = ref({ categoryId: member.value?.categoryId || null, positionId: member.value?.positionId || '' })

function saveAssignment() {
  usersStore.updateUserTeamPosition(userId.value, assignmentForm.value.categoryId, assignmentForm.value.positionId)
  showAssignmentModal.value = false
  Swal.fire({ icon: 'success', title: 'Ficha técnica actualizada', timer: 1200, showConfirmButton: false })
}

const currentTeam = computed(() => sports.getCategoryById(member.value?.categoryId))
const currentPosition = computed(() => {
  if (!member.value?.categoryId || !member.value?.positionId) return null
  const team = sports.getCategoryById(member.value.categoryId)
  const lineup = sports.getLineupById(team?.lineupId)
  return lineup?.positions.find(p => p.id === member.value.positionId)
})

const showIDCard = ref(false)

const memberPerformance = computed(() => {
  return sports.performance
    .filter(p => p.athleteId === userId.value)
    .map(p => {
      const match = sports.matches.find(m => m.id === p.matchId)
      const tournament = sports.tournaments.find(t => t.id === match?.tournamentId)
      const sport = sports.getSportById(tournament?.sportId)
      const team = sports.getCategoryById(p.categoryId)
      return { ...p, match, tournament, sport, team }
    })
})
</script>

<template>
  <div class="space-y-6" v-if="member">
    <button @click="router.back()"
      class="flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-primary-600 tracking-widest transition-all group">
      <font-awesome-icon icon="chevron-left" class="group-hover:-translate-x-1 transition-transform" />
      Volver al directorio
    </button>

    <!-- Profile Header -->
    <div
      class="bg-surface-100 rounded-[2.5rem] border border-border-subtle shadow-sm overflow-hidden transition-colors">
      <div class="h-56 bg-surface-200 relative overflow-hidden">
        <img v-if="member.coverImage" :src="member.coverImage"
          class="w-full h-full object-cover grayscale-20 group-hover:grayscale-0 transition-all duration-700">
        <div v-else class="w-full h-full bg-linear-to-r from-primary-600 via-accent-600 to-primary-800 opacity-90">
        </div>
        <div class="absolute inset-0 bg-linear-to-t from-surface-100/80 to-transparent"></div>
      </div>
      <div class="px-8 pb-8 -mt-16 relative z-10">
        <div class="flex flex-col sm:flex-row sm:items-end gap-6">
          <div
            class="w-32 h-32 rounded-4xl bg-surface-100 shadow-2xl flex items-center justify-center text-4xl font-semibold text-primary-600 dark:text-primary-400 border-4 border-surface-100 overflow-hidden ring-4 ring-primary-500/10 transition-transform hover:scale-105 duration-300">
            <img v-if="member.profileImage" :src="member.profileImage" class="w-full h-full object-cover">
            <span v-else>{{member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}}</span>
          </div>
          <div class="flex-1 pb-2">
            <h1 class="text-3xl font-semibold text-text-main tracking-tight">{{ member.name }}</h1>
            <div class="flex flex-wrap items-center gap-3 mt-2">
              <span
                :class="['text-[10px] font-semibold px-3 py-1 rounded-full tracking-widest shadow-sm', member.status === 'activo' ? 'bg-success-100 dark:bg-success-950/30 text-success-700 dark:text-success-400' : 'bg-danger-100 dark:bg-danger-950/30 text-danger-700 dark:text-danger-400']">
                {{ member.status === 'activo' ? 'Socio Activo' : 'Socio Inactivo' }}
              </span>

            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-10 pt-6 border-t border-border-subtle border-dashed">
          <div class="space-y-1">
            <span class="text-[10px] font-semibold text-text-muted tracking-widest opacity-60 block">Email de
              contacto</span>
            <span class="text-sm font-semibold text-text-main flex items-center gap-2">
              <font-awesome-icon icon="envelope" class="opacity-30" /> {{ member.email }}
            </span>
          </div>
          <div class="space-y-1">
            <span class="text-[10px] font-semibold text-text-muted tracking-widest opacity-60 block">Teléfono
              Principal</span>
            <span class="text-sm font-semibold text-text-main flex items-center gap-2">
              <font-awesome-icon icon="phone" class="opacity-30" /> {{ member.phone }}
            </span>
          </div>
          <div class="space-y-1">
            <span class="text-[10px] font-semibold text-text-muted tracking-widest opacity-60 block">Nro
              Documento</span>
            <span class="text-sm font-semibold text-text-main flex items-center gap-2">
              <font-awesome-icon icon="id-card" class="opacity-30" /> {{ member.documentType || 'CC' }} {{
                member.documentNumber || member.document }}
            </span>
          </div>
          <div class="space-y-1">
            <span class="text-[10px] font-semibold text-text-muted tracking-widest opacity-60 block">Fecha
              Inscripción</span>
            <span class="text-sm font-semibold text-text-main flex items-center gap-2">
              <font-awesome-icon icon="calendar" class="opacity-30" /> {{ member.enrollmentDate }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <div class="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
        :class="['flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-bold tracking-widest transition-all shrink-0', activeTab === tab.id ? 'bg-primary-600 text-white shadow-xl shadow-primary-500/25 -translate-y-1' : 'bg-surface-100 text-text-muted hover:bg-surface-200 border border-border-subtle']">
        <font-awesome-icon :icon="tab.icon" />
        {{ tab.name }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div class="lg:col-span-2 space-y-8">

        <!-- GENERAL TAB -->
        <div v-if="activeTab === 'general'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <!-- Basic Info Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              class="bg-surface-100 rounded-4xl border border-border-subtle p-8 flex items-center gap-6 group hover:shadow-xl transition-all">
              <div
                class="w-16 h-16 bg-primary-100 dark:bg-primary-950/30 rounded-2xl flex items-center justify-center text-2xl text-primary-600">
                <font-awesome-icon icon="heart-pulse" />
              </div>
              <div>
                <div class="flex items-center gap-2 mt-4">
                  <span
                    class="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg text-xs font-bold tracking-wider">
                    Socio #{{ member.id }}
                  </span>
                  <button @click="showIDCard = true"
                    class="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-slate-950/20">
                    <font-awesome-icon icon="id-card" />
                    Ver Carnet Digital
                  </button>
                </div>
                <p class="text-[9px] font-bold text-text-muted tracking-widest opacity-60">Tipo de Sangre</p>
                <p class="text-2xl font-bold text-text-main">{{ healthRecord?.bloodType || '--' }}</p>
              </div>
            </div>
            <div
              class="bg-surface-100 rounded-4xl border border-border-subtle p-8 flex items-center gap-6 group hover:shadow-xl transition-all">
              <div
                class="w-16 h-16 bg-warning-100 dark:bg-warning-950/30 rounded-2xl flex items-center justify-center text-2xl text-warning-600">
                <font-awesome-icon icon="triangle-exclamation" />
              </div>
              <div>
                <p class="text-[9px] font-bold text-text-muted tracking-widest opacity-60">Alergias Detectadas</p>
                <p class="text-sm font-bold text-text-main line-clamp-1">{{ healthRecord?.allergies?.join(', ') ||
                  'Ninguna conocida' }}</p>
              </div>
            </div>
          </div>

          <!-- Sports Enrollment -->
          <div class="bg-surface-100 rounded-4xl border border-border-subtle shadow-sm p-8">
            <h3 class="text-base font-bold text-text-main tracking-tighter mb-8 flex items-center gap-4">
              <div
                class="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/40">
                <font-awesome-icon icon="futbol" />
              </div>
              Disciplinas Inscritas
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div v-for="sportId in member.sports" :key="sportId"
                class="flex items-center gap-4 bg-surface-50 p-6 rounded-3xl border border-border-subtle overflow-hidden relative group">
                <div
                  class="absolute inset-0 bg-linear-to-r from-transparent to-surface-100 opacity-0 group-hover:opacity-100 transition-opacity">
                </div>
                <div
                  class="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg shadow-lg relative z-10"
                  :style="{ backgroundColor: getSportColor(sportId) }">
                  <font-awesome-icon :icon="mockSports.find(s => s.id === sportId)?.icon || 'futbol'" />
                </div>
                <div class="relative z-10">
                  <p class="text-xs font-bold text-text-main tracking-tight">{{ getSportName(sportId) }}</p>
                  <p class="text-[9px] font-bold text-text-muted tracking-widest">{{ getSportPseudonym(sportId) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SALUD TAB -->
        <div v-if="activeTab === 'salud'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <!-- Medical Summary -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Health Card -->
            <div class="bg-surface-100 rounded-4xl border border-border-subtle p-10 space-y-8 relative overflow-hidden">
              <div
                class="absolute -top-10 -right-10 w-40 h-40 bg-linear-to-br from-primary-500/10 to-transparent rounded-full blur-3xl">
              </div>
              <h3
                class="text-xl font-bold text-text-main tracking-tighter flex items-center gap-4 border-b border-border-subtle pb-6">
                <font-awesome-icon icon="stethoscope" class="text-primary-600" /> Expediente Médico
              </h3>
              <div class="grid grid-cols-2 gap-8">
                <div>
                  <p class="text-[9px] font-bold text-text-muted tracking-widest opacity-50 mb-2">Seguridad Social / EPS
                  </p>
                  <p class="text-sm font-bold text-text-main">{{ healthRecord?.insuranceCompany || 'No registra' }}</p>
                </div>
                <div>
                  <p class="text-[9px] font-bold text-text-muted tracking-widest opacity-50 mb-2">Contacto Emergencia
                  </p>
                  <p class="text-sm font-bold text-text-main">{{ healthRecord?.emergencyContactName || '--' }}</p>
                  <p class="text-[10px] font-bold text-primary-600 mt-1 tabular-nums">{{
                    healthRecord?.emergencyContactPhone || '--' }}</p>
                </div>
                <div
                  class="col-span-2 p-4 bg-danger-50 dark:bg-danger-950/20 border border-danger-100 dark:border-danger-900/30 rounded-2xl flex gap-4">
                  <font-awesome-icon icon="lungs" class="text-danger-600 mt-1" />
                  <div>
                    <p class="text-[9px] font-bold text-danger-700 tracking-widest">Condiciones Crónicas</p>
                    <p class="text-xs font-bold text-danger-900 dark:text-danger-400 mt-1">{{
                      healthRecord?.chronicDiseases || 'Ninguna reportada' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Latest Measurements -->
            <div class="bg-surface-100 rounded-4xl border border-border-subtle p-10 space-y-8">
              <h3
                class="text-xl font-bold text-text-main tracking-tighter flex items-center gap-4 border-b border-border-subtle pb-6">
                <font-awesome-icon icon="ruler-vertical" class="text-primary-600" /> Última Evaluación
              </h3>
              <div class="grid grid-cols-4 gap-4">
                <div v-for="stat in [
                  { label: 'Talla', val: latestMeasurement?.height, unit: 'm', icon: 'ruler-vertical' },
                  { label: 'Peso', val: latestMeasurement?.weight, unit: 'kg', icon: 'weight-scale' },
                  { label: 'IMC', val: latestMeasurement?.bmi, unit: '', icon: 'chart-pie' },
                  { label: 'Grasa', val: latestMeasurement?.bodyFatPercentage, unit: '%', icon: 'circle' },
                ]" :key="stat.label"
                  class="bg-surface-50 p-4 rounded-2xl text-center border border-border-subtle transition-all hover:bg-surface-0 hover:shadow-lg group">
                  <font-awesome-icon :icon="stat.icon"
                    class="text-primary-500 mb-3 opacity-30 group-hover:opacity-100" />
                  <p class="text-lg font-bold text-text-main tabular-nums">{{ stat.val || '--' }}<span
                      class="text-[10px] ml-0.5 opacity-40">{{ stat.unit }}</span></p>
                  <p class="text-[8px] font-bold text-text-muted tracking-widest opacity-60 mt-1">{{ stat.label }}</p>
                </div>
              </div>
              <div v-if="activeInjuries.length"
                class="p-5 bg-warning-50 dark:bg-warning-950/20 border border-warning-200 rounded-3xl flex items-center gap-4">
                <div
                  class="w-12 h-12 bg-warning-100 dark:bg-warning-900 rounded-full flex items-center justify-center text-warning-600 animate-pulse">
                  <font-awesome-icon icon="bandage" />
                </div>
                <div>
                  <p class="text-[9px] font-bold text-warning-700 tracking-widest">Lesión Activa</p>
                  <p class="text-xs font-bold text-warning-900 dark:text-warning-300">{{ activeInjuries[0].type }} - {{
                    activeInjuries[0].recoveryStatus }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Performance Radar & Bio Chart -->
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div class="bg-surface-100 rounded-4xl border border-border-subtle p-10 space-y-6">
              <h3 class="text-base font-bold text-text-main tracking-tighter">Capacidades Físicas</h3>
              <PerformanceRadarChart v-if="latestTest" :stats="latestTest" />
              <div v-else class="h-[300px] flex items-center justify-center text-text-muted opacity-30 italic text-sm">
                Sin tests recientes</div>
            </div>
            <div class="bg-surface-100 rounded-4xl border border-border-subtle p-10 space-y-6">
              <h3 class="text-base font-bold text-text-main tracking-tighter">Tendencia Antropométrica</h3>
              <apexchart v-if="measurements.length" height="300" :options="biometricsOptions"
                :series="biometricsSeries" />
              <div v-else class="h-[300px] flex items-center justify-center text-text-muted opacity-30 italic text-sm">
                Sin historial de medidas</div>
            </div>
          </div>
        </div>

        <!-- DEPORTE TAB -->
        <div v-if="activeTab === 'deporte'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div
            class="bg-surface-100 rounded-4xl border border-border-subtle p-10 flex justify-between items-center bg-linear-to-r from-accent-600 to-accent-800 text-white shadow-xl shadow-accent-500/20">
            <div class="flex items-center gap-8">
              <div
                class="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-3xl">
                <font-awesome-icon icon="clipboard-user" />
              </div>
              <div>
                <h3 class="text-2xl font-bold tracking-tighter">{{ currentTeam?.name || 'No asignado a Categoría' }}
                </h3>
                <p class="text-sm font-bold opacity-80 tracking-widest mt-1">{{ currentPosition?.name || 'Sin Posición'
                  }}</p>
              </div>
            </div>
            <button @click="showAssignmentModal = true"
              class="px-8 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-lg rounded-2xl text-xs font-bold tracking-widest transition-all">Modificar
              Ficha</button>
          </div>

          <!-- Performance Table -->
          <div
            class="bg-surface-100 rounded-4xl border border-border-subtle shadow-sm overflow-hidden transition-colors">
            <div class="px-8 py-6 border-b border-border-subtle bg-surface-50/50">
              <h3 class="text-sm font-bold text-text-main tracking-widest flex items-center gap-3">
                <font-awesome-icon icon="chart-line" /> Rendimiento en Partidos
              </h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead>
                  <tr class="bg-surface-50 border-b border-border-subtle">
                    <th class="px-8 py-4 text-[9px] font-bold text-text-muted tracking-widest">Torneo</th>
                    <th class="px-8 py-4 text-center text-[9px] font-bold text-text-muted tracking-widest">Goles</th>
                    <th class="px-8 py-4 text-center text-[9px] font-bold text-text-muted tracking-widest">Asist</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border-subtle">
                  <tr v-for="p in memberPerformance" :key="p.id"
                    class="hover:bg-surface-50 transition-colors group text-sm">
                    <td class="px-8 py-6">
                      <p class="font-bold text-text-main tracking-tighter">{{ p.tournament?.name }}</p>
                      <p class="text-[10px] text-text-muted font-bold opacity-60">{{ p.team?.name }}</p>
                    </td>
                    <td class="px-8 py-4 text-center font-bold text-primary-600 tabular-nums text-xl">{{ p.annotations
                      }}</td>
                    <td class="px-8 py-4 text-center font-bold text-text-main tabular-nums opacity-60 text-xl">{{
                      p.assists }}</td>
                  </tr>
                  <tr v-if="!memberPerformance.length">
                    <td colspan="3"
                      class="px-8 py-12 text-center text-text-muted opacity-30 italic font-bold tracking-widest">Sin
                      registros competitivos</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- FINANZAS TAB -->
        <div v-if="activeTab === 'finanzas'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              class="bg-surface-100 rounded-4xl border border-border-subtle p-8 flex items-center justify-between group hover:shadow-xl transition-all">
              <div class="flex items-center gap-6">
                <div
                  class="w-14 h-14 bg-success-100 rounded-2xl flex items-center justify-center text-xl text-success-600 shadow-sm">
                  <font-awesome-icon icon="circle-check" />
                </div>
                <div>
                  <p class="text-[9px] font-bold text-text-muted tracking-widest opacity-60">Total Recaudado</p>
                  <p class="text-2xl font-bold text-success-600 tabular-nums">{{ formatCurrency(paidTotal) }}</p>
                </div>
              </div>
            </div>
            <div
              class="bg-surface-100 rounded-4xl border border-border-subtle p-8 flex items-center justify-between group hover:shadow-xl transition-all border-l-4 border-l-danger-500">
              <div class="flex items-center gap-6">
                <div
                  class="w-14 h-14 bg-danger-100 rounded-2xl flex items-center justify-center text-xl text-danger-600 shadow-sm">
                  <font-awesome-icon icon="money-bill-wave" />
                </div>
                <div>
                  <p class="text-[9px] font-bold text-text-muted tracking-widest opacity-60">Saldo Pendiente</p>
                  <p class="text-2xl font-bold text-danger-600 tabular-nums">{{ formatCurrency(pendingDebt) }}</p>
                </div>
              </div>
            </div>
          </div>

          <div
            class="bg-surface-100 rounded-4xl border border-border-subtle shadow-sm overflow-hidden transition-colors">
            <div class="px-8 py-6 border-b border-border-subtle bg-surface-50/50">
              <h3 class="text-sm font-bold text-text-main tracking-widest flex items-center gap-3">
                <font-awesome-icon icon="receipt" /> Movimientos en Cartera
              </h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead>
                  <tr class="bg-surface-50 border-b border-border-subtle">
                    <th class="px-8 py-4 text-[9px] font-bold text-text-muted tracking-widest">Concepto / Fecha</th>
                    <th class="px-8 py-4 text-right text-[9px] font-bold text-text-muted tracking-widest">Monto</th>
                    <th class="px-8 py-4 text-center text-[9px] font-bold text-text-muted tracking-widest">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border-subtle">
                  <tr v-for="c in memberCharges" :key="c.id" class="hover:bg-surface-50 transition-colors group">
                    <td class="px-8 py-5 min-w-[200px]">
                      <p class="text-xs font-bold text-text-main tracking-tighter">{{ c.concept }}</p>
                      <p class="text-[9px] font-bold text-text-muted opacity-60 italic mt-1">{{ c.date }}</p>
                    </td>
                    <td class="px-8 py-5 text-right text-sm font-bold text-text-main tabular-nums">{{
                      formatCurrency(c.amount) }}</td>
                    <td class="px-8 py-5 text-center">
                      <span
                        :class="['text-[9px] font-bold px-4 py-1.5 rounded-full tracking-tighter shadow-sm border', statusColors[c.status]]">{{
                        c.status }}</span>
                    </td>
                  </tr>
                  <tr v-if="!memberCharges.length">
                    <td colspan="3"
                      class="px-8 py-16 text-center text-text-muted opacity-30 italic font-bold tracking-widest">Sin
                      transacciones registradas</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Contextual Sidebar -->
      <div class="space-y-8 lg:sticky lg:top-8">
        <!-- Global Performance -->
        <div class="bg-surface-100 rounded-4xl border border-border-subtle shadow-xl p-8 space-y-6">
          <h3 class="text-sm font-bold text-text-main tracking-widest flex items-center gap-3">
            <font-awesome-icon icon="rocket" class="text-accent-500" /> Métricas Globales
          </h3>
          <div class="space-y-4">
            <div v-for="stat in [
              { label: 'Disciplinas', val: member.sports?.length || 0, icon: 'futbol', color: 'text-primary-500' },
              { label: 'Movimientos', val: memberCharges.length, icon: 'receipt', color: 'text-success-500' },
              { label: 'Partidos', val: memberPerformance.length, icon: 'trophy', color: 'text-warning-500' },
            ]" :key="stat.label"
              class="flex justify-between items-center bg-surface-50 p-4 rounded-2xl border border-border-subtle/50 transition-all hover:bg-surface-0">
              <div class="flex items-center gap-3">
                <font-awesome-icon :icon="stat.icon" :class="[stat.color, 'opacity-40']" />
                <span class="text-[9px] font-bold text-text-muted tracking-widest">{{ stat.label }}</span>
              </div>
              <span class="text-lg font-bold text-text-main tabular-nums">{{ stat.val }}</span>
            </div>

            <div
              class="bg-primary-600 p-6 rounded-3xl shadow-xl shadow-primary-500/20 text-white flex justify-between items-center group overflow-hidden relative">
              <div
                class="absolute -right-4 -bottom-4 text-white/5 text-6xl group-hover:scale-125 transition-transform duration-700">
                <font-awesome-icon icon="futbol" />
              </div>
              <div class="relative z-10">
                <p class="text-[9px] font-bold text-white/60 tracking-widest">Total Goles</p>
                <p class="text-3xl font-bold tabular-nums mt-1">{{memberPerformance.reduce((s, p) => s + p.annotations,
                  0) }}</p>
              </div>
              <font-awesome-icon icon="star" class="text-2xl text-warning-400 relative z-10 animate-bounce" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Assignment Modal -->
    <Teleport to="body">
      <div v-if="showAssignmentModal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        @click.self="showAssignmentModal = false">
        <div
          class="bg-surface-100 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-border-subtle transition-all transform scale-100">
          <div class="px-8 py-6 border-b border-border-subtle bg-surface-50/50 flex justify-between items-center">
            <h2 class="text-lg font-semibold text-text-main tracking-widest">Ficha Técnica</h2>
            <button @click="showAssignmentModal = false" class="text-text-muted hover:text-text-main transition-colors">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>
          <div class="p-8 space-y-6">
            <div>
              <label class="text-[10px] font-semibold text-text-muted tracking-widest mb-2 block opacity-60">Asignar
                Categoría</label>
              <select v-model="assignmentForm.categoryId"
                class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 outline-none text-text-main appearance-none cursor-pointer text-sm font-semibold">
                <option :value="null">Sin Categoría / Disciplina</option>
                <option v-for="t in sports.categories" :key="t.id" :value="t.id">{{ t.name }} ({{
                  getSportName(t.sportId) }})</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] font-semibold text-text-muted tracking-widest mb-2 block opacity-60">Posición en
                Campo</label>
              <select v-model="assignmentForm.positionId"
                class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 outline-none text-text-main appearance-none cursor-pointer text-sm font-semibold">
                <option value="">Sin Posición Específica</option>
                <optgroup v-if="assignmentForm.categoryId" label="Posiciones Disponibles">
                  <option
                    v-for="pos in sports.getLineupById(sports.getCategoryById(assignmentForm.categoryId)?.lineupId)?.positions"
                    :key="pos.id" :value="pos.id">
                    {{ pos.name }}
                  </option>
                </optgroup>
              </select>
            </div>
            <div class="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-border-subtle mt-4">
              <button @click="showAssignmentModal = false"
                class="flex-1 py-4 border border-border-subtle rounded-2xl text-sm font-semibold text-text-muted hover:bg-surface-200 transition-all active:scale-95 tracking-widest">
                Cancelar
              </button>
              <button @click="saveAssignment"
                class="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-semibold text-sm hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all active:scale-95 tracking-widest">
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
    <!-- Digital ID Card Modal -->
    <DigitalIDCard v-if="member" :show="showIDCard" :member="member" @close="showIDCard = false" />
  </div>
</template>
