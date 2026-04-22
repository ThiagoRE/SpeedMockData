<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConfigStore } from '@/stores/config'
import { apiUploadFile, mediaUrl } from '@/services/api'
import Swal from 'sweetalert2'

const configStore = useConfigStore()

const activeTab = ref('branding')
const tabs = [
  { key: 'branding', label: 'Identidad', icon: 'flag' },
  { key: 'kloggy', label: 'Kloggy', icon: 'gear' },
  { key: 'wompi', label: 'Wompi', icon: 'credit-card' },
  { key: 'modulos', label: 'Módulos', icon: 'boxes-stacked' },
  { key: 'roles', label: 'Roles', icon: 'user-shield' },
  { key: 'usuarios_config', label: 'Usuarios', icon: 'users' },
  { key: 'finanzas', label: 'Finanzas', icon: 'money-bill-wave' },
]

// --- Branding ---
const brandingForm = ref({ ...configStore.branding })
const logoPreview = ref(mediaUrl(configStore.branding.logo))
const logoUploading = ref(false)

async function handleLogoUpload(e) {
  const file = e.target.files[0]
  if (!file) return

  // Preview local inmediato mientras sube
  logoPreview.value = URL.createObjectURL(file)
  logoUploading.value = true

  try {
    const result = await apiUploadFile('/uploads/branding/logo', file)
    // El backend ya actualizó la DB con la URL relativa
    brandingForm.value.logo = result.filepath
    logoPreview.value = mediaUrl(result.filepath)
    Swal.fire({ title: '¡Logo actualizado!', text: `Comprimido a ${(result.size / 1024).toFixed(0)}KB en WebP`, icon: 'success', timer: 2000, showConfirmButton: false, background: '#060606', color: '#FFFFFF' })
  } catch (err) {
    logoPreview.value = mediaUrl(configStore.branding.logo) // Restaurar preview anterior
    Swal.fire({ title: 'Error', text: err.message, icon: 'error', background: '#060606', color: '#FFFFFF' })
  } finally {
    logoUploading.value = false
  }
}

function saveBranding() {
  // El logo ya se persistió en el upload, aquí solo guardamos nombre y colores
  const { logo, ...brandingWithoutLogo } = brandingForm.value
  configStore.updateBranding(brandingWithoutLogo)
  Swal.fire({ title: '¡Guardado!', text: 'Identidad institucional actualizada', icon: 'success', timer: 1500, showConfirmButton: false, background: '#060606', color: '#FFFFFF' })
}

// --- Kloggy ---
const kloggyForm = ref({ ...configStore.kloggy })
function saveKloggy() {
  configStore.updateConfig('kloggy', kloggyForm.value)
  Swal.fire({ title: '¡Guardado!', text: 'Configuración Kloggy actualizada', icon: 'success', timer: 1500, showConfirmButton: false, background: '#060606', color: '#FFFFFF' })
}

// --- Wompi ---
const wompiForm = ref({ ...configStore.wompi })
const showWompiKeys = ref({})
function toggleShowKey(key) {
  showWompiKeys.value[key] = !showWompiKeys.value[key]
}
function saveWompi() {
  configStore.updateConfig('wompi', wompiForm.value)
  Swal.fire({ title: '¡Guardado!', text: 'Llaves Wompi actualizadas', icon: 'success', timer: 1500, showConfirmButton: false, background: '#060606', color: '#FFFFFF' })
}

// --- Módulos Dinámicos ---
const sections = computed(() => {
  const groups = {}
  configStore.allConfigs.forEach(cfg => {
    if (!groups[cfg.seccion]) groups[cfg.seccion] = []
    groups[cfg.seccion].push({ ...cfg })
  })
  return groups
})

async function saveDynamicConfig(cfg) {
  try {
    // Validar si el valor es JSON o string simple
    let valueToSave = cfg.valor_configuracion
    await configStore.updateConfigKey(cfg.clave_configuracion, { 
      valor: valueToSave,
      habilitado: cfg.habilitado 
    })
    Swal.fire({ title: '¡Guardado!', text: `Configuración "${cfg.etiqueta}" actualizada`, icon: 'success', timer: 1500, showConfirmButton: false, background: '#060606', color: '#FFFFFF' })
  } catch (err) {
    Swal.fire({ title: 'Error', text: err.message, icon: 'error', background: '#060606', color: '#FFFFFF' })
  }
}

