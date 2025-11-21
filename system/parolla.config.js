import convertSize from 'convert-size'

export default {
  upload: {
    maxFileSize: convertSize('5 MB', 'B'),
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  },
  modes: {
    creator: {
      quiz: {
        maxFileSize: convertSize('5 MB', 'B'),
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']
      }
    }
  }
}
