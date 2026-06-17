const head = require('./nuxt-config/head')

module.exports = {
  watch: ['nuxt-config/**/*'],
  /*
   ** Nuxt target
   ** See https://nuxtjs.org/api/configuration-target
   */
  target: 'static',

  /*
   ** Nuxt ssr
   ** See https://nuxtjs.org/docs/configuration-glossary/configuration-ssr
   */
  ssr: false,

  /*
   ** Nuxt devtools
   ** See https://nuxtjs.org/docs/configuration-glossary/configuration-devtools
   */
  devtools: process.env.NODE_ENV === 'development' ? true : false,

  /*
   ** Nuxt environments
   ** See https://nuxtjs.org/docs/configuration-glossary/configuration-env
   */
  env: {
    API_URL: process.env.API_URL || 'https://strapi.parolla.app/api',
    WS_URL: process.env.WS_URL || 'wss://0.0.0.0:1881',
    GOOGLE_AUTH_CLIENT_ID: process.env.GOOGLE_AUTH_CLIENT_ID,
    GOOGLE_AUTH_REDIRECT_URI: process.env.GOOGLE_AUTH_REDIRECT_URI
  },

  /*
   ** Public runtime config
   ** See https://nuxtjs.org/api/configuration-runtime-config
   */
  publicRuntimeConfig: {
    API_URL: process.env.API_URL || 'https://strapi.parolla.app/api'
  },

  /*
   ** Headers of the page
   ** See https://nuxtjs.org/api/configuration-head
   */
  head,

  /*
   ** Global Styles (Do not import actual styles)
   ** https://www.npmjs.com/package/@nuxtjs/style-resources
   */
  styleResources: {
    scss: [
      /*
       * Vendor
       */
      // > Bootstrap Vendor
      'bootstrap/scss/_functions.scss',
      'bootstrap/scss/_variables.scss',
      'bootstrap/scss/_mixins.scss',

      /*
       * Overrides (This overrides not includes actual styles. | variables, mixins etc.)
       */
      // > Bootstrap Overrides
      '@/assets/style/scss/overrides/bootstrap/_grid.override.scss',
      '@/assets/style/scss/overrides/bootstrap/_spacing.override.scss',
      // Plugins
      //--
      // Functions
      '~/assets/style/scss/functions/_center.scss',
      // Mixins
      '~/assets/style/scss/mixins/_font.scss'
    ]
  },

  /*
   ** Global Styles (Actual styles)
   */
  css: [
    // Actual styles entry point (as import management)
    '~/assets/style/scss/app.scss'
  ],

  /*
   ** Plugins to load before mounting the App
   ** https://nuxtjs.org/guide/plugins
   */
  router: {
    trailingSlash: false,
    middleware: ['redirect']
  },

  /*
   ** Plugins to load before mounting the App
   ** https://nuxtjs.org/guide/plugins
   */
  plugins: [
    { src: '~/plugins/auth-control', ssr: false }, // https://www.npmjs.com/package/vuex-persist
    { src: '~/plugins/rate-limit-handler', ssr: false },
    { src: '~/plugins/app-fetch', ssr: false },
    { src: '~/plugins/vuex-persist', ssr: false }, // https://www.npmjs.com/package/vuex-persist
    { src: '~/plugins/ua-injector', ssr: false },
    { src: '~/plugins/theme-color', ssr: false },
    { src: '~/plugins/dynamic-head', ssr: false },
    { src: '~/plugins/iconify', ssr: false }, // https://www.npmjs.com/package/@iconify/vue
    { src: '~/plugins/vue-timeago', ssr: false }, // https://vue-timeago.egoist.sh
    { src: '~/plugins/portal-vue', ssr: false }, // https://v2.portal-vue.linusb.org/
    { src: '~/plugins/vue-croppa', ssr: false }, // https://www.npmjs.com/package/vue-croppa
    { src: '~/plugins/acs', ssr: false }, // https://audiocss.dev — UI sound effects
    { src: '~/plugins/vue-infinite-loading', ssr: false } // https://www.npmjs.com/package/vue-infinite-loading
  ],

  /*
   ** Auto import components
   ** See https://nuxtjs.org/api/configuration-components
   */
  components: [
    {
      path: '@/components',
      pathPrefix: false,
      extensions: ['vue'],
      extendComponent(component) {
        /**
         * Remove 'Component' suffix for generated component names
         * e.g.
         *  components/Xyz.component.vue
         *    XyzComponent -> Xyz
         */
        component.pascalName = component.pascalName.replace('Component', '')
        component.kebabName = component.kebabName.replace('component', '')
      }
    }
  ],

  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [
    // https://composition-api.nuxtjs.org
    '@nuxtjs/composition-api/module',
    // https://github.com/nuxt-community/style-resources-module
    '@nuxtjs/style-resources',
    // https://github.com/nuxt-community/eslint-module
    [
      '@nuxtjs/eslint-module',
      {
        // eslint module options
      }
    ],
    // https://github.com/nuxt-community/stylelint-module
    [
      '@nuxtjs/stylelint-module',
      {
        // stylelint module options
        files: ['{assets/style,components,layouts,pages}/**/*.{css,sass,scss,less,stylus,vue}']
      }
    ],
    // https://www.npmjs.com/package/nuxt-font-loader
    [
      'nuxt-font-loader',
      {
        url: 'https://fonts.googleapis.com/css2?family=Rubik:wght@400;700&display=swap',
        prefetch: true,
        preconnect: true
      }
    ],
    // https://v2.color-mode.nuxtjs.org
    [
      '@nuxtjs/color-mode',
      {
        preference: 'system'
      }
    ],
    // https://github.com/antfu/unplugin-auto-import
    [
      'unplugin-auto-import/nuxt',
      {
        dirs: ['./composables/**'],
        dts: true
      }
    ],
    // https://github.com/nuxt-modules/partytown
    [
      '@nuxtjs/partytown',
      {
        debug: false
      }
    ]
  ],

  /*
   ** Nuxt.js modules
   */
  modules: [
    'cookie-universal-nuxt',
    // https://axios.nuxtjs.org
    '@nuxtjs/axios',
    // https://auth.nuxtjs.org
    [
      '@nuxtjs/auth-next',
      {
        vuex: {
          namespace: 'nuxtAuth'
        },
        localStorage: true,
        tokenRequired: true,
        tokenType: 'Bearer',
        cookie: {
          prefix: 'auth.',
          options: {
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7
          }
        },
        strategies: {
          google: {
            clientId: process.env.GOOGLE_AUTH_CLIENT_ID,
            codeChallengeMethod: '',
            responseType: 'code',
            redirectUri: process.env.GOOGLE_AUTH_REDIRECT_URI,
            endpoints: {
              token: false, // your backend url to resolve your auth with google and give you the token back
              userInfo: false // your endpoint to get the user info after you received the token
            }
          }
        },
        plugins: ['@/plugins/auth-lang-redirect.js']
      }
    ],
    // https://i18n.nuxtjs.org
    [
      '@nuxtjs/i18n',
      {
        lazy: true,
        locales: [
          {
            name: 'Turkish',
            title: 'Türkçe',
            code: 'tr',
            iso: 'tr-TR',
            file: 'tr.js'
          },
          {
            name: 'English',
            title: 'English',
            code: 'en',
            iso: 'en-US',
            file: 'en.js'
          }
        ],
        langDir: 'locales/',
        defaultLocale: 'tr',
        strategy: 'prefix_except_default',
        detectBrowserLanguage: false,
        detectBrowserLanguage: false,
        parsePages: false,
        pages: {
          'Main/index': {
            tr: '/',
            en: '/'
          },
          'DailyMode/index': {
            tr: '/gunluk',
            en: '/daily'
          },
          'DailyMode/Leaderboard/index': {
            tr: '/gunluk/liderlik',
            en: '/daily/leaderboard'
          },
          'DailyMode/Leaderboard/_period/index': {
            tr: '/gunluk/liderlik/:period',
            en: '/daily/leaderboard/:period'
          },
          'UnlimitedMode/index': {
            tr: '/limitsiz',
            en: '/unlimited'
          },
          'CreatorMode/index': {
            tr: '/yaratici',
            en: '/creator'
          },
          'CreatorMode/CreatorModeRooms/index': {
            tr: '/quizler',
            en: '/quizzes'
          },
          'CreatorMode/CreatorModeCompose/index': {
            tr: '/quiz-olustur',
            en: '/create-quiz'
          },
          'CreatorMode/CreatorModeCompose/Choices': {
            tr: '/quiz-olustur/secim',
            en: '/create-quiz/choices'
          },
          'CreatorMode/CreatorModeCompose/Flashcards': {
            tr: '/quiz-olustur/flashcards',
            en: '/create-quiz/flashcards'
          },
          'CreatorMode/CreatorModeEdit/_slug': {
            tr: '/quiz-duzenle/:slug',
            en: '/edit-quiz/:slug'
          },
          'CreatorMode/CreatorModeRoom/_slug': {
            tr: '/quiz/:slug',
            en: '/quiz/:slug'
          },
          'TourMode/TourModeGame/index': {
            tr: '/tur',
            en: '/tour'
          },
          'TourMode/Leaderboard/index': {
            tr: '/tur/liderlik',
            en: '/tour/leaderboard'
          },
          'TourMode/Leaderboard/_period/index': {
            tr: '/tur/liderlik/:period',
            en: '/tour/leaderboard/:period'
          },
          'DrawMode/DrawLobby/index': {
            tr: '/ciz',
            en: '/draw'
          },
          'DrawMode/DrawRoom/_code': {
            tr: '/ciz/oda/:code',
            en: '/draw/room/:code'
          },
          'Account/AccountEdit/index': {
            tr: '/hesap/duzenle',
            en: '/account/edit'
          },
          'Profile/_username/index': {
            tr: '/profil/:username',
            en: '/profile/:username'
          },
          'Profile/_username/Quizzes/index': {
            tr: '/profil/:username/quizler',
            en: '/profile/:username/quizzes'
          },
          'Profile/_username/Reviews/index': {
            tr: '/profil/:username/degerlendirmeler',
            en: '/profile/:username/reviews'
          },
          'Profile/_username/Scores/index': {
            tr: '/profil/:username/skorlar',
            en: '/profile/:username/scores'
          },
          'WordblockMode/index': {
            tr: '/kelimeblok',
            en: '/wordblock'
          },
          'WordblockMode/index': {
            tr: '/kelimeblok',
            en: '/wordblock'
          },
          'WordblockMode/_charLength': {
            tr: '/kelimeblok/:charLength-harf',
            en: '/wordblock/:charLength-letters'
          },
          'MusicMode/index': {
            tr: '/muzik',
            en: '/music'
          },
          'MusicMode/GuessTheSong/index': {
            tr: '/muzik/sarki-tahmin-et',
            en: '/music/guess-the-song'
          },
          'MusicMode/GuessTheSong/Play/index': {
            tr: '/muzik/sarki-tahmin-et/oyna',
            en: '/music/guess-the-song/play'
          },
          'Tycoon/KnowledgeKingdom/index': {
            tr: '/bilgi-kralligi',
            en: '/knowledge-kingdom'
          }
        }
      }
    ],
    // https://www.npmjs.com/package/@nuxtjs/gtm
    [
      '@nuxtjs/gtm',
      {
        enabled: process.env.NODE_ENV === 'production' ? true : false,
        debug: false,
        id: 'GTM-W87WBTN'
      }
    ],
    // https://www.npmjs.com/package/nuxt-user-agent
    'nuxt-user-agent',
    // https://www.npmjs.com/package/nuxt-client-init-module
    'nuxt-client-init-module'
  ],

  /*
   ** Build configuration
   ** See https://nuxtjs.org/api/configuration-build/
   */
  build: {
    /* analyze: {
      analyzerMode: 'static'
    }, */
    standalone: true, // for ESM import
    extractCSS: false,
    babel: {
      plugins: [
        [
          'import',
          {
            libraryName: 'vant',
            libraryDirectory: 'es',
            style: true
          }
        ]
      ]
    },
    transpile: ['vant', 'acs-audio'],
    postcss: {
      postcssOptions: {
        plugins: {
          'postcss-preset-env': {
            stage: 2
          }
        }
      }
    },
    extend(config, { isDev, isClient }) {
      if (!isDev && isClient) {
        config.output.filename = '[name].[contenthash].js'
        config.output.chunkFilename = '[name].[contenthash].js'
      }
    }
  },

  /*
   ** Server configuration
   ** See https://nuxtjs.org/api/configuration-server
   */
  server: {
    host: '0.0.0.0', // default: localhost,
    timing: false,
    port: 3000
  }
}
