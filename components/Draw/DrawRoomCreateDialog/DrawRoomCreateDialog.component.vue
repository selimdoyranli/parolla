<template lang="pug">
.draw-create-dialog
  .draw-create-dialog__backdrop(@click="$emit('close')")
  .draw-create-dialog__panel
    h3 Yeni Oda
    label
      span Görünürlük
      select(v-model="form.isPublic")
        option(:value="true") Public
        option(:value="false") Private (sadece kodla)
    label
      span Şifre (opsiyonel)
      input(v-model="form.password" type="password" maxlength="32")
    label
      span Kapasite ({{ form.capacity }})
      input(v-model.number="form.capacity" type="range" min="2" max="16")
    label
      span Tur Sayısı ({{ form.roundCount }})
      input(v-model.number="form.roundCount" type="range" min="3" max="50")
    label
      span Tur Süresi ({{ form.roundDurationSec }}s)
      input(v-model.number="form.roundDurationSec" type="range" min="30" max="180" step="5")
    label
      span Kategoriler
      .draw-create-dialog__cats
        button(v-for="c in allCats" :key="c" type="button" :class="{ active: form.categories.includes(c) }" @click="toggleCat(c)") {{ c }}
    .draw-create-dialog__actions
      button.draw-create-dialog__btn.draw-create-dialog__btn--cancel(type="button" @click="$emit('close')") Vazgeç
      button.draw-create-dialog__btn.draw-create-dialog__btn--submit(type="button" @click="submit") Oda Kur
</template>

<script>
import { defineComponent, reactive } from '@nuxtjs/composition-api'

const ALL = ['hayvan', 'yemek', 'nesne', 'meslek', 'doga', 'spor', 'eylem', 'kavram', 'ulke', 'marka']

export default defineComponent({
  setup(_, { emit }) {
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

    const submit = () => {
      const payload = { ...form }

      if (!payload.password) payload.password = null

      if (payload.categories.length === 0) payload.categories = [...ALL]
      emit('submit', payload)
    }

    return { form, allCats: ALL, toggleCat, submit }
  }
})
</script>

<style src="./DrawRoomCreateDialog.component.scss" lang="scss" scoped />
