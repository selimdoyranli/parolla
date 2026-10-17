// GM-only slash commands (/system_message, /clear_chat). The server enforces the role
// check authoritatively; this only routes the text so a non-GM typing `/foo` still
// sends it as a normal chat message.
export const isGmUser = user => user?.role?.name === 'GM'

export const parseChatCommand = (raw, user) => {
  if (!isGmUser(user)) return null

  const trimmed = raw.trim()

  if (!trimmed.startsWith('/')) return null

  const [name, ...args] = trimmed.slice(1).split(/\s+/)

  if (!name) return null

  return { command: name.toLowerCase(), args }
}
