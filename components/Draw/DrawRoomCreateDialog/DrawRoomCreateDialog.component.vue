<template lang="pug">
Dialog.draw-create-dialog(
  v-model="visible"
  :show-confirm-button="false"
  :show-cancel-button="false"
  :close-on-click-overlay="true"
  width="92%"
  @closed="$emit('close')"
)
  .draw-create-dialog__inner
    header.draw-create-dialog__head
      h3.draw-create-dialog__title Yeni Oda
      p.draw-create-dialog__subtitle Ayarları belirle, oyuna başla.

    section.draw-create-dialog__section
      .draw-create-dialog__row
        span.draw-create-dialog__row-label Görünürlük
        VanSwitch(v-model="form.isPublic" :active-color="brand")
      p.draw-create-dialog__row-hint {{ form.isPublic ? 'Açık odalar lobide listelenir.' : 'Sadece kodla katılınabilir.' }}

      .draw-create-dialog__row
        span.draw-create-dialog__row-label Şifre (opsiyonel)
      Field.draw-create-dialog__field(
        v-model="form.password"
        type="password"
        placeholder="Boş bırakırsan şifresiz olur"
        clearable
        :maxlength="32"
      )

      .draw-create-dialog__row
        span.draw-create-dialog__row-label Kapasite
        .draw-create-dialog__stepper
          Stepper(v-model="form.capacity" :min="2" :max="16" :step="1" :integer="true")
          span.draw-create-dialog__stepper-unit oyuncu

      .draw-create-dialog__row
        span.draw-create-dialog__row-label Tur sayısı
        .draw-create-dialog__stepper
          Stepper(v-model="form.roundCount" :min="3" :max="50" :step="1" :integer="true")

      .draw-create-dialog__row
        span.draw-create-dialog__row-label Tur süresi
        .draw-create-dialog__stepper
          Stepper(v-model="form.roundDurationSec" :min="30" :max="180" :step="5" :integer="true")
          span.draw-create-dialog__stepper-unit sn

    section.draw-create-dialog__section
      .draw-create-dialog__row
        span.draw-create-dialog__row-label Kategori
        span.draw-create-dialog__row-value {{ selectedTitle }}
      .draw-create-dialog__cats(v-if="allCats.length")
        Tag.draw-create-dialog__cat(
          v-for="c in allCats"
          :key="c.slug"
          :type="form.categorySlug === c.slug ? 'primary' : 'default'"
          :plain="form.categorySlug !== c.slug"
          @click="selectCat(c.slug)"
        ) {{ c.title }}
      p.draw-create-dialog__row-hint(v-else) {{ catsLoading ? 'Kategoriler yükleniyor…' : 'Kategori bulunamadı.' }}

    .draw-create-dialog__actions
      Button.draw-create-dialog__cancel(plain block round @click="close") Vazgeç
      Button(type="primary" block round @click="submit") Oda Kur
</template>

<script>
import { defineComponent, reactive, ref, computed, onMounted, getCurrentInstance } from '@nuxtjs/composition-api'
import { Dialog, Field, Button, Stepper, Switch as VanSwitch, Tag } from 'vant'
import { sortDrawCategories } from '@/helpers/draw-categories'

export default defineComponent({
  components: {
    // Vant 2'de Dialog hem imperative API hem component; component formu için
    // Dialog.Component register etmek gerekir, yoksa şablonda <Dialog> hiç render
    // edilmez ve modal boş gözükür.
    Dialog: Dialog.Component,
    Field,
    Button,
    Stepper,
    // Switch ismi SVG <switch> ile çakışıyor (Vue reserved-tag uyarısı verir).
    VanSwitch,
    Tag
  },
  emits: ['close', 'submit'],
  setup(_, { emit }) {
    // Vant Dialog v-model is the source of truth for "shown"; flipping it to
    // false drives the closed animation, then @closed bubbles up to the parent.
    const visible = ref(true)
    const vm = getCurrentInstance().proxy

    // Categories are fetched from Strapi DrawWordCategory so the dialog never
    // drifts from the seeded JSON.
    const allCats = ref([])
    const catsLoading = ref(true)

    const form = reactive({
      isPublic: true,
      password: '',
      capacity: 12,
      roundCount: 25,
      roundDurationSec: 60,
      // Exactly one category per room (radio-style). null until allCats loads.
      categorySlug: null,
      locale: 'tr-TR'
    })

    const selectedTitle = computed(() => {
      const found = allCats.value.find(c => c.slug === form.categorySlug)

      return found ? found.title : catsLoading.value ? '—' : 'Seçili değil'
    })

    onMounted(async () => {
      try {
        const { data } = await vm.$appFetch({
          path: 'draw-word-categories',
          query: {
            'filters[isActive][$eq]': true,
            'pagination[pageSize]': 100,
            sort: 'title:asc',
            locale: form.locale
          }
        })

        const items = (data && data.data) || []
        const normalized = items
          .map(c => ({ slug: c.slug || (c.attributes && c.attributes.slug), title: c.title || (c.attributes && c.attributes.title) }))
          .filter(c => c.slug && c.title)

        // Order tags so "Genel / Yemekler / Meslekler" appear first regardless
        // of the Strapi alpha sort, then the rest fall back to locale alpha.
        allCats.value = sortDrawCategories(normalized)

        if (allCats.value.length > 0 && !form.categorySlug) {
          form.categorySlug = allCats.value[0].slug
        }
      } catch (e) {
        allCats.value = []
      } finally {
        catsLoading.value = false
      }
    })

    const selectCat = slug => {
      form.categorySlug = slug
    }

    const close = () => {
      visible.value = false
    }

    const submit = () => {
      if (!form.categorySlug) return
      // WS contract still uses `categories` (array); we always send exactly one.
      const payload = {
        isPublic: form.isPublic,
        password: form.password || null,
        capacity: form.capacity,
        roundCount: form.roundCount,
        roundDurationSec: form.roundDurationSec,
        locale: form.locale,
        categories: [form.categorySlug]
      }

      emit('submit', payload)
      visible.value = false
    }

    return { visible, form, allCats, catsLoading, selectedTitle, selectCat, close, submit, brand: '#ff7878' }
  }
})
</script>

<style src="./DrawRoomCreateDialog.component.scss" lang="scss" scoped />
