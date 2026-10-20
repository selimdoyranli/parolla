export default {
  catalogMap: state => Object.fromEntries(state.catalog.items.map(item => [item.key, item])),
  // series -> latest end of its running free events (overlapping events are a union)
  freeSeriesEnds: state => {
    const ends = {}

    for (const e of state.freeEvents) if (!ends[e.series] || e.endsAt > ends[e.series]) ends[e.series] = e.endsAt

    return ends
  },
  // for-sale items of a free series: anyone can equip them without owning them
  freeKeys: (state, getters) =>
    new Set(state.catalog.items.filter(i => getters.freeSeriesEnds[i.series] && i.price != null && i.rarity !== 'sezon').map(i => i.key))
}
