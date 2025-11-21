/**
 * Composable function that provides file extension utility functions.
 * @returns {Object} An object containing file extension utility functions
 */
export default () => {
  /**
   * Extracts the file extension from a filename.
   * @param {string} filename - The filename to extract the extension from
   * @returns {string} The file extension in lowercase (without leading dot)
   * @example
   * getFileExtension('document.pdf') // returns 'pdf'
   * getFileExtension('image.JPG') // returns 'jpg'
   */
  const getFileExtension = filename => {
    return filename.split('.').pop().toLowerCase()
  }

  /**
   * Removes the leading dot from a file extension if present.
   * @param {string} extension - The file extension (with or without leading dot)
   * @returns {string} The file extension without leading dot, in lowercase
   * @example
   * removeDotFromFileExtension('.pdf') // returns 'pdf'
   * removeDotFromFileExtension('jpg') // returns 'jpg'
   */
  const removeDotFromFileExtension = extension => {
    return extension.startsWith('.') ? extension.slice(1).toLowerCase() : extension.toLowerCase()
  }

  /**
   * Adds a leading dot to a file extension if it's missing.
   * @param {string} extension - The file extension (with or without leading dot)
   * @returns {string} The file extension with leading dot
   * @example
   * addDotToFileExtension('pdf') // returns '.pdf'
   * addDotToFileExtension('.jpg') // returns '.jpg'
   */
  const addDotToFileExtension = extension => {
    return extension.startsWith('.') ? extension : `.${extension}`
  }

  /**
   * Checks if a file extension is in the list of allowed extensions.
   * @param {Object} params - The parameters object
   * @param {string} params.extension - The file extension to check
   * @param {string[]} params.extensions - Array of allowed file extensions
   * @returns {boolean} True if the extension is allowed, false otherwise
   * @example
   * isAllowedFileExtension({ extension: 'pdf', extensions: ['pdf', 'jpg', 'png'] }) // returns true
   * isAllowedFileExtension({ extension: 'exe', extensions: ['pdf', 'jpg', 'png'] }) // returns false
   */
  const isAllowedFileExtension = ({ extension, extensions }) => {
    return extensions.includes(extension)
  }

  return {
    getFileExtension,
    removeDotFromFileExtension,
    addDotToFileExtension,
    isAllowedFileExtension
  }
}
