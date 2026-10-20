export default () => ({
  wallet: { gold: 0, dailyStreak: 0, streakFreezes: 0, canClaimDaily: false, nextDailyAmount: 0 },
  catalog: { version: null, items: [] },
  quests: null,
  inventory: null,
  // active free events: [{ series, seriesName, startsAt, endsAt, note }]
  freeEvents: [],
  achievements: null,
  lastEconomy: null,
  guestPreview: null,
  pendingMode: null,
  dialog: { inventory: { isOpen: false, tab: 'shop' } }
})
