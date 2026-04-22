<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUsersStore } from '@/stores/users'
import { useConfigStore } from '@/stores/config'
import { mockSports } from '@/data/mockData'
import Swal from 'sweetalert2'

const usersStore = useUsersStore()
const configStore = useConfigStore()
const router = useRouter()
const search = ref('')
const filterRole = ref('')
const showModal = ref(false)
const editMode = ref(false)
const roles = ['administrativo', 'profesor', 'deportista', 'supervisor']
const roleLabels = { administrativo: 'Administrativo', profesor: 'Profesor', deportista: 'Deportista', supervisor: 'Supervisor' }
const roleColors = {
  administrativo: 'bg-accent-100 dark:bg-accent-950/30 text-accent-700 dark:text-accent-400',
  profesor: 'bg-primary-100 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400',
  deportista: 'bg-success-100 dark:bg-success-950/30 text-success-700 dark:text-success-400',
  supervisor: 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400'
}

const form = ref({
  name: '', email: '', role: 'deportista', phone: '', status: 'activo', password: '',
  documentType: 'CC', documentNumber: '', birthDate: '', enrollmentDate: '', createdAt: new Date().toISOString().split('T')[0],
  canViewFinancialReports: false
})

const filteredUsers = computed(() => {
  return usersStore.users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.value.toLowerCase()) || u.email.toLowerCase().includes(search.value.toLowerCase())
    const matchRole = !filterRole.value || u.role === filterRole.value
    return matchSearch && matchRole
  })
})

function openCreate() {
  form.value = {
    name: '', email: '', role: 'deportista', phone: '', status: 'activo', password: '',
    documentType: 'CC', documentNumber: '', birthDate: '', enrollmentDate: '', createdAt: new Date().toISOString().split('T')[0],
    canViewFinancialReports: false
  }
  editMode.value = false
  showModal.value = true
}
function openEdit(user) {
  form.value = { ...user, canViewFinancialReports: user.canViewFinancialReports || false }
  editMode.value = true
  showModal.value = true
}

async function saveUser() {
  if (!form.value.name || !form.value.email) {
    Swal.fire({ icon: 'warning', title: 'Datos requeridos', text: 'Nombre y correo son obligatorios', confirmButtonColor: '#3b82f6' })
    return
  }
  if (editMode.value) {
    try {
      await usersStore.updateUser(form.value.id, form.value)
      await Swal.fire({ icon: 'success', title: 'Usuario actualizado', timer: 1200, showConfirmButton: false })
      showModal.value = false
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Error al actualizar usuario' })
    }
  } else {
    try {
      const res = await usersStore.addUser(form.value)
      await Swal.fire({ icon: 'success', title: 'Usuario creado', timer: 1200, showConfirmButton: false })
      showModal.value = false

      if (form.value.role === 'deportista') {
        const newId = res?.id || Math.max(...usersStore.users.map(u => u.id), 0)
        router.push({ name: 'EnrollmentCreate', params: { deportistaId: newId } })
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Error al crear usuario' })
    }
  }
}

async function removeUser(id) {
  const r = await Swal.fire({ title: '¿Desactivar usuario?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' })
  if (r.isConfirmed) {
    try {
      await usersStore.deleteUser(id)
      Swal.fire({ icon: 'success', title: 'Desactivado', timer: 1000, showConfirmButton: false })
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message })
    }
  }
}

function viewProfile(u) {
  router.push(`/usuarios/${u.id}`)
}

