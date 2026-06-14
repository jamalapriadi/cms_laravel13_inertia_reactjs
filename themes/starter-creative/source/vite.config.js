import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const sourceDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: sourceDir,
  publicDir: false,
  clearScreen: false,
  build: {
    outDir: path.resolve(sourceDir, '../public'),
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(sourceDir, 'js/theme.js'),
      name: 'StarterCreativeTheme',
      formats: ['iife'],
      fileName: () => 'js/theme',
    },
    rollupOptions: {
      output: {
        entryFileNames: 'js/theme.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
        inlineDynamicImports: true,
      },
    },
  },
});
