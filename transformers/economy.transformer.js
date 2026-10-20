// /economy/me and /users/me `economy` -> wallet state
export const walletTransformer = model => ({
  gold: model.gold || 0,
  dailyStreak: model.dailyStreak || 0,
  streakFreezes: model.streakFreezes || 0,
  canClaimDaily: Boolean(model.canClaimDaily),
  nextDailyAmount: model.nextDailyAmount || 0
})
