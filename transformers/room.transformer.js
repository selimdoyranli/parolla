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
    choices: model.choices || [],
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
