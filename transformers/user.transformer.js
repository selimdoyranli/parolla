export default model => {
  return {
    blocked: model.blocked,
    confirmed: model.confirmed,
    createdAt: model.createdAt,
    documentId: model.documentId,
    email: model.email,
    id: model.id,
    provider: model.provider,
    publishedAt: model.publishedAt,
    updatedAt: model.updatedAt,
    username: model.username,
    ...(model.diceBear && {
      diceBear: {
        dataImage: model.diceBear.dataImage,
        ...(model.diceBear.config && {
          config: {
            seed: model.diceBear.config.seed,
            mouth: model.diceBear.config.mouth,
            eyes: model.diceBear.config.eyes,
            eyebrows: model.diceBear.config.eyebrows,
            hair: model.diceBear.config.hair,
            hairColor: model.diceBear.config.hairColor,
            earrings: model.diceBear.config.earrings,
            features: model.diceBear.config.features,
            glasses: model.diceBear.config.glasses,
            skinColor: model.diceBear.config.skinColor,
            backgroundColor: model.diceBear.config.backgroundColor
          }
        })
      }
    }),
    fullname: model.fullname,
    bio: model.bio,
    ...(model.tourScore && {
      tourScore: {
        ...(model.tourScore.daily && {
          daily: {
            score: model.tourScore.daily.score,
            rank: model.tourScore.daily.rank
          }
        }),
        ...(model.tourScore.weekly && {
          weekly: {
            score: model.tourScore.weekly.score,
            rank: model.tourScore.weekly.rank
          }
        }),
        ...(model.tourScore.monthly && {
          monthly: {
            score: model.tourScore.monthly.score,
            rank: model.tourScore.monthly.rank
          }
        }),
        ...(model.tourScore.season && {
          season: {
            score: model.tourScore.season.score,
            rank: model.tourScore.season.rank
          }
        }),

        total: model.tourScore.total
      }
    })
  }
}
