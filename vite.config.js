import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',

      // Copies these files from /public into the PWA asset list
      includeAssets: ['favicon.ico', 'icons/*', 'images/*', 'sounds/*'],

      manifest: {
        name: 'Oh Balls Merge',
        short_name: 'Oh Balls',
        description: 'Oh Balls Merge - The Ultimate Merge Game!',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'fullscreen',
        orientation: 'landscape', // or portrait depending on your game
        start_url: '.',

        icons: [
          {
            src: 'icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3,ogg,wav}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB
      },
    }),
  ],
});
