<template lang="pug">
.how-to-play-wordblock-mode-content
  .instructions
    p Günün Kelimesini Bul
    p Her tahmin 5 harfli doğru bir kelime olmalıdır. Göndermek için enter'a bas.
    p Her tahminden sonra kutucukların renkleri tahmininin yakınlığına göre değişecektir. 5 tahmin hakkın var.

    .examples
      p
        strong Örnekler

      .example
        .row
          .game-tile.correct.reveal
            span k
          .game-tile
            span a
          .game-tile
            span l
          .game-tile
            span e
          .game-tile
            span m
        p
          strong K
          |
          | harfi kelimede var ve doğru yerde.

      .example
        .row
          .game-tile
            span i
          .game-tile.present.reveal
            span n
          .game-tile
            span s
          .game-tile
            span a
          .game-tile
            span n
        p
          strong N
          |
          | harfi kelimede var fakat yanlış yerde.

      .example
        .row
          .game-tile
            span ç
          .game-tile
            span a
          .game-tile
            span t
          .game-tile
            span a
          .game-tile.absent.reveal
            span l
        p
          strong L
          |
          | harfi kelimede yok.

    p
      strong Her gün yeni bir kelime gelir!
</template>

<script>
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  setup() {}
})
</script>

<style lang="scss" src="./HowToPlayWordblockModeContent.component.scss"></style>
