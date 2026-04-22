<script setup>
import { ref, computed, onMounted } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import Swal from 'sweetalert2'

const store = useInventoryStore()
const filterCategory = ref('')
const showModal = ref(false)
const editMode = ref(false)
const editingId = ref(null)
const selectedProduct = ref(null)
const showKardexModal = ref(false)
const kardexProduct = ref(null)
const kardexMovements = ref([])
const kardexLoading = ref(false)

// Formulario principal
const form = ref({ name: '', sportId: '', category: 'Equipamiento', hasVariants: false, basePrice: '', stock: 0, sku: '' })

// Formulario de variantes (inline en el modal de creación)
const variantForm = ref({ size: '', color: '', style: '', stock: 0, sku: '' })
const pendingVariants = ref([])

// Formulario de movimiento Kardex
const movementForm = ref({ type: 'ingreso', quantity: 1, reason: '', variantId: null })

const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)
const categories = ['Indumentaria', 'Calzado', 'Equipamiento', 'Accesorios']

const filtered = computed(() => {
  return store.productsWithVariants.filter(p => !filterCategory.value || p.category === filterCategory.value)
})

function getTotalStock(product) {
  if (product.hasVariants && product.variants) return product.variants.reduce((s, v) => s + v.stock, 0)
  return product.stock || 0
}

// ─── CRUD ─────────────────────────────────────────────────
function openCreate() {
  form.value = { name: '', sportId: '', category: 'Equipamiento', hasVariants: false, basePrice: '', stock: 0, sku: '' }
  pendingVariants.value = []
  editMode.value = false
  editingId.value = null
  showModal.value = true
}

function openEdit(product) {
  form.value = {
    name: product.name,
    sportId: product.sportId || '',
    category: product.category,
    hasVariants: product.hasVariants,
    basePrice: product.basePrice,
    stock: product.stock || 0,
    sku: product.sku || ''
  }
  editMode.value = true
  editingId.value = product.id
  pendingVariants.value = []
  showModal.value = true
}

function toggleProduct(product) {
  selectedProduct.value = selectedProduct.value?.id === product.id ? null : product
}

function addPendingVariant() {
  if (!variantForm.value.size && !variantForm.value.color) {
    Swal.fire({ icon: 'warning', title: 'Especifica al menos Talla o Color', confirmButtonColor: '#3b82f6' })
    return
  }
  pendingVariants.value.push({ ...variantForm.value, stock: Number(variantForm.value.stock || 0) })
  variantForm.value = { size: '', color: '', style: '', stock: 0, sku: '' }
}

function removePendingVariant(index) {
  pendingVariants.value.splice(index, 1)
}

async function saveProd() {
  if (!form.value.name || !form.value.basePrice) {
    Swal.fire({ icon: 'warning', title: 'Datos requeridos', text: 'Nombre y precio son obligatorios.', confirmButtonColor: '#3b82f6' })
    return
  }
  if (form.value.hasVariants && !editMode.value && pendingVariants.value.length === 0) {
    Swal.fire({ icon: 'warning', title: 'Sin variantes', text: 'Agrega al menos una variante (Talla/Color/Estilo).', confirmButtonColor: '#3b82f6' })
    return
  }

  try {
    if (editMode.value) {
      await store.updateProduct(editingId.value, form.value)
      await Swal.fire({ icon: 'success', title: 'Producto actualizado', timer: 1200, showConfirmButton: false })
    } else {
      const created = await store.saveProduct(form.value)
      // Si hay variantes pendientes, crearlas una por una
      if (form.value.hasVariants && pendingVariants.value.length > 0) {
        for (const v of pendingVariants.value) {
          await store.addVariant({ ...v, productId: created.id })
        }
      }
      await Swal.fire({ icon: 'success', title: 'Producto creado', timer: 1200, showConfirmButton: false })
    }
    showModal.value = false
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#ef4444' })
  }
}

