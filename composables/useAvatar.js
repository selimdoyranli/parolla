/**
 * Composable for avatar generation utilities
 * @returns {Object} Avatar utility functions
 */
export default () => {
  /**
   * Generates a deterministic hex color code based on username from predefined colors
   * @param {string} username - The username to generate color for
   * @returns {string} 6-digit hex color code from predefined palette
   */
  const generateDeterministicColorByUsername = username => {
    const availableColors = [
      'ff7878',
      '65c9ff',
      'ff6b9d',
      'ffd93d',
      '6bcf7f',
      'a78bfa',
      'f59e0b',
      'ff4757',
      '00d4aa',
      '3742fa',
      'ff7f50',
      '9b6755'
    ]

    if (!username) return availableColors[0]

    let hash = 0

    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash)
    }

    const colorIndex = Math.abs(hash) % availableColors.length

    return availableColors[colorIndex]
  }

  /**
   * Generates avatar configuration object based on username
   * @param {string} username - The username to generate avatar config for
   * @returns {Object} Avatar configuration object
   * @returns {string} returns.seed - The username seed for avatar generation
   * @returns {string[]} returns.backgroundColor - Array containing hex color code
   */
  const generateAvatarConfigByUsername = username => {
    const hex = generateDeterministicColorByUsername(username)

    return {
      seed: username,
      backgroundColor: [hex]
    }
  }

  return {
    generateAvatarConfigByUsername
  }
}
