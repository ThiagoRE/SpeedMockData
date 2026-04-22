<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useSportsStore } from '@/stores/sports'
import { useUsersStore } from '@/stores/users'
import TacticsCanvas from '@/components/sports/TacticsCanvas.vue'
import Swal from 'sweetalert2'

const store = useSportsStore()
const usersStore = useUsersStore()

// ── Phase control ──
const activeTacticId = ref(null) // null = list view, number = board view

// ── Cascade Selectors ──
const selectedSedeId = ref(null)
const selectedTeamId = ref(null)
const selectedMatchId = ref(null)
const isDrawingMode = ref(false)

// ── Computed: cascade logic ──
const sedeCategories = computed(() => {
  if (!selectedSedeId.value) return []
  return store.categories.filter(t => t.sedeId === selectedSedeId.value)
})

const teamMatches = computed(() => {
  if (!selectedTeamId.value) return []
  return store.matches
    .filter(m => m.homeCategoryId === selectedTeamId.value || m.awayCategoryId === selectedTeamId.value)
    .map(m => {
      const home = store.getCategoryById(m.homeCategoryId)
      const away = store.getCategoryById(m.awayCategoryId)
      return { ...m, label: `${m.date} — ${home?.name} vs ${away?.name}` }
    })
})

const selectedMatch = computed(() => store.matches.find(m => m.id === selectedMatchId.value))

// ── Tactics list for selected match+team ──
const tacticsList = computed(() => {
  if (!selectedMatchId.value || !selectedTeamId.value) return []
  return store.getTacticsByMatchCategory(selectedMatchId.value, selectedTeamId.value)
})

// ── Board-level computed (when a tactic is opened) ──
const currentTeam = computed(() => store.getCategoryById(selectedTeamId.value))
const currentSport = computed(() => store.getSportById(currentTeam.value?.sportId))
const currentLineup = computed(() => store.getLineupById(currentTeam.value?.lineupId))

const summonedPlayers = computed(() => {
  if (!selectedMatch.value || !selectedTeamId.value) return []
  const summons = store.getConvocadosByCategory(selectedMatch.value.tournamentId, selectedTeamId.value)
  return summons.map(s => usersStore.getUserById(s.userId)).filter(Boolean)
})

const assignedAthleteIds = computed(() => {
  return displayPlayers.value.map(p => p.athleteId).filter(Boolean)
})

const benchPlayers = computed(() => {
  return summonedPlayers.value.filter(athlete => !assignedAthleteIds.value.includes(athlete.id))
})

// ── Local Display State (board) ──
const displayPlayers = ref([])
const displayDrawings = ref([])

// ── Load tactic into board ──
watch([activeTacticId, currentLineup], () => {
  if (!activeTacticId.value) {
    displayPlayers.value = []
    displayDrawings.value = []
    return
  }

  const savedTactic = store.getTacticById(activeTacticId.value)
  const lineup = currentLineup.value

  if (lineup) {
    displayPlayers.value = lineup.positions.map(pos => {
      const savedPos = savedTactic?.playerPositions.find(sp => sp.positionId === pos.id)
      const athleteId = savedPos?.athleteId || null
      let athlete = athleteId ? usersStore.users.find(m => m.id === athleteId) : null

      if (!athlete) {
        athlete = summonedPlayers.value.find(s => s.positionId === pos.id && !displayPlayers.value.some(p => p.athleteId === s.id))
      }

      return {
        id: pos.id,
        athleteId: athlete?.id || null,
        name: athlete ? athlete.name : pos.name,
        profileImage: athlete?.profileImage || null,
        x: pos.x + (savedPos?.offset?.x || 0),
        y: pos.y + (savedPos?.offset?.y || 0)
      }
    })
  } else {
    displayPlayers.value = []
  }

  displayDrawings.value = savedTactic?.drawings || []
}, { immediate: true })

// ── Board handlers (unchanged logic) ──
function handlePlayersUpdate(newPlayers) {
  displayPlayers.value = newPlayers
  saveTactic()
}

function handleDrawingsUpdate(newDrawings) {
  displayDrawings.value = newDrawings
  saveTactic()
}

