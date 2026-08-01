import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// Declarations are emitted by `tsc --emitDeclarationOnly` in the build script
// rather than a Vite plugin: TypeScript 7 removed the JavaScript Compiler API
// that vite-plugin-dts depends on.
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: 'SmoothDnD',
      fileName: 'smooth-dnd',
    },
    sourcemap: true,
    rollupOptions: {
      // index.ts has both named exports and a deprecated default export.
      output: { exports: 'named' },
    },
  },
})
