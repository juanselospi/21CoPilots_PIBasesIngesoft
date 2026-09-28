import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // /api se reenvía al servidor: un solo origen para la cookie de sesión.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