// --- Finanzas ---
const finanzasForm = ref({ ...configStore.config.finanzas })
function saveFinanzas() {
  configStore.updateConfig('finanzas', finanzasForm.value)
  Swal.fire({ title: '¡Guardado!', text: 'Configuración Financiera actualizada', icon: 'success', timer: 1500, showConfirmButton: false, background: '#060606', color: '#FFFFFF' })
}

// --- Roles Config ---
const roles = ['administrativo', 'supervisor', 'profesor', 'estudiante', 'familiar']
const selectedRol = ref('administrativo')
const rolConfigs = computed(() => configStore.getConfigByRol(selectedRol.value))
const newRolConfig = ref({ clave: '', valor: '' })

function addRolConfig() {
  if (!newRolConfig.value.clave) return
  configStore.setConfigRol(selectedRol.value, newRolConfig.value.clave, newRolConfig.value.valor)
  newRolConfig.value = { clave: '', valor: '' }
}

function deleteRolConfig(id) {
  configStore.removeConfigRol(id)
}

// --- Usuarios Config ---
const selectedUsuarioId = ref(null)
const usuarioConfigs = computed(() =>
  selectedUsuarioId.value ? configStore.getConfigByUsuario(selectedUsuarioId.value) : []
)
const newUsuarioConfig = ref({ clave: '', valor: '' })

function addUsuarioConfig() {
  if (!selectedUsuarioId.value || !newUsuarioConfig.value.clave) return
  configStore.setConfigUsuario(selectedUsuarioId.value, newUsuarioConfig.value.clave, newUsuarioConfig.value.valor)
  newUsuarioConfig.value = { clave: '', valor: '' }
}

function deleteUsuarioConfig(id) {
  configStore.removeConfigUsuario(id)
}

// Wompi key labels
const wompiKeyLabels = {
  llavePublicaSandbox: 'Llave Pública Sandbox',
  llavePublicaProduccion: 'Llave Pública Producción',
  llavePrivadaSandbox: 'Llave Privada Sandbox',
  llavePrivadaProduccion: 'Llave Privada Producción',
  llaveEventosSandbox: 'Llave Eventos Sandbox',
  llaveEventosProduccion: 'Llave Eventos Producción',
  llaveIntegridadSandbox: 'Llave Integridad Sandbox',
  llaveIntegridadProduccion: 'Llave Integridad Producción',
}

