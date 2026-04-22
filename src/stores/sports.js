import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  mockSports, mockTournaments, mockMatches, mockCategories, mockPerformance,
  mockLineups, mockMatchTactics, mockConvocatorias, mockSedes,
  mockMatchPlayerPositions, mockMatchDrawings, mockTrainings, mockAttendance
} from '@/data/mockData'

export const useSportsStore = defineStore('sports', () => {
  const sports = ref([...mockSports])
  const tournaments = ref([...mockTournaments])
  const matches = ref([...mockMatches])
  const categories = ref([...mockCategories])
  const performance = ref([...mockPerformance])
  const sedes = ref([...mockSedes])
  const lineups = ref([...mockLineups])
  const matchTactics = ref([...mockMatchTactics])
  const convocatorias = ref([...mockConvocatorias])
  const matchPlayerPositions = ref([...mockMatchPlayerPositions])
  const matchDrawings = ref([...mockMatchDrawings])
  const trainings = ref([...mockTrainings])
  const attendance = ref([...mockAttendance])

  // --- Mock Actions: Sedes ---
  async function fetchSedes() {
    // Ya inicializado desde mockSedes
  }

  async function addSede(payload) {
    const newSede = {
      ...payload,
      id: Math.max(...sedes.value.map(s => s.id), 0) + 1,
      courts: payload.courts || [],
      tarifasMatricula: payload.tarifasMatricula || {
        tarifaInscripcion: 0,
        tarifaRenovacion: 0,
        tarifaMensual: 0,
        productosIncluidos: []
      }
    }
    sedes.value.push(newSede)
    return { success: true, data: newSede }
  }

  async function updateSede(id, payload) {
    const idx = sedes.value.findIndex(s => s.id === id)
    if (idx !== -1) {
      sedes.value[idx] = { ...sedes.value[idx], ...payload }
      return { success: true, data: sedes.value[idx] }
    }
    return { success: false }
  }

  const getSportById = computed(() => (id) => sports.value.find(s => s.id === id))
  const getTournamentsBySport = computed(() => (sportId) => tournaments.value.filter(t => t.sportId === sportId))
  const getMatchesByTournament = computed(() => (tournamentId) => matches.value.filter(m => m.tournamentId === tournamentId))
  const getCategoryById = computed(() => (id) => categories.value.find(t => t.id === id))
  const getSedeById = computed(() => (id) => sedes.value.find(s => s.id === id))
  const getLineupById = computed(() => (id) => lineups.value.find(l => l.id === id))

  const getStandings = computed(() => (tournamentId) => {
    const tournament = tournaments.value.find(t => t.id === tournamentId)
    if (!tournament) return []

    const sport = sports.value.find(s => s.id === tournament.sportId)
    const pointsConfig = sport?.scoringConfig || { win: 3, draw: 1, loss: 0 }
    
    const tournamentMatches = matches.value.filter(m => m.tournamentId === tournamentId && m.status === 'Validado')
    const standingsMap = {}

    // Find all teams involved in this tournament
    const tournamentCategories = categories.value.filter(t => t.tournamentId === tournamentId)
    
    // Fallback if teams aren't linked via tournamentId yet
    const categoryIdsFromMatches = new Set()
    tournamentMatches.forEach(m => {
      categoryIdsFromMatches.add(m.homeCategoryId)
      categoryIdsFromMatches.add(m.awayCategoryId)
    })

    const finalCategoryIds = tournamentCategories.length > 0 ? tournamentCategories.map(t => t.id) : Array.from(categoryIdsFromMatches)

    finalCategoryIds.forEach(id => {
      standingsMap[id] = {
        categoryId: id,
        pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0,
        recent: []
      }
    })

    tournamentMatches.forEach(m => {
      const home = standingsMap[m.homeCategoryId]
      const away = standingsMap[m.awayCategoryId]
      if (!home || !away) return

      home.pj++
      away.pj++
      home.gf += m.homeScore
      home.gc += m.awayScore
      away.gf += m.awayScore
      away.gc += m.homeScore

      if (m.homeScore > m.awayScore) {
        home.pg++
        home.pts += pointsConfig.win
        home.recent.push('W')
        away.pp++
        away.pts += pointsConfig.loss
        away.recent.push('L')
      } else if (m.homeScore < m.awayScore) {
        away.pg++
        away.pts += pointsConfig.win
        away.recent.push('W')
        home.pp++
        home.pts += pointsConfig.loss
        home.recent.push('L')
      } else {
        home.pe++
        home.pts += pointsConfig.draw
        home.recent.push('D')
        away.pe++
        away.pts += pointsConfig.draw
        away.recent.push('D')
      }
    })

    return Object.values(standingsMap).map(s => ({
      ...s,
      dg: s.gf - s.gc,
      recent: s.recent.slice(-5)
    })).sort((a, b) => {
      // 1. Points
      if (b.pts !== a.pts) return b.pts - a.pts
      
      // 2. Head to Head (Simulation based on DG if multiple tie-breakers aren't fully tracked)
      // but let's implement true Tie-Breaker Config
      if (tournament.tieBreaker === 'goalDifference') {
        if (b.dg !== a.dg) return b.dg - a.dg
        return b.gf - a.gf
      }
      
      if (tournament.tieBreaker === 'headToHead') {
        // Ideally we search for the specific match between A and B
        // For now, let's stick to DG -> GF as secondary
        if (b.dg !== a.dg) return b.dg - a.dg
        return b.gf - a.gf
      }

      // Default: Points -> DG -> GF
      if (b.dg !== a.dg) return b.dg - a.dg
      return b.gf - a.gf
    })
  })

  const getTopScorers = computed(() => (tournamentId) => {
    const tournamentMatches = matches.value.filter(m => m.tournamentId === tournamentId && m.status === 'Validado')
    const scorerMap = {}

    tournamentMatches.forEach(m => {
      if (m.matchStats) {
        m.matchStats.forEach(stat => {
          if (stat.goals > 0) {
            if (!scorerMap[stat.playerId]) scorerMap[stat.playerId] = 0
            scorerMap[stat.playerId] += stat.goals
          }
        })
      }
    })

    return Object.entries(scorerMap)
      .map(([playerId, goals]) => ({ playerId: Number(playerId), goals }))
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5)
  })

  // NEW: Get all tactics for a specific match+team combo
  const getTacticsByMatchCategory = computed(() => (matchId, categoryId) => {
    return matchTactics.value.filter(mt => mt.matchId === matchId && mt.categoryId === categoryId)
  })

  // NEW: Get a single tactic by its ID (assembled with positions + drawings)
  const getTacticById = computed(() => (tacticId) => {
    const tactic = matchTactics.value.find(mt => mt.id === tacticId)
    if (!tactic) return null

    return {
      ...tactic,
      playerPositions: matchPlayerPositions.value
        .filter(pp => pp.matchTacticId === tactic.id)
        .map(pp => ({
          athleteId: pp.athleteId,
          positionId: pp.positionId,
          offset: { x: pp.offsetX, y: pp.offsetY }
        })),
      drawings: matchDrawings.value.filter(md => md.matchTacticId === tactic.id)
    }
  })

  // LEGACY: kept for backward compatibility, returns first tactic found
  const getMatchTactic = computed(() => (matchId, categoryId) => {
    const tactic = matchTactics.value.find(mt => mt.matchId === matchId && mt.categoryId === categoryId)
    if (!tactic) return null

    return {
      ...tactic,
      playerPositions: matchPlayerPositions.value
        .filter(pp => pp.matchTacticId === tactic.id)
        .map(pp => ({
          athleteId: pp.athleteId,
          positionId: pp.positionId,
          offset: { x: pp.offsetX, y: pp.offsetY }
        })),
      drawings: matchDrawings.value.filter(md => md.matchTacticId === tactic.id)
    }
  })

  const getConvocadosByTournament = computed(() => (tournamentId) => convocatorias.value.filter(c => c.tournamentId === tournamentId))
  const getConvocadosByCategory = computed(() => (tournamentId, categoryId) => convocatorias.value.filter(c => c.tournamentId === tournamentId && c.categoryId === categoryId))

  // ─── Sports CRUD ────────────────────────────────────────
  async function fetchSports() {
    // Ya inicializado
  }

  async function addSport(sportForm) {
    const newSport = {
      ...sportForm,
      id: Math.max(...sports.value.map(s => s.id), 0) + 1
    }
    sports.value.push(newSport)
    return newSport
  }

  async function updateSport(id, data) {
    const idx = sports.value.findIndex(s => s.id === id)
    if (idx !== -1) {
      sports.value[idx] = { ...sports.value[idx], ...data }
      return sports.value[idx]
    }
  }

  async function deleteSport(id) {
    sports.value = sports.value.filter(s => s.id !== id)
  }

  // ─── Tournaments CRUD ───────────────────────────────────
  async function fetchTournaments() {
    // Ya inicializado
  }

  async function addTournament(t) {
    const newTournament = {
      ...t,
      id: Math.max(...tournaments.value.map(tm => tm.id), 0) + 1
    }
    tournaments.value.unshift(newTournament)
    return newTournament
  }

  async function updateTournament(id, data) {
    const idx = tournaments.value.findIndex(tm => tm.id === id)
    if (idx !== -1) {
      tournaments.value[idx] = { ...tournaments.value[idx], ...data }
    }
  }

  async function deleteTournament(id) {
    tournaments.value = tournaments.value.filter(tm => tm.id !== id)
  }

  // ─── Matches CRUD ───────────────────────────────────────
  function addMatch(m) {
    m.id = Math.max(...matches.value.map(x => x.id), 0) + 1
    matches.value.push(m)
  }

  function updateMatch(id, data) {
    const idx = matches.value.findIndex(m => m.id === id)
    if (idx !== -1) {
      matches.value[idx] = { ...matches.value[idx], ...data }

      // Sincronizar matchStats con la ref de performance para vistas globales
      if (data.matchStats) {
        performance.value = performance.value.filter(p => p.matchId !== id)
        data.matchStats.forEach(stat => {
          if (stat.playerId) {
            performance.value.push({
              id: performance.value.length > 0 ? Math.max(...performance.value.map(x => x.id), 0) + 1 : 1,
              matchId: id,
              athleteId: Number(stat.playerId),
              categoryId: Number(stat.categoryId),
              annotations: Number(stat.goals || 0),
              assists: Number(stat.assists || 0)
            })
          }
        })
      }
    }
  }

  function deleteMatch(id) {
    matches.value = matches.value.filter(m => m.id !== id)
  }

  function getMatchById(id) {
    return matches.value.find(m => m.id === id)
  }

  // ─── Fixture Generator ──────────────────────────────────
  function generateFixture(tournamentId) {
    const tournament = tournaments.value.find(t => t.id === tournamentId)
    if (!tournament) return

    const tournamentCategories = categories.value.filter(t => t.tournamentId === tournamentId)
    if (tournamentCategories.length < 2) return

    const categoryIds = tournamentCategories.map(t => t.id)
    if (categoryIds.length % 2 !== 0) categoryIds.push(null)

    const rounds = categoryIds.length - 1
    const half = categoryIds.length / 2

    const newMatches = []
    let startDate = new Date(tournament.startDate)

    for (let r = 0; r < rounds; r++) {
      for (let i = 0; i < half; i++) {
        const home = categoryIds[i]
        const away = categoryIds[categoryIds.length - 1 - i]

        if (home !== null && away !== null) {
          const matchDate = new Date(startDate)
          matchDate.setDate(matchDate.getDate() + (r * 7))

          newMatches.push({
            id: matches.value.length + newMatches.length + 1,
            tournamentId,
            homeCategoryId: home,
            awayCategoryId: away,
            homeScore: 0,
            awayScore: 0,
            date: matchDate.toISOString().split('T')[0],
            time: '09:00',
            status: 'Programado',
            sedeId: 1
          })
        }
      }
      categoryIds.splice(1, 0, categoryIds.pop())
    }

    matches.value.push(...newMatches)
    return newMatches
  }

  // ─── Trainings & Attendance ─────────────────────────────
  function addTraining(t) {
    t.id = Math.max(...trainings.value.map(x => x.id), 0) + 1
    trainings.value.push(t)
    return t.id
  }

  function updateTraining(id, data) {
    const idx = trainings.value.findIndex(t => t.id === id)
    if (idx !== -1) trainings.value[idx] = { ...trainings.value[idx], ...data }
  }

  function saveAttendance(trainingId, list) {
    // Remove existing attendance for this training
    attendance.value = attendance.value.filter(a => a.trainingId !== trainingId)
    // Add new attendance
    list.forEach(a => {
      const newId = attendance.value.length > 0 ? Math.max(...attendance.value.map(x => x.id)) + 1 : 1
      attendance.value.push({
        id: newId,
        trainingId,
        userId: a.userId,
        status: a.status,
        observations: a.observations || '',
        evolutionNotes: a.evolutionNotes || '',
        novedades: a.novedades || '',
        ratings: a.ratings || { tecnica: 0, tactica: 0, fisica: 0, mental: 0 }
      })
    })
  }

  // ─── Tactics ────────────────────────────────────────────
  function addMatchTactic(matchId, categoryId, name) {
    const newId = Math.max(...matchTactics.value.map(mt => mt.id), 0) + 1
    const tactic = { id: newId, matchId, categoryId, name }
    matchTactics.value.push(tactic)
    return tactic
  }

  function deleteMatchTactic(tacticId) {
    matchPlayerPositions.value = matchPlayerPositions.value.filter(pp => pp.matchTacticId !== tacticId)
    matchDrawings.value = matchDrawings.value.filter(md => md.matchTacticId !== tacticId)
    matchTactics.value = matchTactics.value.filter(mt => mt.id !== tacticId)
  }

  function updateMatchTactic(tacticId, data) {
    const tactic = matchTactics.value.find(mt => mt.id === tacticId)
    if (!tactic) return

    if (data.name) tactic.name = data.name

    if (data.playerPositions) {
      matchPlayerPositions.value = matchPlayerPositions.value.filter(pp => pp.matchTacticId !== tactic.id)
      data.playerPositions.forEach(pp => {
        matchPlayerPositions.value.push({
          id: Math.max(...matchPlayerPositions.value.map(p => p.id), 0) + 1,
          matchTacticId: tactic.id,
          athleteId: pp.athleteId,
          positionId: pp.positionId,
          offsetX: pp.offset?.x || 0,
          offsetY: pp.offset?.y || 0
        })
      })
    }

    if (data.drawings) {
      matchDrawings.value = matchDrawings.value.filter(md => md.matchTacticId !== tactic.id)
      data.drawings.forEach(md => {
        if (!md.id) md.id = Math.max(...matchDrawings.value.map(d => d.id), 0) + 1
        matchDrawings.value.push({
          ...md,
          matchTacticId: tactic.id
        })
      })
    }
  }

  return {
    sports, tournaments, matches, categories, performance, sedes, lineups, matchTactics, convocatorias,
    matchPlayerPositions, matchDrawings, trainings, attendance,
    getSportById, getTournamentsBySport, getMatchesByTournament,
    getCategoryById, getSedeById, getStandings, getLineupById, getMatchTactic, getTacticById,
    getTacticsByMatchCategory,
    getConvocadosByTournament, getConvocadosByCategory, getTopScorers,

    fetchSports, addSport, updateSport, deleteSport, fetchSedes, addSede, updateSede,
    fetchTournaments, addTournament, updateTournament, deleteTournament,
    addMatch, updateMatch, deleteMatch, getMatchById,
    addMatchTactic, deleteMatchTactic, updateMatchTactic,
    addTraining, updateTraining, saveAttendance, generateFixture
  }
})
