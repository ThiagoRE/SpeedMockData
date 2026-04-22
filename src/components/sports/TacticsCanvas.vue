<script setup>
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'

const props = defineProps({
  background: String,
  players: { type: Array, default: () => [] },
  drawings: { type: Array, default: () => [] },
  teamColor: { type: String, default: '#3b82f6' },
  isDrawingMode: { type: Boolean, default: false },
})

const emit = defineEmits(['update:players', 'update:drawings'])

const canvasRef = ref(null)
const containerRef = ref(null)
const bgImage = ref(null)
let ctx = null

// Interaction State
const isDragging = ref(false)
const dragIndex = ref(-1)
const isDrawing = ref(false)
const currentPath = ref([])

// Dynamic Scaling
const playerRadius = computed(() => {
  if (!canvasRef.value) return 20
  // Scale radius based on canvas width, min 14px, max 24px
  return Math.max(14, Math.min(24, canvasRef.value.width * 0.04))
})

onMounted(() => {
  ctx = canvasRef.value.getContext('2d')
  loadBackground()
  window.addEventListener('resize', resizeCanvas)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
})

function loadBackground() {
  if (props.background) {
    const img = new Image()
    img.src = props.background
    img.onload = () => {
      bgImage.value = img
      resizeCanvas()
    }
  } else {
    bgImage.value = null
    resizeCanvas()
  }
}

function resizeCanvas() {
  if (!containerRef.value || !canvasRef.value) return
  const { width: contW, height: contH } = containerRef.value.getBoundingClientRect()
  
  if (!bgImage.value) {
    canvasRef.value.width = contW
    canvasRef.value.height = contH
    render()
    return
  }

  const imgW = bgImage.value.width
  const imgH = bgImage.value.height
  const imgRatio = imgW / imgH
  
  // Extra padding for mobile margins
  const availableW = contW * 0.96
  const availableH = contH * 0.96
  const containerRatio = availableW / availableH

  let targetW, targetH

  if (containerRatio > imgRatio) {
    targetH = availableH
    targetW = targetH * imgRatio
  } else {
    targetW = availableW
    targetH = targetW / imgRatio
  }

  canvasRef.value.width = targetW
  canvasRef.value.height = targetH
  
  render()
}

function render() {
  if (!ctx || !canvasRef.value) return
  const { width, height } = canvasRef.value
  
  ctx.clearRect(0, 0, width, height)
  
  // 1. Draw Background (Covers full canvas since canvas is sized to match)
  if (bgImage.value) {
    ctx.drawImage(bgImage.value, 0, 0, width, height)
    drawOverlay()
  } else {
    // Green field fallback
    ctx.fillStyle = '#2d5a27'
    ctx.fillRect(0, 0, width, height)
    drawOverlay()
  }
}

function drawOverlay() {
  const { width, height } = canvasRef.value
  const r = playerRadius.value
  
  // 2. Draw Drawings (Paths)
  props.drawings.forEach(draw => {
    if (draw.isVisible === false) return 
    if (draw.type === 'path' && draw.points.length > 1) {
      ctx.beginPath()
      ctx.strokeStyle = draw.color || '#fff'
      ctx.lineWidth = draw.width || 3
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.moveTo(draw.points[0].x * width / 100, draw.points[0].y * height / 100)
      for (let i = 1; i < draw.points.length; i++) {
        ctx.lineTo(draw.points[i].x * width / 100, draw.points[i].y * height / 100)
      }
      ctx.stroke()
    }
  })
  
  // 3. Draw current path (Live feedback)
  if (isDrawing.value && currentPath.value.length > 1) {
    ctx.beginPath()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 3
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.setLineDash([5, 5]) 
    ctx.moveTo(currentPath.value[0].x * width / 100, currentPath.value[0].y * height / 100)
    for (let i = 1; i < currentPath.value.length; i++) {
      ctx.lineTo(currentPath.value[i].x * width / 100, currentPath.value[i].y * height / 100)
    }
    ctx.stroke()
    ctx.setLineDash([]) 
  }

  // 4. Draw Players
  props.players.forEach((player) => {
    const px = player.x * width / 100
    const py = player.y * height / 100
    
    // Player Circle
    ctx.beginPath()
    ctx.arc(px, py, r, 0, Math.PI * 2)
    ctx.fillStyle = props.teamColor
    ctx.shadowBlur = Math.max(4, width * 0.015)
    ctx.shadowColor = 'rgba(0,0,0,0.4)'
    ctx.fill()
    ctx.shadowBlur = 0

    // Profile Image
    if (player.profileImage) {
      const img = new Image()
      img.src = player.profileImage
      if (img.complete) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(px, py, r, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(img, px - r, py - r, r * 2, r * 2)
        ctx.restore()
      } else {
        img.onload = () => render() 
      }
    }

    // Border
    ctx.beginPath()
    ctx.arc(px, py, r, 0, Math.PI * 2)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = Math.max(1, r * 0.1)
    ctx.stroke()
    
    // Label scaled by radius
    const fontSize = Math.max(8, r * 0.5)
    ctx.font = `bold ${fontSize}px Inter, sans-serif`
    const label = player.name.split(' ')[0]
    const labelWidth = ctx.measureText(label).width
    
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(px - labelWidth/2 - 4, py + r + 2, labelWidth + 8, fontSize + 4)
    
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(label, px, py + r + 4)
  })
}

