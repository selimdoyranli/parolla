<template lang="pug">
Form.profile-edit-form(@keypress.enter.prevent @failed="handleFailed")
  span.profile-edit-form__title.mt-base Profil Düzenle

  .profile-edit-form__avatarEdit
    PlayerAvatar(:size="80" :user="displayUser")

    .profile-edit-form__avatarSourceField
      span.profile-edit-form__avatarSourceFieldLabel {{ $t('form.profileEdit.avatarSource.label') }}
      .profile-edit-form__avatarSourceFieldBox
        RadioGroup.profile-edit-form__avatarSourceToggle(v-model="form.avatarSource" direction="horizontal")
          Radio(name="diceBear") {{ $t('form.profileEdit.avatarSource.diceBear') }}
          Radio(name="profilePhoto") {{ $t('form.profileEdit.avatarSource.profilePhoto') }}

    input(
      ref="profilePhotoInputRef"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      style="display: none"
      @change="handleProfilePhotoFileChange"
    )

    Button.profile-edit-form__avatarEditButton(
      v-if="form.avatarSource === 'diceBear'"
      icon="edit"
      size="small"
      native-type="button"
      round
      @click="handleClickAvatarEdit"
    ) {{ $t('form.profileEdit.editAvatarButton') }}

    .profile-edit-form__photoActions(v-else)
      Button(icon="photograph" size="small" native-type="button" round @click="handleClickProfilePhotoEdit")
        | {{ $t('form.profileEdit.uploadPhotoButton') }}
      Button(
        v-if="hasUploadedProfilePhoto"
        type="danger"
        icon="delete-o"
        size="small"
        plain
        native-type="button"
        round
        :loading="form.isDeletingPhoto"
        :disabled="form.isDeletingPhoto || form.isBusy"
        @click="handleClickDeleteProfilePhoto"
      ) {{ $t('form.profileEdit.deletePhotoButton') }}

  .profile-edit-form__fields
    Field.profile-edit-form__usernameField(
      v-model="form.username"
      name="username"
      :label="$t('form.profileEdit.usernameField.label')"
      :placeholder="$t('form.profileEdit.usernameField.placeholder')"
      maxlength="28"
      autocomplete="off"
      show-word-limit
      :rules="[{ required: true, pattern: USERNAME_REGEX, message: $t('form.isInvalid', { model: $t('form.profileEdit.usernameField.label') }) }]"
      :disabled="form.isBusy"
      @input="handleInput({ name: 'username' })"
    )

    Field.profile-edit-form__fullnameField(
      v-model="form.fullname"
      name="fullname"
      :label="$t('form.profileEdit.fullnameField.label')"
      :placeholder="$t('form.profileEdit.fullnameField.placeholder')"
      maxlength="32"
      autocomplete="off"
      show-word-limit
      :disabled="form.isBusy"
      @input="handleInput({ name: 'fullname' })"
    )

    Field.profile-edit-form__bioField(
      v-model="form.bio"
      name="bio"
      type="textarea"
      :label="$t('form.profileEdit.bioField.label')"
      :placeholder="$t('form.profileEdit.bioField.placeholder')"
      maxlength="128"
      autocomplete="off"
      show-word-limit
      autosize
      :disabled="form.isBusy"
      @input="handleInput({ name: 'bio' })"
    )

  Button.profile-edit-form__submitButton(
    type="primary"
    icon="success"
    plain
    native-type="button"
    round
    :loading="form.isBusy"
    :disabled="form.isBusy"
    @click="handleSubmit"
  ) {{ $t('general.save') }}

  AvatarEditorDialog(:user="user" @on-confirm="handleAvatarConfirm")
  ProfilePhotoEditorDialog(:source-file="form.profilePhotoSelectedFile" @on-confirm="handleProfilePhotoConfirm")
</template>

<script>
import { defineComponent, ref, useContext, useStore, reactive, computed } from '@nuxtjs/composition-api'
import { Form, Button, Field, Notify, Toast, Dialog as VanDialog, Badge, RadioGroup, Radio } from 'vant'
import { USERNAME_REGEX } from '@/system/constant'
import parollaConfig from '@/system/parolla.config'

