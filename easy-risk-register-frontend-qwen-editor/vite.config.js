import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-zustand': ['zustand'],
          'vendor-form': ['react-hook-form'],
          'vendor-router': ['react-router-dom'],
        }
      }
    }
  },
  define: {
    global: 'globalThis',
  },
});