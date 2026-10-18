import { userTransformer } from '@/transformers'

export default model => {
  return {
    ids: model.ids,
    type: model.type,
    actor: model.actor ? userTransformer(model.actor) : null,
    actorCount: model.actorCount || 0,
    isQuizOwnerActor: model.isQuizOwnerActor,
    room: model.room,
    comment: model.comment,
    meta: model.meta || {},
    isRead: Boolean(model.readAt),
    createdAt: model.createdAt
  }
}
