<template>
  <div class="training-detail-view p-6 bg-surface-50 min-h-screen">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
      <div class="flex items-center gap-4">
        <button @click="router.back()"
          class="p-3 bg-surface-100 hover:bg-surface-200 rounded-2xl shadow-sm border border-border-subtle text-text-muted transition-all">
          <font-awesome-icon icon="arrow-left" />
        </button>
        <div v-if="training">
          <h1 class="text-3xl font-bold text-text-main flex items-center gap-3">
            Sesión de Entrenamiento
            <span
              class="text-sm font-bold px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 rounded-full">
              ID #{{ training.id }}
            </span>
          </h1>
          <p class="text-text-muted mt-1">
            {{ formatFullDate }} • {{ training.startTime }} - {{ training.endTime }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button @click="saveChanges"
          class="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/25 transition-all flex items-center gap-2">
          <font-awesome-icon icon="floppy-disk" />
          Guardar Cambios
        </button>
      </div>
    </div>

    <!-- Quick Info Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" v-if="training">
      <div class="bg-surface-100 p-6 rounded-3xl shadow-sm border border-border-subtle flex items-center gap-4">
        <div
          class="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center text-primary-500 border border-primary-100 dark:border-primary-800/50">
          <font-awesome-icon icon="location-dot" size="lg" />
        </div>
        <div>
          <p class="text-xs font-bold text-text-muted tracking-wider">Sede / Cancha</p>
          <p class="text-lg font-bold text-text-main leading-tight">
            {{ getVenueName(training.venueId) }}
          </p>
          <p class="text-sm text-text-muted">{{ training.court }}</p>
        </div>
      </div>

      <div class="bg-surface-100 p-6 rounded-3xl shadow-sm border border-border-subtle flex items-center gap-4">
        <div
          class="w-12 h-12 bg-success-50 dark:bg-success-900/20 rounded-2xl flex items-center justify-center text-success-500 border border-success-100 dark:border-success-800/50">
          <font-awesome-icon icon="user-tie" size="lg" />
        </div>
        <div>
          <p class="text-xs font-bold text-text-muted tracking-wider">Entrenador Responsable</p>
          <p class="text-lg font-bold text-text-main leading-tight">
            {{ getCoachName(training.coachId) }}
          </p>
          <span class="text-xs text-text-muted">Profesor Principal</span>
        </div>
      </div>

      <div class="bg-surface-100 p-6 rounded-3xl shadow-sm border border-border-subtle flex items-center gap-4">
        <div
          class="w-12 h-12 bg-accent-50 dark:bg-accent-900/20 rounded-2xl flex items-center justify-center text-accent-500 border border-accent-100 dark:border-accent-800/50">
          <font-awesome-icon icon="users" size="lg" />
        </div>
        <div>
          <p class="text-xs font-bold text-text-muted tracking-wider">Deportistas</p>
          <p class="text-lg font-bold text-text-main leading-tight">
            {{ attendanceList.length }} Asignados
          </p>
          <div class="flex gap-2 mt-1">
            <span
              class="text-[10px] bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400 px-1.5 py-0.5 rounded font-bold">
              {{ countStatus('Presente') }} Presentes
            </span>
            <span
              class="text-[10px] bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 px-1.5 py-0.5 rounded font-bold">
              {{ countStatus('Ausente') }} Ausentes
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="space-y-12">
      <div v-for="group in groupedAttendance" :key="group.categoryId || 'no-team'"
        class="bg-surface-100 rounded-3xl shadow-xl border border-border-subtle overflow-hidden">
        <!-- Team Header -->
        <div
          class="p-6 bg-surface-50/50 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
              :style="{ backgroundColor: group.team?.color || '#94a3b8' }">
              <font-awesome-icon :icon="group.team ? 'people-group' : 'user-slash'" size="lg" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-text-main">
                {{ group.team?.name || 'Deportistas sin Categoría' }}
              </h2>
              <p class="text-sm text-text-muted flex items-center gap-2">
                <font-awesome-icon icon="user-tie" class="text-primary-500" />
                <span class="font-medium">Profesor Principal:</span>
                {{ group.coachName }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div
              class="px-4 py-2 bg-surface-50 rounded-xl border border-border-subtle text-xs font-bold text-text-muted">
              {{ group.list.length }} Deportistas
            </div>
            <button @click="markTeamAs(group.list, 'Presente')"
              class="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors">
              Marcar todos presente
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-50/80">
                <th class="px-6 py-4 text-[10px] font-bold text-text-muted tracking-widest w-[200px]">Deportista</th>
                <th class="px-6 py-4 text-[10px] font-bold text-text-muted tracking-widest w-[120px]">Asistencia</th>
                <th class="px-6 py-4 text-[10px] font-bold text-text-muted tracking-widest w-[300px]">Evaluación Técnica
                </th>
                <th class="px-6 py-4 text-[10px] font-bold text-text-muted tracking-widest">Obs. / Evolución</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-subtle/50">
              <tr v-for="item in group.list" :key="item.userId" class="hover:bg-surface-200/30 transition-colors">
                <td class="px-6 py-6 font-medium">
                  <div class="flex items-center gap-3">
                    <img :src="item.member?.profileImage"
                      class="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-slate-800" />
                    <div v-if="item.member" class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <p class="font-bold text-text-main text-sm tracking-tight truncate">{{ item.member.name }}</p>
                        <!-- Health Alerts -->
                        <div class="flex items-center gap-1.5 shrink-0">
                          <span v-if="healthStore.getActiveInjuriesByUserId(item.member.id).length"
                            class="w-6 h-6 bg-warning-100 dark:bg-warning-900/30 text-warning-600 rounded-lg flex items-center justify-center text-[10px] animate-pulse"
                            :title="'Lesión: ' + healthStore.getActiveInjuriesByUserId(item.member.id)[0].type">
                            <font-awesome-icon icon="bandage" />
                          </span>
                          <span
                            v-if="healthStore.getHealthByUserId(item.member.id)?.chronicDiseases && healthStore.getHealthByUserId(item.member.id)?.chronicDiseases !== 'Ninguna'"
                            class="w-6 h-6 bg-danger-100 dark:bg-danger-900/30 text-danger-600 rounded-lg flex items-center justify-center text-[10px]"
                            :title="'Alerta Médica: ' + healthStore.getHealthByUserId(item.member.id)?.chronicDiseases">
                            <font-awesome-icon icon="heart-pulse" />
                          </span>
                        </div>
                      </div>
                      <p class="text-[9px] text-text-muted font-bold tracking-widest opacity-60">ID: {{ item.member.id
                        }} • {{ item.member.positionId || 'N/A' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-6">
                  <div class="flex p-1 bg-surface-50 rounded-xl w-fit border border-border-subtle">
                    <button @click="item.status = 'Presente'"
                      class="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all tracking-widest"
                      :class="item.status === 'Presente' ? 'bg-primary-600 shadow-lg text-white' : 'text-text-muted hover:text-text-main'">
                      PRE
                    </button>
                    <button @click="item.status = 'Ausente'"
                      class="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all tracking-widest"
                      :class="item.status === 'Ausente' ? 'bg-danger-600 shadow-lg text-white' : 'text-text-muted hover:text-text-main'">
                      AUS
                    </button>
                  </div>
                </td>
                <td class="px-6 py-6">
                  <div class="space-y-3" v-if="item.status === 'Presente'">
                    <div v-for="dim in configStore.config.calificaciones.dimensiones" :key="dim"
                      class="flex items-center justify-between gap-4">
                      <span class="text-[9px] font-bold text-text-muted tracking-widest opacity-70 w-12">{{ dim.slice(0,
                        4) }}.</span>
                      <div class="flex items-center gap-1.5">
                        <button v-for="star in 5" :key="star" @click="item.ratings[dim] = star"
                          class="transition-all transform active:scale-125 focus:outline-none"
                          :class="star <= item.ratings[dim] ? 'text-amber-500 scale-110' : 'text-surface-300 dark:text-surface-700 opacity-30'">
                          <font-awesome-icon icon="star" class="text-xs" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-[10px] font-bold text-text-muted/40 italic flex items-center gap-2">
                    <font-awesome-icon icon="circle-info" />
                    Sin evaluar (Ausente)
                  </div>
                </td>
                <td class="px-6 py-6">
                  <div class="space-y-2">
                    <input type="text" v-model="item.novedades" placeholder="Novedad física o disciplinaria..."
                      class="w-full text-[10px] py-1 border-b border-border-subtle dark:border-slate-800 focus:border-primary-500 bg-transparent text-text-main font-bold focus:outline-none placeholder-text-muted/30" />
                    <textarea v-model="item.evolutionNotes" placeholder="Notas de evolución técnica..." rows="2"
                      class="w-full text-[10px] p-3 bg-surface-50 rounded-xl border border-border-subtle focus:ring-2 focus:ring-primary-500 transition-all text-text-muted outline-none"></textarea>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- General Observations -->
    <div class="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2">
        <div class="bg-surface-100 p-8 rounded-3xl shadow-xl border border-border-subtle">
          <h3 class="text-xl font-bold text-text-main mb-6 flex items-center gap-2">
            <font-awesome-icon icon="pen-to-square" class="text-primary-500" />
            Observaciones Generales de la Sesión
          </h3>
          <textarea v-model="generalObservations"
            class="w-full h-32 p-4 bg-surface-50 border border-border-subtle rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-text-main"
            placeholder="Resuma los objetivos cumplidos, el trabajo realizado y aspectos colectivos a mejorar..."></textarea>
        </div>
      </div>

      <div class="lg:col-span-1">
        <div
          class="bg-linear-to-br from-indigo-600 to-blue-700 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden h-full">
          <font-awesome-icon icon="rocket"
            class="absolute -right-4 -bottom-4 text-9xl opacity-10 transform -rotate-12" />
          <h3 class="text-xl font-bold mb-4">Métricas Rápidas</h3>
          <div class="space-y-6">
            <div>
              <p class="text-blue-100 text-xs font-bold tracking-wider mb-2">Compromiso</p>
              <div class="flex items-center gap-4">
                <div class="flex-1 h-3 bg-white/20 rounded-full overflow-hidden">
                  <div class="h-full bg-white rounded-full" :style="{ width: engagementPerc + '%' }"></div>
                </div>
                <span class="font-bold">{{ engagementPerc }}%</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                <p class="text-blue-100 text-[10px] font-bold">Asignados</p>
                <p class="text-3xl font-bold">{{ attendanceList.length }}</p>
              </div>
              <div>
                <p class="text-blue-100 text-[10px] font-bold">Efectividad</p>
                <p class="text-3xl font-bold">{{ countStatus('Presente') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSportsStore } from '@/stores/sports'
import { useUsersStore } from '@/stores/users'
import { useConfigStore } from '@/stores/config'
import { useHealthStore } from '@/stores/health'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const sportsStore = useSportsStore()
const usersStore = useUsersStore()
const configStore = useConfigStore()
const healthStore = useHealthStore()
const trainingId = parseInt(route.params.id)

const training = ref(null)
const attendanceList = ref([])
const generalObservations = ref('')

const fetchTrainingData = () => {
  const found = sportsStore.trainings.find(t => t.id === trainingId)
  if (!found) {
    router.push('/trainings')
    return
  }
  training.value = found

  // 1. Filter students assigned to this team OR venue
  let assignedMembers = []
  if (training.value.categoryId) {
    assignedMembers = usersStore.users.filter(u =>
      (u.role === 'estudiante' || u.role === 'deportista') &&
      u.categoryId === training.value.categoryId
    )
  } else {
    // Fallback to venue filter if no team is assigned (legacy sessions)
    assignedMembers = usersStore.users.filter(u =>
      (u.role === 'estudiante' || u.role === 'deportista') &&
      (!u.venueIds || u.venueIds.includes(training.value.venueId))
    )
  }

  // 2. Map to attendance records
  attendanceList.value = assignedMembers.map(member => {
    const record = sportsStore.attendance.find(a => a.trainingId === trainingId && a.userId === member.id)

    // Initialize ratings from config dimensions if not present
    const defaultRatings = {}
    configStore.config.calificaciones.dimensiones.forEach(d => {
      defaultRatings[d] = record?.ratings?.[d] || 0
    })

    return {
      userId: member.id,
      member: member,
      status: record ? record.status : 'Ausente',
      exercises: record ? (record.exercises || '') : '',
      observations: record ? record.observations : '',
      evolutionNotes: record ? record.evolutionNotes : '',
      novedades: record ? record.novedades : '',
      ratings: defaultRatings
    }
  })
}

// 3. Group the list by team for display
const groupedAttendance = computed(() => {
  const groups = {}

  attendanceList.value.forEach(item => {
    const categoryId = item.member?.categoryId || 'no-team'
    if (!groups[categoryId]) {
      const team = sportsStore.categories.find(t => t.id === categoryId)
      const coach = team ? usersStore.users.find(u => u.id === team.mainCoachId) : null
      groups[categoryId] = {
        team: team,
        categoryId: categoryId,
        coachName: coach ? coach.name : 'Sin asignar',
        list: []
      }
    }
    groups[categoryId].list.push(item)
  })

  return Object.values(groups).sort((a, b) => {
    if (a.categoryId === 'no-team') return 1
    if (b.categoryId === 'no-team') return -1
    return a.team?.name.localeCompare(b.team?.name)
  })
})

const getVenueName = (id) => sportsStore.sedes.find(s => s.id === id)?.name || 'Sede'
const getCoachName = (id) => usersStore.users.find(u => u.id === id)?.name || 'Entrenador'
const getSportName = (id) => sportsStore.sports.find(s => s.id === id)?.name || 'Deporte'

const formatFullDate = computed(() => {
  if (!training.value) return ''
  const date = new Date(training.value.date + 'T12:00:00')
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
})

const countStatus = (status) => {
  return attendanceList.value.filter(a => a.status === status).length
}

const engagementPerc = computed(() => {
  if (attendanceList.value.length === 0) return 0
  return Math.round((countStatus('Presente') / attendanceList.value.length) * 100)
})

const markTeamAs = (list, status) => {
  list.forEach(item => item.status = status)
}

const saveChanges = () => {
  sportsStore.saveAttendance(trainingId, attendanceList.value)

  Swal.fire({
    title: '¡Guardado!',
    text: 'La asistencia y observaciones han sido actualizadas.',
    icon: 'success',
    confirmButtonColor: '#3b82f6',
    confirmButtonText: 'Genial'
  }).then(() => {
    router.push('/trainings')
  })
}

onMounted(() => {
  fetchTrainingData()
})
</script>

<style scoped>
.transform:hover {
  transform: translateY(-2px);
}
</style>
