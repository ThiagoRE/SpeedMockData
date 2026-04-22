<script setup>
import { computed, ref } from 'vue'
import { useSportsStore } from '@/stores/sports'
import { useUsersStore } from '@/stores/users'
import { useConfigStore } from '@/stores/config'

const sportsStore = useSportsStore()
const usersStore = useUsersStore()
const configStore = useConfigStore()

const filterSport = ref('')
const selectedAthleteId = ref(null)

const getMemberName = (id) => usersStore.users.find(m => m.id === id)?.name || `Deportista #${id}`

// All dimensions from config
const dimensions = computed(() => configStore.config.calificaciones.dimensiones)

const performanceTable = computed(() => {
  return sportsStore.performance.map(p => {
    const match = sportsStore.matches.find(m => m.id === p.matchId)
    const tournament = sportsStore.tournaments.find(t => t.id === match?.tournamentId)
    const sport = sportsStore.getSportById(tournament?.sportId)
    const team = sportsStore.getCategoryById(p.categoryId)
    return { ...p, match, tournament, sport, team, memberName: getMemberName(p.athleteId) }
  }).filter(p => !filterSport.value || p.sport?.id === Number(filterSport.value))
})

// Calculate ratings averages
const ratingsSummary = computed(() => {
  const result = {}

  sportsStore.attendance.forEach(att => {
    if (!att.ratings) return
    const athleteId = att.userId
    if (!result[athleteId]) {
      result[athleteId] = { athleteId, name: getMemberName(athleteId), counts: {}, sums: {}, avg: 0 }
      dimensions.value.forEach(d => {
        result[athleteId].sums[d] = 0
        result[athleteId].counts[d] = 0
      })
    }

    dimensions.value.forEach(d => {
      if (att.ratings[d] > 0) {
        result[athleteId].sums[d] += att.ratings[d]
        result[athleteId].counts[d]++
      }
    })
  })

  // Final average calculation
  return Object.values(result).map(res => {
    const dims = {}
    let totalSum = 0
    let totalCount = 0
    dimensions.value.forEach(d => {
      const avg = res.counts[d] > 0 ? (res.sums[d] / res.counts[d]) : 0
      dims[d] = avg
      totalSum += avg
      if (avg > 0) totalCount++
    })
    res.dimensions = dims
    res.overall = totalCount > 0 ? (totalSum / totalCount).toFixed(1) : '0.0'
    return res
  }).sort((a, b) => b.overall - a.overall)
})

// ApexCharts Options for Radar Chart
const chartOptions = computed(() => ({
  chart: {
    type: 'radar',
    toolbar: { show: false },
    dropShadow: { enabled: true, blur: 1, left: 1, top: 1 }
  },
  title: {
    text: selectedAthleteId.value ? `Perfil de ${getMemberName(selectedAthleteId.value)}` : 'Promedio Escuadra',
    align: 'center',
    style: { fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)' }
  },
  xaxis: {
    categories: dimensions.value.map(d => d.toUpperCase()),
    labels: { style: { colors: 'var(--text-muted)', fontSize: '9px', fontWeight: 700 } }
  },
  yaxis: { show: false, min: 0, max: 5 },
  colors: ['#3b82f6'],
  stroke: { width: 2 },
  fill: { opacity: 0.4 },
  markers: { size: 4, strokeWidth: 2, hover: { size: 7 } }
}))

const chartSeries = computed(() => {
  const athlete = ratingsSummary.value.find(r => r.athleteId === selectedAthleteId.value)
  const data = dimensions.value.map(d => {
    return athlete ? athlete.dimensions[d] : 0
  })

  return [{
    name: 'Puntaje',
    data: data
  }]
})

