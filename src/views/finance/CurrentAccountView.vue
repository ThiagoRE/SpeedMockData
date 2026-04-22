<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useFinanceStore } from '@/stores/finance'
import { useUsersStore } from '@/stores/users'
import Swal from 'sweetalert2'

const route = useRoute()
const financeStore = useFinanceStore()
const usersStore = useUsersStore()

const deportista = ref(null)

const cuentaCorriente = ref([])
const creditosPendientes = ref([])
const saldoTotal = ref(0)

async function loadFinances(deportistaId) {
    if (!deportistaId) return
    const estado = await financeStore.fetchEstadoFinanciero(deportistaId)
    saldoTotal.value = Number(estado.total_pendiente || 0)

    const ct = await financeStore.fetchCuentaCorriente(deportistaId)
    cuentaCorriente.value = ct
    creditosPendientes.value = ct.filter(c => c.naturaleza === 'credito' && c.saldo > 0 && c.estado !== 'anulado')
}

onMounted(async () => {
    const id = Number(route.params.id)
    deportista.value = usersStore.deportistas.find(d => d.id === id)
    if (deportista.value) {
        await loadFinances(deportista.value.id)
    }
})

const showPaymentModal = ref(false)
const payForm = ref({ amount: 0, method: 'Transferencia', reference: '' })

const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)

function openPaymentModal() {
    payForm.value = { amount: saldoTotal.value, method: 'Transferencia', reference: `REF-${Date.now()}` }
    showPaymentModal.value = true
}

async function submitPayment() {
    if(payForm.value.amount <= 0) {
        Swal.fire({ icon: 'warning', title: 'Monto inválido' })
        return
    }
    const result = await financeStore.aplicarPagoBase({
       deportistaId: deportista.value.id, 
       monto: payForm.value.amount, 
       metodoPago: payForm.value.method, 
       referencia: payForm.value.reference
    })
    
    if (result.success) {
      Swal.fire({
         icon: 'success',
         title: 'Pago Aplicado',
         text: 'El pago se distribuyó correctamente en la cartera.'
      })
      await loadFinances(deportista.value.id)
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: result.message })
    }
    
    showPaymentModal.value = false
}

// Para Pagar documento específico
const specificPayCreditId = ref(null)
function openSpecificPayment(credito) {
    specificPayCreditId.value = credito.id
    payForm.value = { amount: credito.saldo, method: 'Transferencia', reference: `REF-${Date.now()}` }
    showPaymentModal.value = true
}

async function submitSpecificPayment() {
    // Para simplificar, la API maneja el pago FIFO general.
    // Podremos enviarlo por general
    Swal.fire({ icon: 'info', title: 'Información', text: 'Los pagos aplican FIFO actualmente.' })
    showPaymentModal.value = false
    specificPayCreditId.value = null
}

const activeTab = ref('pendientes')
</script>

