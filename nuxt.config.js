import getSiteMeta from "./scripts/siteMeta";
import axios from 'axios'

const { 
  API_URL,
  OPENSEA_API_KEY,
  NETLIFY_API_TOKEN,
  PAYPAL_CLIENT_ID
} = process.env

export default {
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',

  env: {
    API_URL,
    OPENSEA_API_KEY,
    NETLIFY_API_TOKEN,
    PAYPAL_CLIENT_ID
  },

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'Zero Code NFT Wizard',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' }, // mobile responsive https://search.google.com/test/mobile-friendly
      { name: 'format-detection', content: 'telephone=no' },
      { hid: 'description', name: 'description', content: 'Drop your NFT collection with ZERO coding skills' },
      { property: "og:site_name", content: "Zero Code NFT Wizard" },
      ...getSiteMeta()
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/logo.png' }
    ]
  },

  sitemap: {
    hostname: 'https://app.zerocodenft.com',
    exclude: [
      '/admin/**'
    ],
    defaults: {
      changefreq: 'daily',
      priority: 1,
      lastmod: new Date()
    }
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    '@/assets/styles/main.scss'
  ],

  styleResources: {
    scss: [
      '@/assets/styles/variables.scss',
    ]
  },

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    '@/plugins/axios',
    '@/plugins/netlify',
    '@/plugins/vuelidate',
    '@/plugins/filters',
    '@/plugins/wallet'
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: [
    '@/components',
    '@/components/smart-contract',
    '@/components/dashboard'
  ],

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/bootstrap
    'bootstrap-vue/nuxt',
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    // https://go.nuxtjs.dev/pwa
    '@nuxtjs/pwa',
    '@nuxtjs/sitemap',
    '@nuxtjs/recaptcha',
    '@nuxtjs/style-resources'
  ],

  recaptcha: {
    siteKey: process.env.RECAPTCHA_KEY,
    version: 3,
    size: 'compact'
  },

  bootstrapVue: {
    icons: true,
  },

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {
    baseURL: process.env.API_URL
  },

  // PWA module configuration: https://go.nuxtjs.dev/pwa
  pwa: {
    manifest: {
      lang: 'en'
    }
  },

  generate: {
    // support to generate dynamic _id routes
    routes: async () => {
      try {
        const contracts = await axios.get(`https://${process.env.API_URL}/smartcontracts/ids`)
        return (contracts?.data || []).map((id) => ({
          route: `/smartcontracts/${id}`
        }))
      } catch(e) {
        console.error(e)
        return []
      }
    },
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
  }
}
