<template>
  <div class="trainings-view p-6 bg-surface-50 min-h-screen">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-bold text-text-main flex items-center gap-3">
          <font-awesome-icon icon="calendar-check" class="text-primary-600" />
          Planificación de Entrenamientos
        </h1>
        <p class="text-text-muted mt-1">Organiza el seguimiento deportivo de tus equipos</p>
      </div>

      <div class="flex items-center gap-3 bg-surface-100 p-2 rounded-2xl shadow-sm border border-border-subtle">
        <button @click="prevMonth" class="p-2 hover:bg-surface-200 rounded-xl transition-colors text-text-muted">
          <font-awesome-icon icon="chevron-left" />
        </button>
        <span class="text-lg font-bold px-4 min-w-[160px] text-center text-text-main">
          {{ monthName }} {{ currentYear }}
        </span>
        <button @click="nextMonth" class="p-2 hover:bg-surface-200 rounded-xl transition-colors text-text-muted">
          <font-awesome-icon icon="chevron-right" />
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- Calendar Grid -->
      <div class="lg:col-span-3">
        <div
          class="bg-surface-100 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-border-subtle overflow-hidden backdrop-blur-xl bg-opacity-90 dark:bg-opacity-70">
          <!-- Days Header -->
          <div class="grid grid-cols-7 border-b border-border-subtle bg-surface-50/50 dark:bg-transparent">
            <div v-for="day in ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']" :key="day"
              class="py-4 text-center text-xs font-bold text-text-muted tracking-widest">
              {{ day }}
            </div>
          </div>

          <!-- Days Grid -->
          <div class="grid grid-cols-7">
            <div v-for="(date, index) in calendarDays" :key="index" @click="selectDate(date)"
              class="min-h-[120px] p-2 border-r border-b border-border-subtle relative transition-all cursor-pointer hover:bg-surface-50 group"
              :class="[
                !date.isCurrentMonth ? 'bg-surface-200/30 text-text-muted/40' : 'text-text-main',
                isSelected(date) ? 'ring-2 ring-inset ring-primary-500 bg-primary-50/30 dark:bg-primary-900/10' : ''
              ]">
              <div class="flex justify-between items-start">
                <span
                  class="text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                  :class="isToday(date) ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : ''">
                  {{ date.day }}
                </span>
              </div>

              <!-- Training Indicators -->
              <div class="mt-2 space-y-1 overflow-y-auto max-h-[70px] custom-scrollbar">
                <div v-for="training in getTrainingsForDate(date)" :key="training.id"
                  class="text-[10px] px-2 py-1 rounded-lg flex items-center gap-1.5 transition-all transform hover:scale-102"
                  :style="{ backgroundColor: getSportColor(training.sportId) + '20', color: getSportColor(training.sportId) }">
                  <div class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: getSportColor(training.sportId) }">
                  </div>
                  <span class="truncate font-semibold">{{ training.court }}</span>
                </div>
              </div>

              <!-- Add Plus Icon on Hover -->
              <div class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div
                  class="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md">
                  <font-awesome-icon icon="plus" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar: Day Details -->
      <div class="lg:col-span-1 space-y-6">
        <div
          class="bg-surface-100 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-border-subtle p-6 backdrop-blur-xl">
          <div v-if="selectedDateObj">
            <h2 class="text-xl font-bold text-text-main mb-4">
              {{ formatSelectedDate }}
            </h2>

            <!-- Sedes con entrenamientos -->
            <div class="space-y-4">
              <div v-if="selectedDateTrainings.length > 0">
                <p class="text-xs font-bold text-text-muted tracking-wider mb-3">Entrenamientos Programados</p>
                <div v-for="training in selectedDateTrainings" :key="training.id" @click="goToTraining(training.id)"
                  class="p-4 rounded-2xl bg-surface-50 hover:bg-surface-200/50 transition-all cursor-pointer border border-border-subtle group">
                  <div class="flex justify-between items-start mb-2">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      :style="{ color: getSportColor(training.sportId), backgroundColor: getSportColor(training.sportId) + '15' }">
                      {{ getSportName(training.sportId) }}
                    </span>
                    <span class="text-xs font-medium text-text-muted">
                      {{ training.startTime }} - {{ training.endTime }}
                    </span>
                  </div>
                  <h3 class="font-semibold text-text-main truncate">
                    {{ getVenueName(training.venueId) }}
                  </h3>
                  <p class="text-sm text-text-muted">{{ training.court }}</p>

                  <div class="mt-3 flex items-center justify-between text-blue-500 text-xs font-semibold">
                    <span>Gestionar Sesión</span>
                    <font-awesome-icon icon="arrow-right"
                      class="transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-8">
                <div
                  class="w-16 h-16 bg-surface-50 rounded-full flex items-center justify-center mx-auto mb-4 text-text-muted">
                  <font-awesome-icon icon="calendar-xmark" size="2x" />
                </div>
                <p class="text-text-muted">No hay entrenamientos para este día.</p>
              </div>

              <!-- Action: Add Training -->
              <button @click="showAddModal = true"
                class="w-full mt-4 py-4 px-6 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-3">
                <font-awesome-icon icon="plus" />
                Agregar Entrenamiento
              </button>
            </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center h-full py-12 text-center">
            <div
              class="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-4 text-primary-500">
              <font-awesome-icon icon="calendar" size="2x" />
            </div>
            <p class="text-text-muted font-medium">Selecciona un día para ver los detalles.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Training Modal (Simplified for demo) -->
    <div v-if="showAddModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/60 backdrop-blur-sm">
      <div
        class="bg-surface-100 w-full max-w-md rounded-3xl shadow-2xl p-8 transform transition-all animate-in fade-in zoom-in duration-300 border border-border-subtle">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-text-main">Nuevo Entrenamiento</h2>
          <button @click="showAddModal = false" class="text-text-muted hover:text-text-main transition-colors">
            <font-awesome-icon icon="xmark" size="lg" />
          </button>
        </div>

        <div class="space-y-5">
          <!-- Fecha omitida por redundancia (se toma de la seleccionada) -->
          <div
            class="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800/50 flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center text-primary-600 shadow-sm">
              <font-awesome-icon icon="calendar-day" size="lg" />
            </div>
            <div>
              <p class="text-xs font-bold text-primary-600 dark:text-primary-400 tracking-tight">Fecha Seleccionada</p>
              <p class="text-lg font-bold text-text-main">{{ formatSelectedDate }}</p>
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-bold text-text-muted tracking-widest mb-2 opacity-60">Categoría</label>
            <div class="relative">
              <select v-model="newTraining.categoryId"
                class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-text-main appearance-none cursor-pointer">
                <option :value="null" disabled>Seleccionar equipo...</option>
                <option v-for="team in categories" :key="team.id" :value="team.id">
                  {{ team.name }} ({{ getSportName(team.sportId) }})
                </option>
              </select>
              <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                <font-awesome-icon icon="chevron-down" size="xs" />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-bold text-text-muted tracking-widest mb-2 opacity-60">Sede</label>
              <div class="relative">
                <select v-model="newTraining.venueId"
                  class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-text-main appearance-none cursor-pointer">
                  <option v-for="sede in sedes" :key="sede.id" :value="sede.id">{{ sede.name }}</option>
                </select>
                <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                  <font-awesome-icon icon="chevron-down" size="xs" />
                </div>
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-bold text-text-muted tracking-widest mb-2 opacity-60">Cancha /
                Espacio</label>
              <div class="relative">
                <select v-model="newTraining.court"
                  class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-text-main appearance-none cursor-pointer"
                  :disabled="!newTraining.venueId">
                  <option value="" disabled>Seleccionar cancha...</option>
                  <option v-for="court in availableCourts" :key="court.id" :value="court.name">{{ court.name }}</option>
                </select>
                <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                  <font-awesome-icon icon="chevron-down" size="xs" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-bold text-text-muted tracking-widest mb-2 opacity-60">Profesor
              Responsable</label>
            <div class="relative">
              <select v-model="newTraining.coachId"
                class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-text-main appearance-none cursor-pointer">
                <option :value="null" disabled>Seleccionar profesor...</option>
                <option v-for="p in professors" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
              <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                <font-awesome-icon icon="chevron-down" size="xs" />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-bold text-text-muted tracking-widest mb-2 opacity-60">Hora
                Inicio</label>
              <input type="time" v-model="newTraining.startTime"
                class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-text-main">
            </div>
            <div>
              <label class="block text-[10px] font-bold text-text-muted tracking-widest mb-2 opacity-60">Hora
                Fin</label>
              <input type="time" v-model="newTraining.endTime"
                class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-text-main">
            </div>
          </div>

          <!-- Recurring Section -->
          <div v-if="configStore.config.entrenamientos.metodoProgramacion === 'recurrente'"
            class="p-5 bg-surface-200/50 rounded-2xl border border-border-subtle space-y-4">
            <h4 class="text-xs font-bold text-text-main tracking-widest flex items-center gap-2">
              <font-awesome-icon icon="arrows-rotate" class="text-primary-500" />
              Programación Recurrente
            </h4>

            <div>
              <label class="block text-[10px] font-bold text-text-muted tracking-widest mb-2 opacity-60">Repetir
                hasta</label>
              <input type="date" v-model="newTraining.endDate"
                class="w-full px-4 py-2 bg-surface-50 border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-text-main">
            </div>

            <div>
              <label class="block text-[10px] font-bold text-text-muted tracking-widest mb-2 opacity-60">Días de la
                semana</label>
              <div class="flex flex-wrap gap-2">
                <label v-for="(day, idx) in ['D', 'L', 'M', 'X', 'J', 'V', 'S']" :key="idx"
                  class="flex-1 min-w-[36px] aspect-square flex items-center justify-center rounded-lg border-2 cursor-pointer transition-all font-bold text-xs"
                  :class="newTraining.weekDays.includes(idx) ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-surface-50 border-border-subtle text-text-muted hover:border-primary-400'">
                  <input type="checkbox" :value="idx" v-model="newTraining.weekDays" class="hidden" />
                  {{ day }}
                </label>
              </div>
            </div>
          </div>

          <button @click="saveTraining"
            class="w-full py-4 mt-4 bg-linear-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold rounded-2xl shadow-xl shadow-primary-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 tracking-widest text-xs">
            Confirmar Programación
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/config'
import { useSportsStore } from '@/stores/sports'
import { useUsersStore } from '@/stores/users'
import Swal from 'sweetalert2'

