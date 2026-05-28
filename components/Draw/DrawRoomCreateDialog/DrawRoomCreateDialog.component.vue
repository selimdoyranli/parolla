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
        span.draw-create-dialog__row-value {{ form.capacity }} oyuncu
      Slider(v-model="form.capacity" :min="2" :max="16" :step="1" :active-color="brand" :bar-height="4")

      .draw-create-dialog__row
        span.draw-create-dialog__row-label Tur sayısı
        span.draw-create-dialog__row-value {{ form.roundCount }}
      Slider(v-model="form.roundCount" :min="3" :max="50" :step="1" :active-color="brand" :bar-height="4")

      .draw-create-dialog__row
        span.draw-create-dialog__row-label Tur süresi
        span.draw-create-dialog__row-value {{ form.roundDurationSec }}sn
      Slider(v-model="form.roundDurationSec" :min="30" :max="180" :step="5" :active-color="brand" :bar-height="4")

    section.draw-create-dialog__section
      .draw-create-dialog__row
        span.draw-create-dialog__row-label Kategoriler
        span.draw-create-dialog__row-value {{ form.categories.length }} / {{ allCats.length }}
      .draw-create-dialog__cats
        Tag.draw-create-dialog__cat(
          v-for="c in allCats"
          :key="c"
          :type="form.categories.includes(c) ? 'primary' : 'default'"
          :plain="!form.categories.includes(c)"
          @click="toggleCat(c)"
        ) {{ c }}

    .draw-create-dialog__actions
      Button(plain block round @click="close") Vazgeç
      Button(type="primary" block round @click="submit") Oda Kur
</template>

<script>
import { defineComponent, reactive, ref } from '@nuxtjs/composition-api'
import { Dialog, Field, Button, Slider, Switch as VanSwitch, Tag } from 'vant'

const ALL = ['hayvan', 'yemek', 'nesne', 'meslek', 'doga', 'spor', 'eylem', 'kavram', 'ulke', 'marka']

export default defineComponent({
  components: {
    // Vant 2'de Dialog hem imperative API hem component; component formu için
    // Dialog.Component register etmek gerekir, yoksa şablonda <Dialog> hiç render
    // edilmez ve modal boş gözükür.
    Dialog: Dialog.Component,
    Field,
    Button,
    Slider,
    // Switch ismi SVG <switch> ile çakışıyor (Vue reserved-tag uyarısı verir).
    VanSwitch,
    Tag
  },
  emits: ['close', 'submit'],
  setup(_, { emit }) {
    // Vant Dialog v-model is the source of truth for "shown"; flipping it to
    // false drives the closed animation, then @closed bubbles up to the parent.
    const visible = ref(true)

    const form = reactive({
      isPublic: true,
      password: '',
      capacity: 12,
      roundCount: 10,
      roundDurationSec: 60,
      categories: [...ALL],
      locale: 'tr-TR'
    })

    const toggleCat = c => {
      const i = form.categories.indexOf(c)

      if (i >= 0) form.categories.splice(i, 1)
      else form.categories.push(c)
    }

    const close = () => {
      visible.value = false
    }

    const submit = () => {
      const payload = { ...form }

      if (!payload.password) payload.password = null

      if (payload.categories.length === 0) payload.categories = [...ALL]
      emit('submit', payload)
      visible.value = false
    }

    return { visible, form, allCats: ALL, toggleCat, close, submit, brand: '#ff7878' }
  }
})
</script>

<style src="./DrawRoomCreateDialog.component.scss" lang="scss" scoped />
