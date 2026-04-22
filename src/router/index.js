import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { requiresAuth: false, layout: 'blank' }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo', 'supervisor', 'profesor', 'estudiante'], icon: 'house', label: 'Dashboard' }
  },

  {
    path: '/users',
    name: 'Users',
    component: () => import('@/views/users/UsersListView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo'], icon: 'user-shield', label: 'Usuarios & IAM' }
  },
  {
    path: '/sports',
    name: 'Sports',
    component: () => import('@/views/sports/SportsListView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo', 'supervisor', 'profesor'], icon: 'futbol', label: 'Deportes' }
  },
  {
    path: '/tournaments',
    name: 'Tournaments',
    component: () => import('@/views/sports/TournamentsView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo', 'supervisor', 'profesor'], icon: 'trophy', label: 'Torneos' }
  },
  {
    path: '/matches',
    name: 'Matches',
    component: () => import('@/views/sports/MatchesView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo', 'supervisor', 'profesor', 'estudiante'], icon: 'calendar-days', label: 'Partidos' }
  },
  {
    path: '/trainings',
    name: 'Trainings',
    component: () => import('@/views/sports/TrainingsView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo', 'supervisor', 'profesor', 'estudiante'], icon: 'calendar-check', label: 'Entrenamientos' }
  },
  {
    path: '/trainings/:id',
    name: 'TrainingDetail',
    component: () => import('@/views/sports/TrainingSessionDetailView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo', 'supervisor', 'profesor', 'estudiante'] }
  },
  {
    path: '/performance',
    name: 'Performance',
    component: () => import('@/views/sports/PerformanceView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo', 'supervisor', 'profesor', 'estudiante'], icon: 'chart-line', label: 'Rendimiento' }
  },
  {
    path: '/finance',
    name: 'Finance',
    component: () => import('@/views/finance/PortfolioView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo', 'supervisor'], icon: 'money-bill-wave', label: 'Cartera' }
  },
  {
    path: '/charges',
    name: 'Charges',
    component: () => import('@/views/finance/ChargesView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo', 'supervisor'], icon: 'file-invoice-dollar', label: 'Cargos' }
  },
  {
    path: '/payments',
    name: 'Payments',
    component: () => import('@/views/finance/PaymentsView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo', 'supervisor'], icon: 'credit-card', label: 'Pagos' }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/views/finance/ReportsView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo', 'supervisor'], icon: 'chart-pie', label: 'Reportes' }
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: () => import('@/views/inventory/ProductsView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo', 'supervisor'], icon: 'boxes-stacked', label: 'Inventario' }
  },
  {
    path: '/pos',
    name: 'POS',
    component: () => import('@/views/inventory/POSView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo', 'supervisor', 'profesor'], icon: 'cash-register', label: 'Punto de Venta' }
  },
  {
    path: '/athletes',
    name: 'Athletes',
    component: () => import('@/views/athletes/AthletesListView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo', 'supervisor', 'profesor', 'estudiante'], icon: 'people-group', label: 'Deportistas' }
  },
  {
    path: '/athletes/:id',
    name: 'AthleteProfile',
    component: () => import('@/views/athletes/AthleteProfileView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo', 'supervisor', 'profesor', 'estudiante'] }
  },
  {
    path: '/enrollments',
    name: 'Enrollments',
    component: () => import('@/views/enrollments/EnrollmentsListView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo', 'supervisor'], icon: 'file-signature', label: 'Matrículas' }
  },
  {
    path: '/enrollment/create/:deportistaId?',
    name: 'EnrollmentCreate',
    component: () => import('@/views/enrollments/EnrollmentCreateView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo', 'supervisor'] }
  },
  {
    path: '/athletes/:id/account',
    name: 'CurrentAccount',
    component: () => import('@/views/finance/CurrentAccountView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo', 'supervisor', 'estudiante'] }
  },
  {
    path: '/access-control',
    name: 'AccessControl',
    component: () => import('@/views/admin/AccessControlView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo', 'supervisor'], icon: 'qrcode', label: 'Control de Acceso' }
  },
  {
    path: '/sedes',
    name: 'Sedes',
    component: () => import('@/views/sports/SedesListView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo', 'supervisor', 'profesor'], icon: 'building', label: 'Sedes' }
  },
  {
    path: '/categories',
    name: 'Categories',
    component: () => import('@/views/sports/CategoriesListView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo', 'supervisor', 'profesor'], icon: 'people-group', label: 'Categorías' }
  },
  {
    path: '/tactics',
    name: 'Tactics',
    component: () => import('@/views/sports/TacticsView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo', 'supervisor', 'profesor', 'estudiante'], icon: 'clipboard-list', label: 'Tácticas' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/settings/SettingsView.vue'),
    meta: { requiresAuth: true, roles: ['administrativo'], icon: 'gear', label: 'Configuraciones' }
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  // Si no está autenticado y la ruta requiere auth → login
  if (to.meta.requiresAuth !== false && !auth.isAuthenticated) {
    return { name: 'Login' }
  }

  // Si ya está autenticado e intenta ir a login → dashboard
  if (to.name === 'Login' && auth.isAuthenticated) {
    return { name: 'Dashboard' }
  }

  if (to.name === 'Dashboard' && auth.userRole === 'familiar') {
    // Si algún usuario quedara de familiar, redirigir o desloguear
    auth.logout()
    return { name: 'Login' }
  }

  // Verificar rol: si no tiene el rol requerido
  if (to.meta.roles && !to.meta.roles.includes(auth.userRole)) {
    // Si la ruta es Reports y el usuario tiene permiso especial, lo dejamos pasar
    if (to.name === 'Reports' && auth.user?.canViewFinancialReports) {
       return // allowed
    }

    // Si ya estamos yendo a Dashboard, forzar logout para evitar loop
    if (to.name === 'Dashboard') {
      auth.logout()
      return { name: 'Login' }
    }
    return { name: 'Dashboard' }
  }
})

// Export navigation items for sidebar
export const navGroups = [
  {
    title: 'Principal',
    items: routes.filter(r => [
      'Dashboard'
    ].includes(r.name))
  },
  {
    title: 'Sistema',
    items: routes.filter(r => ['Settings'].includes(r.name))
  },
  {
    title: 'Comunidad',
    items: routes.filter(r => [
      'Athletes',
      'Users'
    ].includes(r.name))
  },
  {
    title: 'Finanzas',
    items: routes.filter(r => [
      'Finance',
      'Charges',
      'Payments',
      'Reports'
    ].includes(r.name))
  },
  {
    title: 'Gestión Deportiva',
    items: routes.filter(r => [
      'Enrollments',
      'Sports',
      'Tournaments',
      'Matches',
      'Performance',
      'Sedes',
      'Categories',
      'Tactics',
      'Trainings',
      'AccessControl'
    ].includes(r.name))
  },
  {
    title: 'Inventario',
    items: routes.filter(r => [
      'Inventory',
      'POS'
    ].includes(r.name))
  },


]

export default router
