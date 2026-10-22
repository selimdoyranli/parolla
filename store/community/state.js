export default () => ({
  list: [],
  listFilters: { sort: 'recent', tag: null, search: '' },
  currentCommunity: null,
  approvedMembers: [],
  pendingMembers: [],
  feed: [],
  composeForm: {
    name: '',
    description: '',
    avatar: null,
    coverPhoto: null,
    tags: [],
    visibility: 'public',
    postPermission: 'everyone'
  }
})
