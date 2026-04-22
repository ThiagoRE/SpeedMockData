<script setup>
import { ref, computed } from 'vue'
import { useSportsStore } from '@/stores/sports'
import Swal from 'sweetalert2'

const store = useSportsStore()
const activeTab = ref('sedes') // 'sedes' or 'categories'

// State for Sedes
const showSedeModal = ref(false)
const editSedeMode = ref(false)
const sedeForm = ref({ name: '', address: '', phone: '', isOwned: true, rentalCost: 0, courts: [] })
const newCourtName = ref('')
const newCourtPrice = ref(0)
const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)

// State for Categories
const showTeamModal = ref(false)
const editTeamMode = ref(false)
const teamForm = ref({ name: '', sportId: null, tournamentId: null, sedeId: null, color: '#3b82f6', localUniformVariantId: '', awayUniformVariantId: '' })

// Handlers for Sedes
function openCreateSede() {
  sedeForm.value = { name: '', address: '', phone: '', isOwned: true, rentalCost: 0, courts: [] }
  editSedeMode.value = false
  showSedeModal.value = true
}

function openEditSede(sede) {
  sedeForm.value = { ...sede, courts: [...sede.courts] }
  editSedeMode.value = true
  showSedeModal.value = true
}

function addCourt() {
  if (newCourtName.value.trim()) {
    sedeForm.value.courts.push({
      id: 'nc' + Date.now().toString(36),
      name: newCourtName.value.trim(),
      rentalPrice: newCourtPrice.value || 0
    })
    newCourtName.value = ''
    newCourtPrice.value = 0
  }
}

function removeCourt(index) {
  sedeForm.value.courts.splice(index, 1)
}

async function saveSede() {
  if (!sedeForm.value.name) {
    Swal.fire({ icon: 'warning', title: 'Nombre requerido' })
    return
  }

  try {
    if (editSedeMode.value) {
      const res = await store.updateSede(sedeForm.value.id, sedeForm.value)
      if (res.success) {
        Swal.fire({ icon: 'success', title: 'Sede actualizada', timer: 1200, showConfirmButton: false })
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: res.message })
      }
    } else {
      const res = await store.addSede(sedeForm.value)
      if (res.success) {
        Swal.fire({ icon: 'success', title: 'Sede creada', timer: 1200, showConfirmButton: false })
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: res.message })
      }
    }
  } catch(e) {
    Swal.fire({ icon: 'error', title: 'Error de Red', text: 'Imposible conectar con el servidor.' })
  }
  
  showSedeModal.value = false
}

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
    Swal.fire({ icon: 'success', title: 'Categoría actualizado', timer: 1200, showConfirmButton: false })
  } else {
    const newTeam = {
      ...teamForm.value,
      id: Math.max(...store.categories.map(t => t.id), 0) + 1
    }
    store.categories.push(newTeam)
    Swal.fire({ icon: 'success', title: 'Categoría creado', timer: 1200, showConfirmButton: false })
  }
  showTeamModal.value = false
}

async function deleteTeam(categoryId) {
  const result = await Swal.fire({
    title: '¿Eliminar equipo?',
    text: "Esta acción no se puede deshacer",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Sí, eliminar'
  })
  if (result.isConfirmed) {
    store.categories = store.categories.filter(t => t.id !== categoryId)
    Swal.fire('Eliminado', 'El equipo ha sido eliminado', 'success')
  }
}

