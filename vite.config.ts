import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['cjs'],
      fileName: () => 'index.js'
    },
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: ['siyuan']
    }
  },
  plugins: [
    {
      name: 'copy-static-files',
      writeBundle() {
        const files = ['icon.png', 'preview.png', 'index.css', 'plugin.json', 'README.md', 'README_zh_CN.md'];
        files.forEach(file => {
          const srcPath = join(__dirname, file);
          const destPath = join(__dirname, 'dist', file);
          if (existsSync(srcPath)) {
            copyFileSync(srcPath, destPath);
          }
        });

        const i18nSrc = join(__dirname, 'i18n');
        const i18nDest = join(__dirname, 'dist', 'i18n');
        if (existsSync(i18nSrc)) {
          mkdirSync(i18nDest, { recursive: true });
          const i18nFiles = readdirSync(i18nSrc);
          i18nFiles.forEach(file => {
            copyFileSync(join(i18nSrc, file), join(i18nDest, file));
          });
        }
      }
    }
  ]
});
