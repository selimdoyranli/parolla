<template lang="pug">
.quiz-carousel(v-if="rooms.length > 0")
  .quiz-carousel__swiper.swiper(ref="swiperRef")
    .swiper-wrapper
      .swiper-slide.quiz-carousel__slide(v-for="(room, index) in rooms" :key="room.roomId")
        QuizCard(:room="room" :index="index")

  button.quiz-carousel__nav.quiz-carousel__nav--prev(ref="prevRef" type="button" aria-label="prev")
    AppIcon(name="tabler:chevron-left" :width="20" :height="20")

  button.quiz-carousel__nav.quiz-carousel__nav--next(ref="nextRef" type="button" aria-label="next")
    AppIcon(name="tabler:chevron-right" :width="20" :height="20")
</template>

<script>
import { defineComponent, ref, watch, onMounted, onBeforeUnmount, nextTick } from '@nuxtjs/composition-api'
// Swiper
import Swiper, { Navigation } from 'swiper'
import 'swiper/swiper-bundle.min.css'

export default defineComponent({
  props: {
    rooms: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  setup(props) {
    const swiperRef = ref(null)
    const prevRef = ref(null)
    const nextRef = ref(null)

    let swiper = null

    const destroySwiper = () => {
      if (swiper) {
        swiper.destroy(true, true)
        swiper = null
      }
    }

    // The rooms arrive after the block has rendered, so the swiper is (re)built once they land
    const buildSwiper = async () => {
      await nextTick()
      destroySwiper()

      if (!swiperRef.value || props.rooms.length === 0) {
        return
      }

      swiper = new Swiper(swiperRef.value, {
        modules: [Navigation],
        cssMode: true,
        direction: 'horizontal',
        slidesPerView: 'auto',
        spaceBetween: 12,
        speed: 500,
        watchOverflow: true,
        navigation: {
          prevEl: prevRef.value,
          nextEl: nextRef.value
        }
      })
    }

    watch(() => props.rooms, buildSwiper)

    onMounted(buildSwiper)
    onBeforeUnmount(destroySwiper)

    return {
      swiperRef,
      prevRef,
      nextRef
    }
  }
})
</script>

<style lang="scss" src="./QuizCarousel.component.scss"></style>
