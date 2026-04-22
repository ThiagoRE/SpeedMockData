import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockProducts, mockProductVariants } from '@/data/mockData'

export const useInventoryStore = defineStore('inventory', () => {

  const products = ref([...mockProducts])
  const variants = ref([...mockProductVariants])
  const movements = ref([]) // Simulado
  const loading = ref(false)
  const error = ref(null)

  // ─── Fetch Mock ──────────────────────────────────────────
  async function fetchProducts() {
    // Ya inicializado
  }

  // ─── CRUD Productos ─────────────────────────────────────
  async function saveProduct(form) {
    const newProduct = {
      ...form,
      id: Math.max(...products.value.map(p => p.id), 0) + 1,
      status: 'activo'
    }
    products.value.push(newProduct)
    return newProduct
  }

  async function updateProduct(id, form) {
    const idx = products.value.findIndex(p => p.id === id)
    if (idx !== -1) {
      products.value[idx] = { ...products.value[idx], ...form }
      return products.value[idx]
    }
  }

  async function archiveProduct(id) {
    const p = products.value.find(p => p.id === id)
    if (p) p.status = 'inactivo'
  }

  // ─── CRUD Variantes ─────────────────────────────────────
  async function addVariant(variant) {
    const newV = {
      ...variant,
      id: 'v' + (variants.value.length + 1)
    }
    variants.value.push(newV)
    return newV
  }

  async function deleteVariant(variantId) {
    variants.value = variants.value.filter(v => v.id !== variantId)
  }

  // ─── Kardex (Movimientos de Inventario) ─────────────────
  async function registerMovement(movement) {
    const newM = {
      ...movement,
      id: movements.value.length + 1,
      date: new Date().toISOString()
    }
    movements.value.push(newM)
    
    // Actualizar stock localmente
    if (movement.variantId) {
      const v = variants.value.find(x => x.id === movement.variantId)
      if (v) v.stock = movement.type === 'entrada' ? v.stock + movement.quantity : v.stock - movement.quantity
    } else {
      const p = products.value.find(x => x.id === movement.productId)
      if (p) p.stock = movement.type === 'entrada' ? p.stock + movement.quantity : p.stock - movement.quantity
    }

    return { success: true, data: newM }
  }

  async function fetchMovements(productId) {
    return movements.value.filter(m => m.productId === productId)
  }

  // ─── Computed Getters ───────────────────────────────────
  const productsWithVariants = computed(() => {
    return products.value.map(p => {
      const pVariants = variants.value.filter(v => v.productId === p.id)
      return { ...p, variants: pVariants }
    })
  })

  const lowStockItems = computed(() => {
    const list = []
    products.value.forEach(p => {
      if (!p.hasVariants && (p.stock || 0) <= 5) {
        list.push({ ...p, type: 'Simple' })
      }
    })
    variants.value.forEach(v => {
      const p = products.value.find(x => x.id === v.productId)
      if ((v.stock || 0) <= 5) {
        list.push({ ...v, name: `${p?.name || 'Producto'} (${v.size}/${v.color})`, type: 'Variante' })
      }
    })
    return list
  })

  const simpleProducts = computed(() => productsWithVariants.value.filter(p => !p.hasVariants))
  const variantProducts = computed(() => productsWithVariants.value.filter(p => p.hasVariants))

  const totalStockValue = computed(() => {
    return productsWithVariants.value.reduce((sum, p) => {
      if (p.hasVariants && p.variants) {
        return sum + p.variants.reduce((vs, v) => vs + (v.stock || 0) * p.basePrice, 0)
      }
      return sum + (p.stock || 0) * p.basePrice
    }, 0)
  })

  return {
    products,
    loading,
    error,
    productsWithVariants,
    simpleProducts,
    variantProducts,
    lowStockItems,
    totalStockValue,
    fetchProducts,
    saveProduct,
    updateProduct,
    archiveProduct,
    addVariant,
    deleteVariant,
    registerMovement,
    fetchMovements
  }
})
