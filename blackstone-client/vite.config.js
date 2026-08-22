import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import sitemap from 'vite-plugin-sitemap'
import { FLEET } from './src/constants/fleet.js'
import { TOURS } from './src/constants/tours.js'

// Static marketing routes, plus every individual fleet vehicle and tour page
// generated from the same data the app itself renders from — so a new
// vehicle/tour added to constants/fleet.js or constants/tours.js
// automatically appears in the sitemap too, instead of silently being
// crawlable-but-unlisted until someone remembers to add it here by hand.
// '/fleet/economy' was previously listed here but that route doesn't
// exist — the real economy/comfort-class route is '/fleet/comfort' (see
// App.jsx and constants/fleet.js categoryPath()), so the old entry was
// telling Google to index a URL that 404s.
const routes = [
  '/',
  '/about',
  '/services',
  '/fleet/luxury',
  '/fleet/comfort',
  ...FLEET.map((v) => `/fleet/${v.slug}`),
  '/tour',
  ...TOURS.map((t) => `/tour/${t.slug}`),
  '/gallery',
  '/contact',
  '/booking',
  '/privacy',
  '/terms',
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