<template>
  <div v-if="deportista" class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-text-main">Cuenta Corriente</h1>
        <p class="text-sm text-text-muted mt-1 font-medium">{{ deportista.name }}</p>
      </div>
      <button v-if="saldoTotal > 0" @click="openPaymentModal"
        class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-success-600 text-white rounded-2xl hover:bg-success-700 transition-all font-bold text-sm shadow-lg shadow-success-500/25 shrink-0">
        <font-awesome-icon icon="money-bill" /> Registrar Pago
      </button>
    </div>

    <!-- Summary Widgets -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
       <div class="bg-surface-100 p-6 rounded-3xl border border-border-subtle shadow-sm flex items-center justify-between">
           <div>
               <p class="text-[10px] font-bold text-text-muted tracking-widest uppercase mb-1">Saldo Pendiente (Deuda)</p>
               <h3 class="text-2xl font-black text-danger-600">{{ formatCurrency(saldoTotal) }}</h3>
           </div>
           <div class="w-12 h-12 bg-danger-50 text-danger-600 flex items-center justify-center rounded-2xl text-xl">
               <font-awesome-icon icon="triangle-exclamation" />
           </div>
       </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 p-1 bg-surface-100 rounded-2xl border border-border-subtle overflow-x-auto custom-scrollbar w-fit">
      <button @click="activeTab = 'pendientes'" 
        :class="['px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2', 
        activeTab === 'pendientes' ? 'bg-primary-50 text-primary-600 shadow-sm' : 'text-text-muted hover:text-text-main hover:bg-surface-50']">
        <font-awesome-icon icon="clock" />
        Saldos Pendientes ({{ creditosPendientes.length }})
      </button>
      <button @click="activeTab = 'historial'" 
        :class="['px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2', 
        activeTab === 'historial' ? 'bg-primary-50 text-primary-600 shadow-sm' : 'text-text-muted hover:text-text-main hover:bg-surface-50']">
        <font-awesome-icon icon="list" />
        Todos los Documentos
      </button>
    </div>

    <!-- Pendientes -->
    <div v-if="activeTab === 'pendientes'">
        <div v-if="creditosPendientes.length === 0" class="bg-surface-100 p-10 rounded-3xl border border-border-subtle text-center">
            <div class="w-20 h-20 bg-success-50 text-success-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"><font-awesome-icon icon="check" /></div>
            <h3 class="text-lg font-bold text-text-main">Todo al día</h3>
            <p class="text-sm text-text-muted mt-2 font-medium">El deportista no tiene saldos pendientes de pago.</p>
        </div>
        <div v-else class="space-y-4">
            <div v-for="c in creditosPendientes" :key="c.id" class="bg-surface-100 p-5 rounded-2xl border border-border-subtle shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-primary-300 transition-all">
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-danger-50 text-danger-600 rounded-xl flex items-center justify-center shrink-0">
                         <font-awesome-icon icon="file-invoice" />
                    </div>
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-xs font-bold text-primary-600 tracking-wider font-mono">{{ c.numeroDocumento }}</span>
                            <span class="px-2 py-0.5 bg-danger-50 text-danger-700 text-[10px] font-bold rounded-md">Vence: {{ c.fechaVencimiento }}</span>
                        </div>
                        <h4 class="font-bold text-text-main">{{ c.concepto }}</h4>
                        <p class="text-[11px] text-text-muted font-bold mt-1">Valor Original: {{ formatCurrency(c.monto) }}</p>
                    </div>
                </div>
                <div class="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-border-subtle pt-4 sm:pt-0 sm:pl-6">
                    <div class="text-right">
                        <p class="text-[10px] font-bold tracking-widest text-text-muted uppercase">Saldo Deudor</p>
                        <p class="text-lg font-black text-danger-600">{{ formatCurrency(c.saldo) }}</p>
                    </div>
                    <button @click="openSpecificPayment(c)" class="w-10 h-10 rounded-xl bg-surface-50 text-text-muted hover:bg-success-50 hover:text-success-600 transition-colors flex items-center justify-center shrink-0">
                        <font-awesome-icon icon="money-bill-transfer" />
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Historial Ledger -->
    <div v-if="activeTab === 'historial'" class="bg-surface-100 rounded-3xl border border-border-subtle overflow-hidden">
        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-200/50 border-b border-border-subtle">
                <th class="p-4 text-[10px] uppercase tracking-widest font-bold text-text-muted">Fecha</th>
                <th class="p-4 text-[10px] uppercase tracking-widest font-bold text-text-muted">Documento</th>
                <th class="p-4 text-[10px] uppercase tracking-widest font-bold text-text-muted">Concepto</th>
                <th class="p-4 text-[10px] uppercase tracking-widest font-bold text-text-muted text-right">Crédito (+)</th>
                <th class="p-4 text-[10px] uppercase tracking-widest font-bold text-text-muted text-right">Débito (-)</th>
              </tr>
            </thead>
            <tbody class="text-sm font-bold divide-y divide-border-subtle">
              <tr v-for="doc in cuentaCorriente" :key="doc.numeroDocumento" :class="[doc.estado === 'anulado' ? 'opacity-40' : 'hover:bg-surface-50']">
                <td class="p-4 text-text-muted font-mono text-xs">{{ doc.fecha }}</td>
                <td class="p-4">
                    <span :class="['px-2 py-1 rounded text-xs', doc.naturaleza === 'credito' ? 'bg-danger-50 text-danger-700' : 'bg-success-50 text-success-700']">
                        {{ doc.numeroDocumento }}
                    </span>
                    <span v-if="doc.estado === 'anulado'" class="ml-2 text-[10px] bg-text-muted text-white px-1.5 rounded">ANUL.</span>
                </td>
                <td class="p-4 text-text-main max-w-[200px] truncate" :title="doc.concepto">{{ doc.concepto }}</td>
                <td class="p-4 text-right">
                    <span v-if="doc.naturaleza === 'credito'" class="text-danger-600">{{ formatCurrency(doc.monto) }}</span>
                    <span v-else class="text-text-muted">-</span>
                </td>
                <td class="p-4 text-right">
                    <span v-if="doc.naturaleza === 'debito'" class="text-success-600">{{ formatCurrency(doc.monto) }}</span>
                    <span v-else class="text-text-muted">-</span>
                </td>
              </tr>
              <tr v-if="cuentaCorriente.length === 0">
                 <td colspan="5" class="p-8 text-center text-text-muted">No hay movimientos en la cuenta</td>
              </tr>
            </tbody>
          </table>
        </div>
    </div>

    <!-- MODAL PAGO -->
    <Teleport to="body">
       <div v-if="showPaymentModal" class="fixed inset-0 bg-black/60 relative z-50 flex items-center justify-center p-4 backdrop-blur-sm" @click.self="showPaymentModal = false; specificPayCreditId = null">
          <div class="bg-surface-100 rounded-3xl max-w-md w-full p-8 shadow-2xl">
              <h3 class="text-xl font-bold text-text-main mb-6">{{ specificPayCreditId ? 'Abono a Documento' : 'Distribución Automática' }}</h3>
              
              <div class="space-y-4">
                 <div>
                    <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block uppercase">Monto a Pagar</label>
                    <input v-model.number="payForm.amount" type="number" class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 outline-none transition-all font-bold text-2xl text-text-main">
                 </div>
                 <div>
                    <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block uppercase">Método</label>
                    <select v-model="payForm.method" class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 outline-none transition-all font-bold text-sm text-text-main">
                        <option>Efectivo</option>
                        <option>Transferencia</option>
                        <option>Wompi/PSE</option>
                    </select>
                 </div>
                  <div>
                    <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block uppercase">Referencia</label>
                    <input v-model="payForm.reference" type="text" class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 outline-none transition-all font-bold text-sm text-text-main">
                 </div>
              </div>
              <div class="mt-8 flex gap-3">
                 <button @click="showPaymentModal = false; specificPayCreditId = null" class="flex-1 py-3 border border-border-subtle rounded-2xl font-bold text-text-muted text-sm hover:bg-surface-50">Cancelar</button>
                 <button @click="specificPayCreditId ? submitSpecificPayment() : submitPayment()" class="flex-1 py-3 bg-success-600 text-white rounded-2xl font-bold text-sm hover:bg-success-700 shadow-lg shadow-success-500/20 active:scale-95 transition-all">Confirmar</button>
              </div>
          </div>
       </div>
    </Teleport>
  </div>
</template>
