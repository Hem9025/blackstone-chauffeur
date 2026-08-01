import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import sitemap from 'vite-plugin-sitemap'

const routes = [
  '/',
  '/about',
  '/services',
  '/fleet/luxury',
  '/fleet/economy',
  '/tour',
  '/gallery',
  '/contact',
  '/booking',
  '/login',
  '/register',
  '/apply',
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    sitemap({
      hostname: 'https://www.blackstonechauffeur.co.nz',
      dynamicRoutes: routes,
    }),
  ],
  server: {
    port: 5173,
  },
})
