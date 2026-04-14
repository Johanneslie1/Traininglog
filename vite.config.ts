import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
// Prevent stale system/process env vars from overriding .env file values for Firebase config.
// Remove this block once VS Code has been restarted after clearing the system env vars.
const firebaseEnvKeys = ['VITE_FIREBASE_API_KEY', 'FIREBASE_API_KEY'];
firebaseEnvKeys.forEach(key => { delete process.env[key]; });

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development';
  // VITE_BASE_PATH can be set per-deployment:
  //   GitHub Pages: /Traininglog/  (set via scripts/build-gh-pages.mjs)
  //   Vercel:       /              (not set — defaults to /)
  const basePath = isDev ? '/' : (process.env.VITE_BASE_PATH || env.VITE_BASE_PATH || '/');
  
  return {
    base: basePath,
    server: {
      port: 3000,
      strictPort: true,
      host: true,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 3000,
        timeout: 120000,
        overlay: false, // Disable overlay to prevent some console errors
        clientPort: 3000
      },
      fs: {
        strict: true
      },
      middlewareMode: false
    },
    define: {
      __APP_URL__: JSON.stringify(env.VITE_APP_URL || 'http://localhost:3000'),
      __DEV__: isDev
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@reduxjs/toolkit',
        'react-redux',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore'
      ],
      exclude: ['@vercel/analytics']
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: "Training Log App",
          short_name: "TrainingLog",
          description: "A professional strength training logging application",
          theme_color: "#23272F",
          background_color: "#23272F",
          display: "standalone",
          start_url: basePath,
          scope: basePath,
          icons: [
            {
              src: `${basePath}icons/android-chrome-192x192.png`,
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable"
            },
            {
              src: `${basePath}icons/android-chrome-512x512.png`,
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable"
            }
          ]
        },
        devOptions: {
          // Enable PWA dev features only in production builds; having the PWA dev service worker
          // enabled during `vite dev` can interfere with module requests and HMR and cause
          // dynamic-import failures in the browser. Use the mode flag to control this.
          enabled: !isDev,
          type: 'module',
          navigateFallback: 'index.html'
        },
        workbox: {
          cleanupOutdatedCaches: true,
          sourcemap: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: null,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'firebase-storage',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/.*\.firebaseapp\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'firebase-api',
                networkTimeoutSeconds: 10,
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*/i,
              handler: 'NetworkOnly'
            },
            {
              urlPattern: new RegExp('^https://.*\\.firebaseapp\\.com/.*$'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'firebase-cache',
                networkTimeoutSeconds: 10,
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');

            if (
              normalizedId.includes('/node_modules/react/') ||
              normalizedId.includes('/node_modules/react-dom/') ||
              normalizedId.includes('/node_modules/react-router-dom/')
            ) {
              return 'react-vendor';
            }

            // Split Firebase into predictable chunks so bundle budget checks can
            // track size growth while keeping related internals grouped.
            if (
              normalizedId.includes('/node_modules/firebase/firestore') ||
              normalizedId.includes('/node_modules/@firebase/firestore')
            ) {
              return 'firebase-firestore-vendor';
            }

            if (normalizedId.includes('/node_modules/firebase/') ||
                normalizedId.includes('/node_modules/@firebase/')) {
              return 'firebase-core-vendor';
            }

            if (normalizedId.includes('/src/services/exerciseDatabaseService.ts')) {
              return 'exercise-db-core';
            }

            if (normalizedId.includes('/src/data/exercises/resistance.json')) {
              return 'exercise-data-resistance';
            }

            if (
              normalizedId.includes('/src/data/exercises/endurance.json') ||
              normalizedId.includes('/src/data/exercises/sports.json') ||
              normalizedId.includes('/src/data/exercises/flexibility.json') ||
              normalizedId.includes('/src/data/exercises/speedAgility.json') ||
              normalizedId.includes('/src/data/exercises/other.json')
            ) {
              return 'exercise-data-activities';
            }

            if (
              normalizedId.includes('/src/data/exercises.ts') ||
              normalizedId.includes('/src/data/importedExercises.ts')
            ) {
              return 'exercise-data-legacy';
            }

            return undefined;
          }
        }
      }
    }
  };
});
