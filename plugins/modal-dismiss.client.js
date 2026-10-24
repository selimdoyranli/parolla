import Vue from 'vue'

// Every modal closes through its cancel action on Esc or a click outside it.
// Dialogs without a cancel button (game scenes, forced choices) keep their own overlay rule and ignore Esc.
const openModals = []

const dismiss = vm => {
  if (vm.$options.name === 'van-dialog') {
    if (!vm.showCancelButton || vm.loading.cancel || vm.loading.confirm) return false

    vm.handleAction('cancel')

    return true
  }

  if (!vm.closeOnClickOverlay) return false

  vm.close()

  return true
}

Vue.mixin({
  created() {
    const name = this.$options.name

    if (name !== 'van-dialog' && name !== 'van-popup') return

    const track = isOpen => {
      const index = openModals.indexOf(this)

      if (index > -1) openModals.splice(index, 1)

      if (isOpen) openModals.push(this)
    }

    this.$watch('value', track, { immediate: true })
    this.$once('hook:beforeDestroy', () => track(false))

    if (name !== 'van-dialog') return

    // vant only calls this when closeOnClickOverlay is on, and reports it as 'overlay'
    this.onClickOverlay = () => dismiss(this) || this.handleAction('overlay')
    this.$on('click-overlay', () => !this.closeOnClickOverlay && dismiss(this))
  }
})

// capture phase: runs before vant's own Esc handler on the focused dialog, so cancel fires once
window.addEventListener(
  'keydown',
  event => {
    if (event.key !== 'Escape' || !openModals.length) return

    // the most recently opened modal is the one on top
    if (dismiss(openModals[openModals.length - 1])) event.stopPropagation()
  },
  true
)
