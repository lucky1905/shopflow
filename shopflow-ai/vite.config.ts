import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  // Dev server proxies /api to the FastAPI backend so the browser never needs
  // CORS and the same relative URLs work in dev and production.
  const backend = env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backend,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ''),
        },
      },
    },
    preview: {
      port: 4173,
      proxy: {
        '/api': {
          target: backend,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      sourcemap: mode !== 'production',
      chunkSizeWarningLimit: 900,
    },
  }
})
