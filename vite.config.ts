import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Root domain (anuradhapumudu.github.io) → base must be '/'
  base: '/',
})
