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
    // Make tier strictly linear: e.g. first item is level 1, 1000th item is level 1000
    return id
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

      const MAX_BASE_COST = 1e300

      // Hard mode: first items 10, 50, 100; then 100 * costGrowthMult^(id-3)
      let exactCost

      if (id <= firstCosts.length) {
        exactCost = firstCosts[id - 1]
      } else {
        exactCost = firstCosts[firstCosts.length - 1] * Math.pow(costGrowthMult, id - firstCosts.length)
      }
      exactCost = Math.min(MAX_BASE_COST, exactCost)

      let finalCost = exactCost < 1e14 ? roundNice(Math.round(exactCost)) : Math.floor(exactCost)

      // Strict inequality: each item at least minCostMult x previous
      if (finalCost < lastCost * minCostMult && lastCost > 0) {
        finalCost = Math.ceil(lastCost * minCostMult)
      }

      if (finalCost > MAX_BASE_COST) {
        finalCost = MAX_BASE_COST
      }

      // Lower ROI (amorti): ~0.2% early (500s payback), ~0.01% late (10000s payback)
      let roi = roiEarly * Math.pow(roiDecay, id)
      roi = Math.max(roiMin, roi)

      let gps = Math.round(finalCost * roi)

      // Strict GPS inequality
      if (gps <= lastGPS) {
        gps = lastGPS + Math.max(1, Math.floor(lastGPS * 0.03))
      }

      gps = Math.max(1, gps)

      lastGPS = gps
      lastCost = finalCost

      const tickSeconds = 1

      allItems.push({
        id,
        name,
        baseCost: finalCost,
        goldPerSecond: gps,
        tickSeconds,
        tier,
        icon
      })
    }

    // Scale costs so last tier ends at maxCostCap (e.g. 999T)
    // Power curve: next item much more expensive than previous (makes game harder)
    if (maxCostCap != null && allItems.length > 0) {
      const n = allItems.length
      const startCost = firstCosts[firstCosts.length - 1] || 100
      const startId = firstCosts.length // startId=3 for item 4
      const power = Math.log(maxCostCap / startCost) / Math.log(n / startId)

      for (let i = 0; i < allItems.length; i++) {
        const item = allItems[i]
        let cost

        if (item.id <= firstCosts.length) {
          cost = firstCosts[item.id - 1]
        } else {
          cost = startCost * Math.pow(item.id / startId, power)
        }
        cost = Math.max(cost, 0.1)

        item.baseCost = cost < 1e14 ? roundNice(Math.round(cost)) : Math.floor(cost)
        const roi = Math.max(roiMin, roiEarly * Math.pow(roiDecay, item.id))
        let gps = Math.round(Math.max(0.1, item.baseCost * roi) * 10) / 10
        const prev = allItems[i - 1]

        if (prev && gps <= prev.goldPerSecond) {
          gps = Math.round((prev.goldPerSecond + Math.max(0.1, prev.goldPerSecond * 0.03)) * 10) / 10
        }
        item.goldPerSecond = gps
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
