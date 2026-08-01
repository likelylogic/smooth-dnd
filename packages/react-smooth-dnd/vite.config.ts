import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// No @vitejs/plugin-react here: that plugin exists for Fast Refresh / HMR,
// which a library bundle has no use for. Vite's built-in esbuild transpiles the
// JSX on its own, using the automatic runtime configured below.
//
// Declarations are emitted by `tsc --emitDeclarationOnly` in the build script
// rather than a Vite plugin: TypeScript 7 removed the JavaScript Compiler API
// that vite-plugin-dts depends on.
export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: 'ReactSmoothDnD',
      fileName: 'react-smooth-dnd',
    },
    sourcemap: true,
    rollupOptions: {
      // Core must stay external. The adapter mutates the `smoothDnD` module
      // singleton (dropHandler / wrapChild); bundling a private copy would mean
      // a consumer importing the core directly got a different, unconfigured one.
      external: ['react', 'react-dom', 'react/jsx-runtime', '@likelylogic/smooth-dnd'],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'ReactJSXRuntime',
          '@likelylogic/smooth-dnd': 'SmoothDnD',
        },
      },
    },
  },
})
