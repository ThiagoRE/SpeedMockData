<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSportsStore } from '@/stores/sports'
import Swal from 'sweetalert2'
import MatchResultModal from '@/components/sports/MatchResultModal.vue'

const store = useSportsStore()

onMounted(() => {
  store.fetchTournaments()
})
const search = ref('')
const filterSport = ref('')
const showModal = ref(false)
const editMode = ref(false)
const selectedTournamentId = ref(null)

const form = ref({
  name: '',
  sportId: '',
  type: 'Liga',
  ageRange: '',
  startDate: '',
  endDate: '',
  status: 'Programado',
  categories: 0,
  tieBreaker: 'goalDifference'
})

const detailActiveTab = ref('standings')
const detailTabs = [
  { id: 'standings', name: 'Posiciones', icon: 'trophy' },
  { id: 'fixture', name: 'Fixture', icon: 'calendar-days' },
  { id: 'playoffs', name: 'Fase Final', icon: 'diagram-project' }
]

const showResultModal = ref(false)
const selectedMatchId = ref(null)

function openMatchResult(id) {
  selectedMatchId.value = id
  showResultModal.value = true
}

const statusColors = {
  'En Curso': 'bg-success-100 dark:bg-success-950/30 text-success-700 dark:text-success-400',
  'Programado': 'bg-primary-100 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400',
  'Finalizado': 'bg-surface-200 text-text-muted border border-border-subtle'
}

const filtered = computed(() => {
  return store.tournaments.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.value.toLowerCase())
    const matchSport = !filterSport.value || t.sportId === Number(filterSport.value)
    return matchSearch && matchSport
  })
})

const selectedTournament = computed(() => store.tournaments.find(t => t.id === selectedTournamentId.value))
const standings = computed(() => selectedTournamentId.value ? store.getStandings(selectedTournamentId.value) : [])
const topScorers = computed(() => selectedTournamentId.value ? store.getTopScorers(selectedTournamentId.value) : [])

function getSportName(id) { return store.getSportById(id)?.name || '—' }
function getSportColor(id) { return store.getSportById(id)?.color || '#999' }
function getTeamName(id) { return store.getCategoryById(id)?.name || 'Categoría Desconocido' }

function openCreate() {
  form.value = { name: '', sportId: '', type: 'Liga', ageRange: '', startDate: '', endDate: '', status: 'Programado', categories: 0, tieBreaker: 'goalDifference' }
  editMode.value = false; showModal.value = true
}
function openEdit(t) { form.value = { ...t }; editMode.value = true; showModal.value = true }

async function save() {
  if (!form.value.name || !form.value.sportId) {
    Swal.fire({ icon: 'warning', title: 'Datos requeridos', confirmButtonColor: '#3b82f6' }); return
  }
  // Mapear campos del formulario (camelCase) al formato del backend (español)
  const payload = {
    nombre: form.value.name,
    deporteId: Number(form.value.sportId),
    tipo: form.value.type,
    rangoEdad: form.value.ageRange,
    fechaInicio: form.value.startDate,
    fechaFin: form.value.endDate || null,
    estado: form.value.status,
    cantidadEquipos: form.value.categories || 0,
    desempate: form.value.tieBreaker
  }
  if (editMode.value) {
    await store.updateTournament(form.value.id, payload)
    await Swal.fire({ icon: 'success', title: 'Torneo actualizado', timer: 1200, showConfirmButton: false })
  } else {
    await store.addTournament(payload)
    await Swal.fire({ icon: 'success', title: 'Torneo creado', timer: 1200, showConfirmButton: false })
  }
  showModal.value = false
}

