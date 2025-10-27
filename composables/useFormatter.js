import { useContext, computed } from '@nuxtjs/composition-api'

export default () => {
  const context = useContext()

  /**
   * Turkish to english char converter
   * @param {string} value
   * @returns English variant of turkish characters
   */
  const encodeEnglish = value => {
    return value
      .replace(/ /g, '-')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ç/g, 'c')
      .replace(/ğ/g, 'g')
      .replace(/ö/g, 'o')
      .replace(/ü/g, 'u')
      .replace(/Ş/g, 's')
      .replace(/İ/g, 'i')
      .replace(/I/g, 'i')
      .replace(/Ç/g, 'c')
      .replace(/Ğ/g, 'g')
      .replace(/Ö/g, 'o')
      .replace(/Ü/g, 'u')
      .replace(/-{2,}/g, '-')
  }

  /**
   * Rating value formatter
   * @param {number} value
   * @returns e.g. 5, 4.33, 1
   */
  const formatRating = value => {
    const rating = Number(value)

    if (rating % 1 === 0) {
      return rating.toFixed(0) // remove decimal places if it's an integer
    } else {
      return rating.toFixed(1) // remove trailing zeros after the first decimal place
    }
  }

  /**
   * Formats a number into a string representation with appropriate suffixes.
   * @param {number} value - The number to format.
   * @returns {string} The formatted number with 'B' for thousands, 'M' for millions, or the number itself if less than 1000.
   */
  const formatMillions = value => {
    const decimal = Number(value)

    if (decimal >= 1000000) {
      return (decimal / 1000000).toFixed(0) + 'M' // For millions
    } else if (decimal >= 1000) {
      return (decimal / 1000).toFixed(0) + (context.i18n.locale === 'tr' ? 'B' : 'K') // For thousands
    } else {
      return decimal.toFixed(0) // For values less than 1000
    }
  }

  /**
   * Converts a timestamp to a human-readable date and time format with customizable components
   * @param {number|string} timestamp - The timestamp in milliseconds or ISO string
   * @param {Object} options - Formatting options
   * @param {boolean} options.showHour - Whether to show hours (default: true)
   * @param {boolean} options.showMinute - Whether to show minutes (default: true)
   * @param {boolean} options.showSecond - Whether to show seconds (default: false)
   * @param {boolean} options.showDay - Whether to show day (default: false)
   * @param {boolean} options.showMonth - Whether to show month (default: false)
   * @param {boolean} options.showYear - Whether to show year (default: false)
   * @returns {string} Formatted date and time according to specified options
   */
  const isoToHumanDate = (timestamp, options = {}) => {
    // Default options
    const defaultOptions = {
      showHour: true,
      showMinute: true,
      showSecond: false,
      showDay: false,
      showMonth: false,
      showYear: false
    }

    // Merge default options with provided options
    const formatOptions = { ...defaultOptions, ...options }

    // Check if timestamp is a number (milliseconds)
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp)

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }

    // Build formatting options for toLocaleString
    const localeOptions = {}

    if (formatOptions.showHour) localeOptions.hour = '2-digit'

    if (formatOptions.showMinute) localeOptions.minute = '2-digit'

    if (formatOptions.showSecond) localeOptions.second = '2-digit'

    if (formatOptions.showDay) localeOptions.day = '2-digit'

    if (formatOptions.showMonth) localeOptions.month = '2-digit'

    if (formatOptions.showYear) localeOptions.year = 'numeric'

    return date.toLocaleString(context.i18n.locale, localeOptions)
  }

  /**
   * Formats the current year and the next year as a season year
   * @returns {string} The formatted season year
   */
  const seasonYear = computed(() => {
    return `${new Date().getFullYear().toString().slice(2)}-${(new Date().getFullYear() + 1).toString().slice(2)}`
  })

  return {
    encodeEnglish,
    formatRating,
    formatMillions,
    isoToHumanDate,
    seasonYear
  }
}
