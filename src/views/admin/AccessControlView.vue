<script setup>
import { ref, computed } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useFinanceStore } from '@/stores/finance'
import { useHealthStore } from '@/stores/health'
import { useSportsStore } from '@/stores/sports'
import Swal from 'sweetalert2'

const usersStore = useUsersStore()
const financeStore = useFinanceStore()
const healthStore = useHealthStore()
const sportsStore = useSportsStore()

const searchQuery = ref('')
const selectedUser = ref(null)
const accessLogs = ref([])

const findMember = () => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return

  const member = usersStore.users.find(u =>
    u.id.toString() === query ||
    u.document?.toString() === query ||
    u.name.toLowerCase().includes(query)
  )

  if (member) {
    processAccess(member)
    searchQuery.value = ''
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Socio no encontrado',
      text: 'Verifica el documento o ID ingresado.',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    })
  }
}

const processAccess = (member) => {
  const memberCharges = financeStore.charges.filter(c => c.userId === member.id)
  const isOverdue = memberCharges.some(c => c.status === 'Vencido')
  const healthAlert = healthStore.getHealthByUserId(member.id)
  const activeInjuries = healthStore.getActiveInjuriesByUserId(member.id)

  selectedUser.value = {
    ...member,
    isOverdue,
    healthAlert,
    activeInjuries,
    timestamp: new Date().toLocaleTimeString()
  }

  // Add to logs
  accessLogs.value.unshift({
    id: Date.now(),
    userId: member.id,
    memberName: member.name,
    status: isOverdue ? 'Alerta Deuda' : 'Acceso Denegado', // Overdue doesn't mean denied, just alert
    type: isOverdue ? 'danger' : 'success',
    time: new Date().toLocaleTimeString()
  })

  if (accessLogs.value.length > 10) accessLogs.value.pop()
}

const getSportName = (sId) => sportsStore.sports.find(s => s.id === sId)?.name || 'N/A'
</script>