async function deleteProd(p) {
  const r = await Swal.fire({ title: '¿Archivar producto?', text: `"${p.name}" será archivado (no se borra del historial).`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Archivar', cancelButtonText: 'Cancelar', confirmButtonColor: '#ef4444' })
  if (r.isConfirmed) {
    try {
      await store.archiveProduct(p.id)
      Swal.fire({ icon: 'success', title: 'Archivado', timer: 1000, showConfirmButton: false })
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message })
    }
  }
}

// ─── KARDEX ───────────────────────────────────────────────
async function openKardex(product) {
  kardexProduct.value = product
  kardexLoading.value = true
  showKardexModal.value = true
  movementForm.value = { type: 'ingreso', quantity: 1, reason: '', variantId: null }
  try {
    kardexMovements.value = await store.fetchMovements(product.id)
  } catch (err) {
    kardexMovements.value = []
  } finally {
    kardexLoading.value = false
  }
}

async function registerMovement() {
  if (!movementForm.value.quantity || movementForm.value.quantity <= 0) {
    Swal.fire({ icon: 'warning', title: 'Cantidad inválida', confirmButtonColor: '#3b82f6' })
    return
  }
  if (!movementForm.value.reason) {
    Swal.fire({ icon: 'warning', title: 'Motivo requerido', text: 'Indica la razón del movimiento.', confirmButtonColor: '#3b82f6' })
    return
  }
  try {
    await store.registerMovement({
      productId: kardexProduct.value.id,
      variantId: movementForm.value.variantId || null,
      type: movementForm.value.type,
      quantity: Number(movementForm.value.quantity),
      reason: movementForm.value.reason
    })
    kardexMovements.value = await store.fetchMovements(kardexProduct.value.id)
    movementForm.value = { type: 'ingreso', quantity: 1, reason: '', variantId: null }
    Swal.fire({ icon: 'success', title: 'Movimiento registrado', timer: 1000, showConfirmButton: false })
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Error', text: err.message })
  }
}

// ─── Variantes Existentes (desde edición) ─────────────────
async function addVariantToExisting(product) {
  const { value: formValues } = await Swal.fire({
    title: `Nueva variante: ${product.name}`,
    html:
      '<input id="swal-size" class="swal2-input" placeholder="Talla (ej: XL)">' +
      '<input id="swal-color" class="swal2-input" placeholder="Color (ej: Rojo)">' +
      '<input id="swal-style" class="swal2-input" placeholder="Estilo (ej: Manga Corta)">' +
      '<input id="swal-stock" class="swal2-input" type="number" placeholder="Stock inicial" value="0">',
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Agregar',
    confirmButtonColor: '#3b82f6',
    preConfirm: () => ({
      size: document.getElementById('swal-size').value,
      color: document.getElementById('swal-color').value,
      style: document.getElementById('swal-style').value,
      stock: Number(document.getElementById('swal-stock').value || 0)
    })
  })
  if (formValues) {
    try {
      await store.addVariant({ productId: product.id, ...formValues })
      Swal.fire({ icon: 'success', title: 'Variante agregada', timer: 1000, showConfirmButton: false })
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message })
    }
  }
}

async function removeVariant(variantId) {
  const r = await Swal.fire({ title: '¿Eliminar variante?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Eliminar', confirmButtonColor: '#ef4444' })
  if (r.isConfirmed) {
    try {
      await store.deleteVariant(variantId)
      Swal.fire({ icon: 'success', title: 'Variante eliminada', timer: 1000, showConfirmButton: false })
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message })
    }
  }
}

