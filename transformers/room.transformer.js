const choiceItemTransformer = model => {
  return {
    id: model.id,
    documentId: model.documentId,
    choiceType: model.choiceType,
    mediaNote: model.mediaNote,
    text: model.text,
    youtubeUrl: model.youtubeUrl,
    voteCount: model.voteCount,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    publishedAt: model.publishedAt,
    locale: model.locale,
    media: model.media
  }
}

export default model => {
  return {
    id: model.id,
    roomId: model.roomId,
    documentId: model.documentId,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    publishedAt: model.publishedAt,
    title: model.title,
    isVisible: model.isVisible,
    isListed: model.isPublic,
    isAnon: model.isAnon,
    questionCount: model.questionCount,
    quizType: model.quizType,
    viewCount: model.viewCount,
    reviewCount: model.reviewsCount,
    rating: model.rating,
    user: model.user,
    alphabet: model.alphabet,
    hasMedia: model.hasMedia,
    mediaCount: model.mediaCount,
    questions: model.qaItems,
    choices: model.choices?.map(choiceItemTransformer),
    winnerChoices: model.winnerChoices?.map(choiceItemTransformer),
    answerTypeDominance: model.answerTypeDominance,
    questionTypeDominance: model.questionTypeDominance,
    tags: model.roomTags
      ? model.roomTags.map(tag => {
          return {
            id: tag.id,
            createdAt: tag.createdAt,
            updatedAt: tag.updatedAt,
            publishedAt: tag.publishedAt,
            title: tag.title,
            isFeatured: tag.isFeatured
          }
        })
      : [],
    gameTimeLimit: Number(model.gameTimeLimit)
  }
}
