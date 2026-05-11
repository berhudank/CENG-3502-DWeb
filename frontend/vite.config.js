import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // This tells Vite to empty the folder and put the compiled files directly into your backend!
    outDir: '../backend/public',
    emptyOutDir: true
  }
})