onMounted(() => {
  store.fetchProducts()
})
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
      <div>
        <h1 class="text-3xl font-bold text-text-main tracking-tighter">Gestión de Inventario</h1>
        <p class="text-sm text-text-muted mt-1 font-medium italic opacity-70">Control centralizado de existencias y
          catálogo de productos</p>
      </div>
      <div class="flex items-center gap-3">
        <div
          class="bg-surface-100 rounded-2xl border border-border-subtle px-6 py-3 text-sm shadow-xs transition-all hover:shadow-md hidden lg:block">
          <span
            class="text-text-muted font-bold text-[10px] tracking-widest opacity-60 block leading-none mb-1">Valorización
            Total</span>
          <span class="font-bold text-primary-600 dark:text-primary-400 tabular-nums text-lg">{{
            formatCurrency(store.totalStockValue) }}</span>
        </div>
        <button @click="openCreate"
          class="inline-flex items-center gap-3 px-6 py-3.5 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all font-bold text-xs tracking-widest shadow-lg shadow-primary-500/25 active:scale-95">
          <font-awesome-icon icon="plus" /> Nuevo Producto
        </button>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        class="bg-surface-100 rounded-[2rem] border border-border-subtle p-6 shadow-xs group hover:shadow-lg transition-all relative overflow-hidden">
        <div class="flex items-center gap-4 relative z-10">
          <div
            class="w-12 h-12 rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <font-awesome-icon icon="boxes-stacked" />
          </div>
          <div>
            <p class="text-[10px] font-bold text-text-muted tracking-widest opacity-60">Items Unicos</p>
            <p class="text-2xl font-bold text-text-main tabular-nums">{{ store.products.length }}</p>
          </div>
        </div>
        <div class="absolute -right-4 -bottom-4 text-indigo-500/5 text-6xl group-hover:scale-125 transition-transform">
          <font-awesome-icon icon="barcode" />
        </div>
      </div>

      <div
        class="bg-surface-100 rounded-[2rem] border border-border-subtle p-6 shadow-xs group hover:shadow-lg transition-all relative overflow-hidden">
        <div class="flex items-center gap-4 relative z-10">
          <div
            class="w-12 h-12 rounded-2xl bg-linear-to-br from-danger-500 to-danger-600 flex items-center justify-center text-white shadow-lg shadow-danger-500/20">
            <font-awesome-icon icon="triangle-exclamation" />
          </div>
          <div>
            <p class="text-[10px] font-bold text-text-muted tracking-widest opacity-60">Stock Crítico</p>
            <p class="text-2xl font-bold text-danger-600 tabular-nums">{{ store.lowStockItems.length }}</p>
          </div>
        </div>
        <div
          class="absolute -right-4 -bottom-4 text-danger-500/5 text-6xl group-hover:scale-125 transition-transform rotate-12">
          <font-awesome-icon icon="box-open" />
        </div>
      </div>

      <!-- Horizontal scroll of low stock items if any -->
      <div v-if="store.lowStockItems.length > 0"
        class="sm:col-span-2 bg-danger-50 dark:bg-danger-950/20 rounded-[2rem] border border-danger-200 dark:border-danger-900/30 p-6 flex items-center gap-6 overflow-hidden">
        <div
          class="hidden lg:block shrink-0 px-4 py-2 bg-danger-600 text-white rounded-xl text-[10px] font-bold tracking-widest animate-pulse">
          Alertas</div>
        <div class="flex gap-4 overflow-x-auto no-scrollbar py-1">
          <div v-for="item in store.lowStockItems.slice(0, 3)" :key="item.id"
            class="flex-none bg-white dark:bg-surface-100 rounded-2xl p-3 border border-danger-200 shadow-sm flex items-center gap-3">
            <p class="text-[11px] font-bold text-text-main max-w-[120px] truncate tracking-tighter">{{ item.name }}</p>
            <span class="px-2 py-0.5 bg-danger-100 text-danger-700 rounded-md text-[10px] font-bold">{{ item.stock }}
              Uni</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="store.loading" class="flex items-center justify-center py-20">
      <div class="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
    </div>

    <!-- Filters and List -->
    <div v-else class="space-y-4">
      <div class="flex gap-4">
        <div class="relative min-w-[220px]">
          <select v-model="filterCategory"
            class="w-full appearance-none pl-10 pr-10 py-3 rounded-2xl border border-border-subtle text-sm font-bold tracking-tighter focus:border-primary-500 outline-none bg-surface-100 text-text-main transition-all hover:bg-surface-200/50 cursor-pointer shadow-sm">
            <option value="">Todas las categorías</option>
            <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
          </select>
          <font-awesome-icon icon="filter"
            class="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-40 text-xs" />
          <font-awesome-icon icon="chevron-down"
            class="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted opacity-30 text-[10px]" />
        </div>
      </div>

      <div
        class="bg-surface-100 rounded-[2.5rem] border border-border-subtle shadow-sm overflow-hidden transition-colors">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-surface-50 border-b border-border-subtle">
                <th class="px-8 py-5 text-[10px] font-bold text-text-muted tracking-widest">Producto</th>
                <th class="px-8 py-5 text-[10px] font-bold text-text-muted tracking-widest">Categoría</th>
                <th class="px-8 py-5 text-[10px] font-bold text-text-muted tracking-widest text-center">Tipo</th>
                <th class="px-8 py-5 text-right text-[10px] font-bold text-text-muted tracking-widest">Precio Base</th>
                <th class="px-8 py-5 text-center text-[10px] font-bold text-text-muted tracking-widest">Stock Total</th>
                <th class="px-8 py-5 text-right text-[10px] font-bold text-text-muted tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-subtle">
              <template v-for="p in filtered" :key="p.id">
                <tr class="hover:bg-surface-50 transition-all cursor-pointer group"
                  @click="p.hasVariants && toggleProduct(p)">
                  <td class="px-8 py-5">
                    <div class="flex items-center gap-4">
                      <div v-if="p.hasVariants"
                        :class="['w-8 h-8 rounded-xl bg-surface-200 dark:bg-surface-900 flex items-center justify-center text-[10px] text-text-muted transition-transform', selectedProduct?.id === p.id ? 'rotate-180' : '']">
                        <font-awesome-icon icon="chevron-down" />
                      </div>
                      <div
                        class="w-10 h-10 rounded-xl bg-linear-to-br from-surface-50 to-surface-200 flex items-center justify-center border border-border-subtle text-text-muted opacity-40 shadow-inner group-hover:scale-110 transition-transform">
                        <font-awesome-icon icon="camera" class="text-xs" />
                      </div>
                      <span
                        class="text-base font-bold text-text-main group-hover:text-primary-600 transition-colors tracking-tighter">{{
                        p.name }}</span>
                    </div>
                  </td>
                  <td class="px-8 py-5">
                    <p class="text-[10px] font-bold text-text-main tracking-tight">{{ p.category }}</p>
                  </td>
                  <td class="px-8 py-5 text-center">
                    <span
                      :class="['text-[9px] font-bold px-4 py-1.5 rounded-full tracking-widest shadow-xs', p.hasVariants ? 'bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400' : 'bg-surface-200 dark:bg-surface-900 text-text-muted']">
                      {{ p.hasVariants ? 'Variantes (SCS)' : 'Simple' }}
                    </span>
                  </td>
                  <td class="px-8 py-5 text-right text-base font-bold text-text-main tabular-nums">{{
                    formatCurrency(p.basePrice) }}</td>
                  <td class="px-8 py-5 text-center">
                    <div
                      :class="['inline-flex flex-col items-center justify-center w-12 h-12 rounded-2xl border font-bold tabular-nums transition-all group-hover:scale-110', getTotalStock(p) < 5 ? 'bg-danger-100 border-danger-200 text-danger-700' : getTotalStock(p) < 15 ? 'bg-warning-100 border-warning-200 text-warning-700' : 'bg-success-100 border-success-200 text-success-700']">
                      <span class="text-lg leading-none">{{ getTotalStock(p) }}</span>
                      <span class="text-[7px] tracking-widest opacity-50">Unds</span>
                    </div>
                  </td>
                  <td class="px-8 py-5 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button @click.prevent.stop="openKardex(p)" title="Kardex / Movimientos"
                        class="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-50 border border-border-subtle text-text-muted hover:text-emerald-600 hover:border-emerald-200 transition-all active:scale-90">
                        <font-awesome-icon icon="arrows-rotate" />
                      </button>
                      <button @click.prevent.stop="openEdit(p)" title="Editar"
                        class="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-50 border border-border-subtle text-text-muted hover:text-primary-600 hover:border-primary-200 transition-all active:scale-90">
                        <font-awesome-icon icon="pen-to-square" />
                      </button>
                      <button @click.prevent.stop="deleteProd(p)" title="Archivar"
                        class="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-50 border border-border-subtle text-text-muted hover:text-danger-600 hover:border-danger-200 transition-all active:scale-90">
                        <font-awesome-icon icon="box-archive" />
                      </button>
                    </div>
                  </td>
                </tr>
                <!-- Variants expansion -->
                <tr v-if="p.hasVariants && selectedProduct?.id === p.id">
                  <td colspan="6" class="px-8 py-0">
                    <div
                      class="bg-surface-50/50 rounded-[2rem] p-8 mb-8 border border-border-subtle shadow-inner animate-in slide-in-from-top-4 duration-300">
                      <div
                        class="text-[10px] font-bold text-text-muted tracking-widest mb-6 border-b border-border-subtle pb-4 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <font-awesome-icon icon="folder-tree" class="text-primary-600" /> Desglose por Tallas y Colores
                        </div>
                        <button @click.stop="addVariantToExisting(p)" class="px-3 py-1.5 bg-primary-600 text-white rounded-xl text-[10px] font-bold tracking-wider hover:bg-primary-700 transition-all active:scale-95">
                          <font-awesome-icon icon="plus" class="mr-1" /> Nueva Variante
                        </button>
                      </div>
                      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <div v-for="v in p.variants" :key="v.id"
                          class="flex flex-col bg-surface-100 rounded-2xl p-5 border border-border-subtle shadow-xs transition-all hover:shadow-md hover:-translate-y-1 relative group/var">
                          <button @click.stop="removeVariant(v.id)" class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-danger-100 text-danger-600 text-[8px] opacity-0 group-hover/var:opacity-100 transition-opacity hover:bg-danger-200">
                            <font-awesome-icon icon="xmark" />
                          </button>
                          <div class="flex justify-between items-start mb-4">
                            <div
                              class="px-3 py-1 bg-surface-200 dark:bg-surface-800 rounded-lg text-[10px] font-bold text-text-main tracking-tighter">
                              {{ v.size }}</div>
                            <span
                              :class="['text-[9px] font-bold px-3 py-1 rounded-full tracking-tighter', v.stock < 5 ? 'bg-danger-50 text-danger-600 border border-danger-100' : 'bg-success-50 text-success-600 border border-success-100']">
                              {{ v.stock }} Uni
                            </span>
                          </div>
                          <div class="space-y-1">
                            <p class="text-sm font-bold text-text-main tracking-tighter">{{ v.color }}</p>
                            <p class="text-[10px] font-bold text-text-muted opacity-60">{{ v.style }}</p>
                          </div>
                          <div class="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
                            <span class="font-mono text-[9px] text-primary-500 font-bold">{{ v.sku }}</span>
                            <font-awesome-icon icon="barcode" class="text-text-muted opacity-20 text-xs" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Create/Edit -->
    <Teleport to="body">
      <div v-if="showModal"
        class="fixed inset-0 bg-surface-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300"
        @click.self="showModal = false">
        <div
          class="bg-surface-100 rounded-[2.5rem] w-full max-w-lg max-h-[90vh] overflow-y-auto p-10 shadow-2xl border border-border-subtle animate-in fade-in zoom-in duration-200">
          <div class="flex items-center gap-5 mb-10">
            <div
              class="w-14 h-14 rounded-2xl bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-xl shadow-primary-500/20 text-xl">
              <font-awesome-icon :icon="editMode ? 'pen-to-square' : 'box-archive'" />
            </div>
            <div>
              <h3 class="text-2xl font-bold text-text-main tracking-tighter">{{ editMode ? 'Editar Producto' : 'Nuevo Producto' }}</h3>
              <p class="text-xs text-text-muted font-medium opacity-60 italic">{{ editMode ? 'Modifica las propiedades del item' : 'Define las características base del item' }}</p>
            </div>
          </div>

          <form @submit.prevent="saveProd" class="space-y-6">
            <div class="space-y-2">
              <label class="text-[10px] font-bold text-text-muted tracking-widest pl-1">Identificación del
                Producto</label>
              <input v-model="form.name"
                class="w-full px-6 py-4 bg-surface-50 border border-border-subtle rounded-2xl text-base font-bold text-text-main focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                placeholder="Nombre completo" />
            </div>

            <div class="grid grid-cols-2 gap-5">
              <div class="space-y-2">
                <label class="text-[10px] font-bold text-text-muted tracking-widest pl-1">Categoría</label>
                <div class="relative">
                  <select v-model="form.category"
                    class="appearance-none w-full px-6 py-4 bg-surface-50 border border-border-subtle rounded-2xl text-sm font-bold text-text-main focus:border-primary-500 outline-none cursor-pointer">
                    <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
                  </select>
                  <font-awesome-icon icon="chevron-down"
                    class="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] text-text-muted opacity-50" />
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-bold text-text-muted tracking-widest pl-1">SKU</label>
                <input v-model="form.sku"
                  class="w-full px-6 py-4 bg-surface-50 border border-border-subtle rounded-2xl text-sm font-bold text-text-main focus:border-primary-500 outline-none font-mono"
                  placeholder="SKU-001" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-5">
              <div class="space-y-2">
                <label class="text-[10px] font-bold text-text-muted tracking-widest pl-1">Valor Venta Uni ($)</label>
                <div class="relative">
                  <span class="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted font-bold">$</span>
                  <input v-model="form.basePrice" type="number"
                    class="w-full pl-10 pr-6 py-4 bg-surface-50 border border-border-subtle rounded-2xl text-base font-bold text-text-main focus:border-primary-500 outline-none tabular-nums"
                    placeholder="0.00" />
                </div>
              </div>
              <div v-if="!form.hasVariants" class="space-y-2">
                <label class="text-[10px] font-bold text-text-muted tracking-widest pl-1">Unidades Iniciales</label>
                <input v-model.number="form.stock" type="number" min="0"
                  class="w-full px-6 py-4 bg-surface-50 border border-border-subtle rounded-2xl text-base font-bold text-text-main focus:border-primary-500 outline-none tabular-nums" />
              </div>
            </div>

            <div v-if="!editMode" class="p-6 bg-surface-50 rounded-3xl border border-border-subtle space-y-4">
              <label class="flex items-center gap-4 cursor-pointer group">
                <div class="relative flex items-center">
                  <input v-model="form.hasVariants" type="checkbox"
                    class="w-6 h-6 rounded-lg border-border-subtle text-primary-600 focus:ring-primary-500/20 bg-white" />
                </div>
                <div>
                  <span class="text-xs font-bold text-text-main tracking-tight block">Gestionar Variantes (SCS)</span>
                  <span class="text-[10px] text-text-muted font-medium italic opacity-60">Permite controlar stock por
                    Talla, Color y Estilo</span>
                </div>
              </label>

              <!-- Variant Builder -->
              <div v-if="form.hasVariants" class="pt-4 border-t border-border-subtle space-y-4">
                <p class="text-[10px] font-bold text-text-muted tracking-widest">AGREGAR VARIANTES</p>
                <div class="grid grid-cols-4 gap-2">
                  <input v-model="variantForm.size" placeholder="Talla" class="px-3 py-2.5 bg-white border border-border-subtle rounded-xl text-xs font-bold text-text-main focus:border-primary-500 outline-none" />
                  <input v-model="variantForm.color" placeholder="Color" class="px-3 py-2.5 bg-white border border-border-subtle rounded-xl text-xs font-bold text-text-main focus:border-primary-500 outline-none" />
                  <input v-model.number="variantForm.stock" type="number" placeholder="Stock" min="0" class="px-3 py-2.5 bg-white border border-border-subtle rounded-xl text-xs font-bold text-text-main focus:border-primary-500 outline-none tabular-nums" />
                  <button type="button" @click="addPendingVariant" class="px-3 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 transition-all active:scale-95">
                    <font-awesome-icon icon="plus" />
                  </button>
                </div>
                <!-- Pending list -->
                <div v-if="pendingVariants.length" class="space-y-2">
                  <div v-for="(pv, idx) in pendingVariants" :key="idx" class="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-border-subtle">
                    <div class="flex items-center gap-3">
                      <span class="text-xs font-bold text-text-main">{{ pv.size || '—' }} / {{ pv.color || '—' }}</span>
                      <span v-if="pv.style" class="text-[10px] text-text-muted">{{ pv.style }}</span>
                    </div>
                    <div class="flex items-center gap-3">
                      <span class="text-xs font-bold text-primary-600 tabular-nums">{{ pv.stock }} uni</span>
                      <button type="button" @click="removePendingVariant(idx)" class="text-danger-500 hover:text-danger-700 text-xs"><font-awesome-icon icon="xmark" /></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-6 border-t border-border-subtle">
              <button type="button" @click="showModal = false"
                class="px-8 py-4 rounded-2xl text-xs font-bold tracking-widest text-text-muted hover:bg-surface-200 transition-all">Cancelar</button>
              <button type="submit"
                class="px-10 py-4 bg-primary-600 text-white rounded-2xl text-xs font-bold tracking-widest hover:bg-primary-700 shadow-xl shadow-primary-500/25 transition-all hover:scale-105 active:scale-95">
                {{ editMode ? 'Guardar Cambios' : 'Registrar en Catálogo' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modal Kardex -->
    <Teleport to="body">
      <div v-if="showKardexModal"
        class="fixed inset-0 bg-surface-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
        @click.self="showKardexModal = false">
        <div class="bg-surface-100 rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto p-10 shadow-2xl border border-border-subtle animate-in fade-in zoom-in duration-200">
          <div class="flex items-center justify-between mb-8">
            <div class="flex items-center gap-5">
              <div class="w-14 h-14 rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 text-xl">
                <font-awesome-icon icon="arrows-rotate" />
              </div>
              <div>
                <h3 class="text-2xl font-bold text-text-main tracking-tighter">Kardex: {{ kardexProduct?.name }}</h3>
                <p class="text-xs text-text-muted font-medium opacity-60 italic">Trazabilidad de ingresos, salidas y ajustes</p>
              </div>
            </div>
            <button @click="showKardexModal = false" class="text-text-muted hover:text-text-main text-xl transition-colors"><font-awesome-icon icon="xmark" /></button>
          </div>

          <!-- Register Movement Form -->
          <div class="bg-surface-50 rounded-3xl border border-border-subtle p-6 mb-8 space-y-4">
            <p class="text-[10px] font-bold text-text-muted tracking-widest">REGISTRAR MOVIMIENTO</p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <select v-model="movementForm.type" class="appearance-none px-4 py-3 bg-white border border-border-subtle rounded-xl text-xs font-bold focus:border-primary-500 outline-none">
                <option value="ingreso">📥 Ingreso</option>
                <option value="salida">📤 Salida</option>
                <option value="ajuste">🔧 Ajuste</option>
              </select>
              <input v-model.number="movementForm.quantity" type="number" min="1" placeholder="Cantidad" class="px-4 py-3 bg-white border border-border-subtle rounded-xl text-xs font-bold focus:border-primary-500 outline-none tabular-nums" />
              <input v-model="movementForm.reason" placeholder="Motivo (ej: Compra mayorista)" class="px-4 py-3 bg-white border border-border-subtle rounded-xl text-xs font-bold focus:border-primary-500 outline-none col-span-2 sm:col-span-1" />
              <button type="button" @click="registerMovement" class="px-4 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all active:scale-95">
                <font-awesome-icon icon="check" class="mr-1" /> Registrar
              </button>
            </div>
            <div v-if="kardexProduct?.hasVariants && kardexProduct?.variants?.length" class="pt-2">
              <label class="text-[10px] font-bold text-text-muted tracking-widest block mb-2">Variante específica (opcional)</label>
              <select v-model="movementForm.variantId" class="appearance-none px-4 py-3 bg-white border border-border-subtle rounded-xl text-xs font-bold focus:border-primary-500 outline-none w-full">
                <option :value="null">Producto general</option>
                <option v-for="v in kardexProduct.variants" :key="v.id" :value="v.id">{{ v.size }} / {{ v.color }} (Stock: {{ v.stock }})</option>
              </select>
            </div>
          </div>

          <!-- Movements Table -->
          <div v-if="kardexLoading" class="flex justify-center py-12">
            <div class="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
          <div v-else-if="kardexMovements.length === 0" class="text-center py-12 text-text-muted opacity-50">
            <font-awesome-icon icon="inbox" class="text-4xl mb-3 block" />
            <p class="text-sm font-bold">Sin movimientos registrados</p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="border-b border-border-subtle">
                  <th class="px-4 py-3 text-[10px] font-bold text-text-muted tracking-widest">Fecha</th>
                  <th class="px-4 py-3 text-[10px] font-bold text-text-muted tracking-widest">Tipo</th>
                  <th class="px-4 py-3 text-[10px] font-bold text-text-muted tracking-widest text-center">Cantidad</th>
                  <th class="px-4 py-3 text-[10px] font-bold text-text-muted tracking-widest text-center">Stock Previo</th>
                  <th class="px-4 py-3 text-[10px] font-bold text-text-muted tracking-widest text-center">Stock Nuevo</th>
                  <th class="px-4 py-3 text-[10px] font-bold text-text-muted tracking-widest">Motivo</th>
                  <th class="px-4 py-3 text-[10px] font-bold text-text-muted tracking-widest">Responsable</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border-subtle">
                <tr v-for="m in kardexMovements" :key="m.id" class="hover:bg-surface-50 transition-colors">
                  <td class="px-4 py-3 text-xs text-text-main tabular-nums">{{ new Date(m.date).toLocaleDateString('es-CO') }}</td>
                  <td class="px-4 py-3">
                    <span :class="['text-[9px] font-bold px-3 py-1 rounded-full',
                      m.type === 'ingreso' ? 'bg-emerald-100 text-emerald-700' :
                      m.type === 'salida' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700']">
                      {{ m.type === 'ingreso' ? '📥 Ingreso' : m.type === 'salida' ? '📤 Salida' : '🔧 Ajuste' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center text-sm font-bold tabular-nums" :class="m.type === 'ingreso' ? 'text-emerald-600' : 'text-red-600'">
                    {{ m.type === 'ingreso' ? '+' : '-' }}{{ m.quantity }}
                  </td>
                  <td class="px-4 py-3 text-center text-xs text-text-muted tabular-nums">{{ m.previousStock }}</td>
                  <td class="px-4 py-3 text-center text-xs font-bold text-text-main tabular-nums">{{ m.newStock }}</td>
                  <td class="px-4 py-3 text-xs text-text-muted max-w-[200px] truncate">{{ m.reason }}</td>
                  <td class="px-4 py-3 text-xs text-text-muted">{{ m.adminName }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