<template>
  <div class="access-control p-6 max-w-7xl mx-auto space-y-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 class="text-3xl font-bold text-text-main tracking-tight">Control de Accesos</h1>
        <p class="text-text-muted mt-1 font-medium">Validación de socios y registro de ingreso</p>
      </div>

      <div class="flex-1 max-w-md">
        <div class="relative group">
          <input v-model="searchQuery" @keyup.enter="findMember" type="text"
            placeholder="Escanear QR o ingresar ID/Documento..."
            class="w-full pl-12 pr-4 py-4 bg-surface-100 rounded-3xl border-2 border-border-subtle focus:border-primary-500 outline-none transition-all shadow-lg text-lg font-bold" />
          <font-awesome-icon icon="qrcode"
            class="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-text-muted group-focus-within:text-primary-500" />
          <button @click="findMember"
            class="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary-600 text-white rounded-2xl font-bold text-sm shadow-md">
            Validar
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Result Panel -->
      <div class="lg:col-span-2">
        <Transition name="slide-up">
          <div v-if="selectedUser"
            class="bg-surface-100 rounded-[3rem] p-10 border border-border-subtle shadow-2xl relative overflow-hidden h-full flex flex-col justify-center">
            <!-- Alert Backgrounds -->
            <div v-if="selectedUser.isOverdue"
              class="absolute inset-0 bg-danger-500/5 animate-pulse pointer-events-none"></div>

            <div class="relative z-10 flex flex-col md:flex-row items-center gap-10">
              <div class="relative">
                <img :src="selectedUser.profileImage"
                  class="w-48 h-48 rounded-[2.5rem] object-cover shadow-2xl border-4"
                  :class="selectedUser.isOverdue ? 'border-danger-500' : 'border-success-500'" />
                <div
                  class="absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-2xl font-bold text-sm shadow-xl"
                  :class="selectedUser.isOverdue ? 'bg-danger-500 text-white' : 'bg-success-500 text-white'">
                  {{ selectedUser.isOverdue ? 'Deuda Pendiente' : 'Socio Activo' }}
                </div>
              </div>

              <div class="flex-1 text-center md:text-left space-y-4">
                <div>
                  <p class="text-xs font-bold text-text-muted tracking-widest mb-1">Nombre Completo</p>
                  <h2 class="text-4xl font-bold text-text-main tracking-tighter">{{ selectedUser.name }}</h2>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-[10px] font-bold text-text-muted tracking-widest">Documento</p>
                    <p class="font-bold text-text-main">{{ selectedUser.document }}</p>
                  </div>
                  <div>
                    <p class="text-[10px] font-bold text-text-muted tracking-widest">Deporte</p>
                    <p class="font-bold text-primary-600">{{ getSportName(selectedUser.sports[0]) }}</p>
                  </div>
                </div>

                <!-- Health Alerts for Supervisor -->
                <div v-if="selectedUser.healthAlert?.chronicDiseases || selectedUser.activeInjuries.length"
                  class="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-3xl space-y-3">
                  <p
                    class="text-[10px] font-bold text-amber-700 dark:text-amber-400 tracking-widest flex items-center gap-2">
                    <font-awesome-icon icon="triangle-exclamation" />
                    Observaciones de Campo
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <span v-if="selectedUser.healthAlert?.chronicDiseases"
                      class="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-xl text-xs font-bold">
                      Condición: {{ selectedUser.healthAlert.chronicDiseases }}
                    </span>
                    <span v-for="injury in selectedUser.activeInjuries" :key="injury.id"
                      class="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-xl text-xs font-bold">
                      Lesión: {{ injury.type }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Access Grant Message -->
            <div class="mt-12 text-center">
              <div
                class="inline-flex items-center gap-4 px-10 py-5 bg-surface-50 rounded-full border border-border-subtle shadow-inner">
                <div class="w-8 h-8 rounded-full flex items-center justify-center"
                  :class="selectedUser.isOverdue ? 'bg-danger-100 text-danger-600' : 'bg-success-100 text-success-600'">
                  <font-awesome-icon :icon="selectedUser.isOverdue ? 'circle-xmark' : 'circle-check'"
                    class="text-xl" />
                </div>
                <p class="text-xl font-bold text-text-main">
                  {{ selectedUser.isOverdue ? 'SOLICITAR REGULARIZACIÓN' : 'INGRESO AUTORIZADO' }}
                </p>
              </div>
            </div>
          </div>
          <div v-else
            class="h-full bg-surface-100 rounded-[3rem] border-2 border-dashed border-border-subtle flex flex-col items-center justify-center p-20 text-center opacity-50">
            <font-awesome-icon icon="qrcode" class="text-8xl text-text-muted mb-6" />
            <p class="text-2xl font-bold text-text-muted max-w-sm">Escanéa el carnet del socio para iniciar el proceso
              de ingreso</p>
          </div>
        </Transition>
      </div>

      <!-- Log Sidebar -->
      <div class="bg-surface-100 rounded-[3rem] p-8 border border-border-subtle shadow-xl h-full flex flex-col">
        <h3 class="text-xl font-bold text-text-main mb-6 flex items-center gap-3">
          <font-awesome-icon icon="history" class="text-primary-500" />
          Ingresos Recientes
        </h3>

        <div class="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          <div v-for="log in accessLogs" :key="log.id"
            class="p-4 rounded-2xl bg-surface-50 border border-border-subtle hover:border-primary-200 transition-colors">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[10px] font-bold text-text-muted tracking-widest">{{ log.time }}</span>
              <span class="w-2 h-2 rounded-full"
                :class="log.type === 'danger' ? 'bg-danger-500' : 'bg-success-500'"></span>
            </div>
            <p class="font-bold text-text-main text-sm truncate">{{ log.memberName }}</p>
            <p class="text-[10px] font-bold text-text-muted mt-1">Socio #{{ log.userId }}</p>
          </div>

          <div v-if="accessLogs.length === 0" class="text-center py-10">
            <p class="text-xs text-text-muted font-bold italic">No se han registrado ingresos hoy</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-up-enter-active {
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}
</style>
