const MILESTONES = [
  { threshold: 10, multiplier: 2 },
  { threshold: 25, multiplier: 2 },
  { threshold: 50, multiplier: 2.5 },
  { threshold: 100, multiplier: 4 },
  { threshold: 200, multiplier: 8 }
]

export function getMilestoneMultiplier(ownedCount) {
  let mult = 1

  for (const { threshold, multiplier } of MILESTONES) {
    if (ownedCount >= threshold) mult *= multiplier
  }

  return mult
}

export default {
  gold(state) {
    return state.gold
  },

  goldPerSecond(state) {
    return state.goldPerSecond
  },

  goldPerClick(state) {
    // Tap: 0.1 base + 0.01% of GPS — decimal support, tap cannot easily level up
    return 0.1 + state.goldPerSecond * 0.0001
  },

  itemCost: state => id => {
    const item = state.items.find(i => i.id === id)

    if (!item) return 0

    const ownedCount = state.ownedItems[id] || 0
    const base = item.baseCost !== undefined ? item.baseCost : item.cost
    const cost = base * Math.pow(1.15, ownedCount)

    // 1.15 multiplier — repeat purchases cost more; decimal support
    return cost < 100 ? Math.round(cost * 10) / 10 : Math.floor(cost)
  },

  ownedItems(state) {
    return state.ownedItems
  },

  items(state) {
    return state.items
  },

  isLoaded(state) {
    return state.isLoaded
  },

  debugUnlockAll(state) {
    return state.debugUnlockAll
  },

  economyVersion(state) {
    return state.economyVersion || ''
  }
}