const router = useRouter()
const configStore = useConfigStore()
const sportsStore = useSportsStore()
const usersStore = useUsersStore()

const sedes = computed(() => sportsStore.sedes)
const sports = computed(() => sportsStore.sports)
const categories = computed(() => sportsStore.categories)
const trainings = computed(() => sportsStore.matchesAndTrainings || sportsStore.trainings || [])

// Note: checking where trainings are stored in sportsStore. 
// Looking back at sports.js view_file, I didn't see an explicit "trainings" ref, maybe it's in mockData but not in store?
// Let's check sportsStore again.

// Calendar Logic
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())
const selectedDateObj = ref(null)
const showAddModal = ref(false)

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const monthName = computed(() => months[currentMonth.value])

const calendarDays = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)

  const startDay = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const days = []

  // Prev month filler
  const prevMonthLastDay = new Date(currentYear.value, currentMonth.value, 0).getDate()
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      day: prevMonthLastDay - i,
      month: currentMonth.value - 1,
      year: currentYear.value,
      isCurrentMonth: false,
      dateStr: `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(prevMonthLastDay - i).padStart(2, '0')}`
    })
  }

  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      month: currentMonth.value,
      year: currentYear.value,
      isCurrentMonth: true,
      dateStr: `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    })
  }

  // Next month filler
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      day: i,
      month: currentMonth.value + 1,
      year: currentYear.value,
      isCurrentMonth: false,
      dateStr: `${currentYear.value}-${String(currentMonth.value + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    })
  }

  return days
})

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

