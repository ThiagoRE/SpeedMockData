<script setup>
import { ref, computed } from 'vue'
import { useSportsStore } from '@/stores/sports'
import { useUsersStore } from '@/stores/users'
import Swal from 'sweetalert2'

const props = defineProps({
  matchId: { type: Number, required: true },
  show: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'saved'])

const store = useSportsStore()
const usersStore = useUsersStore()

const match = computed(() => store.matches.find(m => m.id === props.matchId))
const homeCategory = computed(() => store.getCategoryById(match.value?.homeCategoryId))
const awayCategory = computed(() => store.getCategoryById(match.value?.awayCategoryId))

const homeScore = ref(0)
const awayScore = ref(0)
const matchStats = ref([]) // { playerId: null, categoryId: null, goals: 0, assists: 0, yellowCard: false, redCard: false }

// Get players for both categories
const homePlayers = computed(() => usersStore.members.filter(m => m.categoryId === match.value?.homeCategoryId))
const awayPlayers = computed(() => usersStore.members.filter(m => m.categoryId === match.value?.awayCategoryId))

// Initialize form
const initForm = () => {
  if (match.value) {
    homeScore.value = match.value.homeScore || 0
    awayScore.value = match.value.awayScore || 0
    // Try to load existing stats if any
    const existingStats = store.performance.filter(p => p.matchId === props.matchId)
    if (existingStats.length > 0) {
      matchStats.value = existingStats.map(s => ({
        playerId: s.athleteId,
        categoryId: s.categoryId,
        goals: s.annotations || 0,
        assists: s.assists || 0
      }))
    } else {
      matchStats.value = []
    }
  }
}

const addStatEntry = (categoryId) => {
  matchStats.value.push({ playerId: null, categoryId, goals: 1, assists: 0 })
}

const removeStatEntry = (index) => {
  matchStats.value.splice(index, 1)
}

const save = async () => {
  // Basic validation
  if (matchStats.value.some(s => !s.playerId)) {
    Swal.fire({ icon: 'warning', title: 'Datos incompletos', text: 'Debes seleccionar el jugador para cada registro de estadística.' })
    return
  }

  const resultData = {
    homeScore: homeScore.value,
    awayScore: awayScore.value,
    status: 'Validado',
    matchStats: matchStats.value
  }

  store.updateMatch(props.matchId, resultData)

  await Swal.fire({
    icon: 'success',
    title: 'Resultado Guardado',
    text: 'Las posiciones del torneo han sido actualizadas.',
    timer: 1500,
    showConfirmButton: false
  })

  emit('saved')
  emit('close')
}

