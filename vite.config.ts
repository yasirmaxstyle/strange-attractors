import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/strange-attractors/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three')) return 'vendor-three';
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            if (id.includes('@react-three')) return 'vendor-r3f';
            if (id.includes('@react-three/drei')) return 'vendor-drei';
            if (id.includes('@react-three/postprocessing')) return 'vendor-postprocessing';
            if (id.includes('leva')) return 'vendor-leva';
            return 'vendor-core';
          }
        }
      }
    }
  },
})
