import path from 'node:path';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@vueuse/nuxt'],
  nitro: {
    experimental: {
      websocket: true,
      database: true
    },
    database: {
      default: {
        connector: 'sqlite',
        options: { name: 'otel' }
      }
    }
  },
  alias: {
    '@types': path.resolve(__dirname, 'types'),
  }
})
