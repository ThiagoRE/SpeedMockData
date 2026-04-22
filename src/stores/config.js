import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockConfig, mockConfigRol, mockAllConfigs } from '@/data/mockData'

export const useConfigStore = defineStore('config', () => {
  const config = ref({ ...mockConfig })
  const allConfigs = ref([]) 
  const configRol = ref([...mockConfigRol])
  const configUsuario = ref([])

  // --- Fetch Data Mock ---
  async function fetchConfiguraciones() {
    // Ya inicializado desde mockConfig
    applyBrandingColors()
  }

  async function fetchFullConfiguraciones() {
    allConfigs.value = [...mockAllConfigs]
  }

  async function fetchConfiguracionesRol() {
    // Ya inicializado
  }

  async function fetchConfiguracionesUsuario(id) {
    // En modo mock regresamos vacío o simulamos
    configUsuario.value = []
  }

  // --- Getters ---
  const branding = computed(() => config.value.branding || {})
  const kloggy = computed(() => config.value.kloggy || {})
  const wompi = computed(() => config.value.wompi || {})
  const configInventario = computed(() => config.value.inventario || {})
  
  const getConfigByRol = computed(() => (rol) =>
    configRol.value.filter(c => c.nombre_rol === rol)
  )

  const getConfigByUsuario = computed(() => (id) =>
    configUsuario.value.filter(c => c.usuario_id === id)
  )

  // --- Actions ---
  async function updateConfigKey(clave, payload) {
    config.value[clave] = payload.valor
    applyBrandingColors()
    return { success: true }
  }

  async function updateConfig(category, data) {
    return await updateConfigKey(category, { valor: data })
  }

  function updateBranding(data) {
    if(!config.value.branding) config.value.branding = {}
    config.value.branding = { ...config.value.branding, ...data }
    applyBrandingColors()
    return updateConfig('branding', config.value.branding)
  }

  async function setConfigRol(rol, clave, valor) {
    const newId = Math.max(...configRol.value.map(c => c.id), 0) + 1
    configRol.value.push({ id: newId, nombre_rol: rol, clave, valor })
    return { success: true }
  }

  async function removeConfigRol(id) {
    configRol.value = configRol.value.filter(c => c.id !== id)
    return { success: true }
  }

  async function setConfigUsuario(usuarioId, clave, valor) {
    const newId = Math.max(...configUsuario.value.map(c => c.id || 0), 0) + 1
    configUsuario.value.push({ id: newId, usuario_id: usuarioId, clave, valor })
    return { success: true }
  }

  async function removeConfigUsuario(id, usuarioId) {
    configUsuario.value = configUsuario.value.filter(c => c.id !== id)
    return { success: true }
  }

  function applyBrandingColors() {
    const root = document.documentElement
    const { colorPrimario, colorSecundario } = config.value.branding || {}
    if (colorPrimario) root.style.setProperty('--branding-primary', colorPrimario)
    if (colorSecundario) root.style.setProperty('--branding-secondary', colorSecundario)
  }

  async function fetchAdminConfigs() {
    await fetchFullConfiguraciones()
    await fetchConfiguracionesRol()
  }

  async function init() {
    applyBrandingColors()
    await fetchConfiguraciones()
  }

  return {
    config, allConfigs, configRol, configUsuario,
    branding, kloggy, wompi, configInventario,
    getConfigByRol, getConfigByUsuario,
    updateConfig, updateConfigKey, updateBranding, setConfigRol, removeConfigRol,
    setConfigUsuario, removeConfigUsuario, applyBrandingColors, init,
    fetchConfiguraciones, fetchFullConfiguraciones, fetchConfiguracionesUsuario,
    fetchAdminConfigs
  }
})
