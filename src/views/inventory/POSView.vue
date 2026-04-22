<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { useConfigStore } from '@/stores/config'
import { useUsersStore } from '@/stores/users'
import Swal from 'sweetalert2'

const inventory = useInventoryStore()
const configStore = useConfigStore()
const usersStore = useUsersStore()

const cart = ref([])
const selectedUserId = ref('')
const paymentMethod = ref('Efectivo')
const search = ref('')
const searchInput = ref(null)

const config = computed(() => configStore.configInventario)
const formatCurrency = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)
const cartTotal = computed(() => cart.value.reduce((s, i) => s + i.total, 0))

// Variant Modal
const showVariantModal = ref(false)
const productToSelectVariants = ref(null)

const filteredProducts = computed(() => {
  const q = search.value.toLowerCase()
  return inventory.productsWithVariants.filter(p =>
    p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  )
})

const selectedUser = computed(() => usersStore.getUserById(Number(selectedUserId.value)))

function addToCart(product, variant = null) {
  const itemId = variant ? `v-${variant.id}` : `p-${product.id}`
  const itemName = variant ? `${product.name} (${variant.size}/${variant.color})` : product.name
  const itemPrice = product.basePrice
  const sku = variant ? variant.sku : product.sku

  const existing = cart.value.find(i => i.id === itemId)
  if (existing) {
    existing.quantity++
    existing.total = existing.quantity * itemPrice
  } else {
    cart.value.push({
      id: itemId,
      productId: product.id,
      variantId: variant ? variant.id : null,
      name: itemName,
      price: itemPrice,
      quantity: 1,
      total: itemPrice,
      sku
    })
  }
  showVariantModal.value = false
}

function handleProductClick(product) {
  if (product.hasVariants) {
    productToSelectVariants.value = product
    showVariantModal.value = true
  } else {
    addToCart(product)
  }
}

async function handleBarcode(e) {
  if (config.value.metodoEscaneo === 'manual') return

  // Simple simulation: if length is typical of a SKU and Enter is pressed
  const sku = search.value.trim()
  if (!sku) return

  // Find by SKU (Variant or Simple Product)
  let foundProduct = null
  let foundVariant = null

  inventory.products.forEach(p => {
    if (!p.hasVariants && p.sku === sku) {
      foundProduct = p
    }
  })

  if (!foundProduct) {
    // Search variants inside products
    inventory.products.forEach(p => {
      if (p.hasVariants && p.variants) {
        const v = p.variants.find(v => v.sku === sku)
        if (v) {
          foundVariant = v
          foundProduct = p
        }
      }
    })
  }

  if (foundProduct) {
    addToCart(foundProduct, foundVariant)
    search.value = ''
    await Swal.fire({
      toast: true, position: 'top-end', icon: 'success',
      title: `Añadido: ${foundProduct.name}`, showConfirmButton: false, timer: 1000
    })
  }
}

function removeFromCart(idx) {
  cart.value.splice(idx, 1)
}

async function startCheckout() {
  if (!selectedUserId.value) {
    Swal.fire({ icon: 'warning', title: 'Socio Requerido', text: 'Por favor selecciona un socio para continuar.', confirmButtonColor: '#3b82f6' }); return
  }
  if (cart.value.length === 0) {
    Swal.fire({ icon: 'secondary', title: 'Carrito Vacío', confirmButtonColor: '#3b82f6' }); return
  }

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/pos/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {})
      },
      body: JSON.stringify({
        usuarioId: Number(selectedUserId.value),
        metodoPago: paymentMethod.value,
        items: cart.value.map(i => ({
          producto_id: i.productId,
          variante_id: i.variantId,
          cantidad: i.quantity,
          precio: i.price
        }))
      })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Error en el checkout')

    await Swal.fire({ icon: 'success', title: '¡Venta Exitosa!', text: 'El inventario ha sido actualizado.', timer: 2000, showConfirmButton: false })
    cart.value = []
    selectedUserId.value = ''
    search.value = ''
    await inventory.fetchProducts() // Recargar stock actualizado
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Error en Venta', text: error.message, confirmButtonColor: '#ef4444' })
  }
}

onMounted(() => {
  inventory.fetchProducts()
  searchInput.value?.focus()
})
</script>

