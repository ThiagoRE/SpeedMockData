<script setup>
import { ref } from 'vue'
import { useSportsStore } from '@/stores/sports'
import { useInventoryStore } from '@/stores/inventory'
import Swal from 'sweetalert2'

const store = useSportsStore()
const inventoryStore = useInventoryStore()

// State for Sedes
const showSedeModal = ref(false)
const editSedeMode = ref(false)
const defaultTarifas = () => ({
  tarifaInscripcion: 0,
  tarifaRenovacion: 0,
  tarifaMensual: 0,
  productosIncluidos: []
})
const sedeForm = ref({ name: '', address: '', phone: '', isOwned: true, rentalCost: 0, courts: [], tarifasMatricula: defaultTarifas() })
const newCourtName = ref('')
const newCourtPrice = ref(0)
const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)

const selectedProductId = ref('')
const selectedProductDiscount = ref(0)
const selectedProductIsObligatory = ref(true)

// Handlers for Sedes
function openCreateSede() {
  sedeForm.value = { name: '', address: '', phone: '', isOwned: true, rentalCost: 0, courts: [], tarifasMatricula: defaultTarifas() }
  editSedeMode.value = false
  showSedeModal.value = true
}

function openEditSede(sede) {
  sedeForm.value = { ...sede, courts: [...sede.courts], tarifasMatricula: sede.tarifasMatricula ? JSON.parse(JSON.stringify(sede.tarifasMatricula)) : defaultTarifas() }
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

function addProductToTarifas() {
  if (selectedProductId.value) {
    const product = inventoryStore.productsWithVariants.find(p => p.id === selectedProductId.value)
    if(product) {
       sedeForm.value.tarifasMatricula.productosIncluidos.push({
           productoId: product.id,
           varianteId: null, // Assuming simple for now
           nombre: product.name,
           precioVenta: product.basePrice,
           descuentoPorcentaje: selectedProductDiscount.value,
           obligatorio: selectedProductIsObligatory.value
       })
       selectedProductId.value = ''
       selectedProductDiscount.value = 0
       selectedProductIsObligatory.value = true
    }
  }
}

function removeIncludedProduct(index) {
    sedeForm.value.tarifasMatricula.productosIncluidos.splice(index, 1)
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
import { onMounted } from 'vue'

onMounted(() => {
  store.fetchSedes()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-text-main">Sedes del Club</h1>
        <p class="text-sm text-text-muted mt-1 font-medium">Gestión de sedes físicas e instalaciones</p>
      </div>
      <button @click="openCreateSede"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all font-semibold text-xs tracking-widest shadow-lg shadow-primary-500/25 hover:scale-105 active:scale-95">
        <font-awesome-icon icon="plus" /> Nueva Sede
      </button>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <div v-for="sede in store.sedes" :key="sede.id"
        class="bg-surface-100 rounded-3xl border border-border-subtle p-6 shadow-sm hover:shadow-xl transition-all group flex flex-col">
        <div class="flex justify-between items-start mb-6">
          <div class="flex items-center gap-4">
            <div
              class="w-14 h-14 bg-primary-100 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center text-2xl shadow-inner transition-colors shrink-0">
              <font-awesome-icon icon="building" />
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="font-bold text-text-main text-xl">{{ sede.name }}</h3>
                <span
                  :class="['text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider', sede.isOwned ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700']">
                  {{ sede.isOwned ? 'Sede Propia' : 'Alquilada' }}
                </span>
              </div>
              <p class="text-sm text-text-muted mt-1 w-full truncate">{{ sede.address }}</p>
            </div>
          </div>
          <button @click="openEditSede(sede)"
            class="p-2.5 text-text-muted hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-all shrink-0">
            <font-awesome-icon icon="pen-to-square" />
          </button>
        </div>

        <div class="grid grid-cols-2 gap-4 mt-auto">
          <div class="p-4 bg-surface-50 border border-border-subtle rounded-2xl transition-colors">
            <p class="text-[10px] font-bold text-text-muted tracking-widest mb-1 opacity-60">Tarifa Mensual</p>
            <p class="font-bold text-text-main text-lg tabular-nums">{{ sede.tarifasMatricula ? formatCurrency(sede.tarifasMatricula.tarifaMensual) : formatCurrency(0) }}</p>
          </div>
          <div class="p-4 bg-surface-50 border border-border-subtle rounded-2xl transition-colors">
            <p class="text-[10px] font-bold text-text-muted tracking-widest mb-1 opacity-60">Categorías Activas</p>
            <p class="font-bold text-text-main text-lg tabular-nums">{{store.categories.filter(t => t.sedeId === sede.id).length }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Sede -->
    <Teleport to="body">
      <div v-if="showSedeModal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="showSedeModal = false">
        <div
          class="bg-surface-100 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl border border-border-subtle transition-all duration-300 transform scale-100 overflow-y-auto max-h-[90vh] custom-scrollbar">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-text-main">{{ editSedeMode ? 'Editar Sede' : 'Nueva Sede' }}</h3>
            <button @click="showSedeModal = false" class="text-text-muted hover:text-text-main transition-colors">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>

          <form @submit.prevent="saveSede" class="space-y-6">
            <!-- Basic Info -->
            <div class="space-y-4">
                <h4 class="text-sm font-bold text-primary-600 border-b border-border-subtle pb-2">Información General</h4>
                <div>
                  <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block opacity-60">Nombre de la Sede</label>
                  <input v-model="sedeForm.name" class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-text-main placeholder-text-muted/40" placeholder="Ej: Sede Campestre" />
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block opacity-60">Dirección</label>
                    <input v-model="sedeForm.address" class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-text-main" placeholder="Ej: Calle 123..." />
                  </div>
                  <div>
                    <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block opacity-60">Teléfono</label>
                    <input v-model="sedeForm.phone" class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-text-main" placeholder="Ej: +57 300..." />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block opacity-60">Propiedad</label>
                    <div class="flex gap-4 items-center h-[46px]">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="radio" v-model="sedeForm.isOwned" :value="true" class="text-primary-600 focus:ring-primary-500" />
                        <span class="text-sm font-bold text-text-main">Sede Propia</span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="radio" v-model="sedeForm.isOwned" :value="false" class="text-warning-600 focus:ring-warning-500" />
                        <span class="text-sm font-bold text-text-main">Sede Alquilada</span>
                      </label>
                    </div>
                  </div>
                  <div v-if="!sedeForm.isOwned">
                    <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block opacity-60">Costo Base /
                      Hora</label>
                    <input v-model.number="sedeForm.rentalCost" type="number" class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-warning-500 focus:ring-4 focus:ring-warning-500/10 outline-none transition-all text-text-main" placeholder="Ej: 50000" />
                  </div>
                </div>
            </div>

            <!-- Financial Config -->
            <div class="space-y-4">
                <h4 class="text-sm font-bold text-primary-600 border-b border-border-subtle pb-2">Configuración de Matrículas (Tarifas Base)</h4>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block opacity-60">Tarifa Inscripción</label>
                    <input v-model.number="sedeForm.tarifasMatricula.tarifaInscripcion" type="number" class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-text-main" />
                  </div>
                  <div>
                    <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block opacity-60">Tarifa Renovación</label>
                    <input v-model.number="sedeForm.tarifasMatricula.tarifaRenovacion" type="number" class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-text-main" />
                  </div>
                  <div>
                    <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block opacity-60">Tarifa Mensualidad</label>
                    <input v-model.number="sedeForm.tarifasMatricula.tarifaMensual" type="number" class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-text-main" />
                  </div>
                </div>

                <div>
                   <label class="text-[10px] font-bold text-text-muted tracking-widest mb-2 block opacity-60">Indumentaria / Productos Incluidos</label>
                   <div class="flex flex-col sm:flex-row gap-2 mb-4 items-end">
                      <div class="flex-1">
                          <label class="text-[10px] font-bold text-text-muted block mb-1">Producto</label>
                          <select v-model="selectedProductId" class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-xl focus:border-primary-500 outline-none text-sm text-text-main">
                              <option value="">Seleccione...</option>
                              <option v-for="p in inventoryStore.simpleProducts" :value="p.id" :key="p.id">{{ p.name }} ({{ formatCurrency(p.basePrice) }})</option>
                          </select>
                      </div>
                      <div class="w-24">
                          <label class="text-[10px] font-bold text-text-muted block mb-1">% Dcto</label>
                          <input v-model.number="selectedProductDiscount" type="number" min="0" max="100" class="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-xl text-sm outline-none text-text-main text-center" />
                      </div>
                      <div class="w-24 flex items-center justify-center p-3 border border-border-subtle rounded-xl bg-surface-50 h-[46px]">
                          <label class="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" v-model="selectedProductIsObligatory" class="w-4 h-4 text-primary-600 rounded">
                              <span class="text-xs font-bold whitespace-nowrap">Oblig.</span>
                          </label>
                      </div>
                      <button type="button" @click="addProductToTarifas" class="px-5 py-3 h-[46px] bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-xl font-bold transition-all text-sm shrink-0">Añadir</button>
                   </div>
                   
                   <div class="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                       <div v-for="(prod, idx) in sedeForm.tarifasMatricula.productosIncluidos" :key="idx" class="flex justify-between items-center p-3 bg-surface-50 rounded-xl border border-border-subtle text-sm">
                           <div class="flex items-center gap-2">
                               <font-awesome-icon icon="shirt" class="text-text-muted" />
                               <span class="font-bold text-text-main">{{prod.nombre}}</span>
                               <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-700" v-if="prod.descuentoPorcentaje > 0">-{{prod.descuentoPorcentaje}}%</span>
                               <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-danger-100 text-danger-700" v-if="prod.obligatorio">Oblig.</span>
                           </div>
                           <button type="button" @click="removeIncludedProduct(idx)" class="text-danger-500 hover:text-danger-700 p-1"><font-awesome-icon icon="xmark" /></button>
                       </div>
                       <p v-if="!sedeForm.tarifasMatricula.productosIncluidos.length" class="text-center text-xs text-text-muted p-4">No hay productos vinculados</p>
                   </div>
                </div>
            </div>

            <!-- Instalaciones -->
            <div class="space-y-4">
              <h4 class="text-sm font-bold text-primary-600 border-b border-border-subtle pb-2">Canchas e Instalaciones</h4>
              <div class="flex flex-col sm:flex-row gap-2 mb-4">
                <input v-model="newCourtName" @keyup.enter="addCourt" class="flex-2 px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-text-main placeholder-text-muted/40" placeholder="Nombre de la cancha (Ej: Sintética 5)" />
                <input v-model.number="newCourtPrice" @keyup.enter="addCourt" type="number" class="flex-1 px-4 py-3 bg-surface-50 border border-border-subtle rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-text-main placeholder-text-muted/40" placeholder="Precio Alquiler/hr" />
                <button type="button" @click="addCourt" class="px-6 py-3 bg-text-main text-surface-100 rounded-2xl hover:opacity-90 font-bold transition-all active:scale-95 shadow-lg">Agregar</button>
              </div>
              <div class="flex flex-col gap-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                <div v-for="(court, index) in sedeForm.courts" :key="court.id || index" class="flex items-center justify-between px-4 py-2 bg-surface-200/50 border border-border-subtle rounded-xl text-sm font-bold text-text-muted transition-colors">
                  <div class="flex items-center justify-between w-full pr-4">
                    <span>{{ court.name }}</span>
                    <span class="text-success-600">{{ formatCurrency(court.rentalPrice) }}</span>
                  </div>
                  <button type="button" @click="removeCourt(index)" class="hover:text-danger-500 transition-colors p-1"><font-awesome-icon icon="circle-xmark" /></button>
                </div>
              </div>
            </div>

            <div class="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-border-subtle mt-8">
              <button type="button" @click="showSedeModal = false" class="px-6 py-3 border border-border-subtle rounded-2xl text-sm font-bold text-text-muted hover:bg-surface-200 transition-all">Cancelar</button>
              <button type="submit" class="px-8 py-3 bg-primary-600 text-white rounded-2xl text-sm font-bold hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all active:scale-95">
                {{ editSedeMode ? 'GUARDAR CAMBIOS' : 'CREAR SEDE' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
