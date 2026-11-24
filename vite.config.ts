/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': decodeURIComponent(new URL('./src', import.meta.url).pathname) },
  },
  server: { port: 5175 },
  test: {
    environment: 'jsdom',
  },
})
