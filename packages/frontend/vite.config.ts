import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@ai-team/shared': resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        // 只代理 /api 路径，不代理根路径
      },
      '/ws': {
        target: 'http://localhost:3002',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
