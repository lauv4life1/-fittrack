import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'FitTrack - 智能健身助手',
        short_name: 'FitTrack',
        description: '追踪饮食、训练和进步的智能健身助手',
        start_url: '/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#3b82f6',
        orientation: 'portrait-primary',
        scope: '/',
        lang: 'zh-CN',
        categories: ['fitness', 'health'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/localhost:3001\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api/fatsecret': {
        target: 'https://platform.fatsecret.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fatsecret/, '/rest/server.api'),
      },
    },
  },
})
