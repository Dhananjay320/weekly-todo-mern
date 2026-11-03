import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // In development the API runs separately on :4000; in production Express serves this app itself.
  server: { proxy: { '/api': 'http://localhost:4000' } },
})
