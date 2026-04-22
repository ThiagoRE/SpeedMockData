<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFinanceStore } from '@/stores/finance'
import { useUsersStore } from '@/stores/users'
import Swal from 'sweetalert2'

const router = useRouter()
const finance = useFinanceStore()
const members = useUsersStore()
const showModal = ref(false)
const form = ref({ userId: '', amount: '', method: 'Transferencia', reference: '', comprobante: null })

const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)
const getMemberName = (id) => members.getUserById(id)?.name || '—'

const methodColors = {
  'Efectivo': 'bg-success-100 dark:bg-success-950/30 text-success-700 dark:text-success-400',
  'Transferencia': 'bg-primary-100 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400',
  'Wompi/PSE': 'bg-accent-100 dark:bg-accent-950/30 text-accent-700 dark:text-accent-400',
}

const debitos = computed(() => {
  return finance.documentos
    .filter(d => d.naturaleza === 'debito')
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
})

const getMethodFromReference = (refText) => {
    if(refText.includes('Efectivo')) return 'Efectivo'
    if(refText.includes('Wompi') || refText.includes('PSE')) return 'Wompi/PSE'
    return 'Transferencia'
}

function openPayment() {
  form.value = { userId: '', amount: '', method: 'Transferencia', reference: '', comprobante: null }
  showModal.value = true
}

function handleFileUpload(event) {
  const file = event.target.files[0]
  if (file) {
    form.value.comprobante = file.name
  } else {
    form.value.comprobante = null
  }
}

async function savePayment() {
  if (!form.value.userId || !form.value.amount || form.value.amount <= 0) {
    Swal.fire({ icon: 'warning', title: 'Datos requeridos', confirmButtonColor: '#3b82f6' }); return
  }
  
  const result = finance.aplicarPago(
     Number(form.value.userId),
     Number(form.value.amount),
     form.value.method,
     form.value.reference || `REF-${Date.now()}`,
     form.value.comprobante
  )
  
  await Swal.fire({ 
      icon: 'success', 
      title: '¡Pago Registrado!', 
      html: `Se distribuyeron <b>${formatCurrency(result.montoAplicado)}</b> en la cuenta corriente.`,
      timer: 1500, 
      showConfirmButton: false 
  })
  showModal.value = false
}

