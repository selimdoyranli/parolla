import { roomTransformer } from '@/transformers'

export default model => ({ ...model, room: model.room ? roomTransformer(model.room) : null })
