import VuexPersistence from 'vuex-persist'
import { WORDBLOCK_AVAILABLE_LENGTHS, WORDBLOCK_FALLBACK_LOCALE } from '@/system/constant'

export default ({ store }) => {
  new VuexPersistence({
    key: 'persistStore',
    reducer: state => ({
      auth: {
        user: state.auth.user
      },
      app: {
        soundFx: state.app.soundFx
      },
      daily: {
        isGameOver: state.daily.isGameOver,
        currentDate: state.daily.currentDate,
        questions: state.daily.questions
      },
      wordblock:
        state.wordblock && state.wordblock.games
          ? {
              games: state.wordblock.games,
              isActiveKeyboard: state.wordblock.isActiveKeyboard
            }
          : {},
      draw:
        state.draw && state.draw.guest
          ? {
              guest: {
                id: state.draw.guest.id,
                name: state.draw.guest.name,
                avatarSeed: state.draw.guest.avatarSeed
              }
            }
          : {}
    })
  }).plugin(store)

  // One-shot migration: returning users may have the legacy single-flag
  // soundFx.isActive. Map it to both new flags, then drop the old key so
  // future saves don't keep it around.
  const sfx = store.state.app.soundFx

  if (sfx && typeof sfx.isActive === 'boolean') {
    store.commit('app/SET_IS_ACTIVE_REACTION_SOUND_FX', sfx.isActive)
    store.commit('app/SET_IS_ACTIVE_GAME_SCENE_SOUND_FX', sfx.isActive)
    delete sfx.isActive
  }

  // One-shot migration: wordblock games used to be keyed by charLength alone, so a
  // finished game counted as finished in every locale. The restore deep-merges those
  // numeric keys in next to the new locale-keyed slots — move them under the locale they
  // were actually played in (the mode was Turkish-only) and drop them, so future saves
  // don't carry the old shape.
  const games = store.state.wordblock?.games

  if (games) {
    WORDBLOCK_AVAILABLE_LENGTHS.forEach(charLength => {
      const legacyGame = games[charLength]

      if (legacyGame && games[WORDBLOCK_FALLBACK_LOCALE]) {
        games[WORDBLOCK_FALLBACK_LOCALE][charLength] = legacyGame
        delete games[charLength]
      }
    })
  }
}
