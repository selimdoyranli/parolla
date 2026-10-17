import { userTransformer } from '@/transformers'

export default model => {
  return {
    documentId: model.documentId,
    content: model.content,
    isDeleted: model.isDeleted,
    isQuizOwner: model.isQuizOwner,
    createdAt: model.createdAt,
    user: model.user ? userTransformer(model.user) : null,
    replyToUser: model.replyToUser,
    likeCount: model.likeCount || 0,
    replyCount: model.replyCount || 0,
    likedByMe: model.likedByMe,
    parentDocumentId: model.parentDocumentId,
    room: model.room || null
  }
}
