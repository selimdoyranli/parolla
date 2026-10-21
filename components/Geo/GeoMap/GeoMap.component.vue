<template lang="pug">
.geo-map(:class="{ 'geo-map--interactive': interactive }")
  .geo-map__canvas(ref="canvasRef")
</template>

<script>
import { defineComponent, ref, watch, onMounted, onBeforeUnmount, useContext } from '@nuxtjs/composition-api'
import 'leaflet/dist/leaflet.css'

// Same source as the Street View panoramas, labelled in the player's language. Dark mode is a CSS filter on the tiles.
// shortcut: keyless Google tiles — switch to the Map Tiles API (billed key) if Google starts blocking them.
const TILE_URL = 'https://mt{s}.google.com/vt/lyrs=m&hl={hl}&x={x}&y={y}&z={z}'
const TILE_ATTRIBUTION = '&copy; Google'

/**
 * Generic location picker / result map. Knows nothing about GeoGuess, so creator quizzes can reuse it
 * for location-type questions: v-model the picked point, pass `pairs` to reveal guesses against answers.
 */
export default defineComponent({
  props: {
    // Picked point { lat, lng } — v-model
    value: {
      type: Object,
      required: false,
      default: null
    },
    interactive: {
      type: Boolean,
      required: false,
      default: true
    },
    // [{ guess: { lat, lng } | null, answer: { lat, lng } }] — drawn with a connecting line, map fits to them
    pairs: {
      type: Array,
      required: false,
      default: () => []
    },
    view: {
      type: Object,
      required: false,
      default: () => ({ center: [25, 10], zoom: 1 })
    }
  },
  setup(props, { emit }) {
    const { i18n } = useContext()
    const canvasRef = ref(null)

    let L = null
    let map = null
    let guessMarker = null
    let pairsLayer = null
    let resizeObserver = null
    let revealedBounds = null

    const pinIcon = modifier =>
      L.divIcon({
        className: `geo-map-pin geo-map-pin--${modifier}`,
        html: '<span class="geo-map-pin__dot"></span>',
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      })

    const resetView = () => map?.setView(props.view.center, props.view.zoom, { animate: false })

    // Extra bottom room: callers usually float a result card over the lower part of the map
    const fitRevealed = () =>
      revealedBounds &&
      map.fitBounds(revealedBounds, { paddingTopLeft: [48, 64], paddingBottomRight: [48, 200], maxZoom: 14, animate: false })

    const renderGuess = () => {
      if (!map) return

      // Once pairs are revealed they draw their own guess pins
      if (!props.value || props.pairs.length) {
        guessMarker?.remove()
        guessMarker = null

        return
      }

      if (guessMarker) {
        guessMarker.setLatLng(props.value)
      } else {
        guessMarker = L.marker(props.value, { icon: pinIcon('guess'), interactive: false }).addTo(map)
      }
    }

    const renderPairs = () => {
      if (!map) return

      pairsLayer.clearLayers()

      if (!props.pairs.length) {
        revealedBounds = null
        resetView()

        return
      }

      const bounds = []

      props.pairs.forEach(({ guess, answer }) => {
        L.marker(answer, { icon: pinIcon('answer'), interactive: false }).addTo(pairsLayer)
        bounds.push(answer)

        if (!guess) return

        L.marker(guess, { icon: pinIcon('guess'), interactive: false }).addTo(pairsLayer)
        L.polyline([guess, answer], { className: 'geo-map-line', weight: 3, dashArray: '6 8' }).addTo(pairsLayer)
        bounds.push(guess)
      })

      revealedBounds = bounds
      fitRevealed()
    }

    onMounted(async () => {
      L = (await import('leaflet')).default

      map = L.map(canvasRef.value, {
        center: props.view.center,
        zoom: props.view.zoom,
        minZoom: 1,
        worldCopyJump: true,
        zoomControl: false,
        attributionControl: true
      })
      L.control.zoom({ position: 'topright' }).addTo(map)
      map.attributionControl.setPrefix(false)
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, subdomains: '0123', maxZoom: 20, hl: i18n.locale }).addTo(map)
      pairsLayer = L.layerGroup().addTo(map)

      map.on('click', event => {
        if (!props.interactive) return

        // Wrap so a click on a repeated world copy still yields a real longitude
        const { lat, lng } = event.latlng.wrap()
        emit('input', { lat, lng })
      })

      // The map lives in panels that grow/shrink (hover, mobile toggle, reveal) — keep tiles in sync
      // A reveal usually grows the map right as the pairs arrive, so refit once the new size settles
      resizeObserver = new ResizeObserver(() => {
        if (!map) return

        map.invalidateSize()
        fitRevealed()
      })
      resizeObserver.observe(canvasRef.value)

      renderGuess()
      renderPairs()
    })

    watch(() => props.value, renderGuess)
    watch(
      () => props.pairs,
      () => {
        renderPairs()
        renderGuess()
      }
    )
    watch(() => props.view, resetView)

    onBeforeUnmount(() => {
      resizeObserver?.disconnect()
      map?.remove()
      map = null
    })

    return {
      canvasRef,
      resetView
    }
  }
})
</script>

<style lang="scss" src="./GeoMap.component.scss"></style>
