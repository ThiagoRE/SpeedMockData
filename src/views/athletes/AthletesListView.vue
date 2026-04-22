<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUsersStore } from '@/stores/users'
import { mockSports } from '@/data/mockData'
import Swal from 'sweetalert2'

const router = useRouter()
const store = useUsersStore()
const search = ref('')
const filterSport = ref('')
const filterStatus = ref('')

const getSportName = (id) => mockSports.find(s => s.id === id)?.name || ''
const getSportColor = (id) => mockSports.find(s => s.id === id)?.color || '#999'

const filtered = computed(() => {
  return store.deportistas.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.value.toLowerCase()) || m.email.toLowerCase().includes(search.value.toLowerCase())
    const matchSport = !filterSport.value || m.sports?.includes(Number(filterSport.value))
    const matchStatus = !filterStatus.value || m.status === filterStatus.value
    return matchSearch && matchSport && matchStatus
  })
})

function viewProfile(member) {
  router.push({ name: 'AthleteProfile', params: { id: member.id } })
}


</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-text-main">Directorio de Deportistas</h1>
        <p class="text-sm text-text-muted mt-1">{{ store.deportistas.filter(d => d.status === 'active').length }} deportistas activos de {{ store.deportistas.length
          }} registrados</p>
      </div>

    </div>

    <div class="flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1 group">
        <font-awesome-icon icon="magnifying-glass"
          class="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm opacity-60 group-focus-within:opacity-100 transition-opacity" />
        <input v-model="search" type="text" placeholder="Buscar deportista..."
          class="w-full pl-11 pr-4 py-3 rounded-2xl border border-border-subtle bg-surface-100 focus:bg-surface-50 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none text-sm transition-all text-text-main placeholder-text-muted/40" />
      </div>
      <select v-model="filterSport"
        class="px-4 py-3 rounded-2xl border border-border-subtle text-sm focus:border-primary-500 outline-none bg-surface-100 text-text-main appearance-none cursor-pointer font-bold">
        <option value="">Todos los deportes</option>
        <option v-for="s in mockSports" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
      <select v-model="filterStatus"
        class="px-4 py-3 rounded-2xl border border-border-subtle text-sm focus:border-primary-500 outline-none bg-surface-100 text-text-main appearance-none cursor-pointer font-bold">
        <option value="">Todos los estados</option>
        <option value="active">Activo</option>
        <option value="inactive">Inactivo</option>
      </select>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div v-for="m in filtered" :key="m.id" @click="viewProfile(m)"
        class="bg-surface-100 rounded-3xl border border-border-subtle shadow-sm p-6 hover:shadow-xl hover:border-primary-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden">
        <div class="flex items-center gap-4 mb-5 relative z-10">
          <div
            class="w-14 h-14 rounded-2xl overflow-hidden border-2 border-surface-200 shadow-lg shrink-0 bg-linear-to-br from-primary-400 to-accent-600 transition-transform group-hover:scale-110">
            <img v-if="m.profileImage" :src="m.profileImage" class="w-full h-full object-cover">
            <div v-else class="w-full h-full flex items-center justify-center text-white font-bold text-lg">
              {{m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}}
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p
              class="text-sm font-bold text-text-main truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors tracking-tight">
              {{ m.name }}</p>
            <p class="text-[10px] text-text-muted truncate font-bold opacity-60">{{ m.email }}</p>
          </div>
          <span
            :class="['w-3 h-3 rounded-full flex-shrink-0 shadow-sm border-2 border-surface-100', m.status === 'active' ? 'bg-success-500' : 'bg-surface-300']"></span>
        </div>
        <div class="flex flex-wrap gap-2 mb-4 relative z-10">
          <span v-for="sportId in m.sports" :key="sportId"
            class="text-[9px] font-bold px-2 py-0.5 rounded-lg text-white tracking-tighter"
            :style="{ backgroundColor: getSportColor(sportId) }">
            {{ getSportName(sportId) }}
          </span>
        </div>
        <div
          class="flex items-center justify-between text-[10px] font-bold text-text-muted pt-4 border-t border-border-subtle border-dashed opacity-60">
          <span class="flex items-center gap-1"><font-awesome-icon icon="calendar" /> {{ m.enrollmentDate }}</span>
          <span class="flex items-center gap-1"><font-awesome-icon icon="phone" /> {{ m.phone }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