export default defineComponent({
  components: {
    Form,
    Button,
    Field,
    Notify,
    Badge,
    RadioGroup,
    Radio
  },
  setup() {
    const { i18n } = useContext()
    const store = useStore()

    const user = computed(() => store.getters['auth/user'])
    const profilePhotoInputRef = ref(null)

    const handleClickAvatarEdit = async () => {
      store.commit('profile/SET_AVATAR_EDITOR_DIALOG_IS_OPEN', true)
    }

    const handleAvatarConfirm = diceBear => {
      form.diceBear = { ...diceBear }
    }

    // Profile photo: click on the upload button triggers the native
    // file picker directly. Only after the user picks a file that
    // passes MIME + size validation do we stage it and open the
    // cropper dialog. Invalid pick = Toast, dialog stays closed.
    const handleClickProfilePhotoEdit = () => {
      profilePhotoInputRef.value?.click()
    }

    const handleProfilePhotoFileChange = event => {
      const file = event.target.files?.[0]

      if (!file) return

      const { maxFileSize, allowedMimeTypes } = parollaConfig.upload

      if (!allowedMimeTypes.includes(file.type)) {
        Toast.fail({
          message: i18n.t('dialog.profilePhotoEditor.error.mimeTypeNotAllowed'),
          duration: 2500
        })
        event.target.value = ''

        return
      }

      if (file.size > maxFileSize) {
        Toast.fail({
          message: i18n.t('dialog.profilePhotoEditor.error.sizeLimitExceeded'),
          duration: 2500
        })
        event.target.value = ''

        return
      }

      form.profilePhotoSelectedFile = file
      store.commit('profile/SET_PROFILE_PHOTO_EDITOR_DIALOG_IS_OPEN', true)
      // Reset so picking the same file again re-fires `change`
      event.target.value = ''
    }

    const handleProfilePhotoConfirm = blob => {
      if (form.profilePhotoPreviewUrl) {
        URL.revokeObjectURL(form.profilePhotoPreviewUrl)
      }
      form.profilePhotoBlob = blob
      form.profilePhotoPreviewUrl = URL.createObjectURL(blob)
      // The cropper now owns the result blob; the parent's staged File
      // can be released so subsequent opens always start clean.
      form.profilePhotoSelectedFile = null
    }

    const form = reactive({
      isBusy: false,
      isDeletingPhoto: false,
      username: user.value.username,
      fullname: user.value.fullname,
      bio: user.value.bio,
      diceBear: null,
      avatarSource: user.value.avatarSource || 'diceBear',
      profilePhotoBlob: null,
      profilePhotoPreviewUrl: null,
      profilePhotoSelectedFile: null
    })

    const hasUploadedProfilePhoto = computed(() => Boolean(user.value?.profilePhoto?.url))

    const displayUser = computed(() => {
      const base = { ...user.value, avatarSource: form.avatarSource }

      if (form.avatarSource === 'profilePhoto') {
        if (form.profilePhotoPreviewUrl) {
          return {
            ...base,
            profilePhoto: { url: form.profilePhotoPreviewUrl }
          }
        }

        return base
      }

      if (form.diceBear) {
        return { ...base, diceBear: form.diceBear }
      }

      return base
    })

    const isUsernameChanged = computed(() => {
      return form.username !== user.value.username
    })

    const handleInput = ({ name }) => {
      if (name === 'username') {
        form.username = form.username.replace(/\s/g, '').toLowerCase()
      }
    }

    const validateUsername = username => {
      return USERNAME_REGEX.test(username)
    }

    const handleFailed = errorInfo => {
      if (errorInfo && errorInfo.values.length > 0) {
        form.isClear = false
      } else {
        form.isClear = true
      }
    }

    const handleClickDeleteProfilePhoto = async () => {
      try {
        await VanDialog.confirm({
          title: i18n.t('dialog.deleteProfilePhoto.title'),
          message: i18n.t('dialog.deleteProfilePhoto.message'),
          confirmButtonText: i18n.t('general.delete'),
          cancelButtonText: i18n.t('general.cancel'),
          confirmButtonColor: 'var(--color-danger-01)'
        })
      } catch (_) {
        // User cancelled
        return
      }

      form.isDeletingPhoto = true

      const { data, error } = await store.dispatch('auth/deleteProfilePhoto')

      if (data) {
        // Drop any staged photo state so the next save doesn't try to
        // re-upload something the user just deleted.
        if (form.profilePhotoPreviewUrl) {
          URL.revokeObjectURL(form.profilePhotoPreviewUrl)
        }
        form.profilePhotoBlob = null
        form.profilePhotoPreviewUrl = null
        form.profilePhotoSelectedFile = null
        form.avatarSource = 'diceBear'

        // Re-fetch /users/me so the avatar reflects the user's existing
        // diceBear config — the delete response can occasionally return
        // an incomplete component payload, leaving PlayerAvatar to fall
        // back to a generated (wrong-looking) avatar until refresh.
        await store.dispatch('auth/fetchMe')

        Toast.success({
          message: i18n.t('form.profileEdit.deletePhotoCallback.success'),
          duration: 2000
        })
      }

      if (error) {
        Notify({
          message: error.message,
          color: 'var(--color-text-04)',
          background: 'var(--color-danger-01)',
          duration: 3000
        })
      }

      form.isDeletingPhoto = false
    }

    const handleSubmit = async () => {
      form.isBusy = true

      if (!validateUsername(form.username)) {
        Notify({
          message: i18n.t('form.usernameEdit.error.submit'),
          color: 'var(--color-text-04)',
          background: 'var(--color-danger-01)',
          duration: 1000
        })
        form.isBusy = false

        return
      }

      if (form.avatarSource === 'profilePhoto' && form.profilePhotoBlob) {
        const { error: uploadError } = await store.dispatch('auth/uploadProfilePhoto', {
          file: form.profilePhotoBlob
        })

        if (uploadError) {
          Notify({
            message: uploadError.message,
            color: 'var(--color-text-04)',
            background: 'var(--color-danger-01)',
            duration: 3000
          })
          form.isBusy = false

          return
        }

        if (form.profilePhotoPreviewUrl) {
          URL.revokeObjectURL(form.profilePhotoPreviewUrl)
        }
        form.profilePhotoBlob = null
        form.profilePhotoPreviewUrl = null
      }

      const { data, error } = await store.dispatch('auth/updateUser', {
        username: form.username,
        fullname: form.fullname?.trim() || null,
        bio: form.bio?.trim() || null,
        avatarSource: form.avatarSource,
        ...(form.avatarSource === 'diceBear' &&
          form.diceBear && {
            diceBear: {
              dataImage: form.diceBear.dataImage,
              config: {
                seed: form.username || form.diceBear.config.seed,
                mouth: form.diceBear.config.mouth,
                eyes: form.diceBear.config.eyes,
                eyebrows: form.diceBear.config.eyebrows,
                hair: form.diceBear.config.hair,
                hairColor: form.diceBear.config.hairColor,
                earrings: form.diceBear.config.earrings,
                features: form.diceBear.config.features,
                glasses: form.diceBear.config.glasses,
                skinColor: form.diceBear.config.skinColor,
                backgroundColor: form.diceBear.config.backgroundColor
              }
            }
          })
      })

      if (data) {
        store.commit('auth/SET_USER', { ...data })

        Notify({
          message: i18n.t('form.profileEdit.callback.success'),
          color: 'var(--color-text-04)',
          background: 'var(--color-success-01)',
          duration: 3000
        })
      }

      if (error) {
        Notify({
          message: error.message,
          color: 'var(--color-text-04)',
          background: 'var(--color-danger-01)',
          duration: 3000
        })
      }

      form.isBusy = false
    }

    return {
      USERNAME_REGEX,
      user,
      displayUser,
      hasUploadedProfilePhoto,
      profilePhotoInputRef,
      handleClickAvatarEdit,
      handleAvatarConfirm,
      handleClickProfilePhotoEdit,
      handleProfilePhotoFileChange,
      handleProfilePhotoConfirm,
      handleClickDeleteProfilePhoto,
      form,
      handleInput,
      isUsernameChanged,
      handleFailed,
      handleSubmit
    }
  }
})
</script>

<style lang="scss" src="./ProfileEditForm.component.scss"></style>
