// ============================================
// DATOS MOCK - Plataforma Gestión Speed
// ============================================


// --- PERMISOS DE USUARIO ---
export const mockUserPermissions = [
  // Admin permissions (Global)
  { id: 1, usuario_id: 41, deporte_id: null, accion: 'lectura' },
  { id: 2, usuario_id: 41, deporte_id: null, accion: 'escritura' },
  { id: 3, usuario_id: 41, deporte_id: null, accion: 'eliminacion' },
  // María González (Profesor)
  { id: 4, usuario_id: 42, deporte_id: 1, accion: 'lectura' },
  { id: 5, usuario_id: 42, deporte_id: 1, accion: 'escritura' },
  { id: 6, usuario_id: 42, deporte_id: 2, accion: 'lectura' },
  { id: 7, usuario_id: 42, deporte_id: 2, accion: 'escritura' },
  { id: 8, usuario_id: 42, deporte_id: 3, accion: 'lectura' },
  // Laura Martínez (Profesor)
  { id: 9, usuario_id: 43, deporte_id: 4, accion: 'lectura' },
  { id: 10, usuario_id: 43, deporte_id: 4, accion: 'escritura' },
  { id: 11, usuario_id: 43, deporte_id: 5, accion: 'lectura' },
  { id: 12, usuario_id: 43, deporte_id: 5, accion: 'escritura' },
]

