import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/strange-attractors/',

  build: {
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('@react-three/drei')) {
            return 'vendor-drei';
          }

          if (id.includes('@react-three/postprocessing')) {
            return 'vendor-postprocessing';
          }

          if (id.includes('@react-three/fiber')) {
            return 'vendor-r3f';
          }

          if (id.includes('react-dom')) {
            return 'vendor-react';
          }

          if (id.includes('react')) {
            return 'vendor-react';
          }

          if (id.includes('three')) {
            return 'vendor-three';
          }

          if (id.includes('leva')) {
            return 'vendor-leva';
          }

          return 'vendor-core';
        },
      },
    },
  },
})