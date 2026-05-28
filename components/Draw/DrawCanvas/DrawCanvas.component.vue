<template lang="pug">
.draw-canvas(ref="stage")
  canvas.draw-canvas__el(
    ref="canvas"
    @mousedown.prevent="start"
    @mousemove.prevent="move"
    @mouseup.prevent="end"
    @mouseleave.prevent="end"
    @touchstart.prevent="start"
    @touchmove.prevent="move"
    @touchend.prevent="end"
  )
</template>

<script>
import { defineComponent, ref, onMounted, onBeforeUnmount, watch } from '@nuxtjs/composition-api'

const STREAM_INTERVAL_MS = 50

export default defineComponent({
  props: {
    drawable: { type: Boolean, default: false },
    color: { type: String, default: '#000' },
    size: { type: Number, default: 8 },
    tool: { type: String, default: 'brush' },
    strokes: { type: Array, default: () => [] }
  },
  emits: ['chunk', 'stroke-end', 'undo', 'clear'],
  setup(props, { emit }) {
    const stage = ref(null)
    const canvas = ref(null)
    const ctx = ref(null)
    const dpr = ref(1)
    const drawing = ref(false)
    const currentStrokeId = ref(null)
    const currentBatchPoints = ref([])
    const batchTimer = ref(null)

    const drawChunk = chunk => {
      const c = ctx.value
      c.lineCap = 'round'
      c.lineJoin = 'round'
      c.strokeStyle = chunk.tool === 'eraser' ? '#ffffff' : chunk.color
      c.lineWidth = chunk.tool === 'eraser' ? chunk.size * 2.2 : chunk.size
      const p = chunk.points

      if (!p || !p.length) return
      c.beginPath()
      c.moveTo(p[0].x, p[0].y)

      for (let i = 1; i < p.length; i++) c.lineTo(p[i].x, p[i].y)

      c.stroke()
    }

    const redraw = () => {
      const c = ctx.value

      if (!c || !canvas.value) return
      c.setTransform(1, 0, 0, 1, 0, 0)
      c.clearRect(0, 0, canvas.value.width, canvas.value.height)
      c.fillStyle = '#fff'
      c.fillRect(0, 0, canvas.value.width, canvas.value.height)
      c.setTransform(dpr.value, 0, 0, dpr.value, 0, 0)

      for (const s of props.strokes) drawChunk(s)
    }

    const resize = () => {
      if (!canvas.value || !stage.value) return
      dpr.value = window.devicePixelRatio || 1
      canvas.value.width = stage.value.clientWidth * dpr.value
      canvas.value.height = stage.value.clientHeight * dpr.value
      ctx.value.setTransform(dpr.value, 0, 0, dpr.value, 0, 0)
      redraw()
    }

    const pointFromEvent = e => {
      const r = canvas.value.getBoundingClientRect()
      const t = e.touches ? e.touches[0] : e

      return { x: t.clientX - r.left, y: t.clientY - r.top }
    }

    const flushBatch = (final = false) => {
      if (currentBatchPoints.value.length > 0 && currentStrokeId.value) {
        emit('chunk', {
          strokeId: currentStrokeId.value,
          tool: props.tool,
          color: props.color,
          size: props.size,
          points: currentBatchPoints.value.slice()
        })
        currentBatchPoints.value = []
      }

      if (!final && drawing.value) {
        batchTimer.value = setTimeout(flushBatch, STREAM_INTERVAL_MS)
      }
    }

    const start = e => {
      if (!props.drawable) return
      const pt = pointFromEvent(e)
      drawing.value = true
      currentStrokeId.value = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      currentBatchPoints.value = [pt]
      flushBatch()
    }

    const move = e => {
      if (!props.drawable || !drawing.value) return
      const pt = pointFromEvent(e)
      currentBatchPoints.value.push(pt)
    }

    const end = () => {
      if (!props.drawable || !drawing.value) return
      drawing.value = false
      flushBatch(true)
      emit('stroke-end', { strokeId: currentStrokeId.value })
      currentStrokeId.value = null
    }

    watch(
      () => props.strokes.length,
      () => redraw()
    )

    onMounted(() => {
      ctx.value = canvas.value.getContext('2d')
      resize()
      window.addEventListener('resize', resize)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('resize', resize)

      if (batchTimer.value) clearTimeout(batchTimer.value)
    })

    return { stage, canvas, start, move, end }
  }
})
</script>

<style src="./DrawCanvas.component.scss" lang="scss" scoped />
