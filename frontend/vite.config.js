import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwind()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) {
              return 'lucide-icons';
            }
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            // Group other vendor dependencies together
            return 'vendor';
          }
        }
      }
    }
  }
})
