import convertSize from 'convert-size'

export default {
  upload: {
    maxFileSize: convertSize('5 MB', 'B'),
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  },
  modes: {
    creator: {
      quiz: {
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        maxFileSize: convertSize('5 MB', 'B')
      }
    }
  }
}
