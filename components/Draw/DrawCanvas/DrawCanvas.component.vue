<template lang="pug">
.draw-canvas(ref="stage")
  span.draw-canvas__hint(v-if="drawable && hint") {{ hint }}
  canvas.draw-canvas__el(
    ref="canvas"
    :class="{ 'is-drawable': drawable }"
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

const TOOL_HINTS = {
  brush: 'Fırça',
  line: 'Çizgi',
  rect: 'Dikdörtgen',
  circle: 'Daire',
  fill: 'Doldur',
  eraser: 'Silgi'
}

export default defineComponent({
  props: {
    drawable: { type: Boolean, default: false },
    color: { type: String, default: '#000000' },
    size: { type: Number, default: 8 },
    tool: { type: String, default: 'brush' },
    strokes: { type: Array, default: () => [] }
  },
  emits: ['chunk', 'stroke-end'],
  setup(props, { emit }) {
    const stage = ref(null)
    const canvas = ref(null)
    const ctx = ref(null)
    const dpr = ref(1)

    const drawing = ref(false)
    const currentStrokeId = ref(null)
    const currentBatchPoints = ref([])
    const batchTimer = ref(null)
    const inProgress = ref(null)

    const hint = ref('')
    watch(
      () => props.tool,
      t => {
        hint.value = TOOL_HINTS[t] || ''
      },
      { immediate: true }
    )

    const drawStroke = s => {
      const c = ctx.value

      if (!c || !s) return
      c.lineCap = 'round'
      c.lineJoin = 'round'
      c.strokeStyle = s.color
      c.fillStyle = s.color
      c.lineWidth = s.size

      if (s.tool === 'brush' || s.tool === 'eraser') {
        const p = s.points

        if (!p || !p.length) return
        c.beginPath()

        if (p.length === 1) {
          c.arc(p[0].x, p[0].y, s.size / 2, 0, Math.PI * 2)
          c.fill()

          return
        }

        c.moveTo(p[0].x, p[0].y)

        for (let i = 1; i < p.length; i++) c.lineTo(p[i].x, p[i].y)
        c.stroke()

        return
      }

      if (s.tool === 'line') {
        c.beginPath()
        c.moveTo(s.x1, s.y1)
        c.lineTo(s.x2, s.y2)
        c.stroke()

        return
      }

      if (s.tool === 'rect') {
        const x = Math.min(s.x1, s.x2)
        const y = Math.min(s.y1, s.y2)
        const w = Math.abs(s.x2 - s.x1)
        const h = Math.abs(s.y2 - s.y1)
        c.strokeRect(x, y, w, h)

        return
      }

      if (s.tool === 'circle') {
        const cx = (s.x1 + s.x2) / 2
        const cy = (s.y1 + s.y2) / 2
        const rx = Math.abs(s.x2 - s.x1) / 2
        const ry = Math.abs(s.y2 - s.y1) / 2
        c.beginPath()

        if (c.ellipse) c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        else c.arc(cx, cy, Math.max(rx, ry), 0, Math.PI * 2)
        c.stroke()

        return
      }

      if (s.tool === 'fill') {
        floodFill(Math.floor(s.x), Math.floor(s.y), s.color)
      }
    }

    const floodFill = (x, y, hex) => {
      const cnv = canvas.value
      const c = ctx.value

      if (!cnv || !c) return
      c.setTransform(1, 0, 0, 1, 0, 0)
      const px = Math.floor(x * dpr.value)
      const py = Math.floor(y * dpr.value)
      const w = cnv.width
      const h = cnv.height

      if (px < 0 || py < 0 || px >= w || py >= h) {
        c.setTransform(dpr.value, 0, 0, dpr.value, 0, 0)

        return
      }

      const img = c.getImageData(0, 0, w, h)
      const data = img.data
      const idx = (py * w + px) * 4
      const tr = data[idx]
      const tg = data[idx + 1]
      const tb = data[idx + 2]
      const ta = data[idx + 3]
      const fr = parseInt(hex.slice(1, 3), 16)
      const fg = parseInt(hex.slice(3, 5), 16)
      const fb = parseInt(hex.slice(5, 7), 16)

      if (tr === fr && tg === fg && tb === fb && ta === 255) {
        c.setTransform(dpr.value, 0, 0, dpr.value, 0, 0)

        return
      }

      const stack = [[px, py]]

      while (stack.length) {
        const p = stack.pop()
        const cx = p[0]
        const cy = p[1]

        if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue
        const i = (cy * w + cx) * 4

        if (data[i] !== tr || data[i + 1] !== tg || data[i + 2] !== tb || data[i + 3] !== ta) continue
        data[i] = fr
        data[i + 1] = fg
        data[i + 2] = fb
        data[i + 3] = 255
        stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1])
      }

      c.putImageData(img, 0, 0)
      c.setTransform(dpr.value, 0, 0, dpr.value, 0, 0)
    }

    const redraw = () => {
      const cnv = canvas.value
      const c = ctx.value

      if (!c || !cnv) return
      c.setTransform(1, 0, 0, 1, 0, 0)
      c.clearRect(0, 0, cnv.width, cnv.height)
      c.fillStyle = '#ffffff'
      c.fillRect(0, 0, cnv.width, cnv.height)
      c.setTransform(dpr.value, 0, 0, dpr.value, 0, 0)

      for (const s of props.strokes) drawStroke(s)

      if (inProgress.value) drawStroke(inProgress.value)
    }

    const resize = () => {
      if (!canvas.value || !stage.value) return
      dpr.value = window.devicePixelRatio || 1
      // Use the canvas's own client rect (not the stage's) so the drawing surface
      // matches exactly what getBoundingClientRect returns for pointer events.
      const rect = canvas.value.getBoundingClientRect()
      canvas.value.width = Math.round(rect.width * dpr.value)
      canvas.value.height = Math.round(rect.height * dpr.value)
      ctx.value.setTransform(dpr.value, 0, 0, dpr.value, 0, 0)
      redraw()
    }

    const pointFromEvent = e => {
      // getBoundingClientRect is live; recomputing per event keeps coords accurate
      // even after layout shifts (e.g. masked-word appears/disappears above canvas).
      const r = canvas.value.getBoundingClientRect()
      const t = e.touches && e.touches.length ? e.touches[0] : (e.changedTouches && e.changedTouches[0]) || e
      // Account for CSS scaling between display rect and the canvas's internal
      // coordinate system (rare in this layout, but defensive).
      const scaleX = canvas.value.clientWidth ? r.width / canvas.value.clientWidth : 1
      const scaleY = canvas.value.clientHeight ? r.height / canvas.value.clientHeight : 1

      return {
        x: (t.clientX - r.left) / scaleX,
        y: (t.clientY - r.top) / scaleY
      }
    }

    const flushBatch = (final = false) => {
      if (currentBatchPoints.value.length > 0 && currentStrokeId.value) {
        emit('chunk', {
          strokeId: currentStrokeId.value,
          tool: props.tool === 'eraser' ? 'eraser' : 'brush',
          color: props.tool === 'eraser' ? '#ffffff' : props.color,
          size: props.tool === 'eraser' ? props.size * 2.2 : props.size,
          points: currentBatchPoints.value.slice()
        })
        const last = currentBatchPoints.value[currentBatchPoints.value.length - 1]
        currentBatchPoints.value = last ? [last] : []
      }

      if (!final && drawing.value) {
        batchTimer.value = setTimeout(flushBatch, STREAM_INTERVAL_MS)
      }
    }

    const start = e => {
      if (!props.drawable) return
      const pt = pointFromEvent(e)
      const t = props.tool

      if (t === 'fill') {
        const chunk = {
          strokeId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          tool: 'fill',
          color: props.color,
          size: props.size,
          x: pt.x,
          y: pt.y
        }
        emit('chunk', chunk)
        emit('stroke-end', { strokeId: chunk.strokeId })

        return
      }

      drawing.value = true
      currentStrokeId.value = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

      if (t === 'brush' || t === 'eraser') {
        currentBatchPoints.value = [pt]
        inProgress.value = {
          strokeId: currentStrokeId.value,
          tool: t === 'eraser' ? 'eraser' : 'brush',
          color: t === 'eraser' ? '#ffffff' : props.color,
          size: t === 'eraser' ? props.size * 2.2 : props.size,
          points: [pt]
        }
        flushBatch()

        return
      }

      inProgress.value = {
        strokeId: currentStrokeId.value,
        tool: t,
        color: props.color,
        size: props.size,
        x1: pt.x,
        y1: pt.y,
        x2: pt.x,
        y2: pt.y
      }
      redraw()
    }

    const move = e => {
      if (!props.drawable || !drawing.value || !inProgress.value) return
      const pt = pointFromEvent(e)
      const t = inProgress.value.tool

      if (t === 'brush' || t === 'eraser') {
        currentBatchPoints.value.push(pt)
        inProgress.value.points.push(pt)
        redraw()

        return
      }

      inProgress.value.x2 = pt.x
      inProgress.value.y2 = pt.y
      redraw()
    }

    const end = () => {
      if (!drawing.value || !inProgress.value) return
      drawing.value = false
      const stroke = inProgress.value
      inProgress.value = null

      if (batchTimer.value) {
        clearTimeout(batchTimer.value)
        batchTimer.value = null
      }

      if (stroke.tool === 'brush' || stroke.tool === 'eraser') {
        flushBatch(true)
        emit('stroke-end', { strokeId: currentStrokeId.value })
        currentStrokeId.value = null

        return
      }

      const { strokeId, tool, color, size, x1, y1, x2, y2 } = stroke
      emit('chunk', { strokeId, tool, color, size, x1, y1, x2, y2 })
      emit('stroke-end', { strokeId })
      currentStrokeId.value = null
    }

    watch(
      () => props.strokes.length,
      () => redraw()
    )

    let resizeObserver = null

    onMounted(() => {
      ctx.value = canvas.value.getContext('2d')
      resize()
      window.addEventListener('resize', resize)

      // Layout shifts inside the page (e.g. masked-word appearing/disappearing
      // above the canvas) move the canvas without firing window.resize; the
      // observer keeps cursor-to-stroke alignment correct.
      if (typeof ResizeObserver !== 'undefined' && stage.value) {
        resizeObserver = new ResizeObserver(() => resize())
        resizeObserver.observe(stage.value)
      }
    })

    onBeforeUnmount(() => {
      window.removeEventListener('resize', resize)

      if (resizeObserver) resizeObserver.disconnect()

      if (batchTimer.value) clearTimeout(batchTimer.value)
    })

    return { stage, canvas, hint, start, move, end }
  }
})
</script>

<style src="./DrawCanvas.component.scss" lang="scss" scoped />
