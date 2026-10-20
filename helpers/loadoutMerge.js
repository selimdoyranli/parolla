// Unsaved draft + a server loadout change (shop equip, purchase): take only the slots the server changed since the
// last sync and keep the draft's other edits. Same slot changed on both sides: the server (the later action) wins.
export function mergeServerSlots(draft, prev, next, slots) {
  const merged = { ...draft }

  slots.forEach(slot => {
    const value = (next && next[slot]) || null

    if (value !== ((prev && prev[slot]) || null)) merged[slot] = value
  })

  return Object.fromEntries(Object.entries(merged).filter(([, v]) => v))
}
