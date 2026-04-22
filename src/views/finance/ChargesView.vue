<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFinanceStore } from '@/stores/finance'
import { useUsersStore } from '@/stores/users'
import Swal from 'sweetalert2'

const router = useRouter()
const finance = useFinanceStore()
const members = useUsersStore()

const filterType = ref('')
const filterStatus = ref('')
const showModal = ref(false)

const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)
const getMemberName = (id) => members.getUserById(id)?.name || '—'

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

const typeStyles = {
  'mensualidad': 'text-primary-600 dark:text-primary-400',
  'matricula': 'text-accent-600 dark:text-accent-400',
  'interes': 'text-danger-600 dark:text-danger-400 font-bold',
  'torneo': 'text-success-600 dark:text-success-400',
  'producto': 'text-text-main',
  'multa': 'text-warning-600'
}

const typeLabels = {
    'mensualidad': 'Mensualidad',
    'matricula': 'Matrícula',
    'torneo': 'Torneo',
    'interes': 'Interés Mora',
    'producto': 'Producto',
    'multa': 'Multa'
}

const form = ref({ userId: '', concept: '', amount: '', type: 'mensualidad', dueDate: '' })

const filtered = computed(() => {
  return finance.documentos.filter(c => {
    if (c.naturaleza !== 'credito') return false
    const dynStatus = getDynamicStatus(c)
    return (!filterType.value || c.tipoDocumento === filterType.value) && 
           (!filterStatus.value || dynStatus === filterStatus.value)
  }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
})

async function saveCharge() {
  if (!form.value.userId || !form.value.amount || !form.value.dueDate) {
    Swal.fire({ icon: 'warning', title: 'Datos requeridos completarlos' }); 
    return
  }
  
  finance.crearCredito({
      deportistaId: Number(form.value.userId),
      tipoDocumento: form.value.type,
      concepto: form.value.concept,
      monto: Number(form.value.amount),
      fechaVencimiento: form.value.dueDate
  })
  
  await Swal.fire({ icon: 'success', title: 'Documento Creado', timer: 1200, showConfirmButton: false })
  showModal.value = false
}

async function runLateFees() {
  const result = await Swal.fire({
    title: '¿Calcular moras?',
    text: 'Se generarán documentos de interés para todos los saldos vencidos fuera de los días de gracia.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, calcular',
    confirmButtonColor: '#ef4444'
  })

  if (result.isConfirmed) {
    try {
        const count = finance.calcularInteresesMora()
        await Swal.fire({ icon: 'success', title: 'Cálculo finalizado', text: `Se generaron ${count} documentos de mora.` })
    } catch(e) {
        await Swal.fire({ icon: 'info', title: 'Sin cambios', text: e.message })
    }
  }
}

function viewCurrentAccount(userId) {
    router.push({ name: 'CurrentAccount', params: { id: userId } })
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
      <div>
        <h1 class="text-3xl font-bold text-text-main tracking-tighter">Documentos de Cargo (Créditos)</h1>
        <p class="text-sm text-text-muted mt-1 font-medium italic opacity-70">Saldos deudores generados en cuentas corrientes</p>
      </div>
      <button @click="showModal = true"
        class="group relative px-8 py-4 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 shadow-xl shadow-primary-500/20 transition-all active:scale-95 font-bold text-xs tracking-widest overflow-hidden">
        <span class="relative z-10 flex items-center gap-2">
          <font-awesome-icon icon="plus" /> NUEVO DOCUMENTO MANUAL
        </span>
        <div
          class="absolute inset-0 bg-linear-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700">
        </div>
      </button>
    </div>

    <!-- Quick Actions Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        class="bg-linear-to-br from-primary-500/5 to-primary-600/10 border border-primary-500/20 rounded-[2rem] p-6 flex items-center justify-between group hover:border-primary-500/40 transition-all cursor-pointer"
        @click="$router.push('/athletes')">
        <div class="flex items-center gap-5">
          <div
            class="w-14 h-14 rounded-2xl bg-white dark:bg-surface-200 shadow-lg flex items-center justify-center text-primary-600 transform group-hover:rotate-12 transition-transform">
            <font-awesome-icon icon="users" class="text-2xl" />
          </div>
          <div>
            <h3 class="font-bold text-text-main tracking-tight">Cuentas Corrientes</h3>
            <p class="text-xs text-text-muted font-bold opacity-60">Buscar deportista para ver estado de cuenta</p>
          </div>
        </div>
        <font-awesome-icon icon="chevron-right"
          class="text-text-muted opacity-30 group-hover:translate-x-2 transition-transform" />
      </div>

      <div
        class="bg-linear-to-br from-danger-500/5 to-danger-600/10 border border-danger-500/20 rounded-[2rem] p-6 flex items-center justify-between group hover:border-danger-500/40 transition-all cursor-pointer"
        @click="runLateFees">
        <div class="flex items-center gap-5">
          <div
            class="w-14 h-14 rounded-2xl bg-white dark:bg-surface-200 shadow-lg flex items-center justify-center text-danger-600 transform group-hover:rotate-12 transition-transform">
            <font-awesome-icon icon="clock-rotate-left" class="text-2xl" />
          </div>
          <div>
            <h3 class="font-bold text-text-main tracking-tight">Cálculo de Moras</h3>
            <p class="text-xs text-text-muted font-bold opacity-60">Analizar y sancionar documentos vencidos</p>
          </div>
        </div>
        <font-awesome-icon icon="rotate"
          class="text-text-muted opacity-30 group-hover:rotate-180 transition-transform duration-500" />
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-4 bg-surface-50 p-4 rounded-3xl border border-border-subtle">
      <div class="flex-1 min-w-[200px] relative">
        <select v-model="filterType"
          class="w-full appearance-none pl-10 pr-10 py-3 rounded-2xl border border-border-subtle text-sm font-bold focus:border-primary-500 outline-none bg-surface-100 text-text-main transition-all hover:bg-surface-200/50 cursor-pointer">
          <option value="">Todos los tipos</option>
          <option v-for="(lbl, val) in typeLabels" :key="val" :value="val">{{lbl}}</option>
        </select>
        <font-awesome-icon icon="filter"
          class="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-40 text-xs" />
        <font-awesome-icon icon="chevron-down"
          class="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted opacity-30 text-[10px] pointer-events-none" />
      </div>
      <div class="flex-1 min-w-[200px] relative">
        <select v-model="filterStatus"
          class="w-full appearance-none pl-10 pr-10 py-3 rounded-2xl border border-border-subtle text-sm font-bold focus:border-primary-500 outline-none bg-surface-100 text-text-main transition-all hover:bg-surface-200/50 cursor-pointer">
          <option value="">Filtrar por Estado</option>
          <option>Pendiente</option>
          <option>Pagado</option>
          <option>Vencido</option>
          <option>Anulado</option>
        </select>
        <font-awesome-icon icon="circle-check"
          class="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-40 text-xs" />
        <font-awesome-icon icon="chevron-down"
          class="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted opacity-30 text-[10px] pointer-events-none" />
      </div>
    </div>

    <!-- Table -->
    <div
      class="bg-surface-100 rounded-[2.5rem] border border-border-subtle shadow-sm overflow-hidden transition-all duration-500 hover:shadow-2xl">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-surface-50 border-b border-border-subtle">
              <th class="px-6 py-5 text-[10px] font-bold text-text-muted tracking-widest uppercase">Documento</th>
              <th class="px-6 py-5 text-[10px] font-bold text-text-muted tracking-widest uppercase">Cta Corriente</th>
              <th class="px-6 py-5 text-[10px] font-bold text-text-muted tracking-widest uppercase">Concepto</th>
              <th class="px-6 py-5 text-right text-[10px] font-bold text-text-muted tracking-widest uppercase">Monto Total</th>
              <th class="px-6 py-5 text-right text-[10px] font-bold text-text-muted tracking-widest uppercase">Saldo Vivo</th>
              <th class="px-6 py-5 text-center text-[10px] font-bold text-text-muted tracking-widest uppercase">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-subtle">
            <tr v-for="c in filtered" :key="c.id"
              class="hover:bg-surface-50/80 transition-all group cursor-pointer relative overflow-hidden" @click="viewCurrentAccount(c.deportistaId)">
              <td class="px-6 py-5">
                  <span class="text-xs font-bold font-mono text-primary-600">{{ c.numeroDocumento }}</span>
                  <div class="text-[9px] text-text-muted mt-1 uppercase opacity-60">{{ c.fecha }}</div>
              </td>
              <td class="px-6 py-5">
                <p class="text-sm font-bold text-text-main group-hover:text-primary-600 transition-colors">{{ getMemberName(c.deportistaId) }}</p>
              </td>
              <td class="px-6 py-5">
                <p class="text-sm text-text-main font-medium truncate max-w-[200px]" :title="c.concepto">{{ c.concepto }}</p>
                <span :class="['text-[9px] font-bold tracking-widest uppercase', typeStyles[c.tipoDocumento]]">{{ typeLabels[c.tipoDocumento] }}</span>
              </td>
              <td class="px-6 py-5 text-right font-bold text-text-main tabular-nums group-hover:scale-105 origin-right transition-transform">
                {{ formatCurrency(c.monto) }}
              </td>
               <td class="px-6 py-5 text-right font-black tracking-tight tabular-nums group-hover:scale-105 origin-right transition-transform" :class="[c.saldo > 0 ? 'text-danger-600' : 'text-success-600']">
                {{ formatCurrency(c.saldo) }}
              </td>
              <td class="px-6 py-5 text-center">
                <div class="flex flex-col items-center gap-1">
                    <span :class="['text-[9px] font-bold px-3 py-1 rounded-full shadow-sm', statusColors[getDynamicStatus(c)]]">
                      {{ getDynamicStatus(c) }}
                    </span>
                    <span class="text-[9px] font-mono text-text-muted opacity-50">{{ c.fechaVencimiento }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Empty State -->
      <div v-if="filtered.length === 0" class="py-20 text-center">
        <font-awesome-icon icon="face-meh" class="text-4xl text-text-muted mb-4 opacity-30" />
        <p class="text-sm font-bold text-text-muted opacity-40">No se encontraron cargos documentales</p>
      </div>
    </div>

    <!-- Modals -->
    <Teleport to="body">
      <!-- Manual Charge Modal -->
      <div v-if="showModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="showModal = false">
        <div class="bg-surface-100 rounded-[2.5rem] w-full max-w-lg p-6 sm:p-10 shadow-2xl border border-border-subtle transition-all duration-300 transform scale-100 overflow-y-auto max-h-[90vh]">
          <div class="flex items-center justify-between mb-8">
            <h3 class="text-xl font-bold text-text-main tracking-tighter">Nuevo Documento (Crédito)</h3>
            <button @click="showModal = false" class="w-10 h-10 rounded-xl bg-surface-50 text-text-muted hover:text-text-main transition-colors flex items-center justify-center">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>

          <form @submit.prevent="saveCharge" class="space-y-6">
            <div>
              <label class="text-[10px] font-bold text-text-muted tracking-widest mb-3 block uppercase">Cuenta Corriente (Socio)</label>
              <select v-model="form.userId" class="w-full px-5 py-4 bg-surface-50 border-2 border-border-subtle rounded-2xl focus:border-primary-500 focus:bg-white outline-none text-text-main font-bold">
                <option value="">Seleccionar socio</option>
                <option v-for="m in members.deportistas" :key="m.id" :value="m.id">{{ m.name }}</option>
              </select>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label class="text-[10px] font-bold text-text-muted tracking-widest mb-3 block uppercase">Tipo</label>
                <select v-model="form.type" class="w-full px-5 py-4 bg-surface-50 border-2 border-border-subtle rounded-2xl focus:border-primary-500 focus:bg-white outline-none text-text-main font-bold">
                  <option v-for="(lbl, val) in typeLabels" :key="val" :value="val">{{lbl}}</option>
                </select>
              </div>
               <div>
                <label class="text-[10px] font-bold text-text-muted tracking-widest mb-3 block opacity-60">Fecha Límite</label>
                <input v-model="form.dueDate" type="date" class="w-full px-5 py-4 bg-surface-50 border-2 border-border-subtle rounded-2xl focus:border-primary-500 focus:bg-white outline-none text-text-main font-bold" />
              </div>
            </div>

            <div>
              <label class="text-[10px] font-bold text-text-muted tracking-widest mb-3 block opacity-60">Concepto</label>
              <input v-model="form.concept" class="w-full px-5 py-4 bg-surface-50 border-2 border-border-subtle rounded-2xl focus:border-primary-500 focus:bg-white outline-none text-text-main font-bold" placeholder="Ej: Multa Disciplinaria Abril" />
            </div>

            <div>
                <label class="text-[10px] font-bold text-text-muted tracking-widest mb-3 block opacity-60">Valor total ($)</label>
                <div class="relative">
                  <span class="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted font-bold opacity-30">$</span>
                  <input v-model="form.amount" type="number" class="w-full pl-10 pr-5 py-4 bg-surface-50 border-2 border-border-subtle rounded-2xl focus:border-primary-500 focus:bg-white outline-none text-text-main font-bold text-lg tabular-nums" />
                </div>
            </div>

            <div class="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-8 border-t border-border-subtle mt-10">
              <button type="button" @click="showModal = false" class="px-8 py-4 border border-border-subtle rounded-2xl text-xs font-bold tracking-widest text-text-muted hover:bg-surface-200 transition-all">
                Cancelar
              </button>
              <button type="submit" class="px-10 py-4 bg-primary-600 text-white rounded-2xl text-sm font-bold hover:bg-primary-700 shadow-xl shadow-primary-500/25 transition-all">
                Afectar Cta Corriente
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
