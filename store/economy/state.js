export default () => ({
  wallet: { jeton: 0, dailyStreak: 0, streakFreezes: 0, canClaimDaily: false, nextDailyAmount: 0 },
  catalog: { version: null, items: [] },
  quests: null,
  inventory: null,
  achievements: null,
  lastEconomy: null,
  guestPreview: null,
  pendingMode: null,
  dialog: { quests: { isOpen: false } }
})
