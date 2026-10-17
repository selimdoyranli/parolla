import { isGmUser } from '@/helpers/chat-command'

export default ({ $auth, app, redirect }) => {
  if (!isGmUser($auth.user)) {
    redirect(app.localePath({ name: 'Main' }))
  }
}
