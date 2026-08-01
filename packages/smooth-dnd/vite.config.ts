import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: 'SmoothDnD',
      fileName: 'smooth-dnd',
    },
    sourcemap: true,
  },
  plugins: [
    dts({
      include: ['index.ts', 'src/**/*.ts'],
      rollupTypes: false,
    }),
  ],
})
