// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../public',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/main.js'
      }
    }
  },
  // IMPORTANTE: inclua "MALGA_" no envPrefix para o Vite expor MALGA_API_KEY
  envPrefix: ['VITE_', 'MALGA_'],
});
