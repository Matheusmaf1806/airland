// vite.config.js
import { defineConfig } from 'vite';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default defineConfig({
  build: {
    outDir: 'public',
    emptyOutDir: false,
    rollupOptions: {
      input: './src/main.js',
      output: {
        entryFileNames: 'assets/main.js'
      },
      plugins: [
        nodeResolve(),  // resolve node_modules
        commonjs()      // converte CJS -> ESM
      ]
    }
  },
  define: {
    'import.meta.env.VITE_MALGA_API_KEY': JSON.stringify(process.env.MALGA_API_KEY),
    'import.meta.env.VITE_MALGA_CLIENT_ID': JSON.stringify(process.env.MALGA_CLIENT_ID)
  }
});
