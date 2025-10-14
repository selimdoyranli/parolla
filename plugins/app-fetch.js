const appFetch = async ({ $axios, app }, params) => {
  const { method = 'GET', url, path, query, data, cache, headers } = params

  const transformLocale = locale => {
    if (locale === 'tr') {
      return 'tr-TR'
    }

    return locale
  }

  const transformedQuery = {
    ...query,
    ...(query?.locale ? { locale: transformLocale(query.locale) } : {})
  }

  $axios.onRequest(config => {
    config.headers = config.headers || {}
    config.headers.common = config.headers.common || {}

    if (config.headers.common['Content-Type']) {
      config.headers.common['Content-Type'] = 'application/json'
    }
  })

  try {
    const promise = await $axios({
      method,
      url: url || `https://strapi.parolla.app/api/${path}`,
      params: { ...transformedQuery },
      data,
      cache,
      headers,
      timeout: 15000,
      config: {}
    })

    if (method === 'DELETE') {
      return { data: promise, error: null }
    }

    return { data: promise.data, error: null }
  } catch (error) {
    if (error.response) {
      return {
        data: null,
        error: error.response?.data?.error
          ? {
              message: error.response?.data?.error.message,
              code: error.response?.status,
              config: error.response?.config
            }
          : {
              message: error.response?.statusText,
              code: error.response?.status,
              config: error.response?.config
            }
      }
    } else {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code
        }
      }
    }
  }
}

export default ({ $axios, app }, inject) => {
  inject('appFetch', params => {
    return appFetch({ $axios, app }, params)
  })
}
