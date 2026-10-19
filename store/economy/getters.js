export default {
  catalogMap: state => Object.fromEntries(state.catalog.items.map(item => [item.key, item]))
}
