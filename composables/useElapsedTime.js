/**
 * Formats a game's elapsed time for display.
 *
 * useTime().convertMsToTime() is built for the quiz countdown and reports hours, which no
 * wordblock game ever reaches. This keeps it to mm:ss, and rolls minutes past 59 forward
 * rather than wrapping them back to zero.
 */
export const useElapsedTime = () => {
  const padTo2Digits = value => String(value).padStart(2, '0')

  const formatElapsedTime = milliseconds => {
    const total = Number(milliseconds)

    if (!Number.isFinite(total) || total < 0) {
      return '00:00'
    }

    const totalSeconds = Math.floor(total / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    return `${padTo2Digits(minutes)}:${padTo2Digits(seconds)}`
  }

  return {
    formatElapsedTime
  }
}

export default useElapsedTime