// Leaderboard by sport
const leaderboards = computed(() => {
  const byPlayer = {}
  sportsStore.performance.forEach(p => {
    const match = sportsStore.matches.find(m => m.id === p.matchId)
    const tournament = sportsStore.tournaments.find(t => t.id === match?.tournamentId)
    const sport = sportsStore.getSportById(tournament?.sportId)
    if (!sport) return
    const key = `${sport.id}-${p.athleteId}`
    if (!byPlayer[key]) {
      byPlayer[key] = { athleteId: p.athleteId, name: getMemberName(p.athleteId), sport, totalAnnotations: 0, totalAssists: 0, matches: 0 }
    }
    byPlayer[key].totalAnnotations += p.annotations
    byPlayer[key].totalAssists += p.assists
    byPlayer[key].matches++
  })
  const all = Object.values(byPlayer)
  const grouped = {}
  all.forEach(item => {
    if (!grouped[item.sport.name]) grouped[item.sport.name] = { sport: item.sport, players: [] }
    grouped[item.sport.name].players.push(item)
  })
  Object.values(grouped).forEach(g => g.players.sort((a, b) => b.totalAnnotations - a.totalAnnotations))
  return Object.values(grouped)
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-semibold text-text-main tracking-tighter">Rendimiento Deportivo</h1>
        <p class="text-sm text-text-muted mt-1 tracking-widest font-medium">Análisis multidimensional y estadísticas</p>
      </div>
      <div
        class="flex items-center gap-2 bg-surface-100 p-1 rounded-xl border border-border-subtle shadow-sm overflow-hidden">
        <font-awesome-icon icon="filter" class="ml-3 text-text-muted text-xs" />
        <select v-model="filterSport"
          class="pl-1 pr-8 py-2 rounded-lg border-none text-xs font-semibold tracking-wider focus:ring-0 outline-none bg-transparent text-text-main cursor-pointer">
          <option value="" class="bg-surface-100">Todos los Deportes</option>
          <option v-for="s in sportsStore.sports" :key="s.id" :value="s.id" class="bg-surface-100">{{ s.name }}</option>
        </select>
      </div>
    </div>

    <!-- Phase 6: Radar Chart & Skills Profile -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1 bg-surface-100 rounded-3xl border border-border-subtle shadow-sm overflow-hidden p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-sm font-bold text-text-main tracking-widest">Dimensiones Técnicas</h3>
          <font-awesome-icon icon="chart-pie" class="text-primary-500" />
        </div>

        <div v-if="selectedAthleteId || ratingsSummary.length > 0">
          <apexchart type="radar" height="320" :options="chartOptions" :series="chartSeries"></apexchart>
        </div>
        <div v-else class="h-64 flex flex-col items-center justify-center text-center opacity-40">
          <font-awesome-icon icon="star" class="text-3xl mb-4" />
          <p class="text-[10px] font-bold tracking-widest">Sin datos de evaluación</p>
        </div>
      </div>

      <div
        class="lg:col-span-2 bg-surface-100 rounded-3xl border border-border-subtle shadow-sm overflow-hidden flex flex-col">
        <div class="px-6 py-5 border-b border-border-subtle flex items-center justify-between bg-surface-200/50">
          <h3 class="text-sm font-bold text-text-main tracking-widest">Top Evolución Técnica</h3>
          <span class="text-[9px] font-bold px-2 py-1 bg-primary-500 text-white rounded-md tracking-tighter">Basado en
            Entrenamientos</span>
        </div>
        <div class="divide-y divide-border-subtle/50 max-h-[350px] overflow-y-auto custom-scrollbar">
          <div v-for="res in ratingsSummary" :key="res.athleteId" @click="selectedAthleteId = res.athleteId"
            class="flex items-center gap-4 px-6 py-4 hover:bg-primary-50 cursor-pointer transition-all group"
            :class="selectedAthleteId === res.athleteId ? 'bg-primary-50 border-l-4 border-primary-500' : ''">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-text-main tracking-tight">{{ res.name }}</p>
              <div class="flex gap-2 mt-1">
                <span v-for="(val, d) in res.dimensions" :key="d"
                  class="text-[8px] font-bold text-text-muted tracking-tighter">
                  {{ d.slice(0, 3) }}: <span class="text-primary-600">{{ val.toFixed(1) }}</span>
                </span>
              </div>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold text-primary-600 leading-none">{{ res.overall }}</p>
              <p class="text-[9px] text-text-muted tracking-widest font-bold">Puntaje Global</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Leaderboards -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div v-for="group in leaderboards" :key="group.sport.name"
        class="bg-surface-100 rounded-3xl border border-border-subtle shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md hover:border-border-main/20">
        <div class="px-6 py-5 border-b border-border-subtle flex items-center justify-between bg-surface-200/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
              :style="{ backgroundColor: group.sport.color + '15', color: group.sport.color }">
              <font-awesome-icon icon="trophy" class="text-lg" />
            </div>
            <div>
              <h3 class="font-semibold text-text-main tracking-tight">{{ group.sport.name }}</h3>
              <p class="text-[10px] text-text-muted tracking-widest font-semibold">Líderes de Goleo</p>
            </div>
          </div>
          <span
            class="text-[10px] font-semibold px-2 py-0.5 rounded-md border border-border-subtle bg-surface-100 text-text-muted tracking-tighter">Top
            {{ group.players.length }}</span>
        </div>
        <div class="divide-y divide-border-subtle/50">
          <div v-for="(player, idx) in group.players" :key="player.athleteId"
            class="flex items-center gap-4 px-6 py-4 hover:bg-surface-200/50 transition-all group">
            <div
              :class="['w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold transition-transform group-hover:scale-110 shadow-sm',
                idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-slate-400 text-white' : idx === 2 ? 'bg-orange-600 text-white' : 'bg-surface-200 text-text-muted']">
              {{ idx + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <p
                class="text-sm font-semibold text-text-main truncate group-hover:text-primary-500 transition-colors tracking-tight">
                {{ player.name }}</p>
              <p class="text-[10px] text-text-muted tracking-widest font-semibold">{{ player.matches }} encuentros</p>
            </div>
            <div class="text-right flex flex-col justify-center border-l border-border-subtle/50 pl-4">
              <p class="text-xl font-semibold leading-none mb-1" :style="{ color: group.sport.color }">{{
                player.totalAnnotations }}</p>
              <p class="text-[9px] text-text-muted tracking-widest font-semibold leading-none">{{
                group.sport.scoringUnit }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
