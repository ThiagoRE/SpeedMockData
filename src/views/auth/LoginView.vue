<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'
import Swal from 'sweetalert2'

import speedIcon from '@/assets/icon/Isotipo_Speed.ico'

const router = useRouter()
const auth = useAuthStore()
const configStore = useConfigStore()

const activeTab = ref('login') // 'login', 'register', or 'change-password'

// Login state
const email = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)

// Change Password state
const cpCurrent = ref('')
const cpNew = ref('')
const cpConfirm = ref('')
const cpLoading = ref(false)
const showCpCurrent = ref(false)
const showCpNew = ref(false)
const showCpConfirm = ref(false)

// Register state
const regForm = ref({
  name: '',
  document: '',
  email: '',
  phone: ''
})
const regLoading = ref(false)

// Config flags
const isPhotoRequired = computed(() => configStore.config.foto_obligatoria)
const showClinicalHistory = computed(() => configStore.config.mostrar_historia_clinica)
const showMedicalExams = computed(() => configStore.config.mostrar_examenes_medicos)

async function handleLogin() {
  if (!email.value || !password.value) {
    Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Ingresa correo o documento y contraseña', background: '#060606', color: '#FFFFFF', confirmButtonColor: '#86C232' })
    return
  }
  loading.value = true
  const result = await auth.login(email.value, password.value)
  loading.value = false

  if (result.success) {
    if (result.requiresPasswordChange) {
      await Swal.fire({ icon: 'info', title: 'Cambio de Contraseña', text: result.message, background: '#060606', color: '#FFFFFF' })
      cpCurrent.value = password.value
      activeTab.value = 'change-password'
    } else {
      await Swal.fire({ icon: 'success', title: '¡Bienvenido!', text: `Hola, ${auth.userName}`, timer: 1500, showConfirmButton: false, background: '#060606', color: '#FFFFFF' })
      router.push('/')
    }
  } else {
    Swal.fire({ icon: 'error', title: 'Error', text: result.message, background: '#060606', color: '#FFFFFF', confirmButtonColor: '#86C232' })
  }
}

async function handleChangePassword() {
  if (!cpCurrent.value || !cpNew.value || !cpConfirm.value) {
    Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Completa todos los campos', background: '#060606', color: '#FFFFFF', confirmButtonColor: '#86C232' })
    return
  }
  if (cpNew.value !== cpConfirm.value) {
    Swal.fire({ icon: 'error', title: 'Error', text: 'Las contraseñas nuevas no coinciden', background: '#060606', color: '#FFFFFF', confirmButtonColor: '#86C232' })
    return
  }

  cpLoading.value = true
  const result = await auth.changePassword(cpCurrent.value, cpNew.value)
  cpLoading.value = false

  if (result.success) {
    await Swal.fire({ icon: 'success', title: 'Contraseña actualizada', text: result.message, timer: 2000, showConfirmButton: false, background: '#060606', color: '#FFFFFF' })
    // Return to login to authenticate with new password
    activeTab.value = 'login'
    password.value = ''
    cpCurrent.value = ''
    cpNew.value = ''
    cpConfirm.value = ''
  } else {
    Swal.fire({ icon: 'error', title: 'Error', text: result.message, background: '#060606', color: '#FFFFFF', confirmButtonColor: '#86C232' })
  }
}

async function handleRegister() {
  if (!regForm.value.name || !regForm.value.document || !regForm.value.email || !regForm.value.phone) {
    Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Completa todos los campos básicos', background: '#060606', color: '#FFFFFF', confirmButtonColor: '#86C232' })
    return
  }
  
  if (isPhotoRequired.value) {
    const photoInput = document.getElementById('regProfilePhoto')
    if (!photoInput || !photoInput.files || photoInput.files.length === 0) {
       Swal.fire({ icon: 'warning', title: 'Foto requerida', text: 'La foto de perfil es obligatoria en la configuración actual', background: '#060606', color: '#FFFFFF', confirmButtonColor: '#86C232' })
       return
    }
  }

  regLoading.value = true

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regForm.value)
    })
    const data = await res.json()
    
    if (data.success) {
      await Swal.fire({ icon: 'success', title: '¡Registro exitoso!', text: data.message, timer: 2500, showConfirmButton: false, background: '#060606', color: '#FFFFFF' })
      regForm.value = { name: '', document: '', email: '', phone: '' }
      activeTab.value = 'login'
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: data.message, background: '#060606', color: '#FFFFFF', confirmButtonColor: '#86C232' })
    }
  } catch (err) {
    console.error(err)
    Swal.fire({ icon: 'error', title: 'Error de red', text: 'No se pudo conectar con el servidor', background: '#060606', color: '#FFFFFF', confirmButtonColor: '#86C232' })
  } finally {
    regLoading.value = false
  }
}

