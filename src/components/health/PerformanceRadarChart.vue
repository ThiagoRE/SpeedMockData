<script setup>
import { computed } from 'vue'

const props = defineProps({
  stats: {
    type: Object,
    required: true,
    // Expected: { fuerza: 0-100, flexibilidad: 0-100, agilidad: 0-100, resistencia: 0-100 }
  }
})

const series = computed(() => {
  return [{
    name: 'Capacidad Física',
    data: [
      props.stats?.fuerza || 0,
      props.stats?.flexibilidad || 0,
      props.stats?.agilidad || 0,
      props.stats?.resistencia || 0
    ]
  }]
})

const chartOptions = computed(() => ({
  chart: {
    height: 300,
    type: 'radar',
    toolbar: { show: false },
    fontFamily: 'Outfit, Inter, sans-serif'
  },
  dataLabels: {
    enabled: true,
    background: {
      enabled: true,
      borderRadius: 4,
    }
  },
  xaxis: {
    categories: ['Fuerza', 'Flexibilidad', 'Agilidad', 'Resistencia'],
    labels: {
      show: true,
      style: {
        colors: ['#64748b', '#64748b', '#64748b', '#64748b'],
        fontSize: '10px',
        fontWeight: 700,
      }
    }
  },
  yaxis: {
    show: false,
    min: 0,
    max: 100
  },
  colors: ['#3b82f6'],
  fill: {
    opacity: 0.3,
    colors: ['#3b82f6']
  },
  markers: {
    size: 4,
    colors: ['#fff'],
    strokeColor: '#3b82f6',
    strokeWidth: 2
  },
  stroke: {
    width: 2
  },
  tooltip: {
    theme: 'dark',
    y: {
      formatter: (v) => `${v} pts`
    }
  }
}))
</script>

<template>
  <div class="radar-chart bg-surface-50 rounded-3xl p-4 border border-border-subtle/50">
    <apexchart
      type="radar"
      height="300"
      :options="chartOptions"
      :series="series"
    />
  </div>
</template>
