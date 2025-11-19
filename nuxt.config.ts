import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import IconsResolver from 'unplugin-icons/resolver';
import ViteComponents from 'unplugin-vue-components/vite';
import MotionResolver from 'motion-v/resolver';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@vueuse/nuxt', 'unplugin-icons/nuxt', 'motion-v/nuxt'],
  experimental: {
    componentIslands: true,
  },
  css: ['./app/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      title: 'OpenTelemetry Viewer',
      meta: [
        {
          name: 'description',
          content: 'A real-time OpenTelemetry trace visualizer',
        },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/favicon-96x96.png',
          sizes: '96x96',
        },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'shortcut icon', href: '/favicon.ico' },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png',
        },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
  },
  nitro: {
    experimental: {
      websocket: true,
      database: true,
    },
    database: {
      default: {
        connector: 'sqlite',
        options: { name: 'otel' },
      },
    },
  },
  alias: {
    '@types': path.resolve(__dirname, 'types'),
  },
  vite: {
    plugins: [
      tailwindcss() as any,
      ViteComponents({
        resolvers: [
          IconsResolver({
            prefix: 'icon',
          }),
          MotionResolver(),
        ],
      }),
    ],
  },
});
