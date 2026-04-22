<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFinanceStore } from '@/stores/finance'
import { useUsersStore } from '@/stores/users'
import Swal from 'sweetalert2'

const router = useRouter()
const finance = useFinanceStore()
const members = useUsersStore()

const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)

const getAgedDebt = (dueDate, saldo) => {
  if (saldo <= 0) return null
  const today = new Date()
  const due = new Date(dueDate)
  const diffTime = today - due
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return { label: 'Al día', color: 'text-success-600 bg-success-50' }
  if (diffDays <= 30) return { label: '1-30 días', color: 'text-warning-600 bg-warning-50' }
  if (diffDays <= 60) return { label: '31-60 días', color: 'text-danger-500 bg-danger-50' }
  return { label: '90+ días', color: 'text-danger-700 bg-danger-100 font-bold' }
}

const getDynamicStatus = (c) => {
  if (c.estado === 'anulado') return 'Anulado'
  if (c.saldo <= 0) return 'Pagado'
  if (new Date() > new Date(c.fechaVencimiento)) return 'Vencido'
  return 'Pendiente'
}

const statusColors = {
  'Pagado': 'bg-success-100 dark:bg-success-950/30 text-success-700 dark:text-success-400',
  'Pendiente': 'bg-warning-100 dark:bg-warning-950/30 text-warning-700 dark:text-warning-400',
  'Vencido': 'bg-danger-100 dark:bg-danger-950/30 text-danger-700 dark:text-danger-400',
  'Anulado': 'bg-surface-200 text-text-muted'
}

const memberPortfolios = computed(() => {
  const portfolios = {}
  finance.documentos.forEach(d => {
    if (d.naturaleza !== 'credito') return

    if (!portfolios[d.deportistaId]) {
      const member = members.getUserById(d.deportistaId)
      portfolios[d.deportistaId] = { member, creditos: [], totalDebt: 0, totalPaid: 0, oldestDue: null }
    }

    const p = portfolios[d.deportistaId]
    p.creditos.push(d)

    if (d.estado !== 'anulado') {
      if (d.saldo > 0) {
        p.totalDebt += d.saldo
        if (!p.oldestDue || new Date(d.fechaVencimiento) < new Date(p.oldestDue)) {
          p.oldestDue = d.fechaVencimiento
        }
      }
      p.totalPaid += (d.monto - d.saldo)
    }
  })

  return Object.values(portfolios).sort((a, b) => b.totalDebt - a.totalDebt)
})

const sysTotalPending = computed(() => memberPortfolios.value.reduce((acc, p) => acc + p.totalDebt, 0))
const sysTotalCollected = computed(() => memberPortfolios.value.reduce((acc, p) => acc + p.totalPaid, 0))

async function sendReminder(memberName) {
  const result = await Swal.fire({
    title: 'Cobranza Digital',
    text: `¿Enviar notificación de cobro a ${memberName}?`,
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: 'Sí, enviar ahora'
  })

  if (result.isConfirmed) {
    Swal.fire({
      title: '¡Enviado!',
      text: 'Se ha enviado el recordatorio de pago vía WhatsApp y Email.',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    })
  }
}

