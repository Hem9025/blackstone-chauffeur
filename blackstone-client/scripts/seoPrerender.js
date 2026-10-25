// Build-time SEO step (Vite plugin). Runs after `vite build` and:
//
//   1. Writes a real sitemap.xml — every public page once, the blog posts
//      included, honest <lastmod> where we actually know it (blog posts).
//   2. Writes one static HTML file per public route (dist/about.html,
//      dist/services/airport-transfers.html, ...) whose <head> already has
//      the page's own <title>, meta description, canonical and social tags,
//      and whose <div id="root"> already contains an <h1>, intro text and
//      internal links. React replaces that placeholder content the moment the
//      app loads, so visitors see no difference — but crawlers that don't run
//      JavaScript (and Google's first pass) now see a real page instead of an
//      empty shell titled "BlackStone Chauffeur".
//
// .htaccess serves dist/<route>.html for /<route> (see public/.htaccess).
//
// Blog posts live in the database, so they're fetched from the public API at
// build time. Set SEO_API_URL (e.g. https://api.yourdomain.co.nz/api) when
// building for production; if it can't be reached the build still succeeds,
// but blog posts are left out and a loud warning is printed.

import fs from 'node:fs'
import path from 'node:path'
import { STATIC_PAGES } from '../src/constants/seoPages.js'
import { SERVICE_PAGES } from '../src/constants/servicePages.js'
import { LOCATIONS } from '../src/constants/locations.js'
import { FLEET, FLEET_CATEGORIES } from '../src/constants/fleet.js'
import { TOURS } from '../src/constants/tours.js'

const SITE_URL = 'https://www.blackstonechauffeur.co.nz'
const TITLE_SUFFIX = ' | BlackStone Chauffeur'
const MARKER = 'data-static-seo="true"' // removed by src/main.jsx once the app runs (react-helmet-async then owns these tags)

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

// Same trimming PageMeta uses for the canonical URL.
const absolute = (p) => `${SITE_URL}${p.replace(/\/+$/, '') || '/'}`

function buildPages(blogPosts) {
  const pages = STATIC_PAGES.map((p) => ({ ...p, title: p.title + TITLE_SUFFIX }))

  for (const s of SERVICE_PAGES) {
    pages.push({
      path: `/services/${s.slug}`,
      title: `${s.title} | Auckland & NZ${TITLE_SUFFIX}`,
      description: s.tagline,
      h1: s.title,
      intro: s.intro,
      priority: '0.8',
    })
  }

  for (const l of LOCATIONS) {
    pages.push({
      path: `/locations/${l.slug}`,
      title: `${l.name} Chauffeur Service | VVIP, Corporate & Wedding Transport${TITLE_SUFFIX}`,
      description: l.tagline,
      h1: `${l.name} Chauffeur Service`,
      intro: l.intro,
      priority: '0.8',
    })
  }

  for (const cat of Object.values(FLEET_CATEGORIES)) {
    pages.push({
      path: `/fleet/${cat.urlSlug}`,
      title: `${cat.label} | Chauffeured Vehicle Hire New Zealand${TITLE_SUFFIX}`,
      description: `BlackStone Chauffeur's ${cat.label.toLowerCase()} — ${cat.intro}`,
      h1: cat.heading,
      intro: [cat.intro],
      priority: '0.8',
    })
  }

  for (const v of FLEET) {
    pages.push({
      path: `/fleet/${v.slug}`,
      title: `${v.title} | Chauffeured Hire${TITLE_SUFFIX}`,
      description: v.shortDesc,
      h1: `${v.title} Chauffeured Hire`,
      intro: v.description,
      priority: '0.7',
    })
  }

  for (const t of TOURS) {
    pages.push({
      path: `/tour/${t.slug}`,
      title: `${t.title} | Private Chauffeured Day Tour${TITLE_SUFFIX}`,
      description: t.shortDesc,
      h1: t.title,
      intro: [t.shortDesc],
      priority: '0.6',
    })
  }

  for (const b of blogPosts) {
    pages.push({
      path: `/blog/${b.slug}`,
      title: `${b.meta_title || b.title}${TITLE_SUFFIX}`,
      description: b.meta_description || b.excerpt || '',
      h1: b.title,
      intro: b.excerpt ? [b.excerpt] : [],
      image: b.cover_image,
      lastmod: b.published_at ? new Date(b.published_at).toISOString().slice(0, 10) : undefined,
      priority: '0.6',
      og: 'article',
    })
  }

  return pages
}

