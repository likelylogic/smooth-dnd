import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Declarations are emitted by `tsc --emitDeclarationOnly` in the build script
// rather than a Vite plugin: TypeScript 7 removed the JavaScript Compiler API
// that vite-plugin-dts depends on.
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: 'VueSmoothDnD',
      fileName: 'vue-smooth-dnd',
    },
    sourcemap: true,
    rollupOptions: {
      // Core must stay external. The adapter mutates the `smoothDnD` module
      // singleton (dropHandler / wrapChild); bundling a private copy would mean
      // a consumer importing the core directly got a different, unconfigured one.
      external: ['vue', '@likelylogic/smooth-dnd'],
      output: {
        globals: {
          'vue': 'Vue',
          '@likelylogic/smooth-dnd': 'SmoothDnD',
        },
      },
    },
  },
  plugins: [vue()],
})