const demoAccounts = [
  { label: 'Admin', email: 'admin@club.com', pass: 'admin123' }
]

function fillDemo(account) {
  email.value = account.email
  password.value = account.pass
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900 flex items-center justify-center p-4 font-sans">
    <!-- Animated bg elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-700/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s"></div>
    </div>

    <div class="relative w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-2xl shadow-primary-500/30 overflow-hidden">
          <img :src="speedIcon" class="w-12 h-12 object-contain" />
        </div>
        <h1 class="text-3xl font-bold text-white tracking-tight">Speed</h1>
        <p class="text-gray-400 text-sm mt-1">Gestión Deportiva Integral</p>
      </div>

      <!-- Card -->
      <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl max-h-[80vh] overflow-y-auto custom-scrollbar">
        
        <!-- Tabs (Ocultos si se fuerza cambio de password) -->
        <div v-if="activeTab !== 'change-password'" class="flex p-1 mb-6 bg-surface-200/50 rounded-xl border border-white/5">
          <button @click="activeTab = 'login'" :class="['flex-1 py-2 text-sm font-semibold rounded-lg transition-all', activeTab === 'login' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-400 hover:text-white']">Iniciar Sesión</button>
          <button @click="activeTab = 'register'" :class="['flex-1 py-2 text-sm font-semibold rounded-lg transition-all', activeTab === 'register' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-400 hover:text-white']">Registrarse</button>
        </div>
        
        <!-- Header Cambio de Pass -->
        <div v-else class="mb-6 text-center">
          <h2 class="text-xl font-bold text-white mb-2">Seguridad de la Cuenta</h2>
          <p class="text-xs text-gray-400">Debes actualizar tu contraseña inicial (basada en tu documento) para continuar.</p>
        </div>

        <!-- LOGIN FORM -->
        <div v-show="activeTab === 'login'">
          <form @submit.prevent="handleLogin" class="space-y-5">
            <div>
              <label class="text-sm text-gray-400 block mb-1.5">Correo o Documento</label>
              <div class="relative">
                <font-awesome-icon icon="envelope" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                <input
                  v-model="email"
                  type="text"
                  placeholder="correo@club.com o Documento"
                  class="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label class="text-sm text-gray-400 block mb-1.5">Contraseña</label>
              <div class="relative">
                <font-awesome-icon icon="user-shield" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  class="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm"
                />
                <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  <font-awesome-icon :icon="showPassword ? 'eye-slash' : 'eye'" class="text-sm" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              <font-awesome-icon v-if="loading" icon="spinner" class="animate-spin mr-2" />
              {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
            </button>
          </form>
        </div>

        <!-- CHANGE PASSWORD FORM -->
        <div v-if="activeTab === 'change-password'">
          <form @submit.prevent="handleChangePassword" class="space-y-5">
            <div>
              <label class="text-sm text-gray-400 block mb-1.5">Contraseña Actual (Documento)</label>
              <div class="relative">
                <input v-model="cpCurrent" :type="showCpCurrent ? 'text' : 'password'" disabled class="w-full bg-white/10 border border-white/5 rounded-xl px-4 pr-12 py-3 text-gray-400 cursor-not-allowed text-sm" />
              </div>
            </div>

            <div>
              <label class="text-sm text-gray-400 block mb-1.5">Nueva Contraseña</label>
              <div class="relative">
                <input v-model="cpNew" :type="showCpNew ? 'text' : 'password'" placeholder="••••••••" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 pr-12 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all text-sm" />
                <button type="button" @click="showCpNew = !showCpNew" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  <font-awesome-icon :icon="showCpNew ? 'eye-slash' : 'eye'" class="text-sm" />
                </button>
              </div>
            </div>

            <div>
              <label class="text-sm text-gray-400 block mb-1.5">Confirmar Nueva Contraseña</label>
              <div class="relative">
                <input v-model="cpConfirm" :type="showCpConfirm ? 'text' : 'password'" placeholder="••••••••" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 pr-12 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all text-sm" />
                <button type="button" @click="showCpConfirm = !showCpConfirm" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  <font-awesome-icon :icon="showCpConfirm ? 'eye-slash' : 'eye'" class="text-sm" />
                </button>
              </div>
            </div>

            <div class="flex gap-3 pt-2">
              <button type="button" @click="auth.logout(); activeTab = 'login'" class="w-1/3 py-3 rounded-xl border border-white/10 text-white font-semibold hover:bg-white/5 transition-all text-sm">
                Cancelar
              </button>
              <button type="submit" :disabled="cpLoading" class="w-2/3 py-3 rounded-xl bg-gradient-to-r from-accent-600 to-accent-500 text-white font-semibold transition-all duration-300 hover:shadow-lg disabled:opacity-50">
                <font-awesome-icon v-if="cpLoading" icon="spinner" class="animate-spin mr-2" />
                {{ cpLoading ? 'Actualizando...' : 'Guardar y Entrar' }}
              </button>
            </div>
          </form>
        </div>

        <!-- REGISTER FORM -->
        <div v-show="activeTab === 'register'">
          <form @submit.prevent="handleRegister" class="space-y-4">
            <div class="space-y-1">
              <label class="text-xs text-gray-400 block">Nombre Completo <span class="text-danger-500">*</span></label>
              <input v-model="regForm.name" type="text" placeholder="Ej. Juan Pérez" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm" />
            </div>

            <div class="grid grid-cols-2 gap-3">
               <div class="space-y-1">
                 <label class="text-xs text-gray-400 block">Documento <span class="text-danger-500">*</span></label>
                 <input v-model="regForm.document" type="text" placeholder="No. Identificación" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm" />
                 <p class="text-[10px] text-primary-400 mt-1">Este será tu acceso inicial</p>
               </div>
               <div class="space-y-1">
                 <label class="text-xs text-gray-400 block">Teléfono <span class="text-danger-500">*</span></label>
                 <input v-model="regForm.phone" type="tel" placeholder="Número celular" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm" />
               </div>
            </div>

            <div class="space-y-1">
              <label class="text-xs text-gray-400 block">Correo electrónico <span class="text-danger-500">*</span></label>
              <input v-model="regForm.email" type="email" placeholder="correo@ejemplo.com" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm" />
            </div>

            <div class="pt-2 border-t border-white/10 space-y-3">
               <div class="space-y-1">
                 <label class="text-xs text-gray-400 block flex justify-between">
                   <span>Foto de Perfil <span v-if="isPhotoRequired" class="text-danger-500">*</span></span>
                   <span class="text-[10px] text-gray-500">Imágenes (JPG, PNG)</span>
                 </label>
                 <input id="regProfilePhoto" type="file" accept="image/*" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700 text-xs" />
               </div>

               <div v-if="showClinicalHistory" class="space-y-1">
                 <label class="text-xs text-gray-400 block flex justify-between">
                   <span>Historia Clínica</span>
                   <span class="text-[10px] text-gray-500">PDF</span>
                 </label>
                 <input id="regClinicalHistory" type="file" accept=".pdf" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700 text-xs" />
               </div>

               <div v-if="showMedicalExams" class="space-y-1">
                 <label class="text-xs text-gray-400 block flex justify-between">
                   <span>Exámenes Médicos</span>
                   <span class="text-[10px] text-gray-500">PDF, Imágenes</span>
                 </label>
                 <input id="regMedicalExams" type="file" accept=".pdf,image/*" multiple class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700 text-xs" />
               </div>
            </div>

            <button
               type="submit"
               :disabled="regLoading"
               class="w-full py-3 mt-4 rounded-xl bg-gradient-to-r from-success-600 to-success-500 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-success-500/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
               <font-awesome-icon v-if="regLoading" icon="spinner" class="animate-spin mr-2" />
               {{ regLoading ? 'Registrando...' : 'Finalizar Registro' }}
            </button>
          </form>
        </div>

      </div>

      <p class="text-center text-gray-600 text-xs mt-6 pointer-events-none">© 2026 Speed — Todos los derechos reservados</p>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.2);
}
</style>