onMounted(() => {
  configStore.fetchAdminConfigs()
})
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6 font-sans">
    <!-- Tabs -->
    <div class="flex flex-wrap gap-2 p-1 bg-surface-200 rounded-xl">
      <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key" :class="[
        'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
        activeTab === tab.key
          ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
          : 'text-text-muted hover:text-text-main hover:bg-surface-100'
      ]">
        <font-awesome-icon :icon="tab.icon" class="text-xs" />
        <span class="hidden sm:inline">{{ tab.label }}</span>
      </button>
    </div>

    <!-- BRANDING TAB -->
    <div v-if="activeTab === 'branding'" class="bg-surface-100 rounded-2xl border border-border-subtle p-6 space-y-6">
      <div class="flex items-center gap-3 mb-2">
        <div
          class="w-10 h-10 rounded-xl bg-linear-to-br from-primary-500 to-primary-600 flex items-center justify-center">
          <font-awesome-icon icon="flag" class="text-white" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-text-main">Identidad Institucional</h3>
          <p class="text-sm text-text-muted">Logo, colores y nombre de la institución</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Logo Upload -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-text-main">Logo / Escudo</label>
          <div class="flex items-center gap-4">
            <div
              class="relative w-24 h-24 rounded-2xl border-2 border-dashed border-border-subtle bg-surface-200 flex items-center justify-center overflow-hidden transition-colors hover:border-primary-400">
              <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-contain p-1" />
              <font-awesome-icon v-else icon="bolt-lightning" class="text-3xl text-text-muted" />
              <!-- Loading overlay -->
              <div v-if="logoUploading" class="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                <font-awesome-icon icon="spinner" class="text-white text-xl animate-spin" />
              </div>
            </div>
            <div>
              <label
                :class="['inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors', logoUploading ? 'bg-gray-500 cursor-wait' : 'bg-primary-600 hover:bg-primary-700 cursor-pointer']">
                <font-awesome-icon :icon="logoUploading ? 'spinner' : 'plus'" :class="{ 'animate-spin': logoUploading }" />
                {{ logoUploading ? 'Subiendo...' : 'Cargar Logo' }}
                <input type="file" accept="image/*" class="hidden" @change="handleLogoUpload" :disabled="logoUploading" />
              </label>
              <p class="text-xs text-text-muted mt-1">PNG, JPG o WebP. Se comprime a ≤1MB automáticamente</p>
            </div>
          </div>
        </div>

        <!-- Nombre -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-text-main">Nombre de la Institución</label>
          <input v-model="brandingForm.nombre" type="text"
            class="w-full px-4 py-2.5 bg-surface-200 border border-border-subtle rounded-xl text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
            placeholder="Nombre del club" />
        </div>

        <!-- Color Primario -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-text-main">Color Primario</label>
          <div class="flex items-center gap-3">
            <input v-model="brandingForm.colorPrimario" type="color"
              class="w-12 h-10 rounded-lg cursor-pointer border border-border-subtle" />
            <input v-model="brandingForm.colorPrimario" type="text"
              class="flex-1 px-4 py-2.5 bg-surface-200 border border-border-subtle rounded-xl text-text-main text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
            <div class="w-10 h-10 rounded-xl shadow-inner" :style="{ backgroundColor: brandingForm.colorPrimario }">
            </div>
          </div>
        </div>

        <!-- Color Secundario -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-text-main">Color Secundario</label>
          <div class="flex items-center gap-3">
            <input v-model="brandingForm.colorSecundario" type="color"
              class="w-12 h-10 rounded-lg cursor-pointer border border-border-subtle" />
            <input v-model="brandingForm.colorSecundario" type="text"
              class="flex-1 px-4 py-2.5 bg-surface-200 border border-border-subtle rounded-xl text-text-main text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
            <div class="w-10 h-10 rounded-xl shadow-inner" :style="{ backgroundColor: brandingForm.colorSecundario }">
            </div>
          </div>
        </div>
      </div>

      <!-- Preview -->
      <div class="p-4 rounded-xl bg-surface-200 border border-border-subtle">
        <p class="text-xs text-text-muted mb-3 tracking-wider font-semibold">Vista previa</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg"
            :style="{ background: `linear-gradient(135deg, ${brandingForm.colorPrimario}, ${brandingForm.colorSecundario})` }">
            <img v-if="logoPreview" :src="logoPreview" class="w-7 h-7 object-contain" />
            <font-awesome-icon v-else icon="bolt-lightning" />
          </div>
          <div>
            <p class="text-sm font-bold text-text-main">{{ brandingForm.nombre || 'Speed' }}</p>
            <p class="text-[10px] text-text-muted">Gestión Deportiva</p>
          </div>
        </div>
      </div>

      <button @click="saveBranding"
        class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-primary-500/25">
        <font-awesome-icon icon="floppy-disk" class="mr-2" />Guardar Identidad
      </button>
    </div>

    <!-- KLOGGY TAB -->
    <div v-if="activeTab === 'kloggy'" class="bg-surface-100 rounded-2xl border border-border-subtle p-6 space-y-6">
      <div class="flex items-center gap-3 mb-2">
        <div
          class="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <font-awesome-icon icon="gear" class="text-white" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-text-main">Configuración Kloggy</h3>
          <p class="text-sm text-text-muted">Credenciales de registro y activación</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-2">
          <label class="block text-sm font-medium text-text-main">Usuario de Registro</label>
          <input v-model="kloggyForm.usuario" type="text"
            class="w-full px-4 py-2.5 bg-surface-200 border border-border-subtle rounded-xl text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            placeholder="Usuario Kloggy" />
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-medium text-text-main">Clave de Usuario</label>
          <input v-model="kloggyForm.clave" type="password"
            class="w-full px-4 py-2.5 bg-surface-200 border border-border-subtle rounded-xl text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            placeholder="••••••••" />
        </div>
        <div class="space-y-2 md:col-span-2">
          <label class="block text-sm font-medium text-text-main">Serial de Activación</label>
          <input v-model="kloggyForm.serial" type="text"
            class="w-full px-4 py-2.5 bg-surface-200 border border-border-subtle rounded-xl text-text-main text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            placeholder="XXXX-XXXX-XXXX-XXXX" />
        </div>
      </div>

      <button @click="saveKloggy"
        class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-primary-500/25">
        <font-awesome-icon icon="floppy-disk" class="mr-2" />Guardar Kloggy
      </button>
    </div>

    <!-- WOMPI TAB -->
    <div v-if="activeTab === 'wompi'" class="bg-surface-100 rounded-2xl border border-border-subtle p-6 space-y-6">
      <div class="flex items-center gap-3 mb-2">
        <div
          class="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <font-awesome-icon icon="credit-card" class="text-white" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-text-main">Pasarela Wompi</h3>
          <p class="text-sm text-text-muted">Llaves de integración para pagos en línea</p>
        </div>
      </div>

      <!-- Ambiente selector -->
      <div class="flex items-center gap-4 p-4 bg-surface-200 rounded-xl border border-border-subtle">
        <span class="text-sm font-medium text-text-main">Ambiente activo:</span>
        <div class="flex gap-2">
          <button @click="wompiForm.ambiente = 'sandbox'"
            :class="['px-4 py-1.5 rounded-lg text-sm font-medium transition-all', wompiForm.ambiente === 'sandbox' ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30' : 'text-text-muted hover:bg-surface-100']">Sandbox</button>
          <button @click="wompiForm.ambiente = 'produccion'"
            :class="['px-4 py-1.5 rounded-lg text-sm font-medium transition-all', wompiForm.ambiente === 'produccion' ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30' : 'text-text-muted hover:bg-surface-100']">Producción</button>
        </div>
      </div>

      <!-- Keys -->
      <div class="grid grid-cols-1 gap-4">
        <div v-for="(label, key) in wompiKeyLabels" :key="key" class="space-y-1.5">
          <label class="block text-sm font-medium text-text-main">{{ label }}</label>
          <div class="flex gap-2">
            <input v-model="wompiForm[key]" :type="showWompiKeys[key] ? 'text' : 'password'"
              class="flex-1 px-4 py-2.5 bg-surface-200 border border-border-subtle rounded-xl text-text-main text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              :placeholder="'Ingrese ' + label.toLowerCase()" />
            <button @click="toggleShowKey(key)"
              class="px-3 py-2.5 bg-surface-200 border border-border-subtle rounded-xl text-text-muted hover:text-text-main transition-colors">
              <font-awesome-icon :icon="showWompiKeys[key] ? 'eye-slash' : 'eye'" />
            </button>
          </div>
        </div>
      </div>

      <button @click="saveWompi"
        class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-primary-500/25">
        <font-awesome-icon icon="floppy-disk" class="mr-2" />Guardar Llaves Wompi
      </button>
    </div>

    <!-- MÓDULOS TAB (DINÁMICO) -->
    <div v-if="activeTab === 'modulos'" class="bg-surface-100 rounded-2xl border border-border-subtle p-6 space-y-8">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
          <font-awesome-icon icon="boxes-stacked" class="text-white" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-text-main">Módulos y Parámetros</h3>
          <p class="text-sm text-text-muted">Control granular de funcionalidades del sistema</p>
        </div>
      </div>

      <div v-for="(configs, sectionName) in sections" :key="sectionName" class="space-y-4">
        <h4 class="text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle pb-2 capitalize">
          Sección: {{ sectionName }}
        </h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="cfg in configs" :key="cfg.id" 
            class="flex items-center justify-between p-4 bg-surface-200 rounded-xl border border-border-subtle hover:border-primary-500/30 transition-all group">
            <div class="flex-1 mr-4">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-text-main">{{ cfg.etiqueta }}</p>
                <div v-if="cfg.habilitado" class="w-1.5 h-1.5 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
              </div>
              <p class="text-xs text-text-muted">{{ cfg.descripcion }}</p>
              
              <!-- Control de Valor (si no es booleano puro) -->
              <div v-if="cfg.tipo_control === 'text' || cfg.tipo_control === 'number'" class="mt-2">
                <div class="flex gap-2">
                  <input v-model="cfg.valor_configuracion" :type="cfg.tipo_control"
                    @change="saveDynamicConfig(cfg)"
                    class="flex-1 px-3 py-1.5 bg-surface-100 border border-border-subtle rounded-lg text-sm text-text-main focus:ring-1 focus:ring-primary-500 outline-none" />
                </div>
              </div>
            </div>

            <!-- Control Switch Principal (Habilitado/Deshabilitado) -->
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="cfg.habilitado" @change="saveDynamicConfig(cfg)" class="sr-only peer">
              <div class="w-11 h-6 bg-surface-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 border border-border-subtle">
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- ROLES TAB -->
    <div v-if="activeTab === 'roles'" class="bg-surface-100 rounded-2xl border border-border-subtle p-6 space-y-6">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-xl bg-linear-to-br from-orange-500 to-red-600 flex items-center justify-center">
          <font-awesome-icon icon="user-shield" class="text-white" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-text-main">Configuraciones por Rol</h3>
          <p class="text-sm text-text-muted">Permisos y parámetros específicos de cada rol</p>
        </div>
      </div>

      <!-- Rol selector -->
      <div class="flex flex-wrap gap-2">
        <button v-for="rol in roles" :key="rol" @click="selectedRol = rol"
          :class="['px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all', selectedRol === rol ? 'bg-primary-600 text-white shadow-lg' : 'bg-surface-200 text-text-muted hover:text-text-main border border-border-subtle']">{{
          rol }}</button>
      </div>

      <!-- Config list -->
      <div class="space-y-2">
        <div v-for="cfg in rolConfigs" :key="cfg.id"
          class="flex items-center gap-3 p-3 bg-surface-200 rounded-xl border border-border-subtle">
          <div class="flex-1">
            <span class="text-sm font-mono text-text-main">{{ cfg.clave }}</span>
          </div>
          <span class="text-sm text-primary-400 font-medium">{{ cfg.valor }}</span>
          <button @click="deleteRolConfig(cfg.id)"
            class="p-1.5 text-text-muted hover:text-danger-400 transition-colors">
            <font-awesome-icon icon="trash" class="text-xs" />
          </button>
        </div>
        <p v-if="rolConfigs.length === 0" class="text-sm text-text-muted text-center py-4">No hay configuraciones para
          este rol</p>
      </div>

      <!-- Add new -->
      <div class="flex gap-2">
        <input v-model="newRolConfig.clave" type="text" placeholder="Clave"
          class="flex-1 px-3 py-2 bg-surface-200 border border-border-subtle rounded-lg text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
        <input v-model="newRolConfig.valor" type="text" placeholder="Valor"
          class="w-32 px-3 py-2 bg-surface-200 border border-border-subtle rounded-lg text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
        <button @click="addRolConfig"
          class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors">
          <font-awesome-icon icon="plus" />
        </button>
      </div>
    </div>

    <!-- USUARIOS CONFIG TAB -->
    <div v-if="activeTab === 'usuarios_config'"
      class="bg-surface-100 rounded-2xl border border-border-subtle p-6 space-y-6">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-xl bg-linear-to-br from-pink-500 to-rose-600 flex items-center justify-center">
          <font-awesome-icon icon="users" class="text-white" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-text-main">Configuraciones por Usuario</h3>
          <p class="text-sm text-text-muted">Parámetros específicos por usuario individual</p>
        </div>
      </div>

      <div class="space-y-4">
        <div class="space-y-2">
          <label class="block text-sm font-medium text-text-main">ID del Usuario</label>
          <input v-model.number="selectedUsuarioId" type="number" min="1" placeholder="Ingrese el ID del usuario"
            class="w-full max-w-xs px-4 py-2.5 bg-surface-200 border border-border-subtle rounded-xl text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
        </div>

        <div v-if="selectedUsuarioId" class="space-y-2">
          <div v-for="cfg in usuarioConfigs" :key="cfg.id"
            class="flex items-center gap-3 p-3 bg-surface-200 rounded-xl border border-border-subtle">
            <span class="flex-1 text-sm font-mono text-text-main">{{ cfg.clave }}</span>
            <span class="text-sm text-primary-400 font-medium">{{ cfg.valor }}</span>
            <button @click="deleteUsuarioConfig(cfg.id)"
              class="p-1.5 text-text-muted hover:text-danger-400 transition-colors">
              <font-awesome-icon icon="trash" class="text-xs" />
            </button>
          </div>
          <p v-if="usuarioConfigs.length === 0" class="text-sm text-text-muted text-center py-4">No hay configuraciones
            para este usuario</p>

          <div class="flex gap-2 pt-2">
            <input v-model="newUsuarioConfig.clave" type="text" placeholder="Clave"
              class="flex-1 px-3 py-2 bg-surface-200 border border-border-subtle rounded-lg text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
            <input v-model="newUsuarioConfig.valor" type="text" placeholder="Valor"
              class="w-32 px-3 py-2 bg-surface-200 border border-border-subtle rounded-lg text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
            <button @click="addUsuarioConfig"
              class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors">
              <font-awesome-icon icon="plus" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- FINANZAS TAB -->
    <div v-if="activeTab === 'finanzas'" class="bg-surface-100 rounded-2xl border border-border-subtle p-6 space-y-6">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-xl bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center">
          <font-awesome-icon icon="money-bill-wave" class="text-white" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-text-main">Políticas Financieras</h3>
          <p class="text-sm text-text-muted">Intereses, multas y configuraciones de pago</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-2">
          <label class="block text-sm font-medium text-text-main">Días de Gracia (Mensualidades)</label>
          <input v-model.number="finanzasForm.diasGraciaMes" type="number"
            class="w-full px-4 py-2.5 bg-surface-200 border border-border-subtle rounded-xl text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
          <p class="text-xs text-text-muted">Cantidad de días después del vencimiento sin generar mora.</p>
        </div>
        
        <div class="space-y-2">
          <label class="block text-sm font-medium text-text-main">% Interés por Mora</label>
          <div class="relative">
            <input v-model.number="finanzasForm.porcentajeMoraMes" type="number" step="0.1"
              class="w-full px-4 py-2.5 bg-surface-200 border border-border-subtle rounded-xl text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">%</span>
          </div>
          <p class="text-xs text-text-muted">Porcentaje aplicado sobre el saldo vencido al mes.</p>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-text-main">Valor Fijo Adicional por Mora ($)</label>
          <input v-model.number="finanzasForm.valorFijoMoraMes" type="number"
            class="w-full px-4 py-2.5 bg-surface-200 border border-border-subtle rounded-xl text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
          <p class="text-xs text-text-muted">Monto fijo cobrado además del porcentaje al entrar en mora.</p>
        </div>
      </div>

      <div class="p-4 bg-surface-50 border border-border-subtle rounded-xl mt-6">
         <h4 class="text-sm font-bold text-text-main mb-2">Consecutivos Actuales</h4>
         <div class="grid grid-cols-3 gap-4">
            <div>
               <p class="text-xs text-text-muted uppercase tracking-widest font-bold">Cargos</p>
               <p class="font-mono text-sm">CAR-{{finanzasForm.consecutivos?.cargos || 0}}</p>
            </div>
             <div>
               <p class="text-xs text-text-muted uppercase tracking-widest font-bold">Pagos</p>
               <p class="font-mono text-sm">PAG-{{finanzasForm.consecutivos?.pagos || 0}}</p>
            </div>
            <div>
               <p class="text-xs text-text-muted uppercase tracking-widest font-bold">Recibos</p>
               <p class="font-mono text-sm">REC-{{finanzasForm.consecutivos?.recibos || 0}}</p>
            </div>
         </div>
      </div>

      <button @click="saveFinanzas"
        class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-primary-500/25 mt-4">
        <font-awesome-icon icon="floppy-disk" class="mr-2" />Guardar Configuración
      </button>
    </div>
  </div>
</template>
