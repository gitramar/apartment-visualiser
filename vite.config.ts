import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          konva: ['konva', 'react-konva'],
        },
      },
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/tests/**/*.test.ts'],
  },
});
