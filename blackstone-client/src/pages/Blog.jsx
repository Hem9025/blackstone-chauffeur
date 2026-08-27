import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import PageMeta from '../components/PageMeta'
import Reveal from '../components/Reveal'
import { blog as blogApi } from '../utils/api'
import { breadcrumbJsonLd } from '../constants/seo'

const BLOG_JSON_LD = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Blog', path: '/blog' },
])

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    blogApi
      .list()
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageMeta
        title="Blog"
        description="Guides, city tips and news from BlackStone Chauffeur — airport transfers, weddings, corporate travel and touring New Zealand."
        jsonLd={BLOG_JSON_LD}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <Reveal>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">From BlackStone Chauffeur</p>
          <h1 className="mt-2 font-heading text-4xl text-brand-black">Blog</h1>
          <p className="mt-4 max-w-2xl text-brand-black/60">
            City guides, travel tips, and news from the road — written by the BlackStone team.
          </p>
        </Reveal>

        {loading && <p className="mt-10 text-brand-black/50">Loading…</p>}

        {!loading && !posts.length && (
          <p className="mt-10 text-brand-black/50">Nothing published yet — check back soon.</p>
        )}

        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 100}>
              <Link
                to={`/blog/${p.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-black/10 bg-white transition-shadow hover:shadow-lg"
              >
                {p.cover_image && (
                  <div className="aspect-[16/10] overflow-hidden bg-black/5">
                    <img
                      src={p.cover_image}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  {p.published_at && (
                    <p className="text-xs uppercase tracking-widest text-brand-gold">
                      {new Date(p.published_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                  <h2 className="mt-2 font-heading text-xl text-black">{p.title}</h2>
                  {p.excerpt && <p className="mt-2 flex-1 text-sm text-black/60">{p.excerpt}</p>}
                  <span className="mt-4 flex items-center gap-1 text-sm font-medium text-brand-gold">
                    Read more <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  )
}
