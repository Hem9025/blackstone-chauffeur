import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'

const SITE_URL = 'https://www.blackstonechauffeur.co.nz'

/**
 * Wraps react-helmet-async to set per-page SEO title + meta description.
 * Usage: <PageMeta title="About Us" description="..." />
 *
 * `jsonLd` accepts either a single structured-data object or an array of
 * them (e.g. a BreadcrumbList alongside a Service or FAQPage on the same
 * page) — each one renders as its own <script type="application/ld+json">.
 *
 * A canonical link is always set automatically from the current route
 * (stripping any query string, e.g. /fleet/comfort?type=van collapses to
 * /fleet/comfort) so filtered/duplicate URL variants all point search
 * engines at the one canonical version instead of being treated as separate
 * pages. Pass `canonicalPath` to override this for a route where the
 * auto-derived one isn't right.
 */
export default function PageMeta({ title, description, image, jsonLd, canonicalPath }) {
  const { pathname } = useLocation()
  const fullTitle = title
    ? `${title} | BlackStone Chauffeur`
    : 'BlackStone Chauffeur | Premium Chauffeur Service'

  const canonicalUrl = `${SITE_URL}${(canonicalPath ?? pathname).replace(/\/+$/, '') || '/'}`
  const jsonLdItems = Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : jsonLd ? [jsonLd] : []

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {image && <meta property="og:image" content={image} />}
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      {jsonLdItems.map((item, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(item)}</script>
      ))}
    </Helmet>
  )
}