onMounted(() => {
  usersStore.fetchUsers()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-text-main tracking-tight">Usuarios & Control de Acceso</h1>
        <p class="text-sm text-text-muted mt-1 font-medium">Gestión RBAC por sección deportiva</p>
      </div>
      <button @click="openCreate"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all font-semibold text-xs tracking-widest shadow-lg shadow-primary-500/25 hover:scale-105 active:scale-95">
        <font-awesome-icon icon="plus" /> Nuevo Usuario
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="relative flex-1 group">
        <font-awesome-icon icon="magnifying-glass"
          class="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted text-sm opacity-50 group-focus-within:opacity-100 transition-opacity" />
        <input v-model="search" type="text" placeholder="Buscar por nombre o correo..."
          class="w-full pl-12 pr-5 py-3 rounded-2xl border border-border-subtle bg-surface-100 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none text-sm font-semibold text-text-main transition-all placeholder-text-muted/40 shadow-sm" />
      </div>
      <div class="relative group">
        <select v-model="filterRole"
          class="appearance-none pl-5 pr-12 py-3 rounded-2xl border border-border-subtle text-sm font-semibold tracking-tighter focus:border-primary-500 outline-none bg-surface-100 text-text-main shadow-sm transition-all hover:bg-surface-200">
          <option value="">Todos los roles</option>
          <option v-for="r in roles" :key="r" :value="r">{{ roleLabels[r] }}</option>
        </select>
        <font-awesome-icon icon="chevron-down"
          class="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] text-text-muted pointer-events-none opacity-50" />
      </div>
    </div>

    <!-- Table -->
    <div
      class="bg-surface-100 rounded-2xl shadow-sm border border-border-subtle overflow-hidden transition-colors duration-300">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-surface-50 border-b border-border-subtle">
            <tr>
              <th class="text-left text-xs font-semibold text-text-muted px-6 py-4">Usuario</th>
              <th class="text-left text-xs font-semibold text-text-muted px-6 py-4">Correo</th>
              <th class="text-left text-xs font-semibold text-text-muted px-6 py-4">Rol</th>
              <th class="text-left text-xs font-semibold text-text-muted px-6 py-4">Permisos Deportes</th>
              <th class="text-left text-xs font-semibold text-text-muted px-6 py-4">Estado</th>
              <th class="text-right text-xs font-semibold text-text-muted px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-subtle">
            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-surface-50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 rounded-full bg-linear-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {{ user.avatar }}
                  </div>
                  <span class="font-medium text-text-main text-sm line-clamp-1">{{ user.name }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-text-muted truncate max-w-[150px]">{{ user.email }}</td>
              <td class="px-6 py-4">
                <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full', roleColors[user.role]]">
                  {{ roleLabels[user.role] }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div v-if="user.role === 'administrativo'" class="text-xs text-text-muted italic">Acceso completo</div>
                <div v-else class="flex flex-col gap-1">
                  <div v-if="user.permissions && Object.keys(user.permissions).length" class="flex flex-wrap gap-1">
                    <span v-for="(perms, sportId) in user.permissions" :key="sportId"
                      class="text-[10px] px-2 py-0.5 rounded-full bg-surface-200 text-text-muted border border-border-subtle">
                      {{mockSports.find(s => s.id === Number(sportId))?.name || sportId}}:
                      {{ Array.isArray(perms) ? perms.join(',') : perms }}
                    </span>
                  </div>
                  <span v-else-if="!user.canViewFinancialReports" class="text-xs text-text-muted opacity-50">—</span>
                  <span v-if="user.canViewFinancialReports"
                    class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100/50 text-emerald-700 border border-emerald-200 w-max">
                    <font-awesome-icon icon="chart-pie" class="mr-1" /> Finanzas y Reportes
                  </span>
                </div>
              </td>
              <td class="px-8 py-4">
                <span
                  :class="['text-[10px] font-semibold px-3.5 py-1.5 rounded-full tracking-widest shadow-sm', user.status === 'activo' ? 'bg-success-100 dark:bg-success-950/30 text-success-700 dark:text-success-400' : 'bg-danger-100 dark:bg-danger-950/30 text-danger-700 dark:text-danger-400']">
                  {{ user.status === 'activo' ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="openEdit(user)"
                    class="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 text-primary-500 transition-colors"
                    title="Editar">
                    <font-awesome-icon icon="pen-to-square" class="text-sm" />
                  </button>
                  <button @click="deleteUser(user)"
                    class="p-2 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/30 text-danger-500 transition-colors"
                    title="Eliminar">
                    <font-awesome-icon icon="trash" class="text-sm" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="showModal = false">
        <div
          class="bg-surface-100 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl border border-border-subtle transition-all duration-300 transform scale-100">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold text-text-main">{{ editMode ? 'Editar Usuario' : 'Nuevo Usuario' }}</h3>
            <button @click="showModal = false" class="text-text-muted hover:text-text-main transition-colors">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>

          <form @submit.prevent="saveUser" class="space-y-5">
            <!-- Foto de Perfil (Opcional/Obligatoria) -->
            <div class="flex justify-center mb-4">
               <div class="relative group cursor-pointer flex flex-col items-center">
                  <div class="w-20 h-20 rounded-2xl bg-surface-200 border-2 border-dashed border-border-subtle flex items-center justify-center overflow-hidden group-hover:border-primary-500 transition-colors">
                     <font-awesome-icon icon="users" class="text-text-muted text-xl group-hover:scale-110 transition-transform" />
                  </div>
                  <p class="text-[9px] font-bold text-center mt-2 text-text-muted uppercase tracking-tighter">
                    {{ configStore.config.foto_obligatoria ? 'Foto Obligatoria *' : 'Subir Foto' }}
                  </p>
                  <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" />
               </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-semibold text-text-muted tracking-wider mb-2 block">Nombre completo</label>
                <input v-model="form.name"
                  class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-text-main placeholder-text-muted/40"
                  placeholder="Ej: Juan Pérez" />
              </div>
              <div>
                <label class="text-xs font-semibold text-text-muted tracking-wider mb-2 block">Correo
                  electrónico</label>
                <input v-model="form.email" type="email"
                  class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-text-main"
                  placeholder="correo@ejemplo.com" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-semibold text-text-muted tracking-wider mb-2 block">Tipo de Documento</label>
                <select v-model="form.documentType"
                  class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-text-main appearance-none cursor-pointer">
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="TI">Tarjeta de Identidad</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="Pasaporte">Pasaporte</option>
                </select>
              </div>
              <div>
                <label class="text-xs font-semibold text-text-muted tracking-wider mb-2 block">Número de
                  Documento</label>
                <input v-model="form.documentNumber"
                  class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-text-main"
                  placeholder="Ej: 1000000000" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-semibold text-text-muted tracking-wider mb-2 block">Teléfono</label>
                <input v-model="form.phone"
                  class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-text-main"
                  placeholder="Ej: +57 300..." />
              </div>
              <div>
                <label class="text-xs font-semibold text-text-muted tracking-wider mb-2 block">Fecha de
                  Nacimiento</label>
                <input v-model="form.birthDate" type="date"
                  class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-text-main" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-semibold text-text-muted tracking-wider mb-2 block">Fecha de
                  Inscripción</label>
                <input v-model="form.enrollmentDate" type="date"
                  class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-text-main" />
              </div>
              <div>
                <label class="text-xs font-semibold text-text-muted tracking-wider mb-2 block">Fecha de Creación
                  Registro</label>
                <input v-model="form.createdAt" type="date"
                  class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-text-main" />
              </div>
            </div>

            <!-- Campos Condicionales de Documentos -->
            <div v-if="configStore.config.mostrar_historia_clinica || configStore.config.mostrar_examenes_medicos" class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-surface-200 rounded-2xl border border-border-subtle">
               <div v-if="configStore.config.mostrar_historia_clinica">
                 <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 block">Historia Clínica (PDF)</label>
                 <input type="file" accept="application/pdf" class="text-[10px] text-text-main file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
               </div>
               <div v-if="configStore.config.mostrar_examenes_medicos">
                 <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 block">Exámenes Médicos (PDF)</label>
                 <input type="file" accept="application/pdf" class="text-[10px] text-text-main file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
               </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-semibold text-text-muted tracking-wider mb-2 block">Rol</label>
                <select v-model="form.role"
                  class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-text-main appearance-none cursor-pointer">
                  <option v-for="r in roles" :key="r" :value="r">{{ roleLabels[r] }}</option>
                </select>
              </div>
              <div>
                <label class="text-xs font-semibold text-text-muted tracking-wider mb-2 block">Estado</label>
                <select v-model="form.status"
                  class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-text-main appearance-none cursor-pointer">
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            <div class="pt-4 border-t border-border-subtle">
              <label class="text-xs font-semibold text-text-muted tracking-wider mb-2 block">Permisos Especiales
                Globales</label>
              <label
                class="flex items-center gap-3 p-3 bg-surface-50 border border-border-subtle rounded-xl cursor-pointer hover:bg-surface-100 transition-colors">
                <input type="checkbox" v-model="form.canViewFinancialReports"
                  class="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 bg-surface-200 border-border-subtle">
                <div>
                  <span class="text-sm font-bold text-text-main flex items-center gap-2"><font-awesome-icon
                      icon="chart-line" /> Acceso a Reportes Financieros</span>
                  <span class="text-xs text-text-muted block">Permite a este usuario visualizar carteras, saldos y
                    descargar informes, sin importar el rol.</span>
                </div>
              </label>
            </div>

            <div class="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8">
              <button type="button" @click="showModal = false"
                class="px-6 py-3 border border-border-subtle rounded-2xl text-sm font-semibold text-text-muted hover:bg-surface-200 transition-all active:scale-95">
                Cancelar
              </button>
              <button type="submit"
                class="px-6 py-3 bg-primary-600 text-white rounded-2xl text-sm font-semibold hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all active:scale-95">
                {{ editMode ? 'Guardar Cambios' : 'Crear Usuario' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
