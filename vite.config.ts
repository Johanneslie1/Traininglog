import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development';
  
  return {
    base: '/',
    server: {
      port: 3000,
      strictPort: true,
      host: true,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 3000,
        timeout: 120000,
        overlay: true,
        clientPort: 3000
      }
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
        '@': path.resolve(__dirname, './src'),
      },
    },
    plugins: [
      react({
        // Add fast refresh options
        fastRefresh: true,
      }),
      VitePWA({
        registerType: 'prompt',
        devOptions: {
          enabled: isDev
        },
        workbox: {
          cleanupOutdatedCaches: true,
          sourcemap: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
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
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore']
          }
        }
      }
    }
  };
});
