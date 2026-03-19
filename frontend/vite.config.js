import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5180,
    proxy: {
      '/api': { target: 'http://localhost:3005', changeOrigin: true },
      '/auth': { target: 'http://localhost:3005', changeOrigin: true },
      '/me': { target: 'http://localhost:3005', changeOrigin: true },
      '/users': { target: 'http://localhost:3005', changeOrigin: true },
      '/licenses': { target: 'http://localhost:3005', changeOrigin: true },
      '/catalog': { target: 'http://localhost:3005', changeOrigin: true },
      '/activations': { target: 'http://localhost:3005', changeOrigin: true },
      '/pending-licenses': { target: 'http://localhost:3005', changeOrigin: true },
      '/notifications': { target: 'http://localhost:3005', changeOrigin: true },
      '/paypal': { target: 'http://localhost:3005', changeOrigin: true },
      '/roles': { target: 'http://localhost:3005', changeOrigin: true },
      '/settings': { target: 'http://localhost:3005', changeOrigin: true },
      '/audit': { target: 'http://localhost:3005', changeOrigin: true },
      '/backup': { target: 'http://localhost:3005', changeOrigin: true },
      // CRM Routes
      '/crm': { target: 'http://localhost:3005', changeOrigin: true },
      '/servers': { target: 'http://localhost:3005', changeOrigin: true },
      '/domains': { target: 'http://localhost:3005', changeOrigin: true },
      '/migration-clients': { target: 'http://localhost:3005', changeOrigin: true },
      '/clients': { target: 'http://localhost:3005', changeOrigin: true },
      '/prospects': { target: 'http://localhost:3005', changeOrigin: true },
      '/followups': { target: 'http://localhost:3005', changeOrigin: true },
      '/templates': { target: 'http://localhost:3005', changeOrigin: true },
      '/health': { target: 'http://localhost:3005', changeOrigin: true }
    }
  },
  build: {
    chunkSizeWarningLimit: 10000, // Increase limit for large data libraries
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('country-state-city')) {
            return 'geo-data';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})
