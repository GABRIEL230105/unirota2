import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react-leaflet', 'leaflet', '@react-leaflet/core'],
  },
  server: {
    host: true, // permite acessar pelo IP da rede local também
    proxy: {
      '/auth': 'http://localhost:3333',
      '/users': 'http://localhost:3333',
      '/rides': 'http://localhost:3333',
      '/ratings': 'http://localhost:3333',
    },
  },
})