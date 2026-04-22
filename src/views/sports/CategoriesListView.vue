<script setup>
import { ref } from 'vue'
import { useSportsStore } from '@/stores/sports'
import { useInventoryStore } from '@/stores/inventory'
import Swal from 'sweetalert2'

const store = useSportsStore()
const inventoryStore = useInventoryStore()

// State for Categories
const showTeamModal = ref(false)
const editTeamMode = ref(false)
const teamForm = ref({ name: '', sportId: null, tournamentId: null, sedeId: null, color: '#3b82f6', localUniformVariantId: '', awayUniformVariantId: '' })

// Handlers for Categories
function openCreateTeam() {
  teamForm.value = { name: '', sportId: store.sports[0]?.id, tournamentId: null, sedeId: store.sedes[0]?.id, color: '#3b82f6' }
  editTeamMode.value = false
  showTeamModal.value = true
}

function openEditTeam(team) {
  teamForm.value = { ...team }
  editTeamMode.value = true
  showTeamModal.value = true
}

async function saveTeam() {
  if (!teamForm.value.name || !teamForm.value.sportId || !teamForm.value.sedeId) {
    Swal.fire({ icon: 'warning', title: 'Faltan datos requeridos' })
    return
  }

  if (editTeamMode.value) {
    const idx = store.categories.findIndex(t => t.id === teamForm.value.id)
    if (idx !== -1) store.categories[idx] = { ...teamForm.value }
    Swal.fire({ icon: 'success', title: 'Categoría actualizada', timer: 1200, showConfirmButton: false })
  } else {
    const newTeam = {
      ...teamForm.value,
      id: Math.max(...store.categories.map(t => t.id), 0) + 1
    }
    store.categories.push(newTeam)
    Swal.fire({ icon: 'success', title: 'Categoría creada', timer: 1200, showConfirmButton: false })
  }
  showTeamModal.value = false
}

async function deleteTeam(categoryId) {
  const result = await Swal.fire({
    title: '¿Eliminar categoría?',
    text: "Esta acción no se puede deshacer",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Sí, eliminar'
  })
  if (result.isConfirmed) {
    store.categories = store.categories.filter(t => t.id !== categoryId)
    Swal.fire('Eliminada', 'La categoría ha sido eliminada', 'success')
  }
}

const getSportName = (id) => store.sports.find(s => s.id === id)?.name || 'N/A'
const getSedeName = (id) => store.sedes.find(s => s.id === id)?.name || 'N/A'
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-text-main">Categorías del Club</h1>
        <p class="text-sm text-text-muted mt-1 font-medium">Gestión de equipos, técnicos e indumentaria</p>
      </div>
      <button @click="openCreateTeam"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all font-semibold text-xs tracking-widest shadow-lg shadow-primary-500/25 hover:scale-105 active:scale-95">
        <font-awesome-icon icon="plus" /> Nuevo Categoría
      </button>
    </div>

    <div class="bg-surface-100 rounded-3xl border border-border-subtle overflow-hidden shadow-sm transition-colors">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface-50 border-b border-border-subtle transition-colors">
              <th class="px-6 py-4 text-xs font-bold text-text-muted tracking-widest">Categoría</th>
              <th class="px-6 py-4 text-xs font-bold text-text-muted tracking-widest">Deporte</th>
              <th class="px-6 py-4 text-xs font-bold text-text-muted tracking-widest">Sede Asignada</th>
              <th class="px-6 py-4 text-xs font-bold text-text-muted tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-subtle text-sm transition-colors">
            <tr v-for="team in store.categories" :key="team.id" class="hover:bg-surface-50 transition-colors group">
              <td class="px-6 py-4 font-bold text-text-main">
                <div class="flex items-center gap-3">
                  <div class="w-4 h-4 rounded-full border border-border-subtle shadow-inner"
                    :style="{ backgroundColor: team.color }"></div>
                  <span class="truncate">{{ team.name }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-text-muted">{{ getSportName(team.sportId) }}</td>
              <td class="px-6 py-4 text-text-muted italic opacity-80">{{ getSedeName(team.sedeId) }}</td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button @click="openEditTeam(team)"
                    class="p-2.5 text-text-muted hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-xl transition-all">
                    <font-awesome-icon icon="pen-to-square" />
                  </button>
                  <button @click="deleteTeam(team.id)"
                    class="p-2.5 text-text-muted hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/30 rounded-xl transition-all">
                    <font-awesome-icon icon="trash" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!store.categories.length">
              <td colspan="4" class="px-6 py-10 text-center text-text-muted font-medium italic opacity-40">No hay
                equipos registrados</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Categoría -->
    <Teleport to="body">
      <div v-if="showTeamModal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="showTeamModal = false">
        <div
          class="bg-surface-100 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl border border-border-subtle transition-all duration-300 transform scale-100">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-text-main">{{ editTeamMode ? 'Editar Categoría' : 'Nuevo Categoría' }}
            </h3>
            <button @click="showTeamModal = false" class="text-text-muted hover:text-text-main transition-colors">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>

          <form @submit.prevent="saveTeam" class="space-y-5">
            <div>
              <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block opacity-60">Nombre del
                Categoría</label>
              <input v-model="teamForm.name"
                class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-text-main placeholder-text-muted/40"
                placeholder="Ej: Águilas Senior" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block opacity-60">Deporte</label>
                <select v-model="teamForm.sportId"
                  class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 outline-none text-text-main appearance-none cursor-pointer">
                  <option v-for="sport in store.sports" :key="sport.id" :value="sport.id">{{ sport.name }}</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block opacity-60">Sede
                  Asignada</label>
                <select v-model="teamForm.sedeId"
                  class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 outline-none text-text-main appearance-none cursor-pointer">
                  <option v-for="sede in store.sedes" :key="sede.id" :value="sede.id">{{ sede.name }}</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block opacity-60">Indumentaria
                  Local</label>
                <select v-model="teamForm.localUniformVariantId"
                  class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 outline-none text-text-main appearance-none cursor-pointer">
                  <option value="">Ninguna</option>
                  <optgroup
                    v-for="prod in inventoryStore.productsWithVariants.filter(p => p.category === 'Indumentaria')"
                    :key="prod.id" :label="prod.name">
                    <option v-for="v in (prod.variants || []).filter(v => v.style === 'Local')" :key="v.id"
                      :value="v.id">
                      {{ v.color }} ({{ v.size }}) - {{ v.sku }}
                    </option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block opacity-60">Indumentaria
                  Visitante</label>
                <select v-model="teamForm.awayUniformVariantId"
                  class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 outline-none text-text-main appearance-none cursor-pointer">
                  <option value="">Ninguna</option>
                  <optgroup
                    v-for="prod in inventoryStore.productsWithVariants.filter(p => p.category === 'Indumentaria')"
                    :key="prod.id" :label="prod.name">
                    <option v-for="v in (prod.variants || []).filter(v => v.style === 'Visitante')" :key="v.id"
                      :value="v.id">
                      {{ v.color }} ({{ v.size }}) - {{ v.sku }}
                    </option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div class="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-border-subtle mt-8">
              <button type="button" @click="showTeamModal = false"
                class="px-6 py-3 border border-border-subtle rounded-2xl text-sm font-bold text-text-muted hover:bg-surface-200 transition-all">Cancelar</button>
              <button type="submit"
                class="px-8 py-3 bg-primary-600 text-white rounded-2xl text-sm font-bold hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all active:scale-95">
                {{ editTeamMode ? 'GUARDAR CAMBIOS' : 'CREAR CATEGORÍA' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
