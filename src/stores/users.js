import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockUsers, mockUserPermissions } from '@/data/mockData'

export const useUsersStore = defineStore('users', () => {
  const users = ref([...mockUsers])
  const loading = ref(false)
  const error = ref(null)

  // --- Fetch Mock ---
  async function fetchUsers() {
    loading.value = true
    error.value = null
    try {
      // En modo mock, los datos ya están en users.value iniciados desde mockUsers
      // pero simulamos una recarga si fuera necesario
      // users.value = [...mockUsers]
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // --- Getters ---
  const getUserById = computed(() => (id) => users.value.find(u => u.id === id))
  const usersByRole = computed(() => (role) => users.value.filter(u => u.role === role))
  
  const activeUsers = computed(() => users.value.filter(u => u.status === 'activo'))

  // Role-based filtered lists
  const deportistas = computed(() => users.value.filter(u => u.role === 'deportista'))
  const profesores = computed(() => users.value.filter(u => u.role === 'profesor'))
  const administrativos = computed(() => users.value.filter(u => u.role === 'administrativo'))
  const supervisores = computed(() => users.value.filter(u => u.role === 'supervisor'))

  const getPermissionsByUserId = computed(() => (userId) => {
    return mockUserPermissions.filter(p => p.usuario_id === userId)
  })

  // --- Actions ---
  async function addUser(userForm) {
    const newUser = {
      ...userForm,
      id: Math.max(...users.value.map(u => u.id), 0) + 1,
      status: 'activo',
      avatar: userForm.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      createdAt: new Date().toISOString().split('T')[0]
    }
    users.value.push(newUser)
    return newUser
  }

  async function updateUser(id, data) {
    const idx = users.value.findIndex(u => u.id === id)
    if (idx !== -1) {
      users.value[idx] = { ...users.value[idx], ...data }
      return users.value[idx]
    }
  }

  async function deleteUser(id) {
    users.value = users.value.filter(u => u.id !== id)
  }

  async function updateUserTeamPosition(id, categoryId, positionId) {
    // Requires specific endpoint if we persist this in DB, placeholder till backend implements
    console.warn('updateUserTeamPosition needs a dedicated endpoint in DB')
    const idx = users.value.findIndex(u => u.id === id)
    if (idx !== -1) {
      users.value[idx].categoryId = categoryId
      users.value[idx].positionId = positionId
    }
  }

  return {
    users, loading, error,
    // Getters
    getUserById, usersByRole, activeUsers,
    deportistas, profesores, administrativos, supervisores,
    getPermissionsByUserId,
    // Actions
    fetchUsers, addUser, updateUser, deleteUser, updateUserTeamPosition
  }
})
