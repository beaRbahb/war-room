/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  server: {
    port: 8585,
  },
  optimizeDeps: {
    include: ['html2canvas'],
  },
  test: {
    globals: true,
    environment: 'node',
  },
})