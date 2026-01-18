import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteImagemin from '@vheemstra/vite-plugin-imagemin'
import imageminWebp from 'imagemin-webp'
import imageminMozjpeg from 'imagemin-mozjpeg'
import imageminPngquant from 'imagemin-pngquant'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    
    // Image optimization plugin
    viteImagemin({
      plugins: {
        jpg: imageminMozjpeg({ quality: 80 }),
        png: imageminPngquant({ quality: [0.7, 0.8] }),
      },
      makeWebp: {
        plugins: {
          jpg: imageminWebp({ quality: 80 }),
          png: imageminWebp({ quality: 80 }),
        },
      },
    }),
    
    // Gzip compression
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // Only compress files larger than 10kb
      deleteOriginFile: false,
    }),
    
    // Brotli compression (better than gzip)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false,
    }),
  ],
  
  server: {
    port: parseInt(process.env.VITE_PORT) || 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BACKEND_URL || 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  
  // Build optimizations
  build: {
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-libs': ['lucide-react'],
          'utils': ['axios'],
        },
      },
    },
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    // CSS code splitting
    cssCodeSplit: true,
    // Source maps for debugging (disable in production)
    sourcemap: false,
  },
  
  // Performance optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'lucide-react'],
  },
})

