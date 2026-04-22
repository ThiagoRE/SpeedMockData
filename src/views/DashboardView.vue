<script setup>
import { computed } from 'vue'
import { dashboardStats, mockMatches, mockTournaments, mockSports, mockUsers } from '@/data/mockData'
import { useSportsStore } from '@/stores/sports'
import { useFinanceStore } from '@/stores/finance'

const sportsStore = useSportsStore()
const financeStore = useFinanceStore()

const stats = dashboardStats

const upcomingMatches = computed(() => {
  return mockMatches
    .filter(m => m.status === 'Programado' || m.status === 'En Curso')
    .slice(0, 5)
    .map(m => {
      const tournament = mockTournaments.find(t => t.id === m.tournamentId)
      const sport = mockSports.find(s => s.id === tournament?.sportId)
      const home = sportsStore.getCategoryById(m.homeCategoryId)
      const away = sportsStore.getCategoryById(m.awayCategoryId)
      return { ...m, tournament, sport, home, away }
    })
})

const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)

const maxRevenue = computed(() => Math.max(...stats.revenueBySport.map(r => r.amount)))

const recentMembers = computed(() => {
  return mockUsers.filter(u => u.role === 'estudiante' || u.role === 'familiar')
    .sort((a, b) => new Date(b.enrollmentDate) - new Date(a.enrollmentDate))
    .slice(0, 5)
})

const statusCards = [
  { label: 'Socios Activos', value: stats.activeMembers, icon: 'people-group', color: 'from-primary-500 to-primary-600', change: '+3' },
  { label: 'Deportes Activos', value: stats.totalSports, icon: 'futbol', color: 'from-green-500 to-green-600', change: null },
  { label: 'Ingresos del Mes', value: formatCurrency(stats.monthlyRevenue), icon: 'money-bill-wave', color: 'from-accent-500 to-accent-600', change: '+12%' },
  { label: 'Cargos Pendientes', value: formatCurrency(stats.pendingCharges), icon: 'circle-exclamation', color: 'from-warning-400 to-orange-500', change: '-5%' },
]
</script>

