import { WORDBLOCK_FALLBACK_LOCALE } from '@/system/constant'
import { defaultGameState } from './state'

// Read-only stand-in for a slot that does not exist. Frozen and shared so getters keep
// returning the same reference instead of a fresh object on every render.
const EMPTY_GAME = Object.freeze(defaultGameState())

/**
 * Resolve one game slot out of the locale-keyed games map.
 *
 * Slots are pre-created for every supported locale and character length, so a miss means
 * the caller passed something unexpected — a locale wordblock has no alphabet for, or a
 * character length outside WORDBLOCK_AVAILABLE_LENGTHS. Degrade to the default locale and
 * then to an empty slot, so a getter never throws mid-render.
 */
export const resolveGame = (state, locale, charLength) => {
  return state.games?.[locale]?.[charLength] || state.games?.[WORDBLOCK_FALLBACK_LOCALE]?.[charLength] || EMPTY_GAME
}