<template>
  <div class="space-y-8 pb-10">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <h1 class="text-3xl font-bold text-text-main tracking-tighter">Punto de Venta</h1>
          <div
            class="px-3 py-1 bg-primary-100 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-lg text-[9px] font-bold tracking-widest border border-primary-200 dark:border-primary-800">
            Shop Central</div>
        </div>
        <p class="text-sm text-text-muted font-medium italic opacity-70">Registro de ventas directas e indumentaria
          oficial</p>
      </div>

      <!-- Config Status Pill -->
      <div class="flex gap-2">
        <div
          class="flex items-center gap-2 px-4 py-2 bg-surface-100 border border-border-subtle rounded-xl text-[10px] font-bold opacity-60">
          <font-awesome-icon
            :icon="config.metodoEscaneo === 'barcode' ? 'barcode' : config.metodoEscaneo === 'manual' ? 'keyboard' : 'bolt'" />
          {{ config.metodoEscaneo }}
        </div>
        <div v-if="config.permitirCreditoSocio"
          class="flex items-center gap-2 px-4 py-2 bg-success-50 text-success-700 border border-success-200 rounded-xl text-[10px] font-bold">
          <font-awesome-icon icon="check-circle" /> Crédito Habilitado
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      <!-- Main Content: Products -->
      <div class="xl:col-span-8 space-y-6">
        <!-- Search Bar -->
        <div
          class="bg-surface-100 p-2 rounded-[2rem] border border-border-subtle shadow-xs focus-within:shadow-lg focus-within:border-primary-500/50 transition-all flex items-center gap-2 group">
          <div
            class="w-12 h-12 flex items-center justify-center text-text-muted opacity-40 group-focus-within:opacity-100 transition-opacity">
            <font-awesome-icon icon="magnifying-glass" />
          </div>
          <input ref="searchInput" v-model="search" type="text"
            :placeholder="config.metodoEscaneo === 'manual' ? 'Buscar producto por nombre...' : 'Escanea código de barras o busca...'"
            class="flex-1 bg-transparent border-none outline-none text-base font-bold text-text-main placeholder-text-muted/30"
            @keyup.enter="handleBarcode" />
          <div class="flex items-center gap-2 pr-4">
            <div v-if="config.metodoEscaneo !== 'manual'"
              class="flex items-center gap-2 px-3 py-1.5 bg-surface-200 dark:bg-surface-800 rounded-xl text-[9px] font-bold text-text-muted animate-pulse">
              <span class="w-1.5 h-1.5 bg-success-500 rounded-full"></span> Scanner Listo
            </div>
          </div>
        </div>

        <!-- Products Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div v-for="p in filteredProducts" :key="p.id" @click="handleProductClick(p)"
            class="bg-surface-100 rounded-3xl border border-border-subtle p-5 cursor-pointer group hover:border-primary-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div class="absolute top-3 right-3">
              <div v-if="p.hasVariants"
                class="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 rounded-md text-[8px] font-bold tracking-tighter">
                Variantes</div>
              <div v-else
                class="px-2 py-0.5 bg-surface-200 dark:bg-surface-800 text-text-muted rounded-md text-[8px] font-bold tracking-tighter">
                {{ p.stock }} Und</div>
            </div>

            <div
              class="w-14 h-14 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-border-subtle flex items-center justify-center text-xl text-text-muted mb-4 group-hover:text-primary-600 group-hover:border-primary-200 transition-all shadow-inner">
              <font-awesome-icon
                :icon="p.category === 'Indumentaria' ? 'shirt' : p.category === 'Calzado' ? 'shoe-prints' : 'award'" />
            </div>

            <h4 class="text-sm font-bold text-text-main line-clamp-2 tracking-tighter leading-tight">{{ p.name }}</h4>
            <p class="text-[9px] font-bold text-text-muted opacity-50 mt-1 tracking-widest">{{ p.category }}</p>

            <div class="mt-4 pt-3 border-t border-border-subtle border-dashed flex items-center justify-between">
              <span class="text-lg font-bold text-primary-600 dark:text-primary-400 tabular-nums">{{
                formatCurrency(p.basePrice) }}</span>
              <font-awesome-icon icon="circle-plus"
                class="text-primary-500 opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100 transition-all" />
            </div>
          </div>
        </div>
      </div>

      <!-- Right Sidebar: Checkout -->
      <div class="xl:col-span-4 lg:sticky lg:top-8 space-y-6">
        <div
          class="bg-surface-100 rounded-4xl border border-border-subtle shadow-xl overflow-hidden flex flex-col min-h-[600px] border-t-4 border-t-primary-600">
          <!-- Selected Member Info -->
          <div class="p-8 pb-4">
            <h3 class="text-xl font-bold text-text-main tracking-tighter mb-6 flex items-center gap-3">
              <font-awesome-icon icon="basket-shopping" class="text-primary-600" /> Detalle de Pedido
            </h3>

            <div class="space-y-4">
              <div class="space-y-2">
                <label class="text-[10px] font-bold text-text-muted tracking-widest pl-1 opacity-60">Socio /
                  Cliente</label>
                <div class="relative">
                  <select v-model="selectedUserId"
                    class="w-full pl-12 pr-6 py-4 bg-surface-50 border border-border-subtle rounded-2xl font-bold text-sm text-text-main appearance-none focus:border-primary-500 outline-none transition-all cursor-pointer">
                    <option value="">Seleccionar del listado...</option>
                    <option v-for="m in usersStore.activeUsers" :key="m.id" :value="m.id">{{ m.name }}</option>
                  </select>
                  <font-awesome-icon icon="user-tag"
                    class="absolute left-5 top-1/2 -translate-y-1/2 text-primary-500" />
                  <font-awesome-icon icon="chevron-down"
                    class="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] text-text-muted opacity-30" />
                </div>
              </div>
            </div>
          </div>

          <!-- Cart Items -->
          <div class="flex-1 px-8 overflow-y-auto max-h-[400px] custom-scrollbar">
            <div v-if="cart.length === 0"
              class="flex flex-col items-center justify-center py-12 text-center opacity-30 grayscale pointer-events-none border-2 border-dashed border-border-subtle rounded-3xl">
              <font-awesome-icon icon="cart-plus" class="text-5xl mb-4" />
              <p class="text-sm font-bold tracking-widest">Carrito Vacío</p>
            </div>
            <div v-else class="space-y-3">
              <div v-for="(item, idx) in cart" :key="item.id"
                class="flex items-center gap-4 bg-surface-50 p-4 rounded-2xl border border-border-subtle group/cart">
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-bold text-text-main tracking-tighter truncate">{{ item.name }}</p>
                  <p class="text-[10px] font-bold text-text-muted opacity-60 italic tabular-nums">{{
                    formatCurrency(item.price) }} × {{ item.quantity }}</p>
                </div>
                <div class="flex items-center gap-4">
                  <span class="text-sm font-bold text-text-main tabular-nums">{{ formatCurrency(item.total) }}</span>
                  <button @click="removeFromCart(idx)"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-danger-50 hover:text-danger-600 transition-all">
                    <font-awesome-icon icon="xmark" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer & Actions -->
          <div class="p-8 bg-surface-50/50 border-t border-border-subtle space-y-6">
            <div class="space-y-2">
              <div class="flex justify-between items-end">
                <span class="text-[10px] font-bold text-text-muted tracking-widest opacity-60">Total Venta</span>
                <span class="text-3xl font-bold text-primary-600 tabular-nums tracking-tighter">{{
                  formatCurrency(cartTotal) }}</span>
              </div>
              <div class="border-t border-border-subtle border-dashed pt-4">
                <label class="text-[10px] font-bold text-text-muted tracking-widest pl-1 mb-2 block opacity-60">Método
                  de Cobro</label>
                <div class="grid grid-cols-2 gap-3">
                  <button v-for="method in ['Efectivo', 'Crédito Socio']" :key="method" @click="paymentMethod = method"
                    :class="['px-4 py-3 rounded-xl text-[10px] font-bold tracking-tighter transition-all border outline-none', paymentMethod === method ? 'bg-primary-600 text-white border-primary-700 shadow-md ring-2 ring-primary-500/20' : 'bg-surface-100 text-text-muted border-border-subtle hover:bg-surface-200']">
                    <font-awesome-icon :icon="method === 'Efectivo' ? 'money-bill-wave' : 'file-invoice-dollar'"
                      class="mr-2" />
                    {{ method }}
                  </button>
                </div>
                <p v-if="paymentMethod === 'Crédito Socio'"
                  class="mt-4 p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl text-[9px] font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 italic">
                  El monto se cargará al estado de cuenta del socio sujeto a su capacidad crediticia (${{ new
                    Intl.NumberFormat('es-CO').format(config.limiteDeudaSocio) }}).
                </p>
              </div>
            </div>

            <button @click="startCheckout"
              class="w-full py-5 bg-linear-to-r from-success-500 to-success-600 text-white rounded-2xl font-bold text-sm tracking-widest shadow-xl shadow-success-500/25 hover:shadow-success-500/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-95">
              <font-awesome-icon icon="cash-register" />
              Finalizar y Registrar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Variant Selection Modal -->
    <Teleport to="body">
      <div v-if="showVariantModal"
        class="fixed inset-0 bg-surface-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300"
        @click.self="showVariantModal = false">
        <div
          class="bg-surface-100 rounded-4xl w-full max-w-2xl p-10 shadow-2xl border border-border-subtle animate-in zoom-in duration-200">
          <div class="flex items-center justify-between mb-8 border-b border-border-subtle pb-6">
            <div>
              <h3 class="text-2xl font-bold text-text-main tracking-tighter">{{ productToSelectVariants?.name }}</h3>
              <p class="text-xs font-bold text-text-muted opacity-60">Selecciona la variante para añadir al carrito</p>
            </div>
            <button @click="showVariantModal = false"
              class="w-10 h-10 rounded-xl hover:bg-surface-200 flex items-center justify-center text-text-muted transition-all"><font-awesome-icon
                icon="xmark" /></button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button v-for="v in productToSelectVariants?.variants" :key="v.id"
              @click="addToCart(productToSelectVariants, v)"
              class="flex items-center justify-between p-5 bg-surface-50 border border-border-subtle rounded-3xl hover:border-primary-500 hover:bg-surface-0 hover:shadow-xl transition-all group">
              <div class="text-left">
                <p
                  class="text-sm font-bold text-text-main tracking-tighter group-hover:text-primary-600 transition-colors">
                  {{ v.size }} / {{ v.color }}</p>
                <p class="text-[10px] font-bold text-text-muted opacity-50">{{ v.style }} • SKU: {{ v.sku }}</p>
              </div>
              <div
                class="px-3 py-1.5 bg-surface-200 dark:bg-surface-800 rounded-xl text-[10px] font-bold tabular-nums group-hover:bg-primary-100 group-hover:text-primary-700 transition-all">
                {{ v.stock }} Und
              </div>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}
</style>
