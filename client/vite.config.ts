import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_TARGET =
  process.env.VITE_API_TARGET ||
  'https://dk927dff-8000.inc1.devtunnels.ms'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
      },
      '/v1': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
