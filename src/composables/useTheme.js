import { ref, watch, onMounted } from 'vue'

export function useTheme() {
  const theme = ref(localStorage.getItem('theme') || 'system')
  const isDark = ref(false)

  const applyTheme = (newTheme) => {
    const root = window.document.documentElement

    // Resolve "system" theme
    const resolvedTheme = newTheme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : newTheme

    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
      isDark.value = true
    } else {
      root.classList.remove('dark')
      isDark.value = false
    }

    localStorage.setItem('theme', newTheme)
    theme.value = newTheme
  }

  // Watch for system theme changes if set to "system"
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (theme.value === 'system') {
        applyTheme('system')
      }
    })
  }

  onMounted(() => {
    applyTheme(theme.value)
  })

  return {
    theme,
    isDark,
    setTheme: applyTheme,
    toggleTheme: () => applyTheme(theme.value === 'dark' ? 'light' : 'dark')
  }
}
