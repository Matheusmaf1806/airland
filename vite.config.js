// vite.config.js

export default {
  root: 'src',          // A pasta "src" é onde fica seu código front-end
  build: {
    outDir: '../public', // O bundle final vai para "public/"
    emptyOutDir: false,  // Para não apagar o que já existe em /public
    rollupOptions: {
      output: {
        // Garante que o arquivo de saída fique com um nome fixo,
        // facilitando seu <script src="/assets/main.js">
        entryFileNames: 'assets/main.js'
      }
    }
  }
};
