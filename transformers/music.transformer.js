export const artistTransformer = model => {
  return {
    artistId: model.artistId,
    artistName: model.artistName,
    artistLinkUrl: model.artistLinkUrl,
    artistType: model.artistType,
    primaryGenreId: model.primaryGenreId,
    primaryGenreName: model.primaryGenreName,
    wrapperType: model.wrapperType
  }
}
