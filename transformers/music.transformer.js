export const artistTransformer = model => {
  return {
    artistId: model.artistId,
    artistName: model.artistName,
    artistLinkUrl: model.artistLinkUrl,
    artistType: model.artistType,
    primaryGenreId: model.primaryGenreId,
    primaryGenreName: model.primaryGenreName,
    wrapperType: model.wrapperType,
    artwork: model.artwork
      ? {
          artworkUrl: model.artwork.artworkUrl,
          collectionName: model.artwork.collectionName,
          releaseDate: model.artwork.releaseDate,
          trackCount: model.artwork.trackCount
        }
      : null
  }
}

export const songTransformer = model => {
  return {
    trackId: model.trackId,
    trackName: model.trackName,
    previewUrl: model.previewUrl,
    trackViewUrl: model.trackViewUrl,
    artistId: model.artistId,
    artistName: model.artistName,
    artworkUrl100: model.artworkUrl100
  }
}
