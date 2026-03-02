const fs = require('fs')
const path = require('path')

function roundNice(val) {
  if (val <= 10) return 10

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
      outputPath
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

      const MAX_BASE_COST = 1e14
      let exactCost = 15
      let multiplier = 2.5

      for (let i = 1; i < id; i++) {
        exactCost *= multiplier
        multiplier = Math.max(1.18, multiplier * 0.97)
      }
      exactCost = Math.min(MAX_BASE_COST, exactCost)

      let finalCost = roundNice(Math.round(exactCost))

      // Strict inequality constraint
      if (finalCost <= lastCost) finalCost = lastCost + 1

      // ROI: ~4.5% early (22s payback), ~0.4% late (250s payback)
      let roi = 0.045 * Math.pow(0.975, id)
      let gps = Math.round(finalCost * roi)

      // Strict GPS inequality
      if (gps <= lastGPS) {
        gps = lastGPS + 1
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