function viewCurrentAccount(userId) {
    if(userId) {
       router.push({ name: 'CurrentAccount', params: { id: userId } })
    }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-text-main">Registro de Pagos (Débitos)</h1>
        <p class="text-sm text-text-muted mt-1">Recaudación y documentos a favor del cliente</p>
      </div>
      <button @click="openPayment"
        class="inline-flex items-center gap-2 px-6 py-3 bg-success-600 text-white rounded-2xl hover:bg-success-700 shadow-lg shadow-success-500/20 transition-all active:scale-95 font-semibold text-xs tracking-widest">
        <font-awesome-icon icon="credit-card" /> REGISTRAR NUEVO PAGO
      </button>
    </div>

    <!-- Payments Table -->
    <div class="bg-surface-100 rounded-3xl border border-border-subtle shadow-sm overflow-hidden transition-colors">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-surface-50 border-b border-border-subtle transition-colors">
              <th class="text-xs font-semibold text-text-muted tracking-widest px-6 py-4 uppercase">Documento / Fecha</th>
              <th class="text-xs font-semibold text-text-muted tracking-widest px-6 py-4 uppercase">Socio (Cta. Corriente)</th>
              <th class="text-xs font-semibold text-text-muted tracking-widest px-6 py-4 uppercase">Concepto Orig.</th>
              <th class="text-xs font-semibold text-text-muted tracking-widest px-6 py-4 uppercase">Referencia / Método</th>
              <th class="text-right text-xs font-semibold text-text-muted tracking-widest px-6 py-4 uppercase">Monto Aplicado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-subtle transition-colors">
            <tr v-for="d in debitos" :key="d.id" class="hover:bg-surface-50 transition-colors group cursor-pointer" @click="viewCurrentAccount(d.deportistaId)">
              <td class="px-6 py-4">
                  <span class="text-xs font-bold font-mono text-success-600">{{ d.numeroDocumento }}</span>
                  <div class="text-[9px] text-text-muted mt-1 uppercase opacity-60">{{ d.fecha }}</div>
              </td>
              <td class="px-6 py-4 text-sm font-semibold text-text-main group-hover:text-primary-600">{{ getMemberName(d.deportistaId) }}</td>
              <td class="px-6 py-4">
                  <p class="text-xs font-medium text-text-main max-w-[200px] truncate" :title="d.concepto">{{ d.concepto }}</p>
                  <p v-if="d.numeroDocumentoCredito" class="text-[9px] text-text-muted font-mono mt-1 opacity-70">Abono a: {{ d.numeroDocumentoCredito }}</p>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <span :class="['text-[9px] font-semibold px-2 py-0.5 rounded shadow-sm', methodColors[getMethodFromReference(d.concepto)] || 'bg-surface-200 text-text-muted']">
                    {{ getMethodFromReference(d.concepto) }}
                  </span>
                  <span v-if="d.comprobante" class="text-[9px] text-primary-600 bg-primary-50 px-2 py-0.5 rounded flex items-center gap-1" :title="d.comprobante">
                    <font-awesome-icon icon="paperclip" />
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-right font-black text-success-600 dark:text-success-400 tabular-nums">
                {{ formatCurrency(d.monto) }}
               </td>
            </tr>
            <tr v-if="debitos.length === 0">
                 <td colspan="5" class="p-8 text-center text-text-muted">No existen documentos de pago registrados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal PAGO DISTRIBUIDO -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="showModal = false">
        <div
          class="bg-surface-100 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-border-subtle transition-all duration-300 transform scale-100">
          <div class="flex items-center justify-between mb-8">
            <h3 class="text-xl font-semibold text-text-main">Registrar Pago (Distribución Automática)</h3>
            <button @click="showModal = false" class="text-text-muted hover:text-text-main transition-colors">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>

          <div class="bg-primary-50 text-primary-800 p-3 rounded-xl mb-6 text-xs font-medium border border-primary-100 flex gap-3 items-start">
             <font-awesome-icon icon="circle-info" class="mt-0.5" />
             <p>El sistema tomará este monto y lo abonará automáticamente a los documentos de crédito pendientes del deportista, desde los más antiguos a los más recientes.</p>
          </div>

          <form @submit.prevent="savePayment" class="space-y-6">
            <div>
              <label class="text-[10px] font-semibold text-text-muted tracking-widest mb-2 block uppercase opacity-70">Deportista / Cuenta Corriente</label>
              <select v-model="form.userId"
                class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 outline-none text-text-main appearance-none cursor-pointer text-sm font-bold">
                <option value="">Seleccionar socio...</option>
                <option v-for="m in members.deportistas" :key="m.id" :value="m.id">{{ m.name }} - Saldo: {{formatCurrency(finance.getSaldoDeportista(m.id))}}</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-[10px] font-semibold text-text-muted tracking-widest mb-2 block uppercase opacity-70">Monto</label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-semibold opacity-40">$</span>
                  <input v-model="form.amount" type="number"
                    class="w-full pl-8 pr-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none text-text-main font-semibold tabular-nums text-lg" />
                </div>
              </div>
              <div>
                <label class="text-[10px] font-semibold text-text-muted tracking-widest mb-2 block uppercase opacity-70">Método</label>
                <select v-model="form.method"
                  class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 outline-none text-text-main appearance-none cursor-pointer text-sm font-bold">
                  <option>Efectivo</option>
                  <option>Transferencia</option>
                  <option>Wompi/PSE</option>
                </select>
              </div>
            </div>
            <div>
              <label class="text-[10px] font-semibold text-text-muted tracking-widest mb-2 block uppercase opacity-70">Referencia Pago</label>
              <input v-model="form.reference"
                class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none text-text-main placeholder-text-muted/40 font-mono text-sm"
                placeholder="Automática si se deja vacío" />
            </div>
            
            <div>
              <label class="text-[10px] font-semibold text-text-muted tracking-widest mb-2 block uppercase opacity-70">Comprobante (Opcional)</label>
              <input type="file" @change="handleFileUpload" accept="image/*,.pdf"
                class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none text-text-main text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-100 file:text-primary-700 hover:file:bg-primary-200 cursor-pointer" />
            </div>

            <div class="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-border-subtle mt-8">
              <button type="button" @click="showModal = false"
                class="flex-1 py-4 border border-border-subtle rounded-2xl text-sm font-semibold text-text-muted hover:bg-surface-200 transition-all active:scale-95 tracking-widest uppercase">
                Cancelar
              </button>
              <button type="submit"
                class="flex-1 py-4 bg-success-600 text-white rounded-2xl text-sm font-semibold hover:bg-success-700 shadow-lg shadow-success-500/20 transition-all active:scale-95 tracking-widest uppercase">
                Confirmar
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
