import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/auth': { target: 'http://localhost:8001', changeOrigin: true, timeout: 10000 },
      '/api':  { target: 'http://localhost:8001', changeOrigin: true, timeout: 10000 },
      '/webhooks': { target: 'http://localhost:8001', changeOrigin: true, timeout: 10000 },
    },
  },
})
