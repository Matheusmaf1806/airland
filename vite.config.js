import { defineConfig } from 'vite';

export default defineConfig({
  // Remova "root: 'src'," para não forçar o Vite a procurar src/index.html
  build: {
    outDir: '../public',   // ou 'public' dependendo de onde está seu vite.config.js
    emptyOutDir: false,
    rollupOptions: {
      // Define explicitamente o arquivo de entrada, em vez de "index.html"
      input: 'src/main.js',
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
