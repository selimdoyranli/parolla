const fs = require('fs')
const path = require('path')

function roundNice(val) {
  if (val < 1) return Math.round(val * 10) / 10

  if (val <= 10) return Math.round(val * 10) / 10

  if (val < 50) return Math.round(val / 5) * 5

  if (val < 200) return Math.round(val / 10) * 10

  if (val < 1000) return Math.round(val / 50) * 50

  const p = Math.pow(10, Math.floor(Math.log10(val)) - 1)

  return Math.round(val / p) * p
}

class TycoonDataGenerator {
  constructor(config = {}) {
    this.config = config
    this.usedNames = new Set()
    this.seed = config.seed || 42
  }

  seededRandom() {
    this.seed = (this.seed * 16807) % 2147483647

    return (this.seed - 1) / 2147483646
  }

  shuffle(array) {
    const arr = [...array]

    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.seededRandom() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }

    return arr
  }

  hashString(str) {
    let hash = 0

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }

    return Math.abs(hash)
  }

  assignEmoji(name) {
    const { emojiMap = {}, prefixEmoji = {}, diverseEmojis = [] } = this.config

    // Exact or suffix/root match
    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (name.includes(key)) return emoji
    }

    // Prefix match
    for (const [key, emoji] of Object.entries(prefixEmoji)) {
      if (name.includes(key)) return emoji
    }

    // Diverse emoji fallback via deterministic hash
    if (diverseEmojis && diverseEmojis.length > 0) {
      const index = this.hashString(name) % diverseEmojis.length

      return diverseEmojis[index]
    }

    return '❓'
  }

  getTier(id) {
    const tierCount = this.config.tierCount || 12
    const targetItems = this.config.targetItemsCount || 150

    return Math.min(tierCount, Math.ceil(id / (targetItems / tierCount)))
  }

  isFirstItemOfTier(id) {
    if (id === 1) return true

    const tierCount = this.config.tierCount || 12
    const targetItems = this.config.targetItemsCount || 150
    const itemsPerTier = targetItems / tierCount

    return Math.ceil(id / itemsPerTier) !== Math.ceil((id - 1) / itemsPerTier)
  }

  generate() {
    const {
      gameName = 'Generic Tycoon',
      currency = 'gold',
      tickSeconds = 1,
      targetItemsCount = 100,
      prefixes = [],
      baseItems = [],
      existingItems = [],
      costMultRange = [1.015, 1.03],
      gpsMultRange = [1.013, 1.025],
      outputPath,
      firstCosts = [10, 50, 100],
      costGrowthMult = 2.1,
      minCostMult = 2.5,
      roiEarly = 0.002,
      roiDecay = 0.92,
      roiMin = 0.0001,
      maxCostCap = null
    } = this.config

    const allNamesList = []

    for (const item of existingItems) {
      if (!this.usedNames.has(item.name)) {
        allNamesList.push(item.name)
        this.usedNames.add(item.name)
      }
    }

    const shuffledBases = this.shuffle(baseItems)

    for (const base of shuffledBases) {
      if (!this.usedNames.has(base)) {
        allNamesList.push(base)
        this.usedNames.add(base)
      }
    }

    const shuffledPrefixes = this.shuffle(prefixes)

    for (const prefix of shuffledPrefixes) {
      for (const base of this.shuffle(baseItems)) {
        const name = `${prefix} ${base}`

        if (!this.usedNames.has(name)) {
          allNamesList.push(name)
          this.usedNames.add(name)
        }

        if (allNamesList.length >= targetItemsCount) break
      }

      if (allNamesList.length >= targetItemsCount) break
    }

    const allItems = []
    let lastCost = 0
    let lastGPS = 0
    let nextId = 1

    let nameIndex = 0
    while (allItems.length < targetItemsCount && nameIndex < allNamesList.length) {
      const id = nextId++
      const name = allNamesList[nameIndex++]
      const tier = this.getTier(id)
      const icon = this.assignEmoji(name)
      allItems.push({ id, name, tier, icon, baseCost: 0, goldPerSecond: 0, tickSeconds: 1 })
    }

    const numItems = allItems.length
    const costCap = maxCostCap ?? 999e15
    const firstPaybacks = this.config.firstPaybacks ?? [60, 120, 300]
    const paybackBase = this.config.paybackBase ?? 300
    const paybackGrowth = this.config.paybackGrowth ?? 1.09
    const withinTierGrowth = this.config.withinTierGrowth ?? 1.24
    const tierGateMult = this.config.tierGateMult ?? 2.2

    if (numItems > 0) {
      const costs = new Array(numItems + 1).fill(0)
      const paybacks = new Array(numItems + 1).fill(0)
      const gps = new Array(numItems + 1).fill(0)

      const first_costs = firstCosts || [1, 10, 50]

      costs[1] = first_costs[0] ?? 1
      costs[2] = numItems >= 2 ? first_costs[1] ?? 10 : 0
      costs[3] = numItems >= 3 ? first_costs[2] ?? 50 : 0

      paybacks[1] = firstPaybacks[0] ?? 60
      paybacks[2] = numItems >= 2 ? firstPaybacks[1] ?? 120 : 0
      paybacks[3] = numItems >= 3 ? firstPaybacks[2] ?? 300 : 0

      for (let i = 1; i <= 3 && i <= numItems; i++) {
        gps[i] = costs[i] / paybacks[i]

        if (gps[i] >= costs[i]) gps[i] = costs[i] * 0.99
      }

      for (let i = 4; i <= numItems; i++) {
        if (this.isFirstItemOfTier(i)) {
          costs[i] = costs[i - 1] * tierGateMult
        } else {
          costs[i] = costs[i - 1] * withinTierGrowth
        }
        costs[i] = Math.min(costs[i], costCap)

        paybacks[i] = paybackBase * Math.pow(paybackGrowth, i - 3)
        gps[i] = costs[i] / paybacks[i]

        if (gps[i] >= costs[i]) gps[i] = costs[i] * 0.99
      }

      for (let i = 0; i < numItems; i++) {
        const item = allItems[i]
        const id_idx = item.id

        const c = costs[id_idx]
        let g = gps[id_idx]

        item.baseCost = c < 1e14 ? roundNice(Math.round(c)) : c

        if (g < 0.01) g = Math.round(g * 1000) / 1000
        else if (g < 1) g = Math.round(g * 100) / 100
        else if (g < 100) g = Math.round(g * 10) / 10
        else g = Math.floor(g)

        item.goldPerSecond = Math.max(0.001, g)
      }
    }

    const output = {
      game: gameName,
      currency: currency,
      tickSeconds: tickSeconds,
      items: allItems
    }

    if (outputPath) {
      const dir = path.dirname(outputPath)

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      const jsonStr = JSON.stringify(output, null, 2)
      fs.writeFileSync(outputPath, jsonStr, 'utf-8')
      console.log(`\nSaved to ${outputPath}`)
      console.log(`Total items: ${allItems.length}`)
      console.log(`File size: ${(Buffer.byteLength(jsonStr) / 1024 / 1024).toFixed(2)} MB`)

      this.verify(allItems)
    }

    return output
  }

  verify(allItems) {
    const nameSet = new Set(allItems.map(i => i.name))
    console.log(`\nUnique names: ${nameSet.size} / ${allItems.length}`)

    if (nameSet.size !== allItems.length) {
      console.error('WARNING: Duplicate names detected!')
    }

    for (let i = 0; i < allItems.length; i++) {
      if (allItems[i].id !== i + 1) {
        console.error(`ID mismatch at index ${i}: expected ${i + 1}, got ${allItems[i].id}`)
        break
      }
    }
    console.log('All IDs sequential: OK\n')
    console.log('Sample items:')

    const sampleIds =
      allItems.length >= 100
        ? [1, 10, 25, 50, 75, 100]
        : [1, Math.floor(allItems.length / 4), Math.floor(allItems.length / 2), allItems.length]

    for (const sampleId of sampleIds) {
      const item = allItems[sampleId - 1]

      if (item) {
        console.log(
          `  #${item.id} [Tier ${item.tier}] ${item.icon} "${
            item.name
          }" - Base Cost: ${item.baseCost.toLocaleString()}, GPS: ${item.goldPerSecond.toLocaleString()}`
        )
      }
    }
  }
}

module.exports = TycoonDataGenerator