// Watch for match changes to re-init
import { watch } from 'vue'
watch(() => props.show, (newVal) => {
  if (newVal) initForm()
})
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      @click.self="emit('close')">
      <div
        class="bg-surface-100 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-border-subtle shadow-2xl transition-all scale-100">
        <!-- Header -->
        <div class="px-8 py-6 border-b border-border-subtle flex items-center justify-between bg-surface-50">
          <h3 class="text-xl font-bold text-text-main tracking-tight">Cargar Resultado del Partido</h3>
          <button @click="emit('close')"
            class="w-10 h-10 rounded-xl bg-surface-100 text-text-muted hover:text-text-main transition-colors flex items-center justify-center shadow-sm">
            <font-awesome-icon icon="xmark" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-8 space-y-8">
          <!-- Score Input -->
          <div
            class="flex flex-col md:flex-row items-center justify-center gap-8 bg-surface-50 p-8 rounded-[2rem] border border-border-subtle">
            <div class="flex flex-col items-center gap-4 flex-1">
              <span class="text-xs font-bold text-text-main tracking-widest">{{ homeCategory?.name }}</span>
              <input v-model.number="homeScore" type="number" min="0"
                class="w-24 h-24 text-4xl font-bold text-center bg-surface-100 border border-border-subtle rounded-3xl focus:border-primary-500 outline-none transition-all shadow-sm" />
            </div>

            <div class="text-2xl font-bold text-text-muted/30">VS</div>

            <div class="flex flex-col items-center gap-4 flex-1">
              <span class="text-xs font-bold text-text-main tracking-widest">{{ awayCategory?.name }}</span>
              <input v-model.number="awayScore" type="number" min="0"
                class="w-24 h-24 text-4xl font-bold text-center bg-surface-100 border border-border-subtle rounded-3xl focus:border-primary-500 outline-none transition-all shadow-sm" />
            </div>
          </div>

          <!-- Stats Section -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Home Stats -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold text-text-main tracking-widest flex items-center gap-2">
                  <font-awesome-icon icon="medal" class="text-primary-500" />
                  Estadísticas {{ homeCategory?.name }}
                </h4>
                <button @click="addStatEntry(homeCategory?.id)"
                  class="text-[10px] font-bold text-primary-600 tracking-widest hover:underline">
                  + Agregar jugador
                </button>
              </div>

              <div class="space-y-3">
                <div v-for="(stat, idx) in matchStats.filter(s => s.categoryId === homeCategory?.id)" :key="idx"
                  class="flex items-center gap-3 bg-surface-50 p-4 rounded-2xl border border-border-subtle/50">
                  <select v-model="stat.playerId"
                    class="flex-1 bg-transparent text-xs font-bold outline-none border-none cursor-pointer">
                    <option :value="null">Seleccionar jugador</option>
                    <option v-for="p in homePlayers" :key="p.id" :value="p.id">{{ p.name }}</option>
                  </select>
                  <div class="flex items-center gap-2 border-l border-border-subtle pl-3">
                    <font-awesome-icon icon="futbol" class="text-[10px] text-text-muted" />
                    <input v-model.number="stat.goals" type="number" min="0"
                      class="w-10 bg-transparent text-xs font-bold text-center outline-none" placeholder="G" />
                  </div>
                  <button @click="removeStatEntry(matchStats.indexOf(stat))"
                    class="text-danger-500 hover:text-danger-600 p-1">
                    <font-awesome-icon icon="trash-can" />
                  </button>
                </div>
                <div v-if="matchStats.filter(s => s.categoryId === homeCategory?.id).length === 0"
                  class="text-[10px] text-center py-4 text-text-muted italic tracking-widest opacity-60">
                  Sin registros individuales
                </div>
              </div>
            </div>

            <!-- Away Stats -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold text-text-main tracking-widest flex items-center gap-2">
                  <font-awesome-icon icon="medal" class="text-accent-500" />
                  Estadísticas {{ awayCategory?.name }}
                </h4>
                <button @click="addStatEntry(awayCategory?.id)"
                  class="text-[10px] font-bold text-accent-600 tracking-widest hover:underline">
                  + Agregar jugador
                </button>
              </div>

              <div class="space-y-3">
                <div v-for="(stat, idx) in matchStats.filter(s => s.categoryId === awayCategory?.id)" :key="idx"
                  class="flex items-center gap-3 bg-surface-50 p-4 rounded-2xl border border-border-subtle/50">
                  <select v-model="stat.playerId"
                    class="flex-1 bg-transparent text-xs font-bold outline-none border-none cursor-pointer">
                    <option :value="null">Seleccionar jugador</option>
                    <option v-for="p in awayPlayers" :key="p.id" :value="p.id">{{ p.name }}</option>
                  </select>
                  <div class="flex items-center gap-2 border-l border-border-subtle pl-3">
                    <font-awesome-icon icon="futbol" class="text-[10px] text-text-muted" />
                    <input v-model.number="stat.goals" type="number" min="0"
                      class="w-10 bg-transparent text-xs font-bold text-center outline-none" placeholder="G" />
                  </div>
                  <button @click="removeStatEntry(matchStats.indexOf(stat))"
                    class="text-danger-500 hover:text-danger-600 p-1">
                    <font-awesome-icon icon="trash-can" />
                  </button>
                </div>
                <div v-if="matchStats.filter(s => s.categoryId === awayCategory?.id).length === 0"
                  class="text-[10px] text-center py-4 text-text-muted italic tracking-widest opacity-60">
                  Sin registros individuales
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-8 py-6 border-t border-border-subtle bg-surface-50 flex justify-end gap-4">
          <button @click="emit('close')"
            class="px-6 py-3 text-xs font-bold tracking-widest text-text-muted hover:bg-surface-200 rounded-2xl transition-all">
            Cancelar
          </button>
          <button @click="save"
            class="px-10 py-3 bg-primary-600 text-white rounded-2xl text-xs font-bold tracking-widest shadow-xl shadow-primary-500/25 hover:bg-primary-700 transition-all hover:-translate-y-0.5 active:scale-95">
            Guardar Resultado y Estadísticas
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
