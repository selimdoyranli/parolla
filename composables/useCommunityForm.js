import { reactive, ref, computed, useStore, useContext, useRouter } from '@nuxtjs/composition-api'
import { Notify } from 'vant'
import {
  communityVisibilityEnum,
  communityPostPermissionEnum,
  COMMUNITY_NAME_MIN_LENGTH,
  COMMUNITY_NAME_MAX_LENGTH,
  COMMUNITY_DESCRIPTION_MAX_LENGTH,
  COMMUNITY_TAGS_MAX_LENGTH,
  COMMUNITY_TAG_MAX_LENGTH,
  COMMUNITY_TAG_REGEX
} from '@/enums/community.enum'

const STEP_COUNT = 4

/**
 * State + submit flow of the community create wizard / edit page.
 * @param {Object} [community] - existing community (edit mode); omit for create
 */
export default (community = null) => {
  const store = useStore()
  const router = useRouter()
  const { i18n, localePath } = useContext()

  const step = ref(0)
  const isBusy = ref(false)
  const tagInput = ref('')
  const form = reactive({
    name: community?.name || '',
    description: community?.description || '',
    tags: [...(community?.tags || [])],
    visibility: community?.visibility || communityVisibilityEnum.PUBLIC,
    postPermission: community?.postPermission || communityPostPermissionEnum.EVERYONE
  })
  // picked images: { file, url } — uploaded only after the text fields are saved
  const media = reactive({ avatar: null, coverPhoto: null })

  const nameLength = () => form.name.trim().length
  const nameError = computed(() => {
    if (nameLength() === 0) return i18n.t('community.form.name.errorRequired')

    if (nameLength() < COMMUNITY_NAME_MIN_LENGTH) return i18n.t('community.form.name.errorTooShort', { min: COMMUNITY_NAME_MIN_LENGTH })

    if (nameLength() > COMMUNITY_NAME_MAX_LENGTH) return i18n.t('community.form.name.errorTooLong', { max: COMMUNITY_NAME_MAX_LENGTH })

    return ''
  })
  const descriptionError = computed(() =>
    form.description.length > COMMUNITY_DESCRIPTION_MAX_LENGTH
      ? i18n.t('community.form.description.errorTooLong', { max: COMMUNITY_DESCRIPTION_MAX_LENGTH })
      : ''
  )
  const isValid = computed(() => !nameError.value && !descriptionError.value)
  // steps 2-4 have no blocking rules (tags are optional and validated on add)
  const canGoNext = computed(() => (step.value === 0 ? isValid.value : true))

  const next = () => {
    if (canGoNext.value && step.value < STEP_COUNT - 1) step.value++
  }
  const prev = () => {
    if (step.value > 0) step.value--
  }

  const addTag = () => {
    const tag = tagInput.value.replace(COMMUNITY_TAG_REGEX, '').slice(0, COMMUNITY_TAG_MAX_LENGTH)

    if (!tag) {
      tagInput.value = ''

      return
    }

    if (form.tags.length >= COMMUNITY_TAGS_MAX_LENGTH) {
      Notify({ message: i18n.t('community.form.tags.errorTooMany', { max: COMMUNITY_TAGS_MAX_LENGTH }), type: 'warning' })

      return
    }

    if (!form.tags.some(t => t.toLocaleLowerCase('tr') === tag.toLocaleLowerCase('tr'))) form.tags.push(tag)

    tagInput.value = ''
  }
  const removeTag = tag => {
    form.tags = form.tags.filter(t => t !== tag)
  }
  const onTagInput = value => {
    // typing a symbol/space is dropped (letters and digits only)
    tagInput.value = value.replace(COMMUNITY_TAG_REGEX, '')
  }

  const notifyError = error => Notify({ message: error?.message || i18n.t('community.error.generic'), type: 'danger', duration: 4000 })

  // resolves true when every picked image uploaded
  const uploadMedia = async documentId => {
    let allOk = true

    for (const field of ['avatar', 'coverPhoto']) {
      if (!media[field]) continue

      const { error } = await store.dispatch('community/uploadCommunityMedia', { documentId, field, file: media[field].file })

      if (error) allOk = false
    }

    return allOk
  }

  const goToDetail = slug => router.push(localePath({ name: 'Community-Community-slug', params: { slug } }))

  // create: createCommunity -> media -> detail page; edit: editCommunity -> media (if changed) -> detail page
  const submit = async () => {
    if (isBusy.value || !isValid.value) return

    isBusy.value = true

    const payload = { ...form, name: form.name.trim() }
    const { data, error } = community
      ? await store.dispatch('community/editCommunity', { documentId: community.documentId, form: payload })
      : await store.dispatch('community/createCommunity', { form: payload })

    if (error || !data) {
      isBusy.value = false
      notifyError(error)

      return
    }

    const uploaded = await uploadMedia(data.documentId)

    Notify(
      uploaded
        ? { message: i18n.t(community ? 'community.success.edited' : 'community.success.created'), type: 'success' }
        : { message: i18n.t('community.wizard.mediaUploadFailed'), type: 'warning', duration: 5000 }
    )
    // stays busy through navigation so a second click can't post again
    goToDetail(data.slug)
  }

  return { form, media, step, isBusy, tagInput, nameError, descriptionError, canGoNext, next, prev, addTag, removeTag, onTagInput, submit }
}
