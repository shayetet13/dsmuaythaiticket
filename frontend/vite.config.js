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
    // Code splitting - more aggressive splitting for smaller bundles
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('axios')) {
              return 'vendor-axios';
            }
            // Other node_modules
            return 'vendor-other';
          }
          
          // Component chunks
          if (id.includes('/components/')) {
            if (id.includes('skeletons')) {
              return 'components-skeletons';
            }
            if (id.includes('Admin') || id.includes('Management')) {
              return 'components-admin';
            }
            return 'components';
          }
          
          // Utils and hooks
          if (id.includes('/utils/') || id.includes('/hooks/')) {
            return 'utils';
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Chunk size warning limit
    chunkSizeWarningLimit: 500, // Lower limit to catch large bundles
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
        passes: 2, // Multiple passes for better optimization
      },
      mangle: {
        safari10: true, // Fix Safari 10 issues
      },
    },
    // CSS code splitting
    cssCodeSplit: true,
    // Source maps for debugging (disable in production)
    sourcemap: false,
    // Target modern browsers for smaller bundles
    target: 'es2015',
    // Tree shaking
    treeshake: {
      moduleSideEffects: false,
    },
  },
  
  // Performance optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'lucide-react'],
  },
})