function assignPlayerToPosition(athlete, positionId) {
  const idx = displayPlayers.value.findIndex(p => p.id === positionId)
  if (idx !== -1) {
    displayPlayers.value.forEach(p => {
      if (p.athleteId === athlete.id) {
        p.athleteId = null
        p.name = p.id
        p.profileImage = null
      }
    })

    displayPlayers.value[idx].athleteId = athlete.id
    displayPlayers.value[idx].name = athlete.name
    displayPlayers.value[idx].profileImage = athlete.profileImage
    saveTactic()
    Swal.fire({ icon: 'success', title: `${athlete.name} asignado`, timer: 800, showConfirmButton: false })
  }
}

function unassignPlayer(positionId) {
  const idx = displayPlayers.value.findIndex(p => p.id === positionId)
  if (idx !== -1) {
    displayPlayers.value[idx].athleteId = null
    displayPlayers.value[idx].name = displayPlayers.value[idx].id
    displayPlayers.value[idx].profileImage = null
    saveTactic()
  }
}

function toggleDrawingVisibility(drawingId) {
  const newDrawings = displayDrawings.value.map(d =>
    d.id === drawingId ? { ...d, isVisible: !d.isVisible } : d
  )
  handleDrawingsUpdate(newDrawings)
}

function removeDrawing(drawingId) {
  const newDrawings = displayDrawings.value.filter(d => d.id !== drawingId)
  handleDrawingsUpdate(newDrawings)
}

function clearDrawings() {
  displayDrawings.value = []
  saveTactic()
}

function saveTactic() {
  if (!activeTacticId.value) return

  const lineup = currentLineup.value
  const playerPositions = displayPlayers.value.map(p => {
    const basePos = lineup?.positions.find(bp => bp.id === p.id)
    return {
      athleteId: p.athleteId,
      positionId: p.id,
      offset: {
        x: p.x - (basePos?.x || 0),
        y: p.y - (basePos?.y || 0)
      }
    }
  })

  store.updateMatchTactic(activeTacticId.value, {
    playerPositions,
    drawings: displayDrawings.value
  })
}

function updateTeamLineup(lineupId) {
  if (!selectedTeamId.value) return
  const team = store.getCategoryById(selectedTeamId.value)
  if (team) {
    team.lineupId = lineupId
    if (activeTacticId.value) {
      store.updateMatchTactic(activeTacticId.value, {
        playerPositions: [],
        drawings: displayDrawings.value
      })
    }
    Swal.fire({ icon: 'success', title: 'Alineación actualizada', timer: 1000, showConfirmButton: false })
  }
}

// ── Tactic CRUD actions ──
function openTactic(tacticId) {
  activeTacticId.value = tacticId
  isDrawingMode.value = false
}

function goBackToList() {
  activeTacticId.value = null
  isDrawingMode.value = false
}

async function createNewTactic() {
  const { value: name } = await Swal.fire({
    title: 'Nueva Táctica',
    input: 'text',
    inputLabel: 'Nombre de la táctica',
    inputPlaceholder: 'Ej: Contraataque por bandas',
    showCancelButton: true,
    cancelButtonText: 'Cancelar',
    confirmButtonText: 'Crear',
    inputValidator: (value) => {
      if (!value) return 'Debes ingresar un nombre'
    },
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-xl',
      cancelButton: 'rounded-xl',
    }
  })

  if (name) {
    const tactic = store.addMatchTactic(selectedMatchId.value, selectedTeamId.value, name)
    openTactic(tactic.id)
    Swal.fire({ icon: 'success', title: `"${name}" creada`, timer: 1000, showConfirmButton: false })
  }
}

