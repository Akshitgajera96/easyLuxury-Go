import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    // Optimize for Render's free tier memory constraints
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code to reduce memory usage during build
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'map-vendor': ['mapbox-gl', 'react-map-gl'],
        }
      }
    },
    // Reduce memory usage
    minify: 'esbuild',
    sourcemap: false,
  },
  // Optimize dependencies resolution
  optimizeDeps: {
    exclude: ['lucide-react']
  }
})
