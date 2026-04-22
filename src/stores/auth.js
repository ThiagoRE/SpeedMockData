import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockUsers, mockUserPermissions } from '@/data/mockData'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('auth_user')) || null)
  const token = ref(localStorage.getItem('auth_token') || null)
  const userPermissions = ref(JSON.parse(localStorage.getItem('auth_permissions')) || [])
  const requiresPasswordChange = ref(false)
  const tempUserId = ref(null)

  const isAuthenticated = computed(() => !!user.value && !!token.value && !requiresPasswordChange.value)
  const userRole = computed(() => user.value?.role || null)
  const userName = computed(() => user.value?.name || '')
  const userAvatar = computed(() => user.value?.avatar || '')
  const userProfileImage = computed(() => user.value?.profileImage || null)

  async function login(identificador, contrasena) {
    // Simulamos un delay de red
    await new Promise(resolve => setTimeout(resolve, 500))

    try {
      // Buscar usuario por correo o número de documento
      const foundUser = mockUsers.find(u => 
        (u.email === identificador || u.documentNumber === identificador) && 
        (u.password === contrasena || u.documentNumber === contrasena)
      )

      if (!foundUser) {
        return { success: false, message: 'Credenciales inválidas (Modo Mock)' }
      }

      // En modo mock, no forzamos cambio de contraseña a menos que queramos probarlo
      requiresPasswordChange.value = false
      tempUserId.value = null
      
      const mappedUser = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
        status: foundUser.status,
        avatar: foundUser.avatar,
        profileImage: foundUser.profileImage,
        documentNumber: foundUser.documentNumber,
        phone: foundUser.phone
      }

      user.value = mappedUser
      token.value = 'mock-jwt-token-' + Math.random().toString(36).substring(7)
      
      // Cargar permisos desde mockUserPermissions
      const permissions = mockUserPermissions.filter(p => p.usuario_id === foundUser.id)
      userPermissions.value = permissions

      localStorage.setItem('auth_user', JSON.stringify(mappedUser))
      localStorage.setItem('auth_token', token.value)
      localStorage.setItem('auth_permissions', JSON.stringify(permissions))

      // Inicializar configuraciones
      const configStore = (await import('./config')).useConfigStore()
      await configStore.init()

      return { success: true }
    } catch (err) {
      console.error('Error in login (Mock):', err)
      return { success: false, message: 'Error en el sistema mock.' }
    }
  }

  async function changePassword(currentPassword, newPassword) {
    if (!tempUserId.value) return { success: false, message: 'Falta contexto de usuario.' }
    try {
       const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/change-password`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ userId: tempUserId.value, currentPassword, newPassword })
       })
       const data = await res.json()
       if(data.success) {
          requiresPasswordChange.value = false
          tempUserId.value = null
       }
       return data
    } catch (err) {
       console.error('Error in changePassword:', err)
       return { success: false, message: 'Error de conexión.' }
    }
  }

  function logout() {
    user.value = null
    token.value = null
    userPermissions.value = []
    requiresPasswordChange.value = false
    tempUserId.value = null
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_permissions')
  }

  function hasPermission(sportId, action) {
    if (!user.value) return false
    if (user.value.role === 'administrativo') return true
    if (user.value.role === 'supervisor' && action === 'read') return true
    
    // DB raw actions: "lectura", "escritura", "eliminacion", "ver_reportes_financieros"
    let dbAction = action
    if (action === 'read') dbAction = 'lectura'
    if (action === 'write') dbAction = 'escritura'
    if (action === 'delete') dbAction = 'eliminacion'

    // userPermissions is an array of objects: { usuario_id, deporte_id, accion }
    const hasPerm = userPermissions.value.some(p => 
      (p.deporte_id === sportId || p.deporte_id === null) && p.accion === dbAction
    )
    if (hasPerm) return true

    return (user.value.role === 'deportista' || user.value.role === 'familiar') && action === 'read'
  }

  return {
    user, token, isAuthenticated, userRole, userName, userAvatar, userProfileImage, requiresPasswordChange, tempUserId,
    login, logout, hasPermission, changePassword
  }
})
