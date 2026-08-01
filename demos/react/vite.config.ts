import { defineConfig } from 'vite'

// @vitejs/plugin-react is deliberately absent: its current release requires
// Vite 8, and Vite is pinned to 7 here for the rest of the plugin ecosystem.
// esbuild handles the JSX; the only thing given up is React Fast Refresh, so a
// component edit does a full reload rather than preserving state.
export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  server: {
    port: 5175,
  },
})