const getSportName = (id) => store.sports.find(s => s.id === id)?.name || 'N/A'
const getSedeName = (id) => store.sedes.find(s => s.id === id)?.name || 'N/A'
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-text-main">Estructura del Club</h1>
        <p class="text-sm text-text-muted mt-1">Gestión de sedes físicas y equipos deportivos</p>
      </div>
      <div class="flex bg-surface-200 p-1 rounded-xl w-fit border border-border-subtle transition-colors">
        <button @click="activeTab = 'sedes'"
          :class="activeTab === 'sedes' ? 'bg-surface-100 shadow-sm text-primary-600 border-border-subtle' : 'text-text-muted hover:text-text-main'"
          class="px-4 py-2 rounded-lg text-sm font-bold transition-all border border-transparent">
          Sedes
        </button>
        <button @click="activeTab = 'categories'"
          :class="activeTab === 'categories' ? 'bg-surface-100 shadow-sm text-primary-600 border-border-subtle' : 'text-text-muted hover:text-text-main'"
          class="px-4 py-2 rounded-lg text-sm font-bold transition-all border border-transparent">
          Categorías
        </button>
      </div>
    </div>

    <!-- Sedes Tab -->
    <div v-if="activeTab === 'sedes'" class="space-y-4">
      <div class="flex justify-end">
        <button @click="openCreateSede"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors text-sm font-medium">
          <font-awesome-icon icon="plus" /> Nueva Sede
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div v-for="sede in store.sedes" :key="sede.id"
          class="bg-surface-100 rounded-3xl border border-border-subtle p-6 shadow-sm hover:shadow-xl transition-all group">
          <div class="flex justify-between items-start mb-6">
            <div class="flex items-center gap-4">
              <div
                class="w-14 h-14 bg-primary-100 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center text-2xl shadow-inner transition-colors">
                <font-awesome-icon icon="building" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-text-main text-xl">{{ sede.name }}</h3>
                  <span
                    :class="['text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider', sede.isOwned ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700']">
                    {{ sede.isOwned ? 'Sede Propia' : 'Alquilada' }}
                  </span>
                </div>
                <p class="text-sm text-text-muted">{{ sede.address }}</p>
                <p v-if="!sede.isOwned" class="text-xs font-bold text-warning-600 mt-1">Costo Base: {{
                  formatCurrency(sede.rentalCost) }}</p>
              </div>
            </div>
            <button @click="openEditSede(sede)"
              class="p-2.5 text-text-muted hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-all">
              <font-awesome-icon icon="pen-to-square" />
            </button>
          </div>

          <div class="grid grid-cols-2 gap-4 mt-6">
            <div class="p-4 bg-surface-50 border border-border-subtle rounded-2xl transition-colors">
              <p class="text-[10px] font-bold text-text-muted tracking-widest mb-1 opacity-60">Canchas/Espacios</p>
              <p class="font-bold text-text-main text-lg tabular-nums">{{ sede.courts.length }}</p>
            </div>
            <div class="p-4 bg-surface-50 border border-border-subtle rounded-2xl transition-colors">
              <p class="text-[10px] font-bold text-text-muted tracking-widest mb-1 opacity-60">Categorías en sede</p>
              <p class="font-bold text-text-main text-lg tabular-nums">{{store.categories.filter(t => t.sedeId ===
                sede.id).length }}</p>
            </div>
          </div>

          <div class="mt-6">
            <p class="text-[10px] font-bold text-text-muted tracking-widest mb-3 opacity-60">Instalaciones (Alquiler
              Público)</p>
            <div class="flex flex-col gap-2">
              <div v-for="court in sede.courts" :key="court.id"
                class="flex items-center justify-between px-4 py-2 bg-surface-200/50 border border-border-subtle rounded-xl text-sm font-bold text-text-muted transition-colors">
                <span>{{ court.name }}</span>
                <span class="text-success-600 dark:text-success-500">{{ formatCurrency(court.rentalPrice) }}/hr</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Categories Tab -->
    <div v-if="activeTab === 'categories'" class="space-y-4">
      <div class="flex justify-end">
        <button @click="openCreateTeam"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors text-sm font-medium">
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
                <th class="px-6 py-4 text-xs font-bold text-text-muted tracking-widest">Sede</th>
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
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Sede -->
    <Teleport to="body">
      <div v-if="showSedeModal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="showSedeModal = false">
        <div
          class="bg-surface-100 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl border border-border-subtle transition-all duration-300 transform scale-100 overflow-y-auto max-h-[90vh]">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-text-main">{{ editSedeMode ? 'Editar Sede' : 'Nueva Sede' }}</h3>
            <button @click="showSedeModal = false" class="text-text-muted hover:text-text-main transition-colors">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>

          <form @submit.prevent="saveSede" class="space-y-5">
            <div>
              <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block opacity-60">Nombre de la
                Sede</label>
              <input v-model="sedeForm.name"
                class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-text-main placeholder-text-muted/40"
                placeholder="Ej: Sede Campestre" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block opacity-60">Dirección</label>
                <input v-model="sedeForm.address"
                  class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-text-main"
                  placeholder="Ej: Calle 123..." />
              </div>
              <div>
                <label
                  class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block opacity-60">Teléfono</label>
                <input v-model="sedeForm.phone"
                  class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-text-main"
                  placeholder="Ej: +57 300..." />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block opacity-60">Propiedad</label>
                <div class="flex gap-4 items-center h-[46px]">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" v-model="sedeForm.isOwned" :value="true"
                      class="text-primary-600 focus:ring-primary-500" />
                    <span class="text-sm font-bold text-text-main">Sede Propia</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" v-model="sedeForm.isOwned" :value="false"
                      class="text-warning-600 focus:ring-warning-500" />
                    <span class="text-sm font-bold text-text-main">Sede Alquilada</span>
                  </label>
                </div>
              </div>
              <div v-if="!sedeForm.isOwned">
                <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block opacity-60">Costo Base /
                  Hora (Pagado por el club)</label>
                <input v-model.number="sedeForm.rentalCost" type="number"
                  class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-warning-500 focus:ring-4 focus:ring-warning-500/10 outline-none transition-all text-text-main"
                  placeholder="Ej: 50000" />
              </div>
            </div>

            <div>
              <label class="text-[10px] font-bold text-text-muted tracking-widest mb-3 block opacity-60">Canchas e
                Instalaciones</label>
              <div class="flex flex-col sm:flex-row gap-2 mb-4">
                <input v-model="newCourtName" @keyup.enter="addCourt"
                  class="flex-2 px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-text-main placeholder-text-muted/40"
                  placeholder="Nombre de la cancha (Ej: Sintética 5)" />
                <input v-model.number="newCourtPrice" @keyup.enter="addCourt" type="number"
                  class="flex-1 px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-text-main placeholder-text-muted/40"
                  placeholder="Precio Alquiler/hr" />
                <button type="button" @click="addCourt"
                  class="px-6 py-3 bg-text-main text-surface-100 rounded-2xl hover:opacity-90 font-bold transition-all active:scale-95 shadow-lg">Agregar</button>
              </div>
              <div class="flex flex-col gap-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                <div v-for="(court, index) in sedeForm.courts" :key="court.id || index"
                  class="flex items-center justify-between px-4 py-2 bg-surface-200/50 border border-border-subtle rounded-xl text-sm font-bold text-text-muted transition-colors">
                  <div class="flex items-center justify-between w-full pr-4">
                    <span>{{ court.name }}</span>
                    <span class="text-success-600">{{ formatCurrency(court.rentalPrice) }}</span>
                  </div>
                  <button type="button" @click="removeCourt(index)"
                    class="hover:text-danger-500 transition-colors p-1"><font-awesome-icon
                      icon="circle-xmark" /></button>
                </div>
              </div>
            </div>

            <div class="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-border-subtle mt-8">
              <button type="button" @click="showSedeModal = false"
                class="px-6 py-3 border border-border-subtle rounded-2xl text-sm font-bold text-text-muted hover:bg-surface-200 transition-all">Cancelar</button>
              <button type="submit"
                class="px-8 py-3 bg-primary-600 text-white rounded-2xl text-sm font-bold hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all active:scale-95">
                {{ editSedeMode ? 'GUARDAR CAMBIOS' : 'CREAR SEDE' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

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
                  <optgroup v-for="prod in store.products.filter(p => p.category === 'Indumentaria')" :key="prod.id"
                    :label="prod.name">
                    <option v-for="v in prod.variants.filter(v => v.style === 'Local')" :key="v.id" :value="v.id">
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
                  <optgroup v-for="prod in store.products.filter(p => p.category === 'Indumentaria')" :key="prod.id"
                    :label="prod.name">
                    <option v-for="v in prod.variants.filter(v => v.style === 'Visitante')" :key="v.id" :value="v.id">
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
                {{ editTeamMode ? 'GUARDAR CAMBIOS' : 'CREAR EQUIPO' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