// Event Handlers
// Coordinate Mapping Helper
function getCoordinates(e) {
  const rect = canvasRef.value.getBoundingClientRect()
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  
  const canvasX = clientX - rect.left
  const canvasY = clientY - rect.top
  
  return {
    xPercent: canvasX / rect.width * 100,
    yPercent: canvasY / rect.height * 100,
    rect
  }
}

// Event Handlers
function startAction(e) {
  const { xPercent, yPercent, rect } = getCoordinates(e)
  const r = playerRadius.value

  if (props.isDrawingMode) {
    isDrawing.value = true
    currentPath.value = [{ x: xPercent, y: yPercent }]
  } else {
    // Check for player click (use pixel distance for precision)
    const hitIndex = props.players.findIndex(p => {
      const dx = (p.x * rect.width / 100) - (xPercent * rect.width / 100)
      const dy = (p.y * rect.height / 100) - (yPercent * rect.height / 100)
      return Math.sqrt(dx*dx + dy*dy) < r * 1.5
    })
    
    if (hitIndex !== -1) {
      isDragging.value = true
      dragIndex.value = hitIndex
      if (e.cancelable) e.preventDefault() // Prevent scrolling during drag
    }
  }
}

function moveAction(e) {
  if (!isDragging.value && !isDrawing.value) return
  if (e.cancelable) e.preventDefault() // Prevent scrolling

  const { xPercent, yPercent } = getCoordinates(e)
  const clampedX = Math.max(0, Math.min(100, xPercent))
  const clampedY = Math.max(0, Math.min(100, yPercent))

  if (isDragging.value) {
    const updatedPlayers = [...props.players]
    updatedPlayers[dragIndex.value] = { ...updatedPlayers[dragIndex.value], x: clampedX, y: clampedY }
    emit('update:players', updatedPlayers)
  } else if (isDrawing.value) {
    currentPath.value.push({ x: clampedX, y: clampedY })
    render() 
  }
}

function endAction() {
  if (isDrawing.value && currentPath.value.length > 1) {
    const newDrawing = { 
      id: Date.now(),
      name: `Trazo ${props.drawings.length + 1}`,
      type: 'path', 
      points: currentPath.value, 
      color: '#ffffff', 
      width: 3,
      isVisible: true
    }
    emit('update:drawings', [...props.drawings, newDrawing])
  }
  isDragging.value = false
  dragIndex.value = -1
  isDrawing.value = false
  currentPath.value = []
}

// Watchers
watch(() => props.background, loadBackground)
watch([() => props.players, () => props.drawings], render, { deep: true })
</script>

<template>
  <div ref="containerRef" class="h-full relative flex items-center justify-center bg-transparent">
    <!-- Board Wrapper (Handles rounding and shadow) -->
    <div 
      class="relative overflow-hidden"
      :style="{ 
        width: canvasRef ? canvasRef.width + 'px' : 'auto', 
        height: canvasRef ? canvasRef.height + 'px' : 'auto' 
      }"
      :class="{ 'opacity-0 scale-95': !bgImage && props.background, 'opacity-100 scale-100': bgImage || !props.background }"
    >
      <canvas 
        ref="canvasRef"
        @mousedown="startAction"
        @mousemove="moveAction"
        @mouseup="endAction"
        @mouseleave="endAction"
        @touchstart="startAction"
        @touchmove="moveAction"
        @touchend="endAction"
        class="block cursor-crosshair touch-none"
      ></canvas>

      <!-- Internal Field Shadow/Gloss -->
      <div class="absolute inset-0 pointer-events-none shadow-[inset_0_2px_20px_rgba(255,255,255,0.1)] rounded-[2.2rem]"></div>
    </div>
    
    <!-- Controls Overlay -->
    <div class="absolute bottom-4 right-4 md:bottom-6 md:right-6 flex gap-2">
      <button @click="$emit('clearDrawings')" class="px-3 py-2 md:px-4 md:py-2.5 bg-surface-100/60 dark:bg-dark-900/40 hover:bg-surface-200/80 dark:hover:bg-dark-800/60 text-text-main rounded-xl backdrop-blur-xl transition-all text-[10px] md:text-sm font-bold border border-border-subtle shadow-lg flex items-center gap-2 group">
        <font-awesome-icon icon="trash" class="text-red-500 group-hover:scale-110 transition-transform" /> 
        <span class="hidden sm:inline">Limpiar Pizarra</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.touch-none {
  touch-action: none;
}
</style>

