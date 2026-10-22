import { roomTransformer } from '@/transformers'

export default model => ({ ...model, room: roomTransformer(model.room) })
