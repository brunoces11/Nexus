import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nexusState } from './vite-plugin-nexus-state.mjs'

export default defineConfig({
  plugins: [react(), tailwindcss(), nexusState()],
  server: { port: 5173 },
})
