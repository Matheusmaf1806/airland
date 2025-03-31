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
  define: {
    'import.meta.env.VITE_MALGA_API_KEY': JSON.stringify(process.env.MALGA_API_KEY),
    'import.meta.env.VITE_MALGA_CLIENT_ID': JSON.stringify(process.env.MALGA_CLIENT_ID)
  }
});
