import { nextTick } from '@nuxtjs/composition-api'

export default () => {
  const layoutScrollToTop = () => {
    nextTick(() => {
      document.querySelector('.layout__main').scrollTo(0, 0)
    })
  }

  return {
    layoutScrollToTop
  }
}
