import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: __dirname,
  build: {
    outDir: '../assets',
    emptyOutDir: true,
    assetsDir: '',
    rollupOptions: {
      input: {
        shared: resolve(__dirname, 'src/shared.js'),
        homepage: resolve(__dirname, 'src/homepage.js'),
        about: resolve(__dirname, 'src/about.js'),
        styles: resolve(__dirname, 'src/main.css'),
      },
    },
  },
});
