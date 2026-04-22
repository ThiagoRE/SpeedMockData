<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'
import { navGroups } from '@/router/index'
import { useTheme } from '@/composables/useTheme'
import Swal from 'sweetalert2'

import speedIcon from '@/assets/icon/Isotipo_Speed.ico'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const configStore = useConfigStore()
const sidebarOpen = ref(true)
const mobileSidebarOpen = ref(false)
const { theme, toggleTheme } = useTheme()

// Initialize config store (apply branding and administrative configs if needed)
onMounted(async () => {
  if (['administrativo', 'supervisor'].includes(auth.userRole)) {
    await configStore.fetchAdminConfigs()
  }
})

const filteredNavGroups = computed(() => {
  return navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.name === 'Reports' && auth.user?.canViewFinancialReports) {
         return true
      }
      if (!item.meta?.roles) return true
      return item.meta.roles.includes(auth.userRole)
    })
  })).filter(group => group.items.length > 0)
})

const isActive = (routeName) => route.name === routeName

async function handleLogout() {
  const result = await Swal.fire({
    title: '¿Cerrar sesión?',
    text: 'Tu sesión actual se cerrará',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, salir',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#86C232',
    cancelButtonColor: '#6b7280',
    background: '#060606',
    color: '#FFFFFF',
  })
  if (result.isConfirmed) {
    auth.logout()
    router.push('/login')
  }
}

const roleLabels = { administrativo: 'Administrador', supervisor: 'Supervisor', profesor: 'Profesor', estudiante: 'Estudiante', familiar: 'Familiar' }
const roleColors = { administrativo: 'bg-purple-500', supervisor: 'bg-amber-500', profesor: 'bg-blue-500', estudiante: 'bg-green-500', familiar: 'bg-rose-500' }
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-surface-200 transition-colors duration-300 font-sans">
    <!-- Mobile Overlay -->
    <div v-if="mobileSidebarOpen" class="fixed inset-0 bg-black/50 z-40 lg:hidden" @click="mobileSidebarOpen = false">
    </div>

    <!-- Sidebar -->
    <aside
      class="fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-linear-to-b from-surface-100 to-surface-50 dark:from-surface-100 dark:to-surface-50 border-r border-border-subtle shadow-2xl transition-all duration-300 ease-in-out"
      :class="[
        sidebarOpen ? 'w-72' : 'w-20',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]">
      <!-- Logo -->
      <div class="flex items-center gap-3 px-5 py-5 border-b border-border-subtle/10">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg overflow-hidden"
          :style="{ background: `linear-gradient(135deg, ${configStore.branding.colorPrimario}, ${configStore.branding.colorSecundario})` }">
          <img :src="configStore.branding.logo || speedIcon" class="w-7 h-7 object-contain" />
        </div>
        <div v-if="sidebarOpen" class="overflow-hidden">
          <h1 class="text-sm font-bold tracking-wide truncate text-text-main">
            {{ configStore.branding.nombre || "Speed" }}
          </h1>
          <p class="text-[10px] text-text-muted truncate">Gestión Deportiva</p>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-5 custom-scrollbar">
        <div v-for="group in filteredNavGroups" :key="group.title">
          <p v-if="sidebarOpen" class="text-[10px] font-semibold tracking-wider text-gray-500 px-3 mb-2">
            {{ group.title }}
          </p>
          <div v-else class="border-t border-white/5 mb-2"></div>

          <router-link v-for="item in group.items" :key="item.name" :to="item.path" :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group mb-0.5',
            isActive(item.name)
              ? 'bg-primary-600/20 text-primary-500 shadow-sm shadow-primary-500/10 font-medium'
              : 'text-text-muted hover:bg-surface-200 dark:hover:bg-white/5 hover:text-text-main'
          ]" @click="mobileSidebarOpen = false">
            <font-awesome-icon :icon="item.meta.icon" :class="[
              'w-5 text-center shrink-0 transition-colors',
              isActive(item.name) ? 'text-primary-500' : 'text-text-muted group-hover:text-text-main',
            ]" />
            <span v-if="sidebarOpen" class="truncate">{{ item.meta.label }}</span>
          </router-link>
        </div>
      </nav>

      <!-- User section -->
      <div class="border-t border-white/10 p-4">
        <div class="flex items-center gap-3">
          <div
            class="w-9 h-9 rounded-full bg-linear-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden border border-white/20 shadow-sm">
            <img v-if="auth.userProfileImage" :src="auth.userProfileImage" class="w-full h-full object-cover">
            <span v-else>{{ auth.userAvatar }}</span>
          </div>
          <div v-if="sidebarOpen" class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ auth.userName }}</p>
            <span :class="['text-[10px] px-2 py-0.5 rounded-full text-white', roleColors[auth.userRole]]">
              {{ roleLabels[auth.userRole] }}
            </span>
          </div>
          <button @click="handleLogout"
            class="ml-auto p-2 text-text-muted hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-xl transition-all shrink-0"
            title="Cerrar Sesión">
            <font-awesome-icon icon="right-from-bracket" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header
        class="bg-surface-100 border-b border-border-subtle px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 shadow-sm transition-colors duration-300">
        <div class="flex items-center gap-4">
          <button @click="sidebarOpen = !sidebarOpen"
            class="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg hover:bg-surface-200 text-text-muted transition-colors font-bold">
            <font-awesome-icon icon="bars" />
          </button>
          <button @click="mobileSidebarOpen = true"
            class="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-surface-200 text-text-muted transition-colors font-bold">
            <font-awesome-icon icon="bars" />
          </button>
          <div
            class="shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-500 shadow-lg shadow-primary-500/30 ring-4 ring-primary-500/10">
            <font-awesome-icon icon="bolt-lightning" class="text-white text-xl" />
          </div>
          <div>
            <h2 class="text-base sm:text-lg font-semibold text-text-main line-clamp-1">{{ route.meta?.label ||
              route.name }}</h2>
          </div>
        </div>
        <div class="flex items-center gap-2 sm:gap-4">
          <button @click="toggleTheme"
            class="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-surface-200 text-text-muted transition-colors"
            :title="theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'">
            <font-awesome-icon :icon="theme === 'dark' ? 'sun' : 'moon'" />
          </button>
          <span class="text-sm text-text-muted hidden md:inline">
            {{ new Date().toLocaleDateString('es-CO', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            }) }}
          </span>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 bg-surface-50 transition-colors duration-300">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}
</style>
