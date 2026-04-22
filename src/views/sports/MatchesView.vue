<script setup>
import { ref, computed } from 'vue'
import { useSportsStore } from '@/stores/sports'
import { useUsersStore } from '@/stores/users'
import Swal from 'sweetalert2'

const store = useSportsStore()
const usersStore = useUsersStore()
const filterTournament = ref('')
const filterStatus = ref('')

const statusColors = {
  'Validado': 'bg-success-100 dark:bg-success-950/30 text-success-700 dark:text-success-400',
  'Programado': 'bg-primary-100 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400',
  'En Curso': 'bg-accent-100 dark:bg-accent-950/30 text-accent-700 dark:text-accent-400'
}

const enrichedMatches = computed(() => {
  return store.matches
    .filter(m => {
      const matchTournament = !filterTournament.value || m.tournamentId === Number(filterTournament.value)
      const matchStatus = !filterStatus.value || m.status === filterStatus.value
      return matchTournament && matchStatus
    })
    .map(m => {
      const tournament = store.tournaments.find(t => t.id === m.tournamentId)
      const sport = store.getSportById(tournament?.sportId)
      const home = store.getCategoryById(m.homeCategoryId)
      const away = store.getCategoryById(m.awayCategoryId)
      return { ...m, tournament, sport, home, away }
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
})

const showModal = ref(false)
const form = ref({})

function openEdit(match) {
  form.value = {
    ...match,
    matchStats: match.matchStats ? JSON.parse(JSON.stringify(match.matchStats)) : []
  }
  showModal.value = true
}

const getAthletesByTeam = (categoryId) => {
  return usersStore.estudiantes.filter(u => u.categoryId === categoryId)
}

const addStat = (categoryId) => {
  form.value.matchStats.push({ playerId: null, goals: 1, categoryId })
}

const removeStat = (index) => {
  form.value.matchStats.splice(index, 1)
}

async function saveResult() {
  if (form.value.homeScore === null || form.value.awayScore === null) {
    Swal.fire({ icon: 'error', title: 'Marcador incompleto', text: 'Debes ingresar el resultado final.' })
    return
  }

  store.updateMatch(form.value.id, {
    homeScore: Number(form.value.homeScore),
    awayScore: Number(form.value.awayScore),
    matchStats: form.value.matchStats,
    status: 'Validado'
  })

  await Swal.fire({ icon: 'success', title: 'Resultado registrado', text: 'La tabla de posiciones se ha actualizado.', timer: 1500, showConfirmButton: false })
  showModal.value = false
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-text-main tracking-tight">Partidos & Eventos</h1>
        <p class="text-sm text-text-muted mt-1 font-medium">Programación y resultados de encuentros deportivos</p>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row gap-4">
      <div class="relative group">
        <select v-model="filterTournament"
          class="appearance-none pl-5 pr-12 py-3 rounded-2xl border border-border-subtle text-sm font-semibold tracking-tighter focus:border-primary-500 outline-none bg-surface-100 text-text-main shadow-sm transition-all hover:bg-surface-200">
          <option value="">Todos los torneos</option>
          <option v-for="t in store.tournaments" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
        <font-awesome-icon icon="chevron-down"
          class="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] text-text-muted pointer-events-none opacity-50" />
      </div>
      <div class="relative group">
        <select v-model="filterStatus"
          class="appearance-none pl-5 pr-12 py-3 rounded-2xl border border-border-subtle text-sm font-semibold tracking-tighter focus:border-primary-500 outline-none bg-surface-100 text-text-main shadow-sm transition-all hover:bg-surface-200">
          <option value="">Todos los estados</option>
          <option>Programado</option>
          <option>En Curso</option>
          <option>Validado</option>
        </select>
        <font-awesome-icon icon="chevron-down"
          class="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] text-text-muted pointer-events-none opacity-50" />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div v-for="m in enrichedMatches" :key="m.id"
        class="bg-surface-100 rounded-3xl border border-border-subtle shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
        <div
          class="flex items-center justify-between px-6 py-4 bg-surface-50 border-b border-border-subtle transition-colors">
          <span class="text-xs text-text-muted font-semibold tracking-wide"> {{ m.tournament?.name }}</span>
          <span
            :class="['text-[10px] font-bold px-3 py-1 rounded-full tracking-tighter shadow-sm', statusColors[m.status]]">{{
              m.status }}</span>
        </div>
        <div class="p-6">
          <div class="flex items-center justify-between gap-2 sm:gap-4 mb-6">
            <!-- Home -->
            <div class="flex-1">
              <div
                class="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-white font-bold text-lg mb-3 shadow-lg transform group-hover:scale-110 transition-transform"
                :style="{ backgroundColor: m.home?.color || '#999' }">
                {{ m.home?.name?.slice(0, 2).toUpperCase() }}
              </div>
              <p class="text-sm font-semibold text-text-main truncate text-center">{{ m.home?.name }}</p>
              <p class="text-[10px] text-text-muted text-center font-semibold tracking-widest mt-1 opacity-60">
                Local</p>
            </div>
            <!-- Score -->
            <div class="text-center flex flex-col items-center justify-center px-2">
              <div v-if="m.status === 'Validado' || m.status === 'En Curso'" class="flex items-center gap-3">
                <span class="text-4xl font-bold text-text-main tabular-nums">{{ m.homeScore }}</span>
                <span class="text-2xl text-primary-500 font-semibold">:</span>
                <span class="text-4xl font-bold text-text-main tabular-nums">{{ m.awayScore }}</span>
              </div>
              <div v-else class="text-2xl font-semibold text-text-muted opacity-20 italic">VS</div>
              <p class="text-[10px] text-text-muted font-semibold tracking-widest mt-2">{{
                m.sport?.scoringUnit }}</p>
            </div>
            <!-- Away -->
            <div class="flex-1">
              <div
                class="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-white font-bold text-lg mb-3 shadow-lg transform group-hover:scale-110 transition-transform"
                :style="{ backgroundColor: m.away?.color || '#999' }">
                {{ m.away?.name?.slice(0, 2).toUpperCase() }}
              </div>
              <p class="text-sm font-semibold text-text-main truncate text-center">{{ m.away?.name }}</p>
              <p class="text-[10px] text-text-muted text-center font-semibold tracking-widest mt-1 opacity-60">
                Visitante</p>
            </div>
          </div>

          <div
            class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-4 border-y border-border-subtle border-dashed text-[11px] text-text-muted transition-colors">
            <span class="flex items-center gap-2 font-bold"><font-awesome-icon icon="calendar"
                class="text-primary-500" />{{ m.date }}</span>
            <span class="flex items-center gap-2 font-bold"><font-awesome-icon icon="clock"
                class="text-primary-500" />{{ m.time }}</span>
            <span class="flex items-center gap-2 font-bold"><font-awesome-icon icon="location-dot"
                class="text-primary-500" />{{ m.venue }}</span>
          </div>

          <button v-if="m.status !== 'Validado'" @click="openEdit(m)"
            class="w-full mt-6 py-3.5 text-xs font-bold text-white bg-primary-600 rounded-2xl hover:bg-primary-700 shadow-lg shadow-primary-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 group/btn tracking-widest">
            <font-awesome-icon icon="pen-to-square" class="group-hover/btn:rotate-12 transition-transform" />
            Registrar Resultado
          </button>
          <div v-else class="mt-6 flex flex-wrap justify-center gap-1">
            <div v-for="stat in m.matchStats" :key="stat.playerId"
              class="flex items-center gap-1 text-[9px] font-bold bg-surface-50 border border-border-subtle px-2 py-1 rounded-lg text-text-muted">
              <font-awesome-icon icon="futbol" class="text-primary-500" />
              <span>{{ usersStore.getUserById(stat.playerId)?.name?.split(' ')[0] }}</span>
              <span class="text-primary-600">{{ stat.goals }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Result Modal -->
    <Teleport to="body">
      <div v-if="showModal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
        @click.self="showModal = false">
        <div
          class="bg-surface-100 rounded-[2.5rem] w-full max-w-2xl p-6 sm:p-10 shadow-2xl border border-border-subtle transition-all duration-300 transform scale-100 my-8">
          <div class="flex items-center justify-between mb-8">
            <h3 class="text-2xl font-bold text-text-main tracking-tight">Finalizar Encuentro</h3>
            <button @click="showModal = false"
              class="w-10 h-10 rounded-xl bg-surface-50 text-text-muted hover:text-text-main transition-colors flex items-center justify-center">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>

          <!-- Score Input -->
          <div
            class="grid grid-cols-3 gap-4 items-center mb-10 bg-surface-50/50 p-8 rounded-3xl border border-border-subtle">
            <div class="text-center group">
              <div
                class="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-3 shadow-lg"
                :style="{ backgroundColor: form.home?.color }">
                {{ form.home?.name?.slice(0, 2).toUpperCase() }}
              </div>
              <label class="text-[10px] font-bold text-text-muted tracking-widest block mb-4">{{
                form.home?.name }}</label>
              <input v-model.number="form.homeScore" type="number" min="0"
                class="w-20 h-20 text-center text-4xl font-bold bg-surface-100 border-2 border-border-subtle rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-text-main tabular-nums" />
            </div>

            <div class="text-center">
              <span class="text-4xl text-primary-500 font-bold italic opacity-20">VS</span>
              <p class="text-[10px] text-text-muted font-bold tracking-widest mt-4">{{ form.sport?.scoringUnit
              }}</p>
            </div>

            <div class="text-center group">
              <div
                class="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-3 shadow-lg"
                :style="{ backgroundColor: form.away?.color }">
                {{ form.away?.name?.slice(0, 2).toUpperCase() }}
              </div>
              <label class="text-[10px] font-bold text-text-muted tracking-widest block mb-4">{{
                form.away?.name }}</label>
              <input v-model.number="form.awayScore" type="number" min="0"
                class="w-20 h-20 text-center text-4xl font-bold bg-surface-100 border-2 border-border-subtle rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-text-main tabular-nums" />
            </div>
          </div>

          <!-- Incidences / Scorers -->
          <div class="space-y-6 mb-10">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold text-text-main tracking-widest flex items-center gap-2">
                <font-awesome-icon icon="futbol" class="text-primary-500" />
                Goleadores & Incidencias
              </h4>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <!-- Home Scorers -->
              <div class="space-y-4">
                <div class="flex items-center justify-between bg-surface-50 px-4 py-2 rounded-xl">
                  <span class="text-[10px] font-bold text-text-muted tracking-widest">Local ({{
                    form.home?.name }})</span>
                  <button @click="addStat(form.homeCategoryId)"
                    class="text-[10px] font-bold text-primary-600 hover:underline">+ Añadir</button>
                </div>
                <div class="space-y-3">
                  <div v-for="(stat, idx) in form.matchStats.filter(s => s.categoryId === form.homeCategoryId)"
                    :key="'h-' + idx" class="flex gap-2">
                    <select v-model="stat.playerId"
                      class="flex-1 px-3 py-2 bg-surface-100 border border-border-subtle rounded-xl text-xs font-bold text-text-main outline-none focus:border-primary-500">
                      <option :value="null">Seleccionar Deportista</option>
                      <option v-for="athlete in getAthletesByTeam(form.homeCategoryId)" :key="athlete.id"
                        :value="athlete.id">{{ athlete.name }}</option>
                    </select>
                    <input v-model.number="stat.goals" type="number" min="1"
                      class="w-12 px-2 py-2 bg-surface-100 border border-border-subtle rounded-xl text-xs font-bold text-center text-text-main" />
                    <button @click="removeStat(form.matchStats.indexOf(stat))"
                      class="w-8 h-8 rounded-lg bg-danger-50 text-danger-600 flex items-center justify-center hover:bg-danger-100 transition-colors">
                      <font-awesome-icon icon="trash" class="text-[10px]" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Away Scorers -->
              <div class="space-y-4">
                <div class="flex items-center justify-between bg-surface-50 px-4 py-2 rounded-xl">
                  <span class="text-[10px] font-bold text-text-muted tracking-widest">Visitante ({{
                    form.away?.name }})</span>
                  <button @click="addStat(form.awayCategoryId)"
                    class="text-[10px] font-bold text-primary-600 hover:underline">+ Añadir</button>
                </div>
                <div class="space-y-3">
                  <div v-for="(stat, idx) in form.matchStats.filter(s => s.categoryId === form.awayCategoryId)"
                    :key="'a-' + idx" class="flex gap-2">
                    <select v-model="stat.playerId"
                      class="flex-1 px-3 py-2 bg-surface-100 border border-border-subtle rounded-xl text-xs font-bold text-text-main outline-none focus:border-primary-500">
                      <option :value="null">Seleccionar Deportista</option>
                      <option v-for="athlete in getAthletesByTeam(form.awayCategoryId)" :key="athlete.id"
                        :value="athlete.id">{{ athlete.name }}</option>
                    </select>
                    <input v-model.number="stat.goals" type="number" min="1"
                      class="w-12 px-2 py-2 bg-surface-100 border border-border-subtle rounded-xl text-xs font-bold text-center text-text-main" />
                    <button @click="removeStat(form.matchStats.indexOf(stat))"
                      class="w-8 h-8 rounded-lg bg-danger-50 text-danger-600 flex items-center justify-center hover:bg-danger-100 transition-colors">
                      <font-awesome-icon icon="trash" class="text-[10px]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-col-reverse sm:flex-row gap-3 pt-8 border-t border-border-subtle">
            <button @click="showModal = false"
              class="px-8 py-4 border border-border-subtle rounded-2xl text-[10px] font-bold tracking-widest text-text-muted hover:bg-surface-200 transition-all active:scale-95">
              Cancelar
            </button>
            <button @click="saveResult"
              class="flex-1 py-4 bg-success-600 text-white rounded-2xl text-[10px] font-bold tracking-widest hover:bg-success-700 shadow-xl shadow-success-500/25 transition-all active:scale-95">
              Validar Encuentro & Finalizar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