<template>
  <div class="space-y-6">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      <div
        v-for="(card, idx) in statusCards"
        :key="idx"
        class="bg-surface-100 rounded-2xl shadow-sm border border-border-subtle p-4 sm:p-5 hover:shadow-md transition-all duration-300"
      >
        <div class="flex items-center justify-between mb-3">
          <div :class="['w-11 h-11 rounded-xl bg-linear-to-br flex items-center justify-center', card.color]">
            <font-awesome-icon :icon="card.icon" class="text-white text-lg" />
          </div>
          <span
            v-if="card.change"
            :class="['text-xs font-semibold px-2 py-1 rounded-full',
              card.change.startsWith('+') ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400']"
          >
            {{ card.change }}
          </span>
        </div>
        <p class="text-xl sm:text-2xl font-bold text-text-main">{{ card.value }}</p>
        <p class="text-xs sm:text-sm text-text-muted mt-1">{{ card.label }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Revenue by Sport Chart -->
      <div class="lg:col-span-2 bg-surface-100 rounded-2xl shadow-sm border border-border-subtle p-5 sm:p-6 transition-colors duration-300">
        <h3 class="text-lg font-semibold text-text-main mb-6">Ingresos por Deporte</h3>
        <div class="space-y-4">
          <div v-for="item in stats.revenueBySport" :key="item.sport" class="flex items-center gap-4">
            <span class="w-20 sm:w-24 text-xs sm:text-sm text-text-muted text-right truncate">{{ item.sport }}</span>
            <div class="flex-1 bg-surface-50 rounded-full h-8 overflow-hidden">
              <div
                class="h-full rounded-full flex items-center justify-end pr-3 transition-all duration-700 ease-out"
                :style="{ width: `${(item.amount / maxRevenue) * 100}%`, backgroundColor: item.color }"
              >
                <span class="text-white text-xs font-semibold drop-shadow">{{ formatCurrency(item.amount) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Monthly Trend -->
        <div class="mt-8 pt-6 border-t border-border-subtle">
          <h4 class="text-sm font-semibold text-text-muted mb-4">Tendencia Mensual</h4>
          <div class="flex items-end gap-2 sm:gap-3 h-32">
            <div
              v-for="item in stats.revenueByMonth"
              :key="item.month"
              class="flex-1 flex flex-col items-center gap-1"
            >
              <span class="text-[8px] sm:text-[10px] text-text-muted">{{ formatCurrency(item.amount) }}</span>
              <div
                class="w-full rounded-t-lg bg-linear-to-t from-primary-600 to-primary-400 dark:from-primary-700 dark:to-primary-500 transition-all duration-500 hover:from-primary-500 hover:to-primary-300"
                :style="{ height: `${(item.amount / 2000000) * 100}%` }"
              ></div>
              <span class="text-[10px] sm:text-xs text-text-muted font-medium">{{ item.month }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right column -->
      <div class="space-y-6">
        <!-- Members by Sport -->
        <div class="bg-surface-100 rounded-2xl shadow-sm border border-border-subtle p-5 sm:p-6 transition-colors duration-300">
          <h3 class="text-lg font-semibold text-text-main mb-4">Miembros por Deporte</h3>
          <div class="space-y-3">
            <div v-for="item in stats.usersBySport" :key="item.sport" class="flex items-center justify-between">
              <span class="text-sm text-text-muted">{{ item.sport }}</span>
              <span class="text-sm font-bold text-text-main bg-surface-200 px-3 py-1 rounded-full">{{ item.count }}</span>
            </div>
          </div>
        </div>

        <!-- Recent Members -->
        <div class="bg-surface-100 rounded-2xl shadow-sm border border-border-subtle p-5 sm:p-6 transition-colors duration-300">
          <h3 class="text-lg font-semibold text-text-main mb-4">Inscripciones Recientes</h3>
          <div class="space-y-3">
            <div v-for="m in recentMembers" :key="m.id" class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-linear-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {{ m.name.split(' ').map(n => n[0]).join('').slice(0,2) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-text-main truncate">{{ m.name }}</p>
                <p class="text-xs text-text-muted">{{ m.enrollmentDate }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upcoming Matches -->
    <div class="bg-surface-100 rounded-2xl shadow-sm border border-border-subtle p-5 sm:p-6 transition-colors duration-300">
      <h3 class="text-lg font-semibold text-text-main mb-4">
        <font-awesome-icon icon="calendar-days" class="text-primary-500 mr-2" />
        Próximos Eventos
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div
          v-for="match in upcomingMatches"
          :key="match.id"
          class="border border-border-subtle rounded-xl p-4 hover:shadow-md transition-all duration-300 bg-linear-to-br from-surface-50 to-surface-100 dark:from-surface-100 dark:to-surface-200"
        >
          <div class="flex items-center gap-2 mb-3">
            <span
              :class="['text-[10px] font-semibold px-2 py-0.5 rounded-full text-white', match.status === 'En Curso' ? 'bg-green-500 animate-pulse' : 'bg-blue-500 dark:bg-blue-600']"
            >
              {{ match.status }}
            </span>
            <span class="text-xs text-text-muted">{{ match.sport?.name }}</span>
          </div>
          <div class="text-center">
            <p class="font-semibold text-text-main text-sm">{{ match.home?.name }}</p>
            <p class="text-xs text-text-muted my-1">VS</p>
            <p class="font-semibold text-text-main text-sm">{{ match.away?.name }}</p>
          </div>
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-border-subtle text-[10px] sm:text-xs text-text-muted">
            <span><font-awesome-icon icon="calendar" class="mr-1" />{{ match.date }}</span>
            <span><font-awesome-icon icon="clock" class="mr-1" />{{ match.time }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