const isToday = (date) => {
  const d = new Date()
  return date.day === d.getDate() &&
    date.month === d.getMonth() &&
    date.year === d.getFullYear() &&
    date.isCurrentMonth
}

const isSelected = (date) => {
  return selectedDateObj.value?.dateStr === date.dateStr
}

const selectDate = (date) => {
  selectedDateObj.value = date
}

const formatSelectedDate = computed(() => {
  if (!selectedDateObj.value) return ''
  return `${selectedDateObj.value.day} de ${months[selectedDateObj.value.month]}, ${selectedDateObj.value.year}`
})

const selectedDateTrainings = computed(() => {
  if (!selectedDateObj.value) return []
  return trainings.value.filter(t => t.date === selectedDateObj.value.dateStr)
})

const getTrainingsForDate = (date) => {
  return trainings.value.filter(t => t.date === date.dateStr)
}

const getSportColor = (sportId) => {
  return sports.value.find(s => s.id === sportId)?.color || '#3b82f6'
}

const getSportName = (sportId) => {
  return sports.value.find(s => s.id === sportId)?.name || 'Deporte'
}

const getVenueName = (venueId) => {
  return sedes.value.find(s => s.id === venueId)?.name || 'Sede'
}

// Add Training Modal
const newTraining = ref({
  date: '',
  venueId: null,
  court: '',
  startTime: '16:00',
  endTime: '18:00',
  sportId: null,
  categoryId: null,
  coachId: null,
  // Recurring fields
  isRecurring: false,
  endDate: '',
  weekDays: [] // 0-6 (Sun-Sat)
})