function renderSitemap(pages) {
  const seen = new Set()
  const urls = []
  for (const p of pages) {
    const loc = absolute(p.path)
    if (seen.has(loc)) continue // never list a URL twice
    seen.add(loc)
    urls.push(
      `  <url>\n    <loc>${esc(loc)}</loc>\n` +
        (p.lastmod ? `    <lastmod>${p.lastmod}</lastmod>\n` : '') +
        `    <priority>${p.priority}</priority>\n  </url>`,
    )
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}

function renderPage(template, page, navPages) {
  const canonical = absolute(page.path)
  const image = page.image ? (page.image.startsWith('http') ? page.image : `${SITE_URL}${page.image}`) : ''

  const head = [
    `<meta name="description" content="${esc(page.description)}" ${MARKER} />`,
    `<link rel="canonical" href="${esc(canonical)}" ${MARKER} />`,
    `<meta property="og:title" content="${esc(page.title)}" ${MARKER} />`,
    `<meta property="og:description" content="${esc(page.description)}" ${MARKER} />`,
    `<meta property="og:url" content="${esc(canonical)}" ${MARKER} />`,
    `<meta property="og:type" content="${page.og || 'website'}" ${MARKER} />`,
    image ? `<meta property="og:image" content="${esc(image)}" ${MARKER} />` : '',
  ]
    .filter(Boolean)
    .join('\n    ')

  const intro = (page.intro || []).map((t) => `<p>${esc(t)}</p>`).join('')
  const links = navPages
    .map((p) => `<li><a href="${esc(p.path)}">${esc(p.h1)}</a></li>`)
    .join('')
  const placeholder =
    `<div id="root"><main style="max-width:720px;margin:0 auto;padding:48px 20px;font-family:sans-serif">` +
    `<h1>${esc(page.h1)}</h1><p>${esc(page.description)}</p>${intro}` +
    `<nav aria-label="Main"><ul>${links}</ul></nav></main></div>`

  let html = template
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`)
  html = html.replace('</head>', `    ${head}\n  </head>`)
  html = html.replace('<div id="root"></div>', placeholder)
  return html
}

async function fetchBlogPosts(apiUrl) {
  if (!apiUrl || /localhost|127\.0\.0\.1/.test(apiUrl)) {
    console.warn(
      '\n[seo] WARNING: SEO_API_URL not set (or points at localhost) — blog posts will NOT be in the sitemap.\n' +
        '[seo]          Build with: SEO_API_URL=https://<your-api-domain>/api npm run build\n',
    )
    return []
  }
  try {
    const res = await fetch(`${apiUrl.replace(/\/+$/, '')}/blog`, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const posts = await res.json()
    console.log(`[seo] ${posts.length} published blog post(s) added to the sitemap`)
    return posts
  } catch (err) {
    console.warn(`\n[seo] WARNING: couldn't load blog posts from ${apiUrl} (${err.message}) — they will NOT be in the sitemap.\n`)
    return []
  }
}

// Exported separately so it can be run/tested without a full Vite build.
export function generate({ distDir, blogPosts = [] }) {
  const templatePath = path.join(distDir, 'index.html')
  const template = fs.readFileSync(templatePath, 'utf8')
  const pages = buildPages(blogPosts)

  // Short list of main sections, linked from every page's static content.
  const navPaths = ['/', '/services', '/locations', '/fleet/luxury', '/tour', '/blog', '/about', '/contact', '/booking']
  const navPages = navPaths
    .map((p) => pages.find((x) => x.path === p))
    .filter(Boolean)

  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), renderSitemap(pages))

  let written = 0
  for (const page of pages) {
    if (page.path === '/') {
      fs.writeFileSync(templatePath, renderPage(template, page, navPages)) // homepage = index.html
    } else {
      const file = path.join(distDir, `${page.path.replace(/^\//, '')}.html`)
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, renderPage(template, page, navPages))
    }
    written++
  }
  return { pages: written }
}

export default function seoPrerender({ apiUrl } = {}) {
  let outDir = 'dist'
  return {
    name: 'blackstone-seo-prerender',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      const blogPosts = await fetchBlogPosts(apiUrl)
      const { pages } = generate({ distDir: outDir, blogPosts })
      console.log(`[seo] sitemap.xml + ${pages} prerendered pages written`)
    },
  }
}