// --- DEPORTES ---
export const mockSports = [
  { id: 1, name: 'Fútbol', studentPseudonym: 'Futbolista', scoringUnit: 'Goles', icon: 'futbol', color: '#22c55e', playersPerTeam: 11, fieldBackground: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Football_field.svg/960px-Football_field.svg.png', scoringConfig: { win: 3, draw: 1, loss: 0 }, tarifaMensual: 120000 },
  { id: 2, name: 'Baloncesto', studentPseudonym: 'Basquetbolista', scoringUnit: 'Puntos', icon: 'basketball-ball', color: '#f97316', playersPerTeam: 5, fieldBackground: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Basketball_court.svg', scoringConfig: { win: 2, draw: 1, loss: 0 }, tarifaMensual: 140000 },
  { id: 3, name: 'Tenis', studentPseudonym: 'Tenista', scoringUnit: 'Sets', icon: 'table-tennis-paddle-ball', color: '#eab308', playersPerTeam: 1, fieldBackground: 'https://images.unsplash.com/photo-1595435066362-c95613ef456b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', scoringConfig: { win: 1, draw: 0, loss: 0 }, tarifaMensual: 180000 },
  { id: 4, name: 'Natación', studentPseudonym: 'Nadador(a)', scoringUnit: 'Tiempo (s)', icon: 'person-swimming', color: '#3b82f6', playersPerTeam: 1, fieldBackground: 'https://images.unsplash.com/photo-1530549387631-6c129c1bfe24?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', scoringConfig: { win: 0, draw: 0, loss: 0 }, tarifaMensual: 160000 },
  { id: 5, name: 'Karate', studentPseudonym: 'Karateka', scoringUnit: 'Puntos Kumite', icon: 'hand-fist', color: '#ef4444', playersPerTeam: 1, fieldBackground: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', scoringConfig: { win: 3, draw: 1, loss: 0 }, tarifaMensual: 110000 },
]

// --- SEDES ---
export const mockSedes = [
  { 
    id: 1, name: 'Sede Norte', address: 'Calle 100 # 15-20', phone: '601-222-3344', 
    isOwned: true, rentalCost: 0,
    courts: [
      { id: 'n1', name: 'Cancha Principal', rentalPrice: 150000 },
      { id: 'n2', name: 'Cancha 2', rentalPrice: 80000 },
      { id: 'n3', name: 'Coliseo Central', rentalPrice: 200000 }
    ],
    tarifasMatricula: {
      tarifaInscripcion: 300000,
      tarifaRenovacion: 200000,
      tarifaMensual: 120000,
      productosIncluidos: [
        { productoId: 1, varianteId: null, nombre: 'Uniforme Fútbol', precioVenta: 95000, descuentoPorcentaje: 50, obligatorio: true }
      ]
    }
  },
  { 
    id: 2, name: 'Sede Sur', address: 'Avenida 68 # 45-30', phone: '601-555-6677', 
    isOwned: false, rentalCost: 350000,
    courts: [
      { id: 's1', name: 'Cancha Auxiliar', rentalPrice: 100000 },
      { id: 's2', name: 'Coliseo Alterno', rentalPrice: 120000 }
    ],
    tarifasMatricula: {
      tarifaInscripcion: 250000,
      tarifaRenovacion: 180000,
      tarifaMensual: 100000,
      productosIncluidos: []
    }
  },
]

// --- ALINEACIONES / LINEUPS ---
export const mockLineups = [
  {
    id: 1,
    name: '4-4-2 Clasico',
    sportId: 1,
    positions: [
      { id: 'GK', name: 'Portero', x: 50, y: 90 },
      { id: 'LB', name: 'Lat. Izquierdo', x: 20, y: 75 },
      { id: 'CB1', name: 'Central 1', x: 40, y: 75 },
      { id: 'CB2', name: 'Central 2', x: 60, y: 75 },
      { id: 'RB', name: 'Lat. Derecho', x: 80, y: 75 },
      { id: 'LM', name: 'Vol. Izquierdo', x: 20, y: 50 },
      { id: 'CM1', name: 'Central 1', x: 40, y: 50 },
      { id: 'CM2', name: 'Central 2', x: 60, y: 50 },
      { id: 'RM', name: 'Vol. Derecho', x: 80, y: 50 },
      { id: 'ST1', name: 'Delantero 1', x: 40, y: 25 },
      { id: 'ST2', name: 'Delantero 2', x: 60, y: 25 },
    ]
  },
  {
    id: 2,
    name: '4-3-3 Ofensivo',
    sportId: 1,
    positions: [
      { id: 'GK', name: 'Portero', x: 50, y: 90 },
      { id: 'LB', name: 'Lat. Izquierdo', x: 20, y: 75 },
      { id: 'CB1', name: 'Central 1', x: 40, y: 75 },
      { id: 'CB2', name: 'Central 2', x: 60, y: 75 },
      { id: 'RB', name: 'Lat. Derecho', x: 80, y: 75 },
      { id: 'CM1', name: 'Medio Centro', x: 50, y: 55 },
      { id: 'AM1', name: 'Vol. Izquierdo', x: 30, y: 45 },
      { id: 'AM2', name: 'Vol. Derecho', x: 70, y: 45 },
      { id: 'LW', name: 'Ext. Izquierdo', x: 25, y: 25 },
      { id: 'RW', name: 'Ext. Derecho', x: 75, y: 25 },
      { id: 'ST', name: 'Delantero Centro', x: 50, y: 20 },
    ]
  }
]

// --- TORNEOS ---
export const mockTournaments = [
  { id: 1, name: 'Copa Primavera 2026', sportId: 1, type: 'Liga', ageRange: 'Sub-15', startDate: '2026-03-15', endDate: '2026-05-20', status: 'En Curso', teams: 8, tieBreaker: 'goalDifference' },
  { id: 2, name: 'Liga Interna Baloncesto', sportId: 2, type: 'Liga', ageRange: 'Abierta', startDate: '2026-02-01', endDate: '2026-06-30', status: 'En Curso', teams: 6, tieBreaker: 'points' },
  { id: 3, name: 'Torneo Dobles Tenis', sportId: 3, type: 'Eliminación', ageRange: 'Adultos', startDate: '2026-04-10', endDate: '2026-04-25', status: 'Programado', teams: 16 },
  { id: 4, name: 'Campeonato Karate Infantil', sportId: 5, type: 'Puntuación', ageRange: 'Sub-12', startDate: '2026-05-01', endDate: '2026-05-03', status: 'Programado', teams: 20 },
]

// --- EQUIPOS ---
export const mockCategories = [
  { id: 1, name: 'Águilas FC', sportId: 1, tournamentId: 1, sedeId: 1, lineupId: 1, mainCoachId: 42, localUniformVariantId: 'v1', awayUniformVariantId: 'v4', color: '#1d4ed8' },
  { id: 2, name: 'Leones FC', sportId: 1, tournamentId: 1, sedeId: 1, lineupId: 2, mainCoachId: 42, localUniformVariantId: 'v1', awayUniformVariantId: 'v4', color: '#dc2626' },
  { id: 3, name: 'Tigres FC', sportId: 1, tournamentId: 1, sedeId: 1, lineupId: 1, mainCoachId: 42, localUniformVariantId: 'v1', awayUniformVariantId: 'v4', color: '#f97316' },
  { id: 4, name: 'Halcones FC', sportId: 1, tournamentId: 1, sedeId: 2, lineupId: 2, mainCoachId: 43, localUniformVariantId: 'v1', awayUniformVariantId: 'v4', color: '#7c3aed' },
  { id: 5, name: 'Warriors', sportId: 2, tournamentId: 2, sedeId: 1, lineupId: null, mainCoachId: 43, localUniformVariantId: 'v7', awayUniformVariantId: 'v10', color: '#0ea5e9' },
  { id: 6, name: 'Thunder', sportId: 2, tournamentId: 2, sedeId: 2, lineupId: null, mainCoachId: 42, localUniformVariantId: 'v7', awayUniformVariantId: 'v10', color: '#eab308' },
  { id: 7, name: 'Sharks', sportId: 2, tournamentId: 2, sedeId: 1, lineupId: null, mainCoachId: 43, localUniformVariantId: 'v7', awayUniformVariantId: 'v10', color: '#6366f1' },
  { id: 8, name: 'Phoenix', sportId: 2, tournamentId: 2, sedeId: 2, lineupId: null, mainCoachId: 42, localUniformVariantId: 'v7', awayUniformVariantId: 'v10', color: '#ec4899' },
  { id: 9, name: 'Ace Masters', sportId: 3, tournamentId: 3, sedeId: 1, lineupId: null, mainCoachId: 42, localUniformVariantId: 'v1', awayUniformVariantId: 'v4', color: '#10b981' },
  { id: 10, name: 'Net Rushing', sportId: 3, tournamentId: 3, sedeId: 1, lineupId: null, mainCoachId: 43, localUniformVariantId: 'v1', awayUniformVariantId: 'v4', color: '#3b82f6' },
  { id: 11, name: 'Spin Kings', sportId: 3, tournamentId: 3, sedeId: 2, lineupId: null, mainCoachId: 42, localUniformVariantId: 'v1', awayUniformVariantId: 'v4', color: '#f59e0b' },
  { id: 12, name: 'Slice Specialists', sportId: 3, tournamentId: 3, sedeId: 2, lineupId: null, mainCoachId: 43, localUniformVariantId: 'v1', awayUniformVariantId: 'v4', color: '#ef4444' },
]

// --- TACTICAS DE PARTIDO ---
export const mockMatchTactics = [
  { id: 1, matchId: 1, categoryId: 1, name: 'Táctica Ofensiva' },
  { id: 2, matchId: 1, categoryId: 1, name: 'Contraataque Rápido' },
  { id: 3, matchId: 1, categoryId: 1, name: 'Posesión y Control' },
]

// --- POSICIONES DE CADA POSICION EN TACTICA ---
export const mockMatchPlayerPositions = [
  // Táctica 1 (Ofensiva) - Categoría 1 (Águilas FC)
  { id: 1, matchTacticId: 1, athleteId: 1, positionId: 'GK', offsetX: 0, offsetY: 0 },
  { id: 2, matchTacticId: 1, athleteId: 8, positionId: 'LB', offsetX: -5, offsetY: -5 },
  { id: 3, matchTacticId: 1, athleteId: 21, positionId: 'CB1', offsetX: 0, offsetY: 0 },
  { id: 4, matchTacticId: 1, athleteId: 22, positionId: 'CB2', offsetX: 0, offsetY: 0 },
  { id: 5, matchTacticId: 1, athleteId: 23, positionId: 'RB', offsetX: 5, offsetY: -5 },
  { id: 6, matchTacticId: 1, athleteId: 24, positionId: 'LM', offsetX: -3, offsetY: -10 },
  { id: 7, matchTacticId: 1, athleteId: 25, positionId: 'CM1', offsetX: -5, offsetY: -8 },
  { id: 8, matchTacticId: 1, athleteId: 26, positionId: 'CM2', offsetX: 5, offsetY: -8 },
  { id: 9, matchTacticId: 1, athleteId: 27, positionId: 'RM', offsetX: 3, offsetY: -10 },
  { id: 10, matchTacticId: 1, athleteId: 28, positionId: 'ST1', offsetX: -8, offsetY: -15 },
  { id: 11, matchTacticId: 1, athleteId: 29, positionId: 'ST2', offsetX: 8, offsetY: -15 },

  // Táctica 2 (Contraataque) - Categoría 1
  { id: 12, matchTacticId: 2, athleteId: 1, positionId: 'GK', offsetX: 0, offsetY: 0 },
  { id: 13, matchTacticId: 2, athleteId: 21, positionId: 'CB1', offsetX: 0, offsetY: 5 },
  { id: 14, matchTacticId: 2, athleteId: 22, positionId: 'CB2', offsetX: 0, offsetY: 5 },
  { id: 15, matchTacticId: 2, athleteId: 28, positionId: 'ST1', offsetX: 0, offsetY: -20 },
  { id: 16, matchTacticId: 2, athleteId: 29, positionId: 'ST2', offsetX: 0, offsetY: -20 },
]

// --- TRAZADOS DE CADA TACTICA ---
export const mockMatchDrawings = [
  { id: 1, matchTacticId: 1, name: 'Jugada Inicial', type: 'path', points: [{ x: 40, y: 25 }, { x: 50, y: 15 }], color: '#ffffff', width: 2, isVisible: true },
  { id: 2, matchTacticId: 2, name: 'Pase Largo', type: 'path', points: [{ x: 50, y: 90 }, { x: 50, y: 25 }], color: '#facc15', width: 3, isVisible: true },
]

// --- PARTIDOS ---
export const mockMatches = [
  { id: 1, tournamentId: 1, homeCategoryId: 1, awayCategoryId: 2, venue: 'Cancha Principal', date: '2026-03-15', time: '10:00', homeScore: 3, awayScore: 1, status: 'Validado' },
  { id: 2, tournamentId: 1, homeCategoryId: 3, awayCategoryId: 4, venue: 'Cancha Principal', date: '2026-03-15', time: '14:00', homeScore: 2, awayScore: 2, status: 'Validado' },
  { id: 3, tournamentId: 1, homeCategoryId: 1, awayCategoryId: 3, venue: 'Cancha 2', date: '2026-03-22', time: '10:00', homeScore: 1, awayScore: 0, status: 'Validado' },
  { id: 4, tournamentId: 1, homeCategoryId: 2, awayCategoryId: 4, venue: 'Cancha Principal', date: '2026-03-29', time: '10:00', homeScore: null, awayScore: null, status: 'Programado' },
  { id: 5, tournamentId: 2, homeCategoryId: 5, awayCategoryId: 6, venue: 'Coliseo Central', date: '2026-02-10', time: '18:00', homeScore: 78, awayScore: 65, status: 'Validado' },
  { id: 6, tournamentId: 2, homeCategoryId: 7, awayCategoryId: 8, venue: 'Coliseo Central', date: '2026-02-10', time: '20:00', homeScore: 92, awayScore: 88, status: 'Validado' },
  { id: 7, tournamentId: 2, homeCategoryId: 5, awayCategoryId: 7, venue: 'Coliseo Central', date: '2026-02-17', time: '18:00', homeScore: 70, awayScore: 75, status: 'Validado' },
  { id: 8, tournamentId: 2, homeCategoryId: 6, awayCategoryId: 8, venue: 'Coliseo Alterno', date: '2026-03-10', time: '19:00', homeScore: null, awayScore: null, status: 'En Curso' },
]

// --- RENDIMIENTO DEPORTIVO ---
export const mockPerformance = [
  { id: 1, matchId: 1, athleteId: 3, categoryId: 1, annotations: 2, assists: 1 },
  { id: 2, matchId: 1, athleteId: 5, categoryId: 1, annotations: 1, assists: 0 },
  { id: 3, matchId: 1, athleteId: 10, categoryId: 2, annotations: 1, assists: 1 },
  { id: 4, matchId: 2, athleteId: 12, categoryId: 3, annotations: 1, assists: 0 },
  { id: 5, matchId: 2, athleteId: 14, categoryId: 4, annotations: 2, assists: 1 },
  { id: 6, matchId: 3, athleteId: 3, categoryId: 1, annotations: 1, assists: 0 },
  { id: 7, matchId: 5, athleteId: 16, categoryId: 5, annotations: 22, assists: 8 },
  { id: 8, matchId: 5, athleteId: 17, categoryId: 5, annotations: 18, assists: 5 },
  { id: 9, matchId: 5, athleteId: 18, categoryId: 6, annotations: 20, assists: 3 },
  { id: 10, matchId: 6, athleteId: 19, categoryId: 7, annotations: 28, assists: 7 },
  { id: 11, matchId: 6, athleteId: 20, categoryId: 8, annotations: 25, assists: 10 },
  { id: 12, matchId: 7, athleteId: 16, categoryId: 5, annotations: 15, assists: 4 },
  { id: 13, matchId: 7, athleteId: 19, categoryId: 7, annotations: 24, assists: 6 },
]

// --- DATOS BASE DE DEPORTISTAS ---
const _rawDeportistas = [
  { id: 1, name: "Juan Deportista", email: "juan.d@email.com", phone: "320-333-4455", birthDate: "2011-05-15", enrollmentDate: "2025-01-10", status: "activo", profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1001234567", familyId: 1, sports: [1, 2], categoryId: 1 },
  { id: 2, name: "Sofía Deportista", email: "sofia.d@email.com", phone: "320-333-4456", birthDate: "2013-08-22", enrollmentDate: "2025-03-01", status: "activo", profileImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1001234568", familyId: 1, sports: [5], categoryId: null },
  { id: 3, name: "Roberto López", email: "roberto.l@email.com", phone: "300-111-9999", birthDate: "1980-02-10", enrollmentDate: "2025-01-10", status: "activo", profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&h=256&auto=format&fit=crop", documentType: "TI", documentNumber: "79856432", familyId: 1, isParent: true, sports: [] },
  { id: 4, name: "Pedro Sánchez", email: "pedro.s@email.com", phone: "300-555-6677", birthDate: "2010-11-03", enrollmentDate: "2024-08-15", status: "activo", profileImage: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1007654321", familyId: 2, sports: [1, 3], categoryId: 2 },
  { id: 5, name: "Ana Rodríguez", email: "ana.r@email.com", phone: "311-666-7788", birthDate: "2012-04-18", enrollmentDate: "2025-02-20", status: "activo", profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1007654322", familyId: 2, sports: [4], categoryId: null },
  { id: 6, name: "Miguel Sánchez", email: "miguel.s@email.com", phone: "318-777-8899", birthDate: "1978-09-25", enrollmentDate: "2024-08-15", status: "activo", profileImage: "https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=256&h=256&auto=format&fit=crop", documentType: "TI", documentNumber: "80123456", familyId: 2, isParent: true, sports: [] },
  { id: 7, name: "Carolina Ruiz", email: "carolina.r@email.com", phone: "315-888-9900", birthDate: "2009-01-30", enrollmentDate: "2024-06-01", status: "activo", profileImage: "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1009876543", familyId: 3, sports: [2, 4] },
  { id: 8, name: "Tomás Ruiz", email: "tomas.r@email.com", phone: "315-888-9901", birthDate: "2014-07-12", enrollmentDate: "2025-01-15", status: "activo", profileImage: "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1009876544", familyId: 3, sports: [1], categoryId: 1 },
  { id: 9, name: "Sandra Gómez", email: "sandra.g@email.com", phone: "301-999-0011", birthDate: "1982-12-05", enrollmentDate: "2024-06-01", status: "activo", profileImage: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=256&h=256&auto=format&fit=crop", documentType: "TI", documentNumber: "52345678", familyId: 3, isParent: true, sports: [] },
  { id: 10, name: "Diego Torres", email: "diego.t@email.com", phone: "322-111-2234", birthDate: "2011-03-28", enrollmentDate: "2024-11-01", status: "activo", profileImage: "https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1003456789", familyId: 4, sports: [1, 5], categoryId: 3 },
  { id: 11, name: "Valentina Torres", email: "valentina.t@email.com", phone: "322-111-2235", birthDate: "2008-10-08", enrollmentDate: "2024-11-01", status: "activo", profileImage: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1003456790", familyId: 4, sports: [2, 3] },
  { id: 12, name: "Felipe Herrera", email: "felipe.h@email.com", phone: "313-222-3345", birthDate: "2010-06-20", enrollmentDate: "2025-02-01", status: "activo", profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1005678901", familyId: 5, sports: [2] },
  { id: 13, name: "Isabella Herrera", email: "isabella.h@email.com", phone: "313-222-3346", birthDate: "2013-09-14", enrollmentDate: "2025-02-01", status: "activo", profileImage: "https://images.unsplash.com/photo-1517677129300-07b130802f46?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1005678902", familyId: 5, sports: [4, 5] },
  { id: 14, name: "Carlos Herrera", email: "carlos.h@email.com", phone: "310-333-4456", birthDate: "1975-05-30", enrollmentDate: "2025-02-01", status: "activo", profileImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=256&h=256&auto=format&fit=crop", documentType: "TI", documentNumber: "71234567", familyId: 5, isParent: true, sports: [] },
  { id: 15, name: "Martín Vargas", email: "martin.v@email.com", phone: "300-444-5567", birthDate: "2009-12-01", enrollmentDate: "2024-03-15", status: "activo", profileImage: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1002345678", sports: [1, 2, 5] },
  { id: 16, name: "Camila Díaz", email: "camila.d@email.com", phone: "319-555-6678", birthDate: "2011-02-14", enrollmentDate: "2025-01-20", status: "activo", profileImage: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1004567890", sports: [3, 4] },
  { id: 17, name: "Andrés Mendoza", email: "andres.m@email.com", phone: "316-666-7789", birthDate: "2010-07-07", enrollmentDate: "2024-09-01", status: "inactivo", profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1006789012", sports: [1] },
  { id: 18, name: "Lucía Romero", email: "lucia.r@email.com", phone: "305-777-8890", birthDate: "2012-11-25", enrollmentDate: "2025-01-05", status: "activo", profileImage: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1008901234", sports: [2, 5] },
  { id: 19, name: "Santiago Morales", email: "santiago.m@email.com", phone: "317-888-9901", birthDate: "2008-04-18", enrollmentDate: "2024-05-10", status: "activo", profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1001112233", sports: [2, 3] },
  { id: 20, name: "Gabriela Castro", email: "gabriela.c@email.com", phone: "312-999-0012", birthDate: "2013-06-30", enrollmentDate: "2025-02-15", status: "activo", profileImage: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1003344556", sports: [4] },
  { id: 21, name: "Mateo López", email: "mateo.l@email.com", phone: "317-888-9902", birthDate: "2008-05-20", enrollmentDate: "2024-06-10", status: "activo", profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1001112244", sports: [1], categoryId: 1 },
  { id: 22, name: "Daniela Ortiz", email: "daniela.o@email.com", phone: "318-999-0011", birthDate: "2009-03-15", enrollmentDate: "2024-07-12", status: "activo", profileImage: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1002223344", sports: [1], categoryId: 1 },
  { id: 23, name: "Nicolás Silva", email: "nicolas.s@email.com", phone: "319-000-1122", birthDate: "2010-08-25", enrollmentDate: "2024-08-15", status: "activo", profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1003334455", sports: [1], categoryId: 1 },
  { id: 24, name: "Sofía Méndez", email: "sofia.m@email.com", phone: "320-111-2233", birthDate: "2011-01-10", enrollmentDate: "2024-09-18", status: "activo", profileImage: "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1004445566", sports: [1], categoryId: 1 },
  { id: 25, name: "Samuel Rojas", email: "samuel.r@email.com", phone: "321-222-3344", birthDate: "2008-12-05", enrollmentDate: "2024-10-20", status: "activo", profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1005556677", sports: [1], categoryId: 1 },
  { id: 26, name: "Valeria Peña", email: "valeria.p@email.com", phone: "322-333-4455", birthDate: "2009-11-22", enrollmentDate: "2024-11-25", status: "activo", profileImage: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1006667788", sports: [1], categoryId: 1 },
  { id: 27, name: "Lucas Giraldo", email: "lucas.g@email.com", phone: "323-444-5566", birthDate: "2010-06-30", enrollmentDate: "2024-12-01", status: "activo", profileImage: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1007778899", sports: [1], categoryId: 1 },
  { id: 28, name: "Elena Castro", email: "elena.c@email.com", phone: "324-555-6677", birthDate: "2011-04-18", enrollmentDate: "2025-01-10", status: "activo", profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1008889900", sports: [1], categoryId: 1 },
  { id: 29, name: "Juan Pablo Marín", email: "jp.marin@email.com", phone: "325-666-7788", birthDate: "2008-09-12", enrollmentDate: "2025-02-15", status: "activo", profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1009990011", sports: [1], categoryId: 1 },
  { id: 30, name: "Mariana Duarte", email: "mariana.d@email.com", phone: "326-777-8899", birthDate: "2009-07-07", enrollmentDate: "2025-03-01", status: "activo", profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1010101010", sports: [1], categoryId: 1 },
  { id: 31, name: "Esteban Restrepo", email: "esteban.r@email.com", phone: "327-888-9900", birthDate: "2010-02-28", enrollmentDate: "2024-05-15", status: "activo", profileImage: "https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1011112233", sports: [1], categoryId: 2 },
  { id: 32, name: "Clara Estrada", email: "clara.e@email.com", phone: "328-999-0011", birthDate: "2011-12-05", enrollmentDate: "2024-06-20", status: "activo", profileImage: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1012223344", sports: [1], categoryId: 2 },
  { id: 33, name: "Bastian Jaramillo", email: "bastian.j@email.com", phone: "329-000-1122", birthDate: "2008-08-10", enrollmentDate: "2024-07-25", status: "activo", profileImage: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1013334455", sports: [1], categoryId: 2 },
  { id: 34, name: "Inés Cuartas", email: "ines.c@email.com", phone: "330-111-2233", birthDate: "2009-05-30", enrollmentDate: "2024-08-30", status: "activo", profileImage: "https://images.unsplash.com/photo-1517677129300-07b130802f46?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1014445566", sports: [1], categoryId: 2 },
  { id: 35, name: "Oscar Villada", email: "oscar.v@email.com", phone: "331-222-3344", birthDate: "2010-10-15", enrollmentDate: "2024-09-10", status: "activo", profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1015556677", sports: [1], categoryId: 2 },
  { id: 36, name: "Julia Tabares", email: "julia.t@email.com", phone: "332-333-4455", birthDate: "2011-03-25", enrollmentDate: "2024-10-15", status: "activo", profileImage: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1016667788", sports: [1], categoryId: 2 },
  { id: 37, name: "David Noreña", email: "david.n@email.com", phone: "333-444-5566", birthDate: "2008-01-12", enrollmentDate: "2024-11-20", status: "activo", profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1017778899", sports: [1], categoryId: 2 },
  { id: 38, name: "Paula Betancourt", email: "paula.b@email.com", phone: "334-555-6677", birthDate: "2009-09-22", enrollmentDate: "2024-12-15", status: "activo", profileImage: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=256&h=256&auto=format&fit=crop", documentType: "CC", documentNumber: "1018889900", sports: [1], categoryId: 2 },
]

// --- STAFF (Administración y Profesores) ---
const _staff = [
  { id: 41, name: 'Carlos Administrador', email: 'admin@clubdeportivo.com', password: 'admin123', role: 'administrativo', avatar: 'CA', phone: '300-111-2233', status: 'activo', profileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=256&h=256&auto=format&fit=crop', documentType: 'CC', documentNumber: '1000000001', birthDate: '1980-01-01', enrollmentDate: '2024-01-01', createdAt: '2024-01-01', sports: [], familyId: null, venueIds: [] },
  { id: 42, name: 'María González', email: 'profesor@clubdeportivo.com', password: 'prof123', role: 'profesor', avatar: 'MG', phone: '310-222-3344', status: 'activo', profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&h=256&auto=format&fit=crop', documentType: 'TI', documentNumber: '1000000002', birthDate: '1982-01-01', enrollmentDate: '2024-01-01', createdAt: '2024-01-01', sports: [1, 2, 3], familyId: null, venueIds: [] },
  { id: 43, name: 'Laura Martínez', email: 'laura.m@clubdeportivo.com', password: 'laura123', role: 'profesor', avatar: 'LM', phone: '315-444-5566', status: 'activo', profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=256&h=256&auto=format&fit=crop', documentType: 'CC', documentNumber: '1000000004', birthDate: '1995-01-01', enrollmentDate: '2024-01-01', createdAt: '2024-01-01', sports: [4, 5], familyId: null, venueIds: [] },
]

// --- USUARIOS UNIFICADOS (Staff + Deportistas transformados) ---
export const mockUsers = [
  ..._staff,
  ..._rawDeportistas.filter(m => !m.isParent).map(m => {
    return {
      ...m,
      password: m.email.split('@')[0] + '123',
      role: 'deportista',
      avatar: m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      createdAt: m.enrollmentDate,
    };
  })
]

// --- CONVOCATORIAS ---
export const mockConvocatorias = [
  // Convocados Águilas FC (Category 1) para Copa Primavera
  { id: 1, tournamentId: 1, categoryId: 1, userId: 1 },
  { id: 2, tournamentId: 1, categoryId: 1, userId: 8 },
  { id: 3, tournamentId: 1, categoryId: 1, userId: 21 },
  { id: 4, tournamentId: 1, categoryId: 1, userId: 22 },
  { id: 5, tournamentId: 1, categoryId: 1, userId: 23 },
  { id: 6, tournamentId: 1, categoryId: 1, userId: 24 },
  { id: 7, tournamentId: 1, categoryId: 1, userId: 25 },
  { id: 8, tournamentId: 1, categoryId: 1, userId: 26 },
  { id: 9, tournamentId: 1, categoryId: 1, userId: 27 },
  { id: 10, tournamentId: 1, categoryId: 1, userId: 28 },
  { id: 11, tournamentId: 1, categoryId: 1, userId: 29 },
  { id: 12, tournamentId: 1, categoryId: 1, userId: 30 },
  // Convocados Leones FC (Category 2) para Copa Primavera
  { id: 13, tournamentId: 1, categoryId: 2, userId: 4 },
  { id: 14, tournamentId: 1, categoryId: 2, userId: 31 },
  { id: 15, tournamentId: 1, categoryId: 2, userId: 32 },
  { id: 16, tournamentId: 1, categoryId: 2, userId: 33 },
  { id: 17, tournamentId: 1, categoryId: 2, userId: 34 },
  { id: 18, tournamentId: 1, categoryId: 2, userId: 35 },
  { id: 19, tournamentId: 1, categoryId: 2, userId: 36 },
  { id: 20, tournamentId: 1, categoryId: 2, userId: 37 },
  { id: 21, tournamentId: 1, categoryId: 2, userId: 38 },
]



// --- MATRICULAS ---
export const mockMatriculas = [
  {
    id: 1, deportistaId: 1, sedeId: 1, tipo: 'inscripcion', periodo: '2026-I', fechaInicio: '2026-01-15', fechaFin: '2026-06-15', duracionMeses: 6, estado: 'activa', fechaCreacion: '2026-01-10',
    descuentos: { inscripcion: 0, renovacion: 0, mensualidad: 0, productos: 0 }
  },
  {
    id: 2, deportistaId: 4, sedeId: 1, tipo: 'inscripcion', periodo: '2026-I', fechaInicio: '2026-01-15', fechaFin: '2026-06-15', duracionMeses: 6, estado: 'activa', fechaCreacion: '2026-01-10',
    descuentos: { inscripcion: 10, renovacion: 0, mensualidad: 0, productos: 0 }
  },
  {
    id: 3, deportistaId: 10, sedeId: 1, tipo: 'inscripcion', periodo: '2026-I', fechaInicio: '2026-01-15', fechaFin: '2026-06-15', duracionMeses: 6, estado: 'activa', fechaCreacion: '2026-01-10',
    descuentos: { inscripcion: 0, renovacion: 0, mensualidad: 0, productos: 0 }
  }
]

// --- BECAS ---
export const mockBecas = [
  {
    id: 1, deportistaId: 1, tipoPeriodicidad: 'mensual', tipoValor: 'porcentaje', valor: 20, concepto: 'Beca Deportiva', fechaInicio: '2026-01-01', fechaFin: '2026-12-31', estado: 'activa',
  }
]

// --- CARTERA FINANCIERA (DOCUMENTOS CRÉDITO Y DÉBITO) ---
export const mockDocumentos = [
  // Créditos Matrícula y Productos
  { id: 1, deportistaId: 1, matriculaId: 1, numeroDocumento: 'CRG-2026-0001', naturaleza: 'credito', tipoDocumento: 'matricula', concepto: 'Inscripción Semestral 2026-I', monto: 300000, saldo: 0, fecha: '2026-01-05', fechaVencimiento: '2026-01-15', estado: 'pagado', deporteId: null, cuentaIngreso: 'Ingresos_Matriculas' },
  { id: 2, deportistaId: 4, matriculaId: 2, numeroDocumento: 'CRG-2026-0002', naturaleza: 'credito', tipoDocumento: 'matricula', concepto: 'Inscripción Semestral 2026-I', monto: 270000, saldo: 0, fecha: '2026-01-05', fechaVencimiento: '2026-01-15', estado: 'pagado', deporteId: null, cuentaIngreso: 'Ingresos_Matriculas' },
  { id: 3, deportistaId: 10, matriculaId: 3, numeroDocumento: 'CRG-2026-0003', naturaleza: 'credito', tipoDocumento: 'matricula', concepto: 'Inscripción Semestral 2026-I', monto: 300000, saldo: 300000, fecha: '2026-01-05', fechaVencimiento: '2026-01-15', estado: 'vencido', deporteId: null, cuentaIngreso: 'Ingresos_Matriculas' },
  { id: 4, deportistaId: 1, matriculaId: 1, numeroDocumento: 'CRG-2026-0004', naturaleza: 'credito', tipoDocumento: 'producto', concepto: 'Uniforme Fútbol (Incluido)', monto: 47500, saldo: 47500, fecha: '2026-01-05', fechaVencimiento: '2026-01-15', estado: 'vencido', deporteId: 1, cuentaIngreso: 'Ingresos_Productos' },

  // Créditos Mensualidades
  { id: 5, deportistaId: 1, matriculaId: 1, numeroDocumento: 'CRG-2026-0005', naturaleza: 'credito', tipoDocumento: 'mensualidad', concepto: 'Mensualidad Marzo 2026', monto: 120000, saldo: 120000, fecha: '2026-03-01', fechaVencimiento: '2026-03-10', estado: 'pendiente', deporteId: 1, cuentaIngreso: 'Ingresos_Mensualidades' },
  { id: 6, deportistaId: 4, matriculaId: 2, numeroDocumento: 'CRG-2026-0006', naturaleza: 'credito', tipoDocumento: 'mensualidad', concepto: 'Mensualidad Marzo 2026', monto: 120000, saldo: 0, fecha: '2026-03-01', fechaVencimiento: '2026-03-10', estado: 'pagado', deporteId: 1, cuentaIngreso: 'Ingresos_Mensualidades' },
  { id: 7, deportistaId: 10, matriculaId: 3, numeroDocumento: 'CRG-2026-0007', naturaleza: 'credito', tipoDocumento: 'mensualidad', concepto: 'Mensualidad Febrero 2026', monto: 120000, saldo: 120000, fecha: '2026-02-01', fechaVencimiento: '2026-02-10', estado: 'vencido', deporteId: 1, cuentaIngreso: 'Ingresos_Mensualidades' },
  
  // Inscripciones a torneos
  { id: 8, deportistaId: 1, numeroDocumento: 'CRG-2026-0008', naturaleza: 'credito', tipoDocumento: 'torneo', concepto: 'Inscripción Copa Primavera', monto: 50000, saldo: 0, fecha: '2026-03-01', fechaVencimiento: '2026-03-10', estado: 'pagado', deporteId: 1, cuentaIngreso: 'Ingresos_Eventos' },
  { id: 9, deportistaId: 4, numeroDocumento: 'CRG-2026-0009', naturaleza: 'credito', tipoDocumento: 'torneo', concepto: 'Inscripción Copa Primavera', monto: 50000, saldo: 0, fecha: '2026-03-01', fechaVencimiento: '2026-03-10', estado: 'pagado', deporteId: 1, cuentaIngreso: 'Ingresos_Eventos' },

  // Débitos (Pagos)
  { id: 50, deportistaId: 1, numeroDocumento: 'PAG-2026-0001', naturaleza: 'debito', tipoDocumento: 'pago', concepto: 'Pago aplicado a CRG-2026-0001', monto: 300000, fecha: '2026-01-08', estado: 'aplicado', documentoCreditoId: 1, numeroDocumentoCredito: 'CRG-2026-0001', metodo: 'Transferencia', referencia: 'TRF-001100' },
  { id: 51, deportistaId: 4, numeroDocumento: 'PAG-2026-0002', naturaleza: 'debito', tipoDocumento: 'pago', concepto: 'Pago aplicado a CRG-2026-0002', monto: 270000, fecha: '2026-01-10', estado: 'aplicado', documentoCreditoId: 2, numeroDocumentoCredito: 'CRG-2026-0002', metodo: 'Wompi/PSE', referencia: 'WMP-221100' },
  { id: 52, deportistaId: 4, numeroDocumento: 'PAG-2026-0003', naturaleza: 'debito', tipoDocumento: 'pago', concepto: 'Pago aplicado a CRG-2026-0006', monto: 120000, fecha: '2026-03-05', estado: 'aplicado', documentoCreditoId: 6, numeroDocumentoCredito: 'CRG-2026-0006', metodo: 'Transferencia', referencia: 'TRF-001234' },
  { id: 53, deportistaId: 1, numeroDocumento: 'PAG-2026-0004', naturaleza: 'debito', tipoDocumento: 'pago', concepto: 'Pago aplicado a CRG-2026-0008', monto: 50000, fecha: '2026-03-02', estado: 'aplicado', documentoCreditoId: 8, numeroDocumentoCredito: 'CRG-2026-0008', metodo: 'Efectivo', referencia: 'EFE-000400' },
  { id: 54, deportistaId: 4, numeroDocumento: 'PAG-2026-0005', naturaleza: 'debito', tipoDocumento: 'pago', concepto: 'Pago aplicado a CRG-2026-0009', monto: 50000, fecha: '2026-03-03', estado: 'aplicado', documentoCreditoId: 9, numeroDocumentoCredito: 'CRG-2026-0009', metodo: 'Efectivo', referencia: 'EFE-000401' },

  // Débitos (Becas)
  { id: 60, deportistaId: 1, numeroDocumento: 'BEC-2026-0001', naturaleza: 'debito', tipoDocumento: 'beca', concepto: 'Beca - Marzo 2026', monto: 24000, fecha: '2026-03-01', estado: 'aplicado', documentoCreditoId: 5, numeroDocumentoCredito: 'CRG-2026-0005', metodo: null, referencia: null },
]

// --- INVENTARIO ---
export const mockProducts = [
  // Productos con variantes SCS
  { id: 1, name: 'Uniforme Fútbol', sportId: 1, category: 'Indumentaria', hasVariants: true, basePrice: 95000 },
  { id: 2, name: 'Uniforme Baloncesto', sportId: 2, category: 'Indumentaria', hasVariants: true, basePrice: 88000 },
  { id: 3, name: 'Calzado Deportivo', sportId: null, category: 'Calzado', hasVariants: true, basePrice: 220000 },
  // Productos simples
  { id: 4, name: 'Balón Fútbol Profesional', sportId: 1, category: 'Equipamiento', hasVariants: false, basePrice: 85000, stock: 25, sku: 'BFP-001' },
  { id: 5, name: 'Balón Baloncesto Oficial', sportId: 2, category: 'Equipamiento', hasVariants: false, basePrice: 92000, stock: 18, sku: 'BBO-001' },
  { id: 6, name: 'Raqueta Tenis Intermedia', sportId: 3, category: 'Equipamiento', hasVariants: false, basePrice: 180000, stock: 12, sku: 'RTI-001' },
  { id: 7, name: 'Raqueta Tenis Profesional', sportId: 3, category: 'Equipamiento', hasVariants: false, basePrice: 350000, stock: 5, sku: 'RTP-001' },
  { id: 8, name: 'Cinturón Blanco Karate', sportId: 5, category: 'Equipamiento', hasVariants: false, basePrice: 25000, stock: 30, sku: 'CBK-001' },
  { id: 9, name: 'Cinturón Amarillo Karate', sportId: 5, category: 'Equipamiento', hasVariants: false, basePrice: 25000, stock: 20, sku: 'CAK-001' },
  { id: 10, name: 'Cinturón Naranja Karate', sportId: 5, category: 'Equipamiento', hasVariants: false, basePrice: 28000, stock: 15, sku: 'CNK-001' },
  { id: 11, name: 'Gafas de Natación', sportId: 4, category: 'Equipamiento', hasVariants: false, basePrice: 45000, stock: 40, sku: 'GN-001' },
  { id: 12, name: 'Gorro de Natación', sportId: 4, category: 'Equipamiento', hasVariants: false, basePrice: 18000, stock: 50, sku: 'GRN-001' },
  { id: 13, name: 'Protector Bucal', sportId: null, category: 'Accesorios', hasVariants: false, basePrice: 15000, stock: 60, sku: 'PB-001' },
  { id: 14, name: 'Botella Deportiva 750ml', sportId: null, category: 'Accesorios', hasVariants: false, basePrice: 22000, stock: 45, sku: 'BD-001' },
  { id: 15, name: 'Tobillera Compresión', sportId: null, category: 'Accesorios', hasVariants: false, basePrice: 35000, stock: 35, sku: 'TC-001' },
]

// --- VARIANTES DE PRODUCTOS ---
export const mockProductVariants = [
  // Variantes Uniforme Fútbol (productId: 1)
  { id: 'v1', productId: 1, size: 'S', color: 'Verde', style: 'Local', stock: 15, sku: 'UF-S-VRD-L' },
  { id: 'v2', productId: 1, size: 'M', color: 'Verde', style: 'Local', stock: 22, sku: 'UF-M-VRD-L' },
  { id: 'v3', productId: 1, size: 'L', color: 'Verde', style: 'Local', stock: 10, sku: 'UF-L-VRD-L' },
  { id: 'v4', productId: 1, size: 'S', color: 'Blanco', style: 'Visitante', stock: 12, sku: 'UF-S-BLC-V' },
  { id: 'v5', productId: 1, size: 'M', color: 'Blanco', style: 'Visitante', stock: 18, sku: 'UF-M-BLC-V' },
  { id: 'v6', productId: 1, size: 'L', color: 'Blanco', style: 'Visitante', stock: 8, sku: 'UF-L-BLC-V' },
  // Variantes Uniforme Baloncesto (productId: 2)
  { id: 'v7', productId: 2, size: 'S', color: 'Azul', style: 'Local', stock: 10, sku: 'UB-S-AZL-L' },
  { id: 'v8', productId: 2, size: 'M', color: 'Azul', style: 'Local', stock: 14, sku: 'UB-M-AZL-L' },
  { id: 'v9', productId: 2, size: 'L', color: 'Azul', style: 'Local', stock: 7, sku: 'UB-L-AZL-L' },
  { id: 'v10', productId: 2, size: 'S', color: 'Rojo', style: 'Visitante', stock: 9, sku: 'UB-S-RJO-V' },
  { id: 'v11', productId: 2, size: 'M', color: 'Rojo', style: 'Visitante', stock: 11, sku: 'UB-M-RJO-V' },
  { id: 'v12', productId: 2, size: 'L', color: 'Rojo', style: 'Visitante', stock: 5, sku: 'UB-L-RJO-V' },
  // Variantes Calzado Deportivo (productId: 3)
  { id: 'v13', productId: 3, size: '36', color: 'Negro', style: 'Running', stock: 6, sku: 'CD-36-NGR' },
  { id: 'v14', productId: 3, size: '38', color: 'Negro', style: 'Running', stock: 10, sku: 'CD-38-NGR' },
  { id: 'v15', productId: 3, size: '40', color: 'Negro', style: 'Running', stock: 8, sku: 'CD-40-NGR' },
  { id: 'v16', productId: 3, size: '38', color: 'Blanco', style: 'Training', stock: 12, sku: 'CD-38-BLC' },
  { id: 'v17', productId: 3, size: '40', color: 'Blanco', style: 'Training', stock: 9, sku: 'CD-40-BLC' },
  { id: 'v18', productId: 3, size: '42', color: 'Blanco', style: 'Training', stock: 4, sku: 'CD-42-BLC' },
]

export const mockPOSSales = [
  { id: 1, date: '2026-02-20', userId: 1, productId: 4, quantity: 1, total: 85000, paymentType: 'Crédito Socio', status: 'Pendiente' },
  { id: 2, date: '2026-02-15', userId: 11, productId: 6, quantity: 1, total: 180000, paymentType: 'Transferencia', status: 'Pagado' },
  { id: 3, date: '2026-02-18', userId: 7, productId: 11, quantity: 1, total: 45000, paymentType: 'Efectivo', status: 'Pagado' },
  { id: 4, date: '2026-02-22', userId: 15, productId: 14, quantity: 2, total: 44000, paymentType: 'Efectivo', status: 'Pagado' },
  { id: 5, date: '2026-03-01', userId: 10, productId: 8, quantity: 1, total: 25000, paymentType: 'Crédito Socio', status: 'Pendiente' },
]

// --- DATOS PARA DASHBOARD ---
export const dashboardStats = {
  totalUsers: 41,
  activeUsers: 40,
  totalSports: 5,
  totalTournaments: 4,
  upcomingMatches: 2,
  monthlyRevenue: 2450000,
  pendingCharges: 1250000,
  revenueByMonth: [
    { month: 'Oct', amount: 1420000 },
    { month: 'Nov', amount: 1580000 },
    { month: 'Dic', amount: 1350000 },
    { month: 'Ene', amount: 1890000 },
    { month: 'Feb', amount: 1720000 },
    { month: 'Mar', amount: 2450000 },
  ],
  revenueBySport: [
    { sport: 'Fútbol', amount: 950000, color: '#22c55e' },
    { sport: 'Baloncesto', amount: 620000, color: '#f97316' },
    { sport: 'Tenis', amount: 380000, color: '#eab308' },
    { sport: 'Natación', amount: 315000, color: '#3b82f6' },
    { sport: 'Karate', amount: 185000, color: '#ef4444' },
  ],
  usersBySport: [
    { sport: 'Fútbol', count: 18 },
    { sport: 'Baloncesto', count: 12 },
    { sport: 'Tenis', count: 5 },
    { sport: 'Natación', count: 4 },
    { sport: 'Karate', count: 2 },
  ],
}

// --- ENTRENAMIENTOS ---
export const mockTrainings = [
  { id: 1, date: '2026-03-02', venueId: 1, categoryId: 1, startTime: '16:00', endTime: '18:00', coachId: 42, sportId: 1, court: 'Cancha Principal' },
  { id: 2, date: '2026-03-04', venueId: 1, categoryId: 1, startTime: '16:00', endTime: '18:00', coachId: 42, sportId: 1, court: 'Cancha 2' },
  { id: 3, date: '2026-03-06', venueId: 2, categoryId: 5, startTime: '15:00', endTime: '17:00', coachId: 43, sportId: 2, court: 'Coliseo Alterno' },
  { id: 4, date: '2026-03-09', venueId: 1, categoryId: 2, startTime: '08:00', endTime: '10:00', coachId: 42, sportId: 1, court: 'Cancha Principal' },
]

// --- ASISTENCIA Y SEGUIMIENTO ---
export const mockAttendance = [
  // Entrenamiento 1 - Deportistas de Sede 1
  { id: 1, trainingId: 1, userId: 1, status: 'Presente', observations: 'Excelente desempeño en drills de pase', evolutionNotes: 'Mejorando precisión', novedades: 'Ninguna', ratings: { tecnica: 5, tactica: 4, fisica: 3, mental: 5 } },
  { id: 2, trainingId: 1, userId: 8, status: 'Presente', observations: 'Buen trabajo defensivo', evolutionNotes: 'Concentración aumentada', novedades: 'Ninguna', ratings: { tecnica: 4, tactica: 5, fisica: 4, mental: 4 } },
  { id: 3, trainingId: 1, userId: 21, status: 'Ausente', observations: '', evolutionNotes: '', novedades: 'Cita médica informada', ratings: { tecnica: 0, tactica: 0, fisica: 0, mental: 0 } },
  { id: 4, trainingId: 1, userId: 22, status: 'Presente', observations: 'Regular intensidad', evolutionNotes: 'Mantener enfoque', novedades: 'Molestia leve en tobillo', ratings: { tecnica: 3, tactica: 3, fisica: 3, mental: 3 } },
]

// --- CONFIGURACIONES GENERALES ---
export const mockConfig = {
  finanzas: {
    diasGraciaMes: 5,
    porcentajeMoraMes: 5,
    valorFijoMoraMes: 0,
    consecutivos: {
      cargos: 30,
      pagos: 10,
      recibos: 5
    }
  },
  kloggy: {
    usuario: '',
    clave: '',
    serial: '',
  },
  branding: {
    logo: null,
    colorPrimario: '#86C232',
    colorSecundario: '#474B24',
    nombre: 'Speed',
  },
  wompi: {
    ambiente: 'sandbox',
    llavePublicaSandbox: '',
    llavePublicaProduccion: '',
    llavePrivadaSandbox: '',
    llavePrivadaProduccion: '',
    llaveEventosSandbox: '',
    llaveEventosProduccion: '',
    llaveIntegridadSandbox: '',
    llaveIntegridadProduccion: '',
  },
  foto_obligatoria: false,
  mostrar_historia_clinica: true,
  mostrar_examenes_medicos: true,
  matricula: {
    habilitada: true,
    periodoActual: '2026-I',
    paqueteInicialId: null,
  },
  mensualidades: {
    diaLimite: 10,
    tarifaBase: 150000,
    porcentajeInteresMora: 5,
    diasGracia: 5,
  },
  entrenamientos: {
    habilitado: true,
    metodoProgramacion: 'individual',
  },
  torneos: {
    habilitado: true,
  },
  calificaciones: {
    habilitado: true,
    dimensiones: ['tecnica', 'tactica', 'fisica', 'mental'],
  },
  inventario: {
    habilitado: true,
    metodoEscaneo: 'ambos', // 'barcode', 'manual', 'ambos'
    permitirCreditoSocio: true,
    limiteDeudaSocio: 500000,
  },
  salud: {
    habilitado: true,
    compartirRendimientoPublico: false,
  },
  ventas: {
    habilitado: true,
  },
  pagos: {
    habilitado: true,
  },
}

// --- EXPEDIENTE MEDICO ---
export const mockHealthRecords = [
  { userId: 1, bloodType: 'O+', allergies: ['Nueces', 'Penicilina'], chronicDiseases: 'Asma leve', medications: 'Inhalador Salbutamol SOS', insuranceCompany: 'Sura EPS', emergencyContactName: 'Roberto López', emergencyContactPhone: '300-111-9999' },
  { userId: 4, bloodType: 'A-', allergies: ['Ninguna'], chronicDiseases: 'Ninguna', medications: 'Ninguna', insuranceCompany: 'Sanitas EPS', emergencyContactName: 'Miguel Sánchez', emergencyContactPhone: '318-777-8899' },
  { userId: 10, bloodType: 'O+', allergies: ['Acaros'], chronicDiseases: 'Ninguna', medications: 'Ninguna', insuranceCompany: 'Compensar EPS', emergencyContactName: 'Diana Torres', emergencyContactPhone: '322-111-2234' },
]

// --- SEGUIMIENTO BIOMETRICO ---
export const mockMeasurements = [
  { id: 1, userId: 1, date: '2026-01-05', weight: 45, height: 1.55, bodyFatPercentage: 18, muscleMassPercentage: 35, bmi: 18.7, waistCircumference: 65 },
  { id: 2, userId: 1, date: '2026-02-10', weight: 46.5, height: 1.56, bodyFatPercentage: 17.5, muscleMassPercentage: 36, bmi: 19.1, waistCircumference: 64 },
  { id: 3, userId: 1, date: '2026-03-15', weight: 48, height: 1.58, bodyFatPercentage: 17, muscleMassPercentage: 37, bmi: 19.2, waistCircumference: 64 },
  { id: 4, userId: 4, date: '2026-01-10', weight: 52, height: 1.62, bodyFatPercentage: 15, muscleMassPercentage: 40, bmi: 19.8, waistCircumference: 68 },
]

// --- TESTS FISICOS ---
export const mockPhysicalTests = [
  { id: 1, userId: 1, date: '2026-03-01', fuerza: 75, flexibilidad: 12, agilidad: 8.5, resistencia: 45 },
  { id: 2, userId: 4, date: '2026-03-01', fuerza: 82, flexibilidad: 8, agilidad: 9.2, resistencia: 48 },
  { id: 3, userId: 10, date: '2026-03-10', fuerza: 68, flexibilidad: 15, agilidad: 8.8, resistencia: 42 },
]

// --- LESIONES ---
export const mockInjuries = [
  { id: 1, userId: 1, dateOccurred: '2026-02-15', type: 'Esguince de tobillo', severity: 'Leve', recoveryStatus: 'Recuperado', notes: 'Reposo de 1 semana cumplido.' },
  { id: 2, userId: 10, dateOccurred: '2026-03-20', type: 'Desgarro muscular', severity: 'Moderada', recoveryStatus: 'En Rehabilitación', notes: 'En fisioterapia actual. No debe realizar saltos.' },
]

// --- CONFIGURACIONES POR ROL ---
export const mockConfigRol = [
  { id: 1, rol: 'administrativo', clave: 'puede_ver_finanzas', valor: 'true' },
  { id: 2, rol: 'administrativo', clave: 'puede_gestionar_usuarios', valor: 'true' },
  { id: 3, rol: 'supervisor', clave: 'puede_ver_finanzas', valor: 'true' },
  { id: 4, rol: 'supervisor', clave: 'puede_gestionar_usuarios', valor: 'false' },
  { id: 5, rol: 'profesor', clave: 'puede_crear_entrenamientos', valor: 'true' },
  { id: 6, rol: 'profesor', clave: 'puede_calificar', valor: 'true' },
  { id: 7, rol: 'estudiante', clave: 'puede_ver_calificaciones', valor: 'true' },
  { id: 8, rol: 'estudiante', clave: 'puede_ver_pagos_propios', valor: 'true' },
  { id: 9, rol: 'familiar', clave: 'puede_ver_pagos_familia', valor: 'true' },
  { id: 10, rol: 'familiar', clave: 'puede_realizar_pagos', valor: 'true' },
]

// --- CONFIGURACIONES POR USUARIO ---
export const mockConfigUsuario = []

// --- TODAS LAS CONFIGURACIONES (Módulos Dinámicos) ---
export const mockAllConfigs = [
  { id: 1, seccion: 'Deportes', clave_configuracion: 'entrenamientos', etiqueta: 'Módulo de Entrenamientos', descripcion: 'Habilita la programación de sesiones y toma de asistencia.', valor_configuracion: 'true', tipo_control: 'boolean', habilitado: true },
  { id: 2, seccion: 'Deportes', clave_configuracion: 'torneos', etiqueta: 'Módulo de Torneos', descripcion: 'Habilita la creación de ligas, tablas de posiciones y llaves.', valor_configuracion: 'true', tipo_control: 'boolean', habilitado: true },
  { id: 3, seccion: 'Finanzas', clave_configuracion: 'intereses_mora', etiqueta: 'Cálculo de Intereses', descripcion: 'Habilita la aplicación automática de intereses por mora.', valor_configuracion: 'true', tipo_control: 'boolean', habilitado: true },
  { id: 4, seccion: 'Operaciones', clave_configuracion: 'inventario', etiqueta: 'Gestión de Inventario', descripcion: 'Control de uniformes, implementos y stock de tienda.', valor_configuracion: 'true', tipo_control: 'boolean', habilitado: true },
  { id: 5, seccion: 'Operaciones', clave_configuracion: 'pos', etiqueta: 'Punto de Venta (POS)', descripcion: 'Interfaz rápida para ventas directas y facturación.', valor_configuracion: 'true', tipo_control: 'boolean', habilitado: true },
  { id: 6, seccion: 'Seguridad', clave_configuracion: 'qr_access', etiqueta: 'Control por QR', descripcion: 'Permite el ingreso mediante escaneo de carnets digitales.', valor_configuracion: 'true', tipo_control: 'boolean', habilitado: true },
  { id: 7, seccion: 'Comunicación', clave_configuracion: 'notificaciones_whatsapp', etiqueta: 'Notificaciones WhatsApp', descripcion: 'Envío automático de recordatorios de pago y eventos.', valor_configuracion: 'false', tipo_control: 'boolean', habilitado: false },
  { id: 8, seccion: 'Salud', clave_configuracion: 'historias_clinicas', etiqueta: 'Historias Clínicas', descripcion: 'Fichas médicas y seguimiento de lesiones deportistas.', valor_configuracion: 'true', tipo_control: 'boolean', habilitado: true },
  { id: 9, seccion: 'Registro', clave_configuracion: 'foto_obligatoria', etiqueta: 'Foto Obligatoria', descripcion: 'Exigir foto de perfil durante el registro de deportistas.', valor_configuracion: 'false', tipo_control: 'boolean', habilitado: false },
  { id: 10, seccion: 'Registro', clave_configuracion: 'mostrar_historia_clinica', etiqueta: 'Cargar Historia Clínica', descripcion: 'Habilitar campo para subir PDF de historia clínica en el registro.', valor_configuracion: 'true', tipo_control: 'boolean', habilitado: true },
  { id: 11, seccion: 'Registro', clave_configuracion: 'mostrar_examenes_medicos', etiqueta: 'Cargar Exámenes Médicos', descripcion: 'Habilitar campo para subir resultados de exámenes médicos.', valor_configuracion: 'true', tipo_control: 'boolean', habilitado: true },
]
