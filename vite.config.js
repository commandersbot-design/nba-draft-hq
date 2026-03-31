import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/nba-draft-hq/',
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