const selectedSede = computed(() => sedes.value.find(s => s.id === newTraining.value.venueId))
const availableCourts = computed(() => selectedSede.value?.courts || [])

const professors = computed(() => usersStore.users.filter(u => u.role === 'profesor'))

watch(() => newTraining.value.categoryId, (newId) => {
  const team = categories.value.find(t => t.id === newId)
  if (team) {
    newTraining.value.sportId = team.sportId
    if (!newTraining.value.venueId) newTraining.value.venueId = team.sedeId
  }
})

const saveTraining = async () => {
  const isRecurrente = configStore.config.entrenamientos.metodoProgramacion === 'recurrente'

  if (isRecurrente) {
    if (!newTraining.value.endDate || newTraining.value.weekDays.length === 0) {
      Swal.fire('Error', 'Debes seleccionar fecha fin y días de la semana', 'error')
      return
    }
  }

  if (!newTraining.value.categoryId || !newTraining.value.venueId || !newTraining.value.court || !newTraining.value.coachId) {
    Swal.fire('Error', 'Por favor completa todos los campos obligatorios', 'error')
    return
  }

  if (isRecurrente) {
    // Generate dates
    const start = new Date(selectedDateObj.value.dateStr + 'T12:00:00')
    const end = new Date(newTraining.value.endDate + 'T12:00:00')
    const currentDate = new Date(start)

    let sessionsCreated = 0
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay() // 0 (Sun) to 6 (Sat)
      if (newTraining.value.weekDays.includes(dayOfWeek)) {
        sportsStore.addTraining({
          ...newTraining.value,
          date: currentDate.toISOString().split('T')[0]
        })
        sessionsCreated++
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    Swal.fire({
      title: '¡Programado!',
      text: `Se han agendado ${sessionsCreated} sesiones de entrenamiento.`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    })
  } else {
    sportsStore.addTraining({
      ...newTraining.value,
      date: selectedDateObj.value.dateStr
    })
    Swal.fire({
      title: '¡Programado!',
      text: 'El entrenamiento ha sido agendado correctamente.',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    })
  }

  showAddModal.value = false
  resetForm()
}

function resetForm() {
  newTraining.value = {
    date: '',
    venueId: sedes.value[0]?.id || null,
    court: '',
    startTime: '16:00',
    endTime: '18:00',
    sportId: null,
    categoryId: null,
    coachId: null,
    isRecurring: false,
    endDate: '',
    weekDays: []
  }
}

const goToTraining = (id) => {
  router.push(`/trainings/${id}`)
}

onMounted(() => {
  // Select today by default
  const todayStr = new Date().toISOString().split('T')[0]
  selectedDateObj.value = calendarDays.value.find(d => d.dateStr === todayStr) || calendarDays.value[0]
  resetForm()
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 2px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155;
}

.animate-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.scale-102:hover {
  transform: scale(1.02);
}
</style>
