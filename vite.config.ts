import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: '/',
    define: {
      __APP_URL__: JSON.stringify(env.VITE_APP_URL || 'http://localhost:3000'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
    server: {
      port: 3000,
      strictPort: true,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 3000,
        timeout: 30000,
      },
      watch: {
        usePolling: true,
      },
      cors: true,
      open: false,
      host: true
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        devOptions: {
          enabled: false // Disable service worker in development
        },
        workbox: {
          cleanupOutdatedCaches: true,
          sourcemap: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/traininglog-zied\.vercel\.app\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 10,
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ]
  };
});
