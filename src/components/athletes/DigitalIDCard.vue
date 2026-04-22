<script setup>
import { computed } from 'vue'
import { useConfigStore } from '@/stores/config'
import { useFinanceStore } from '@/stores/finance'
import { useSportsStore } from '@/stores/sports'

const props = defineProps({
  member: {
    type: Object,
    required: true
  },
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const configStore = useConfigStore()
const financeStore = useFinanceStore()
const sportsStore = useSportsStore()

// Mock logic for "Membership Status"
const isOverdue = computed(() => {
  const memberCharges = financeStore.getChargesByUser(props.member.id)
  return memberCharges.some(c => c.status === 'Vencido')
})

const qrUrl = computed(() => {
  // Using a standard QR API for the demo
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MEM-${props.member.id}-${props.member.document}`
})

const sportName = computed(() => {
  if (!props.member.sports?.length) return 'Comunidad'
  return sportsStore.sports.find(s => s.id === props.member.sports[0])?.name || 'Deporte'
})
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      @click.self="emit('close')">
      <div class="relative w-full max-w-[400px] aspect-[1/1.58] group perspective-1000">
        <!-- Close Button -->
        <button @click="emit('close')"
          class="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors">
          <font-awesome-icon icon="xmark" size="2xl" />
        </button>

        <!-- Card Container -->
        <div
          class="relative w-full h-full bg-slate-950 rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 flex flex-col items-center p-10 select-none">

          <!-- Background Effects -->
          <div class="absolute -top-20 -left-20 w-60 h-60 bg-primary-600/20 rounded-full blur-[80px]"></div>
          <div class="absolute -bottom-20 -right-20 w-60 h-60 bg-accent-600/20 rounded-full blur-[80px]"></div>

          <!-- Glossy Overlay -->
          <div class="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-black/30 pointer-events-none">
          </div>

          <!-- Header -->
          <div class="relative z-10 w-full flex items-center justify-between mb-8">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                <font-awesome-icon icon="rocket" class="text-white" />
              </div>
              <div>
                <p class="text-[10px] font-bold tracking-widest text-white/40">Membresía Oficial</p>
                <p class="text-sm font-bold text-white italic tracking-tighter">{{ configStore.branding.nombre || 'SPEED' }}</p>
              </div>
            </div>
            <div class="px-3 py-1 rounded-full text-[9px] font-bold tracking-widest"
              :class="isOverdue ? 'bg-danger-500 text-white animate-pulse' : 'bg-success-500/20 text-success-400 border border-success-500/30'">
              {{ isOverdue ? 'Revisión Requerida' : 'Activo' }}
            </div>
          </div>

          <!-- Profile Photo -->
          <div class="relative z-10 w-44 h-44 mb-6">
            <div
              class="absolute inset-0 bg-linear-to-br from-primary-500 to-accent-500 rounded-[2.5rem] rotate-6 opacity-20">
            </div>
            <div
              class="absolute inset-0 bg-linear-to-br from-primary-500 to-accent-500 rounded-[2.5rem] -rotate-3 opacity-20">
            </div>
            <img :src="member.profileImage"
              class="relative w-full h-full object-cover rounded-[2.5rem] border-2 border-white/20 shadow-2xl" />
          </div>

          <!-- Name & Category -->
          <div class="relative z-10 text-center mb-8">
            <h2 class="text-2xl font-bold text-white leading-tight tracking-tight">{{ member.name }}</h2>
            <p class="text-primary-400 font-bold text-sm mt-1">{{ sportName }} • Categoría Juvenil</p>
          </div>

          <!-- Bottom Section with QR -->
          <div class="relative z-10 w-full mt-auto flex items-end justify-between gap-6">
            <div class="flex-1">
              <div class="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                <p class="text-[9px] font-bold text-white/30 mb-2">ID Registro</p>
                <p class="text-lg font-bold text-white tracking-widest">{{ String(member.document).slice(-4) }}-{{
                  member.id }}</p>
              </div>
            </div>

            <div
              class="w-32 h-32 bg-white rounded-3xl p-3 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500 border-4 border-white/10 overflow-hidden">
              <img :src="qrUrl" class="w-full h-full object-contain mix-blend-multiply opacity-90" alt="QR Access" />
            </div>
          </div>

          <!-- Security Tag -->
          <div
            class="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 h-1 bg-linear-to-r from-transparent via-primary-500/30 to-transparent">
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95) blur(10px);
}

.perspective-1000 {
  perspective: 1000px;
}
</style>
