<template lang="pug">
.choice-list
  span.creator-mode-compose-form__fieldsTitle {{ $t('form.creatorModeCompose.choicesSet') }}
  .creator-mode-compose-form__fields
    .compose-qa-list
      // Choices Type List
      template(v-if="choices && choices.length > 0")
        .choice-list-item(v-for="(item, index) in choices" :key="item.id")
          ChoiceItem(
            :item="item"
            :index="index"
            :get-media-src="getMediaSrc"
            :get-media-alt="getMediaAlt"
            @remove="$emit('remove', index)"
            @add-media="$emit('add-media', $event)"
            @delete-media="$emit('delete-media', $event)"
            @update-item="updateChoiceItem($event, index)"
          )

      // Empty List
      template(v-else)
        Empty.choice-list-empty
          template(#image)
            img.choice-list-empty__icon(src="/img/elements/versus.webp" alt="Versus" draggable="false" width="128" height="128")
          p.choice-list-empty__description {{ $t('form.creatorModeCompose.choices.empty.description') }}
          Button.compose-qa-list__addQaButton(type="info" icon="plus" native-type="button" round @click="$emit('open-batch-dialog')")
            | {{ $t('form.creatorModeCompose.choices.empty.action') }}

      // Add choices button
      Button.compose-qa-list__addQaButton.me-2(
        v-if="choices && choices.length > 0"
        type="info"
        icon="plus"
        plain
        native-type="button"
        round
        :loading="isBusy"
        :disabled="isBusy"
        @click="$emit('add-item')"
      )
        | {{ $t('form.creatorModeCompose.choices.addMore.action') }}

      // Add multiple choices button
      Button(
        v-if="choices && choices.length > 0"
        color="light-dark(#666, #aaa)"
        icon="plus"
        plain
        native-type="button"
        size="small"
        round
        :loading="isBusy"
        :disabled="isBusy"
        @click="$emit('open-batch-dialog')"
      ) {{ $t('form.creatorModeCompose.choices.addMore.addMultiple') }}

    p.creator-mode-compose-form__termsDescription
      | {{ $t('form.creatorModeCompose.termsDescription') }}
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'
import { Empty, Button } from 'vant'
import ChoiceItem from './ChoiceItem.vue'

export default defineComponent({
  name: 'ChoiceList',
  components: {
    Empty,
    Button,
    ChoiceItem
  },
  props: {
    choices: {
      type: Array,
      default: () => []
    },
    isBusy: {
      type: Boolean,
      default: false
    },
    getMediaSrc: {
      type: Function,
      required: true
    },
    getMediaAlt: {
      type: Function,
      required: true
    }
  },
  setup(props, { emit }) {
    const updateChoiceItem = (newItem, index) => {
      const newList = [...props.choices]
      newList[index] = newItem
      emit('update:choices', newList)
    }

    return {
      updateChoiceItem
    }
  }
})
</script>

<style lang="scss" src="./ChoiceList.scss"></style>