async function deleteTactic(tacticId, tacticName) {
  const result = await Swal.fire({
    title: '¿Eliminar táctica?',
    text: `Se eliminará "${tacticName}" y todos sus datos.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444',
    customClass: {
      popup: 'rounded-2xl',
      confirmButton: 'rounded-xl',
      cancelButton: 'rounded-xl',
    }
  })

  if (result.isConfirmed) {
    store.deleteMatchTactic(tacticId)
    Swal.fire({ icon: 'success', title: 'Táctica eliminada', timer: 800, showConfirmButton: false })
  }
}

// ── Reset cascade on changes ──
watch(selectedSedeId, () => {
  selectedTeamId.value = null
  selectedMatchId.value = null
  activeTacticId.value = null
})

watch(selectedTeamId, () => {
  selectedMatchId.value = null
  activeTacticId.value = null
})

watch(selectedMatchId, () => {
  activeTacticId.value = null
})

// ── Auto-select first sede on mount ──
onMounted(() => {
  if (store.sedes.length > 0) {
    selectedSedeId.value = store.sedes[0].id
    if (sedeCategories.value.length > 0) {
      selectedTeamId.value = sedeCategories.value[0].id
      if (teamMatches.value.length > 0) {
        selectedMatchId.value = teamMatches.value[0].id
      }
    }
  }
})

// Active tactic name
const activeTacticName = computed(() => {
  if (!activeTacticId.value) return ''
  const t = store.matchTactics.find(mt => mt.id === activeTacticId.value)
  return t?.name || 'Táctica'
})
</script>

<template>
  <div class="h-full md:h-[calc(100vh-12rem)] flex flex-col gap-4 md:gap-6 pb-6 md:pb-0">

    <!-- ═══════ PHASE 1: Selector + List ═══════ -->
    <template v-if="!activeTacticId">
      <!-- Cascade Selectors -->
      <div
        class="bg-surface-100 p-4 rounded-2xl border border-border-subtle shadow-sm flex flex-wrap items-center gap-4 transition-colors duration-300">
        <!-- Sede -->
        <div class="flex-1 min-w-[160px]">
          <label class="text-[10px] font-semibold text-text-muted mb-1 block tracking-wider">Sede</label>
          <select v-model="selectedSedeId"
            class="w-full bg-surface-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none text-text-main transition-colors">
            <option v-for="s in store.sedes" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>

        <!-- Categoría -->
        <div class="flex-1 min-w-[160px]">
          <label class="text-[10px] font-semibold text-text-muted mb-1 block tracking-wider">Categoría</label>
          <select v-model="selectedTeamId"
            class="w-full bg-surface-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none text-text-main transition-colors"
            :disabled="!selectedSedeId">
            <option v-if="sedeCategories.length === 0" :value="null">Sin equipos</option>
            <option v-for="t in sedeCategories" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>

        <!-- Partido -->
        <div class="flex-1 min-w-[220px]">
          <label class="text-[10px] font-semibold text-text-muted mb-1 block tracking-wider">Partido</label>
          <select v-model="selectedMatchId"
            class="w-full bg-surface-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none text-text-main transition-colors"
            :disabled="!selectedTeamId">
            <option v-if="teamMatches.length === 0" :value="null">Sin partidos</option>
            <option v-for="m in teamMatches" :key="m.id" :value="m.id">{{ m.label }}</option>
          </select>
        </div>
      </div>

      <!-- Tactics List -->
      <div class="flex-1 overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4 px-1">
          <h2 class="text-base md:text-lg font-semibold text-text-main flex items-center gap-2">
            <font-awesome-icon icon="clipboard-list" class="text-primary-500" />
            <span>Tácticas</span>
            <span v-if="selectedMatch" class="text-sm text-text-muted font-normal ml-1">
              — {{ store.getCategoryById(selectedMatch.homeCategoryId)?.name }} vs {{
                store.getCategoryById(selectedMatch.awayCategoryId)?.name }}
            </span>
          </h2>
          <button v-if="selectedMatchId && selectedTeamId" @click="createNewTactic"
            class="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2">
            <font-awesome-icon icon="plus" />
            Nueva Táctica
          </button>
        </div>

        <!-- Tactic Cards -->
        <div v-if="tacticsList.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="tactic in tacticsList" :key="tactic.id"
            class="group bg-surface-100 rounded-2xl border border-border-subtle hover:border-primary-300 dark:hover:border-primary-700 p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/5 relative"
            @click="openTactic(tactic.id)">
            <!-- Card Top -->
            <div class="flex items-start justify-between mb-3">
              <div
                class="w-10 h-10 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center text-sm">
                <font-awesome-icon icon="chess-board" />
              </div>
              <button @click.stop="deleteTactic(tactic.id, tactic.name)"
                class="opacity-0 group-hover:opacity-100 p-2 -mt-1 -mr-1 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all">
                <font-awesome-icon icon="trash" class="text-xs" />
              </button>
            </div>

            <!-- Card Body -->
            <h3 class="font-semibold text-text-main text-sm mb-1.5 truncate">{{ tactic.name }}</h3>
            <p class="text-[11px] text-text-muted">
              <font-awesome-icon icon="users" class="mr-1" />
              {{ currentTeam?.name }}
            </p>

            <!-- Card Footer -->
            <div class="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
              <span class="text-[10px] text-text-muted tracking-wider font-semibold">Abrir Pizarra</span>
              <font-awesome-icon icon="arrow-right"
                class="text-primary-500 text-xs group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="selectedMatchId && selectedTeamId"
          class="flex flex-col items-center justify-center py-20 text-center">
          <div
            class="w-20 h-20 bg-surface-100 rounded-3xl flex items-center justify-center mb-5 border border-border-subtle">
            <font-awesome-icon icon="clipboard-list" class="text-3xl text-text-muted opacity-40" />
          </div>
          <h3 class="font-semibold text-text-main mb-2">Sin tácticas aún</h3>
          <p class="text-sm text-text-muted mb-6 max-w-xs">Crea tu primera táctica para este partido y empieza a planear
            la estrategia del equipo.</p>
          <button @click="createNewTactic"
            class="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2">
            <font-awesome-icon icon="plus" />
            Crear Táctica
          </button>
        </div>

        <!-- No match selected -->
        <div v-else class="flex flex-col items-center justify-center py-20 text-center">
          <div
            class="w-20 h-20 bg-surface-100 rounded-3xl flex items-center justify-center mb-5 border border-border-subtle">
            <font-awesome-icon icon="arrow-up" class="text-3xl text-text-muted opacity-40" />
          </div>
          <h3 class="font-semibold text-text-main mb-2">Selecciona un partido</h3>
          <p class="text-sm text-text-muted max-w-xs">Usa los selectores de arriba para elegir la sede, equipo y
            partido.</p>
        </div>
      </div>
    </template>

    <!-- ═══════ PHASE 2: Board ═══════ -->
    <template v-else>
      <!-- Board Header -->
      <div
        class="bg-surface-100 p-4 rounded-2xl border border-border-subtle shadow-sm flex flex-wrap items-center gap-4 transition-colors duration-300">
        <!-- Back Button -->
        <button @click="goBackToList"
          class="h-10 md:h-11 px-4 md:px-5 rounded-xl text-sm font-semibold bg-surface-50 text-text-muted hover:bg-surface-200 transition-all flex items-center gap-2">
          <font-awesome-icon icon="arrow-left" />
          <span class="hidden sm:inline">Volver</span>
        </button>

        <div class="h-10 w-px bg-border-subtle hidden sm:block"></div>

        <!-- Tactic Name -->
        <div class="flex-1 min-w-0">
          <p class="text-[10px] font-semibold text-text-muted tracking-wider mb-0.5">Táctica</p>
          <h2 class="font-semibold text-sm md:text-base text-text-main truncate">{{ activeTacticName }}</h2>
        </div>

        <!-- Lineup selector -->
        <div class="flex-1 min-w-[200px]" v-if="currentTeam">
          <label class="text-[10px] font-semibold text-text-muted mb-1 block tracking-wider">Alineación /
            Formación</label>
          <select :value="currentTeam.lineupId" @change="e => updateTeamLineup(Number(e.target.value))"
            class="w-full bg-surface-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none text-text-main transition-colors">
            <option v-for="l in store.lineups.filter(l => l.sportId === currentTeam.sportId)" :key="l.id" :value="l.id">
              {{ l.name }}
            </option>
          </select>
        </div>

        <div class="h-10 w-px bg-border-subtle mx-2 hidden md:block"></div>

        <!-- Drawing toggle -->
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <button @click="isDrawingMode = !isDrawingMode"
            :class="isDrawingMode ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'bg-surface-50 text-text-muted hover:bg-surface-200'"
            class="h-10 md:h-11 flex-1 sm:flex-initial px-4 md:px-6 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-2">
            <font-awesome-icon icon="pencil" />
            <span>{{ isDrawingMode ? 'Dibujo ON' : 'Pizarra' }}</span>
          </button>
        </div>
      </div>

      <!-- Main Content: Canvas & Players -->
      <div class="flex-1 flex gap-6 overflow-hidden">
        <!-- Tactical Board -->
        <div
          class="flex-1 bg-surface-100 rounded-3xl p-4 shadow-sm border border-border-subtle flex flex-col transition-colors duration-300">
          <div class="flex flex-col sm:row items-start sm:items-center justify-between px-2 gap-2 sm:gap-0">
            <h2 class="font-semibold text-sm md:text-base text-text-main flex items-center gap-2">
              <font-awesome-icon :icon="currentSport?.icon || 'futbol'" class="text-primary-500" />
              <span class="truncate">Pizarra: {{ currentTeam?.name }}</span>
            </h2>
          </div>

          <div class="flex-1 min-h-0 relative">
            <TacticsCanvas :background="currentSport?.fieldBackground" :players="displayPlayers"
              :drawings="displayDrawings" :teamColor="currentTeam?.color" :isDrawingMode="isDrawingMode"
              @update:players="handlePlayersUpdate" @update:drawings="handleDrawingsUpdate"
              @clearDrawings="clearDrawings" />
          </div>
        </div>

        <!-- Players Sidebar -->
        <div
          class="w-72 bg-surface-100 rounded-3xl border border-border-subtle shadow-sm p-5 overflow-y-auto hidden lg:block transition-colors duration-300">
          <h3 class="text-sm font-semibold text-text-main mb-4 flex items-center justify-between">
            Titulares (Campo)
            <span class="px-2 py-0.5 bg-surface-200 text-text-muted rounded text-[10px]">{{ assignedAthleteIds.length }}
              / {{ displayPlayers.length }}</span>
          </h3>

          <div class="space-y-3 mb-8">
            <div v-for="p in displayPlayers" :key="p.id"
              class="p-3 bg-surface-50 rounded-2xl flex items-center gap-3 border border-transparent hover:border-primary-100 dark:hover:border-primary-900 transition-all cursor-default group relative">
              <div
                class="w-10 h-10 rounded-xl overflow-hidden shadow-sm border-2 border-border-subtle shrink-0 bg-surface-100 flex items-center justify-center">
                <img v-if="p.profileImage" :src="p.profileImage" class="w-full h-full object-cover">
                <div v-else class="w-full h-full flex items-center justify-center text-[10px] font-semibold text-white"
                  :style="{ backgroundColor: currentTeam?.color }">
                  {{ p.id }}
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[13px] font-semibold text-text-main leading-tight truncate">{{ p.name }}</p>
                <p class="text-[10px] text-primary-600 dark:text-primary-400 font-semibold">{{ p.id }}</p>
              </div>
              <button v-if="p.athleteId" @click="unassignPlayer(p.id)"
                class="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-500 transition-all">
                <font-awesome-icon icon="times" />
              </button>

              <!-- Dropdown to assign from bench if empty -->
              <div v-if="!p.athleteId"
                class="absolute inset-0 opacity-0 hover:opacity-100 bg-surface-100/90 backdrop-blur-sm rounded-2xl flex items-center justify-center gap-2 transition-all p-2">
                <select
                  @change="e => assignPlayerToPosition(benchPlayers.find(bp => bp.id === Number(e.target.value)), p.id)"
                  class="text-[10px] bg-surface-50 border-none rounded-lg px-2 py-1 w-full focus:ring-0 text-text-main">
                  <option value="">Asignar...</option>
                  <option v-for="bp in benchPlayers" :key="bp.id" :value="bp.id">{{ bp.name }}</option>
                </select>
              </div>
            </div>

            <div v-if="displayPlayers.length === 0" class="text-center py-10">
              <div
                class="w-12 h-12 bg-surface-50 rounded-full flex items-center justify-center mx-auto mb-3 text-text-muted opacity-50">
                <font-awesome-icon icon="users" />
              </div>
              <p class="text-xs text-text-muted">Selecciona un equipo</p>
            </div>
          </div>

          <h3 class="text-sm font-semibold text-text-main mb-4 flex items-center justify-between">
            Banca (Convocados)
            <span class="px-2 py-0.5 bg-surface-200 text-text-muted rounded text-[10px]">{{ benchPlayers.length
              }}</span>
          </h3>

          <div class="space-y-2">
            <div v-for="athlete in benchPlayers" :key="athlete.id"
              class="p-2 bg-surface-50 rounded-xl flex items-center gap-3 border border-transparent hover:border-border-subtle transition-all group">
              <div
                class="w-8 h-8 rounded-lg overflow-hidden shrink-0 grayscale group-hover:grayscale-0 transition-all shadow-xs">
                <img v-if="athlete.profileImage" :src="athlete.profileImage" class="w-full h-full object-cover">
                <div v-else
                  class="w-full h-full bg-surface-200 flex items-center justify-center text-[10px] text-text-muted">
                  {{ athlete.name[0] }}
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[11px] font-semibold text-text-main truncate leading-none">{{ athlete.name }}</p>
                <p class="text-[9px] text-text-muted">Habilitado</p>
              </div>
              <div class="flex gap-1">
                <div v-for="p in displayPlayers.filter(p => !p.athleteId).slice(0, 1)" :key="p.id">
                  <button @click="assignPlayerToPosition(athlete, p.id)"
                    class="p-1 px-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg text-[10px] font-semibold hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors">
                    Entrar
                  </button>
                </div>
              </div>
            </div>

            <div v-if="benchPlayers.length === 0"
              class="text-center py-6 bg-surface-50/50 rounded-2xl border border-dashed border-border-subtle transition-colors">
              <p class="text-[10px] text-text-muted">Toda la nómina en campo</p>
            </div>
          </div>

          <!-- Instructions Section -->
          <div class="mt-8 pt-6 border-t border-border-subtle">
            <h4 class="text-[11px] font-semibold text-text-muted tracking-widest mb-4">Instrucciones</h4>
            <ul class="space-y-3">
              <li class="flex gap-3 text-xs text-text-muted leading-relaxed">
                <span
                  class="w-5 h-5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded flex items-center justify-center shrink-0">
                  <font-awesome-icon icon="hand-pointer" />
                </span>
                Arrastra los jugadores para ajustar su posición.
              </li>
              <li class="flex gap-3 text-xs text-text-muted leading-relaxed">
                <span
                  class="w-5 h-5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded flex items-center justify-center shrink-0">
                  <font-awesome-icon icon="pencil" />
                </span>
                Usa el modo pizarra para dibujar rutas y jugadas.
              </li>
            </ul>
          </div>

          <!-- Drawings Manager Section -->
          <div class="mt-8 pt-6 border-t border-border-subtle">
            <h4 class="text-[11px] font-semibold text-text-muted tracking-widest mb-4">Gestión de Trazados</h4>
            <div class="space-y-2">
              <div v-for="draw in displayDrawings" :key="draw.id"
                class="flex items-center justify-between p-2 bg-surface-50 rounded-xl border border-transparent hover:border-border-subtle transition-all">
                <div class="flex items-center gap-3">
                  <button @click="toggleDrawingVisibility(draw.id)"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all"
                    :class="draw.isVisible !== false ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'bg-surface-200 text-text-muted'">
                    <font-awesome-icon :icon="draw.isVisible !== false ? 'eye' : 'eye-slash'" />
                  </button>
                  <span class="text-xs font-semibold text-text-main">{{ draw.name || 'Sin nombre' }}</span>
                </div>
                <button @click="removeDrawing(draw.id)"
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-all">
                  <font-awesome-icon icon="trash" />
                </button>
              </div>

              <div v-if="displayDrawings.length === 0"
                class="text-center py-4 bg-surface-50/50 rounded-xl border border-dashed border-border-subtle">
                <p class="text-[10px] text-text-muted">Sin trazados activos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<style scoped></style>