async function remove(t) {
  const r = await Swal.fire({ title: '¿Eliminar torneo?', text: t.name, icon: 'warning', showCancelButton: true, confirmButtonText: 'Eliminar', confirmButtonColor: '#ef4444' })
  if (r.isConfirmed) { await store.deleteTournament(t.id); Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1000, showConfirmButton: false }) }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Breadcrumb / Header for Detail Mode -->
    <div v-if="selectedTournamentId" class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <button @click="selectedTournamentId = null"
          class="w-10 h-10 rounded-xl bg-surface-100 border border-border-subtle flex items-center justify-center text-text-muted hover:text-primary-600 transition-colors shadow-sm">
          <font-awesome-icon icon="chevron-left" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-text-main tracking-tight">{{ selectedTournament?.name }}</h1>
          <p class="text-sm text-text-muted font-medium flex items-center gap-2">
            <span class="w-2 h-2 rounded-full"
              :style="{ backgroundColor: getSportColor(selectedTournament?.sportId) }"></span>
            {{ getSportName(selectedTournament?.sportId) }} • {{ selectedTournament?.type }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button @click="openEdit(selectedTournament)"
          class="px-5 py-2.5 bg-surface-100 border border-border-subtle text-text-main font-bold text-[10px] tracking-widest rounded-2xl hover:bg-surface-200 transition-all">
          Configurar
        </button>
      </div>
    </div>

    <!-- Main Header for List Mode -->
    <div v-else class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-text-main tracking-tight">Torneos</h1>
        <p class="text-sm text-text-muted mt-1 font-medium">Gestión de competiciones por deporte</p>
      </div>
      <button @click="openCreate"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all font-bold text-xs tracking-widest shadow-lg shadow-primary-500/25 hover:scale-105 active:scale-95">
        <font-awesome-icon icon="plus" /> Nuevo Torneo
      </button>
    </div>

    <!-- CONTENT: Detail View -->
    <div v-if="selectedTournamentId" class="slide-up">
      <!-- Tabs Navigation -->
      <div
        class="flex items-center gap-2 mb-8 bg-surface-100 p-1.5 rounded-2xl w-fit border border-border-subtle shadow-sm">
        <button v-for="tab in detailTabs" :key="tab.id" @click="detailActiveTab = tab.id" :class="[
          'px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest transition-all flex items-center gap-2',
          detailActiveTab === tab.id
            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
            : 'text-text-muted hover:text-text-main hover:bg-surface-200'
        ]">
          <font-awesome-icon :icon="tab.icon" />
          {{ tab.name }}
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-6">
          <!-- TAB: Standings -->
          <div v-if="detailActiveTab === 'standings'" class="space-y-6 animate-in">
            <div class="bg-surface-100 rounded-[2.5rem] border border-border-subtle shadow-xl overflow-hidden">
              <div class="px-8 py-6 border-b border-border-subtle bg-surface-50/50 flex items-center justify-between">
                <h3 class="text-sm font-bold text-text-main tracking-widest flex items-center gap-2">
                  <font-awesome-icon icon="trophy" class="text-amber-500" />
                  Tabla de Posiciones
                </h3>
                <span
                  class="text-[9px] font-bold text-text-muted tracking-widest bg-surface-100 px-3 py-1 rounded-full">
                  Desempate: {{ selectedTournament?.tieBreaker }}
                </span>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-surface-50/30 text-[10px] font-bold text-text-muted tracking-widest">
                      <th class="px-8 py-4 w-12 text-center">Pos</th>
                      <th class="px-4 py-4">Categoría</th>
                      <th class="px-4 py-4 text-center">PJ</th>
                      <th class="px-4 py-4 text-center">PTS</th>
                      <th class="px-4 py-4 text-center">DG</th>
                      <th class="px-8 py-4 text-center">Forma</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border-subtle/50">
                    <tr v-for="(row, idx) in standings" :key="row.categoryId"
                      class="hover:bg-surface-50 transition-colors group">
                      <td class="px-8 py-5">
                        <div class="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
                          :class="idx < 4 ? 'bg-primary-600 text-white shadow-lg' : 'bg-surface-200 text-text-muted'">
                          {{ idx + 1 }}
                        </div>
                      </td>
                      <td class="px-4 py-5">
                        <div class="flex items-center gap-3">
                          <div
                            class="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[10px]"
                            :style="{ backgroundColor: store.getCategoryById(row.categoryId)?.color }">
                            {{ getTeamName(row.categoryId).slice(0, 2).toUpperCase() }}
                          </div>
                          <span class="text-xs font-bold text-text-main tracking-tight">{{
                            getTeamName(row.categoryId) }}</span>
                        </div>
                      </td>
                      <td class="px-4 py-5 text-center text-xs font-bold">{{ row.pj }}</td>
                      <td class="px-4 py-5 text-center text-xs font-bold text-primary-600">{{ row.pts }}</td>
                      <td class="px-4 py-5 text-center text-xs font-bold"
                        :class="row.dg >= 0 ? 'text-success-600' : 'text-danger-600'">
                        {{ row.dg > 0 ? '+' : '' }}{{ row.dg }}
                      </td>
                      <td class="px-8 py-5">
                        <div class="flex items-center justify-center gap-1">
                          <div v-for="(res, ridx) in row.recent" :key="ridx"
                            class="w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-bold" :class="{
                              'bg-success-500 text-white': res === 'W',
                              'bg-amber-500 text-white': res === 'D',
                              'bg-danger-500 text-white': res === 'L'
                            }">
                            {{ res }}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- TAB: Fixture -->
          <div v-if="detailActiveTab === 'fixture'" class="space-y-6 animate-in">
            <div v-if="store.getMatchesByTournament(selectedTournamentId).length === 0"
              class="p-20 bg-surface-100 rounded-[2.5rem] border-2 border-dashed border-border-subtle text-center">
              <font-awesome-icon icon="calendar-xmark" class="text-6xl text-text-muted/20 mb-6" />
              <h4 class="text-lg font-bold text-text-main tracking-tight mb-2">Sin Calendario Generado</h4>
              <p class="text-text-muted text-sm mb-8 max-w-sm mx-auto font-medium">Este torneo aún no tiene partidos
                programados. Puedes generarlos automáticamente usando el sistema Round Robin.</p>
              <button @click="store.generateFixture(selectedTournamentId)"
                class="px-8 py-4 bg-primary-600 text-white rounded-2xl font-bold text-xs tracking-widest shadow-xl shadow-primary-500/25 hover:scale-105 active:scale-95 transition-all">
                Generar Fixture Automático
              </button>
            </div>

            <div v-else class="space-y-4">
              <div v-for="match in store.getMatchesByTournament(selectedTournamentId)" :key="match.id"
                class="bg-surface-100 border border-border-subtle rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-lg transition-transform hover:-translate-y-0.5 group">

                <div class="flex items-center gap-6 flex-1 justify-end">
                  <div class="text-right">
                    <p class="text-xs font-bold text-text-main tracking-tight">{{
                      getTeamName(match.homeCategoryId) }}</p>
                    <p class="text-[9px] font-bold text-text-muted tracking-widest opacity-60">Local</p>
                  </div>
                  <div
                    class="w-12 h-12 rounded-2xl bg-surface-50 border border-border-subtle flex items-center justify-center text-xl font-bold text-text-main group-hover:border-primary-500/50 transition-colors">
                    {{ match.homeScore ?? '-' }}
                  </div>
                </div>

                <div class="flex flex-col items-center gap-1 shrink-0 px-4">
                  <span class="text-[9px] font-bold text-text-muted tracking-widest">{{ match.date }}</span>
                  <div class="flex items-center gap-2">
                    <div class="h-px w-4 bg-border-subtle"></div>
                    <div
                      class="w-8 h-8 bg-surface-200 rounded-full flex items-center justify-center text-[10px] font-bold group-hover:bg-primary-600 group-hover:text-white transition-all">
                      VS</div>
                    <div class="h-px w-4 bg-border-subtle"></div>
                  </div>
                  <span class="text-[9px] font-bold text-primary-600">{{ match.time }}</span>
                  <button v-if="match.status !== 'Validado'" @click="openMatchResult(match.id)"
                    class="mt-3 px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-[9px] font-bold tracking-widest hover:bg-primary-600 hover:text-white transition-all">
                    Cargar Resultado
                  </button>
                  <span v-else
                    class="mt-3 text-[8px] font-bold text-success-600 tracking-widest bg-success-50 px-3 py-1 rounded-full border border-success-100">Finalizado</span>
                </div>

                <div class="flex items-center gap-6 flex-1 justify-start">
                  <div
                    class="w-12 h-12 rounded-2xl bg-surface-50 border border-border-subtle flex items-center justify-center text-xl font-bold text-text-main group-hover:border-primary-500/50 transition-colors">
                    {{ match.awayScore ?? '-' }}
                  </div>
                  <div class="text-left">
                    <p class="text-xs font-bold text-text-main tracking-tight">{{
                      getTeamName(match.awayCategoryId) }}</p>
                    <p class="text-[9px] font-bold text-text-muted tracking-widest opacity-60">Visitante</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB: Playoffs (Placeholder) -->
          <div v-if="detailActiveTab === 'playoffs'"
            class="p-20 bg-surface-100 rounded-[2.5rem] border border-border-subtle text-center animate-in">
            <font-awesome-icon icon="diagram-project" class="text-6xl text-primary-500/20 mb-6" />
            <h4 class="text-lg font-bold text-text-main tracking-tight mb-2">Cuadro de Eliminación</h4>
            <p class="text-text-muted text-sm font-medium">La visualización de Brackets estará disponible cuando el
              torneo alcance la fase eliminatoria.</p>
          </div>
        </div>

        <!-- SIDEBAR: Leaders & Stats (Constant) -->
        <div class="space-y-6">
          <div class="bg-surface-100 rounded-[2.5rem] border border-border-subtle shadow-xl p-8">
            <h3 class="text-sm font-bold text-text-main tracking-widest flex items-center gap-3 mb-8">
              <font-awesome-icon icon="medal" class="text-primary-500" />
              Líderes
            </h3>
            <div class="space-y-6">
              <div v-for="(scorer, idx) in topScorers" :key="scorer.playerId"
                class="flex items-center justify-between group">
                <div class="flex items-center gap-4">
                  <div
                    class="w-8 h-8 rounded-full bg-surface-50 border border-border-subtle flex items-center justify-center text-[10px] font-bold text-text-muted group-hover:bg-primary-600 group-hover:text-white transition-all">
                    {{ idx + 1 }}
                  </div>
                  <p class="text-xs font-bold text-text-main tracking-tight">{{store.performance.find(p =>
                    p.athleteId === scorer.playerId)?.name || 'Jugador ' + scorer.playerId}}</p>
                </div>
                <div class="text-xl font-bold text-primary-600">{{ scorer.goals }}</div>
              </div>
            </div>
          </div>

          <div
            class="bg-linear-to-br from-primary-600 to-accent-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-primary-500/25">
            <h3 class="text-[10px] font-bold tracking-widest opacity-70 mb-2">Resumen</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between text-xs font-bold text-white/70">
                <span>Categorías</span>
                <span class="text-white">{{ selectedTournament?.categories }}</span>
              </div>
              <div class="flex items-center justify-between text-xs font-bold text-white/70">
                <span>Partidos</span>
                <span class="text-white">{{ store.getMatchesByTournament(selectedTournamentId).length }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MatchResultModal v-if="selectedMatchId" :match-id="selectedMatchId" :show="showResultModal"
        @close="showResultModal = false" @saved="selectedMatchId = null" />
    </div>

    <!-- CONTENT: List View -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6 slide-up">
      <div v-for="t in filtered" :key="t.id" @click="selectedTournamentId = t.id"
        class="bg-surface-100 rounded-[2.5rem] border border-border-subtle shadow-sm hover:shadow-xl transition-all overflow-hidden group cursor-pointer">
        <div class="h-2" :style="{ backgroundColor: getSportColor(t.sportId) }"></div>
        <div class="p-8">
          <div class="flex items-start justify-between mb-6">
            <div>
              <h3
                class="text-xl font-bold text-text-main tracking-tight group-hover:text-primary-600 transition-colors">
                {{ t.name }}</h3>
              <span class="text-[10px] font-bold text-text-muted tracking-widest opacity-60">{{
                getSportName(t.sportId) }}</span>
            </div>
            <span
              :class="['text-[9px] font-bold px-4 py-1.5 rounded-full tracking-widest shadow-sm', statusColors[t.status] || 'bg-surface-200 text-text-muted']">{{
                t.status }}</span>
          </div>
          <div class="grid grid-cols-2 gap-4 mt-6 text-sm">
            <div class="flex items-center gap-3 text-text-muted">
              <div
                class="w-8 h-8 rounded-lg bg-surface-50 flex items-center justify-center text-xs opacity-70 group-hover:opacity-100 transition-opacity">
                <font-awesome-icon icon="flag" />
              </div>
              <span class="text-[11px] font-bold tracking-tight">Tipo: <strong class="text-text-main font-bold ml-1">{{
                t.type }}</strong></span>
            </div>
            <div class="flex items-center gap-3 text-text-muted">
              <div
                class="w-8 h-8 rounded-lg bg-surface-50 flex items-center justify-center text-xs opacity-70 group-hover:opacity-100 transition-opacity">
                <font-awesome-icon icon="people-group" />
              </div>
              <span class="text-[11px] font-bold tracking-tight">Categorías: <strong
                  class="text-text-main font-bold ml-1">{{ t.categories }}</strong></span>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-8 pt-6 border-t border-border-subtle">
            <button @click.stop="openEdit(t)"
              class="px-5 py-2 text-[10px] font-bold tracking-widest text-primary-600 hover:bg-primary-50 rounded-xl transition-all active:scale-95">
              <font-awesome-icon icon="pen-to-square" class="mr-2" />Config
            </button>
            <button @click.stop="remove(t)"
              class="px-5 py-2 text-[10px] font-bold tracking-widest text-danger-600 hover:bg-danger-50 rounded-xl transition-all active:scale-95">
              <font-awesome-icon icon="trash" class="mr-2" />Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="showModal = false">
        <div
          class="bg-surface-100 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl border border-border-subtle transition-all duration-300 transform scale-100">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-text-main tracking-tight">{{ editMode ? 'Configurar Torneo' :
              'Nuevo Torneo' }}</h3>
            <button @click="showModal = false"
              class="w-8 h-8 rounded-lg bg-surface-50 text-text-muted hover:text-text-main transition-colors flex items-center justify-center">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>

          <form @submit.prevent="save" class="space-y-6">
            <div class="space-y-4">
              <div>
                <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block">Nombre del
                  Torneo</label>
                <input v-model="form.name"
                  class="w-full px-5 py-3 bg-surface-50 border border-border-subtle rounded-2xl text-sm font-bold focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-text-main"
                  placeholder="Ej: Copa de Verano 2026" />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block">Deporte</label>
                  <select v-model="form.sportId"
                    class="w-full px-5 py-3 bg-surface-50 border border-border-subtle rounded-2xl text-sm font-bold focus:border-primary-500 outline-none text-text-main appearance-none cursor-pointer">
                    <option value="">Seleccionar</option>
                    <option v-for="s in store.sports" :key="s.id" :value="s.id">{{ s.name }}</option>
                  </select>
                </div>
                <div>
                  <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block">Criterio
                    Desempate</label>
                  <select v-model="form.tieBreaker"
                    class="w-full px-5 py-3 bg-surface-50 border border-border-subtle rounded-2xl text-sm font-bold focus:border-primary-500 outline-none text-text-main appearance-none cursor-pointer">
                    <option value="goalDifference">Dif. Goles</option>
                    <option value="headToHead">Ent. Directo</option>
                    <option value="points">Puntos</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block">Categoría</label>
                  <input v-model="form.ageRange"
                    class="w-full px-5 py-3 bg-surface-50 border border-border-subtle rounded-2xl text-sm font-bold focus:border-primary-500 outline-none text-text-main"
                    placeholder="Ej: Sub-15" />
                </div>
                <div>
                  <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block">Categorías</label>
                  <input v-model.number="form.categories" type="number" min="2"
                    class="w-full px-5 py-3 bg-surface-50 border border-border-subtle rounded-2xl text-sm font-bold focus:border-primary-500 outline-none text-text-main" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block">Inicio</label>
                  <input v-model="form.startDate" type="date"
                    class="w-full px-5 py-3 bg-surface-50 border border-border-subtle rounded-2xl text-sm font-bold focus:border-primary-500 outline-none text-text-main" />
                </div>
                <div>
                  <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block">Fin</label>
                  <input v-model="form.endDate" type="date"
                    class="w-full px-5 py-3 bg-surface-50 border border-border-subtle rounded-2xl text-sm font-bold focus:border-primary-500 outline-none text-text-main" />
                </div>
              </div>
            </div>

            <div class="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-border-subtle">
              <button type="button" @click="showModal = false"
                class="px-6 py-3.5 border border-border-subtle rounded-2xl text-[10px] font-bold tracking-widest text-text-muted hover:bg-surface-200 transition-all active:scale-95">
                Cancelar
              </button>
              <button type="submit"
                class="px-8 py-3.5 bg-primary-600 text-white rounded-2xl text-[10px] font-bold tracking-widest hover:bg-primary-700 shadow-xl shadow-primary-500/25 transition-all hover:-translate-y-0.5 active:scale-95">
                {{ editMode ? 'Actualizar' : 'Crear Torneo' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.slide-up {
  animation: slideUp 0.4s cubic-bezier(0, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
