export const communityVisibilityEnum = Object.freeze({
  PUBLIC: 'public',
  RESTRICTED: 'restricted',
  PRIVATE: 'private'
})

export const communityPostPermissionEnum = Object.freeze({
  EVERYONE: 'everyone',
  MODS_ONLY: 'mods_only'
})

export const communityViewerRoleEnum = Object.freeze({
  OWNER: 'owner',
  MODERATOR: 'moderator',
  MEMBER: 'member',
  PENDING: 'pending',
  NONE: 'none'
})

export const COMMUNITY_NAME_MIN_LENGTH = 3
export const COMMUNITY_NAME_MAX_LENGTH = 100
export const COMMUNITY_DESCRIPTION_MAX_LENGTH = 500
export const COMMUNITY_POST_NOTE_MAX_LENGTH = 500
export const COMMUNITY_TAGS_MAX_LENGTH = 5
export const COMMUNITY_TAG_MAX_LENGTH = 64
export const COMMUNITY_TAG_REGEX = /[^\p{L}\p{N}]/gu
