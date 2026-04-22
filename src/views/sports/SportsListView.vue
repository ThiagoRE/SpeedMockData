<script setup>
import { ref, computed } from 'vue'
import { useSportsStore } from '@/stores/sports'
import Swal from 'sweetalert2'

const store = useSportsStore()
const showModal = ref(false)
const editMode = ref(false)
const form = ref({ name: '', studentPseudonym: 'Estudiante', scoringUnit: '', color: '#3b82f6', playersPerTeam: 1 })

const sportIcons = {
  'Fútbol': 'futbol', 'Baloncesto': 'basketball-ball', 'Tenis': 'table-tennis-paddle-ball',
  'Natación': 'person-swimming', 'Karate': 'hand-fist',
}

function openCreate() {
  form.value = { name: '', studentPseudonym: 'Estudiante', scoringUnit: '', color: '#3b82f6', playersPerTeam: 1 }
  editMode.value = false
  showModal.value = true
}
function openEdit(sport) {
  form.value = { ...sport }
  editMode.value = true
  showModal.value = true
}
async function saveSport() {
  if (!form.value.name || !form.value.scoringUnit) {
    Swal.fire({ icon: 'warning', title: 'Datos requeridos', confirmButtonColor: '#3b82f6' })
    return
  }
  if (!form.value.studentPseudonym) {
    form.value.studentPseudonym = 'Estudiante'
  }
  if (editMode.value) {
    store.updateSport(form.value.id, form.value)
    await Swal.fire({ icon: 'success', title: 'Deporte actualizado', timer: 1200, showConfirmButton: false })
  } else {
    store.addSport({ ...form.value })
    await Swal.fire({ icon: 'success', title: 'Deporte creado', timer: 1200, showConfirmButton: false })
  }
  showModal.value = false
}
async function deleteSport(sport) {
  const result = await Swal.fire({
    title: '¿Eliminar deporte?', text: `Se eliminará "${sport.name}"`,
    icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', confirmButtonColor: '#ef4444',
  })
  if (result.isConfirmed) {
    store.deleteSport(sport.id)
    Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1000, showConfirmButton: false })
  }
}
import { onMounted } from 'vue'

onMounted(() => {
  store.fetchSports()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-text-main tracking-tight">Catálogo de Deportes</h1>
        <p class="text-sm text-text-muted mt-1 font-medium">Disciplinas habilitadas en el club</p>
      </div>
      <button @click="openCreate"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all font-semibold text-xs tracking-widest shadow-lg shadow-primary-500/25 hover:scale-105 active:scale-95">
        <font-awesome-icon icon="plus" /> Nuevo Deporte
      </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div v-for="sport in store.sports" :key="sport.id"
        class="bg-surface-100 rounded-3xl border border-border-subtle shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col">
        <div class="h-2" :style="{ backgroundColor: sport.color }"></div>
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl text-white"
              :style="{ backgroundColor: sport.color + '20', color: sport.color }">
              <font-awesome-icon :icon="sportIcons[sport.name] || 'futbol'" />
            </div>
            <div
              class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
              <button @click="openEdit(sport)"
                class="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-100 border border-border-subtle hover:bg-primary-50 dark:hover:bg-primary-950/30 text-primary-500 transition-all shadow-sm"><font-awesome-icon
                  icon="pen-to-square" /></button>
              <button @click="deleteSport(sport)"
                class="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-100 border border-border-subtle hover:bg-danger-50 dark:hover:bg-danger-950/30 text-danger-500 transition-all shadow-sm"><font-awesome-icon
                  icon="trash" /></button>
            </div>
          </div>
          <h3 class="text-xl font-semibold text-text-main tracking-tight">{{ sport.name }}</h3>
          <div class="mt-4 space-y-3 text-sm text-text-muted">
            <div class="flex items-center justify-between">
              <span>Unidad de puntuación</span>
              <span class="font-semibold text-text-main">{{ sport.scoringUnit }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Seudónimo</span>
              <span class="font-semibold text-text-main">{{ sport.studentPseudonym || 'Estudiante' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Titulares por categoria</span>
              <span class="font-semibold text-text-main">{{ sport.playersPerTeam }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Torneos activos</span>
              <span
                class="font-semibold text-text-main bg-surface-200 px-2 py-0.5 rounded-lg border border-border-subtle">{{
                  store.getTournamentsBySport(sport.id)?.length || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="showModal = false">
        <div
          class="bg-surface-100 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-border-subtle transition-all duration-300 transform scale-100">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold text-text-main">{{ editMode ? 'Editar Deporte' : 'Nuevo Deporte' }}</h3>
            <button @click="showModal = false" class="text-text-muted hover:text-text-main transition-colors">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>

          <form @submit.prevent="saveSport" class="space-y-5">
            <div>
              <label class="text-xs font-semibold text-text-muted tracking-wider mb-2 block">Nombre</label>
              <input v-model="form.name"
                class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-text-main placeholder-text-muted/40"
                placeholder="Ej: Voleibol" />
            </div>
            <div>
              <label class="text-xs font-semibold text-text-muted tracking-wider mb-2 block">Unidad de
                Puntuación</label>
              <input v-model="form.scoringUnit"
                class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-text-main placeholder-text-muted/40"
                placeholder="Ej: Sets, Goles, Puntos" />
            </div>
            <div>
              <label class="text-xs font-semibold text-text-muted tracking-wider mb-2 block">Seudónimo del
                Estudiante</label>
              <input v-model="form.studentPseudonym"
                class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-text-main placeholder-text-muted/40"
                placeholder="Ej: Futbolista, Nadador" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-semibold text-text-muted tracking-wider mb-2 block">Color
                  Distintivo</label>
                <div class="flex gap-2 items-center">
                  <input v-model="form.color" type="color"
                    class="w-12 h-12 rounded-xl border border-border-subtle cursor-pointer bg-surface-50 p-1" />
                  <span class="text-xs font-mono text-text-muted">{{ form.color }}</span>
                </div>
              </div>
              <div>
                <label class="text-xs font-semibold text-text-muted tracking-wider mb-2 block">Titulares Por
                  Categoría</label>
                <input v-model.number="form.playersPerTeam" type="number" min="1"
                  class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-text-main" />
              </div>
            </div>
            <div class="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8">
              <button type="button" @click="showModal = false"
                class="px-6 py-3 border border-border-subtle rounded-2xl text-sm font-semibold text-text-muted hover:bg-surface-200 transition-all active:scale-95">
                Cancelar
              </button>
              <button type="submit"
                class="px-6 py-3 bg-primary-600 text-white rounded-2xl text-sm font-semibold hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all active:scale-95">
                {{ editMode ? 'Guardar Cambios' : 'Crear Deporte' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
