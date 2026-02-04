import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import IconsResolver from 'unplugin-icons/resolver';
import ViteComponents from 'unplugin-vue-components/vite';
import MotionResolver from 'motion-v/resolver';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@vueuse/nuxt', 'unplugin-icons/nuxt', 'motion-v/nuxt'],

  // Client-side only (local-first architecture)
  ssr: false,

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

  // Static generation for Cloudflare Pages
  nitro: {
    preset: 'static',
  },

  alias: {
    '@types': path.resolve(__dirname, 'types'),
    '@shared': path.resolve(__dirname, 'shared'),
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
    // Worker configuration for SharedWorker
    worker: {
      format: 'es',
    },
    optimizeDeps: {
      include: ['dexie', 'nanoid'],
    },
    build: {
      sourcemap: true,
    },
  },

  sourcemap: {
    client: true,
  },
});
