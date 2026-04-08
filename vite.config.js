import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, 'dist');

function copyExtensionAssets() {
  return {
    name: 'copy-extension-assets',
    closeBundle() {
      fs.mkdirSync(path.join(DIST_DIR, 'icons'), { recursive: true });

      fs.copyFileSync(
        path.resolve(__dirname, 'manifest.json'),
        path.join(DIST_DIR, 'manifest.json')
      );

      for (const fileName of fs.readdirSync(path.resolve(__dirname, 'icons'))) {
        fs.copyFileSync(
          path.resolve(__dirname, 'icons', fileName),
          path.join(DIST_DIR, 'icons', fileName)
        );
      }
    }
  };
}

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [
    svelte(),
    copyExtensionAssets()
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        options: path.resolve(__dirname, 'options.html'),
        notebook: path.resolve(__dirname, 'notebook.html'),
        analytics: path.resolve(__dirname, 'analytics.html'),
        background: path.resolve(__dirname, 'background.js'),
        content: path.resolve(__dirname, 'content.js')
      },
      output: {
        entryFileNames(chunkInfo) {
          if (chunkInfo.name === 'background' || chunkInfo.name === 'content') {
            return '[name].js';
          }

          return 'assets/[name].js';
        },
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]'
      }
    }
  }
});
