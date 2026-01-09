import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    open: true
  },
  // Tell Vite to treat .jsx files as JSX
  esbuild: {
    jsx: 'automatic',
  }
})