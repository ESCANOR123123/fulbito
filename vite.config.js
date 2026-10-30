const { defineConfig } = require('vite');
const tailwindcss = require('@tailwindcss/vite').default;

module.exports = defineConfig({
  publicDir: '../public/images',
  plugins: [tailwindcss()],
  root: 'frontend',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/v1': 'http://127.0.0.1:3000',
    },
  },
});