function viewCurrentAccount(userId) {
  router.push({ name: 'CurrentAccount', params: { id: userId } })
}
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
      <div>
        <h1 class="text-3xl font-bold text-text-main tracking-tighter">Cartera Unificada</h1>
        <p class="text-sm text-text-muted mt-1 font-medium italic opacity-70">Visión consolidada de obligaciones y
          saldos vivos de Cuentas Corrientes</p>
      </div>
    </div>

    <!-- Summary Metrics -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div
        class="bg-surface-100 rounded-3xl border border-border-subtle shadow-sm p-6 group hover:shadow-lg transition-all relative overflow-hidden">
        <div class="flex items-center gap-4 mb-3 relative z-10">
          <div
            class="w-12 h-12 rounded-2xl bg-linear-to-br from-success-500 to-success-600 flex items-center justify-center shadow-lg shadow-success-500/20 group-hover:scale-110 transition-transform">
            <font-awesome-icon icon="circle-check" class="text-white text-lg" />
          </div>
          <div>
            <span class="text-[10px] font-bold text-text-muted tracking-widest opacity-60">Total Recaudado</span>
            <p class="text-2xl font-bold text-success-600 dark:text-success-400 tabular-nums">{{
              formatCurrency(sysTotalCollected) }}</p>
          </div>
        </div>
        <div
          class="absolute -right-4 -bottom-4 text-success-500/5 text-7xl rotate-12 group-hover:scale-125 transition-transform">
          <font-awesome-icon icon="money-bill-trend-up" />
        </div>
      </div>

      <div
        class="bg-surface-100 rounded-3xl border border-border-subtle shadow-sm p-6 group hover:shadow-lg transition-all relative overflow-hidden">
        <div class="flex items-center gap-4 mb-3 relative z-10">
          <div
            class="w-12 h-12 rounded-2xl bg-linear-to-br from-warning-500 to-danger-500 flex items-center justify-center shadow-lg shadow-warning-500/20 group-hover:scale-110 transition-transform">
            <font-awesome-icon icon="circle-exclamation" class="text-white text-lg" />
          </div>
          <div>
            <span class="text-[10px] font-bold text-text-muted tracking-widest opacity-60">Saldos Vivos (Cuentas)</span>
            <p class="text-2xl font-bold text-danger-600 dark:text-danger-400 tabular-nums">{{
              formatCurrency(sysTotalPending) }}</p>
          </div>
        </div>
        <div
          class="absolute -right-4 -bottom-4 text-danger-500/5 text-7xl rotate-12 group-hover:scale-125 transition-transform">
          <font-awesome-icon icon="triangle-exclamation" />
        </div>
      </div>

      <div
        class="bg-surface-100 rounded-3xl border border-border-subtle shadow-sm p-6 group hover:shadow-lg transition-all relative overflow-hidden">
        <div class="flex items-center gap-4 mb-3 relative z-10">
          <div
            class="w-12 h-12 rounded-2xl bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform">
            <font-awesome-icon icon="people-group" class="text-white text-lg" />
          </div>
          <div>
            <span class="text-[10px] font-bold text-text-muted tracking-widest opacity-60">Socios con Deuda</span>
            <p class="text-2xl font-bold text-text-main tabular-nums">{{memberPortfolios.filter(p => p.totalDebt >
              0).length}}</p>
          </div>
        </div>
        <div
          class="absolute -right-4 -bottom-4 text-primary-500/5 text-7xl rotate-12 group-hover:scale-125 transition-transform">
          <font-awesome-icon icon="user-clock" />
        </div>
      </div>
    </div>

    <!-- Member Portfolios -->
    <div class="space-y-8">
      <div v-for="p in memberPortfolios" :key="p.member?.id"
        class="bg-surface-100 rounded-[2.5rem] border border-border-subtle shadow-sm overflow-hidden transition-all hover:shadow-2xl group relative">
        <!-- Card Header -->
        <div
          class="px-8 py-6 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-surface-50/50">
          <div class="flex items-center gap-5">
            <div
              class="w-16 h-16 rounded-[1.5rem] bg-linear-to-br from-primary-500 to-accent-600 flex items-center justify-center text-white text-xl font-bold shadow-lg transition-transform group-hover:rotate-6 group-hover:scale-110">
              {{p.member?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}}
            </div>
            <div>
              <p class="text-lg font-bold text-text-main tracking-tight">{{ p.member?.name }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span v-if="p.totalDebt > 0"
                  class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-danger-100 text-danger-700 tracking-tighter">
                  Debe ${{ p.totalDebt }}
                </span>
                <p class="text-[10px] text-text-muted font-bold opacity-60">{{ p.member?.email }}</p>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button @click="viewCurrentAccount(p.member?.id)"
              class="px-6 py-3 bg-surface-200 text-text-muted rounded-2xl text-[10px] font-bold tracking-widest hover:bg-surface-300 transition-all active:scale-95 flex items-center gap-2">
              <font-awesome-icon icon="eye" /> Ver Cuenta Corriente
            </button>
            <button v-if="p.totalDebt > 0" @click="sendReminder(p.member?.name)"
              class="px-6 py-3 bg-white dark:bg-surface-200 border-2 border-primary-500/20 text-primary-600 rounded-2xl text-[10px] font-bold tracking-widest hover:bg-primary-600 hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2">
              <font-awesome-icon icon="paper-plane" />
              Cobrar
            </button>
          </div>
        </div>

        <!-- Detail Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-surface-50 border-b border-border-subtle">
                <th class="px-8 py-5 text-[10px] font-bold text-text-muted tracking-widest">Documento / Concepto</th>
                <th class="px-8 py-5 text-center text-[10px] font-bold text-text-muted tracking-widest">Antigüedad</th>
                <th class="px-8 py-5 text-center text-[10px] font-bold text-text-muted tracking-widest">Vencimiento</th>
                <th class="px-8 py-5 text-right text-[10px] font-bold text-text-muted tracking-widest">Saldo Vivo</th>
                <th class="px-8 py-5 text-center text-[10px] font-bold text-text-muted tracking-widest">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-subtle">
              <tr v-for="c in p.creditos" :key="c.id"
                class="text-sm hover:bg-surface-50 transition-colors group relative overflow-hidden"
                :class="[c.estado === 'anulado' ? 'opacity-50' : '']">
                <td class="px-8 py-5">
                  <p class="font-bold text-text-main group-hover:translate-x-1 transition-transform">{{
                    c.numeroDocumento }} - {{ c.concepto }}</p>
                  <p class="text-[10px] text-text-muted font-bold opacity-60 uppercase">{{ c.tipoDocumento }}</p>
                </td>
                <td class="px-8 py-5 text-center">
                  <span v-if="c.saldo > 0 && c.estado !== 'anulado'"
                    :class="['text-[9px] font-bold px-3 py-1.5 rounded-lg tracking-tight', getAgedDebt(c.fechaVencimiento, c.saldo)?.color]">
                    {{ getAgedDebt(c.fechaVencimiento, c.saldo)?.label }}
                  </span>
                  <span v-else class="text-[9px] font-bold text-text-muted opacity-30 italic">N/A</span>
                </td>
                <td class="px-8 py-5 text-center text-[11px] font-mono font-bold text-text-muted">
                  {{ c.fechaVencimiento }}
                </td>
                <td class="px-8 py-5 text-right font-bold text-text-main tabular-nums">
                  <span v-if="c.saldo > 0" class="text-danger-600">{{ formatCurrency(c.saldo) }}</span>
                  <span v-else class="text-success-600 opacity-50">{{ formatCurrency(0) }}</span>
                </td>
                <td class="px-8 py-5 text-center">
                  <span
                    :class="['text-[9px] font-bold px-4 py-1.5 rounded-full tracking-tighter shadow-sm', statusColors[getDynamicStatus(c)]]">
                    {{ getDynamicStatus(c) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
