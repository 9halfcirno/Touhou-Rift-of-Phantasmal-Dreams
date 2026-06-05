import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@core': path.resolve(__dirname, 'src/core'),
      '@ecs': path.resolve(__dirname, 'src/ecs'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@systems': path.resolve(__dirname, 'src/systems'),
      '@objects': path.resolve(__dirname, 'src/objects'),
      '@map': path.resolve(__dirname, 'src/map'),
      '@graphics': path.resolve(__dirname, 'src/graphics'),
      '@input': path.resolve(__dirname, 'src/input'),
      '@math': path.resolve(__dirname, 'src/math'),
      '@resources': path.resolve(__dirname, 'src/resources'),
      '@managers': path.resolve(__dirname, 'src/managers'),
      '@animation': path.resolve(__dirname, 'src/animation'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
  },

  // 当前目录作为静态资源根，/assets/* 和 /definitions/* 可直访
  publicDir: '.',

  server: {
    port: 3000,
    open: true,
  },

  build: {
    target: 'es2022',
    outDir: 'dist',
  },
});
