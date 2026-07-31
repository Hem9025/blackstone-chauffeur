import { Helmet } from 'react-helmet-async'

/**
 * Wraps react-helmet-async to set per-page SEO title + meta description.
 * Usage: <PageMeta title="About Us" description="..." />
 */
export default function PageMeta({ title, description, image }) {
  const fullTitle = title
    ? `${title} | BlackStone Chauffeur`
    : 'BlackStone Chauffeur | Premium Chauffeur Service'

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {image && <meta property="og:image" content={image} />}
      <meta property="og:type" content="website" />
    </Helmet>
  )
}
