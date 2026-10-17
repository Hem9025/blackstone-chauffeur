import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PageMeta from '../components/PageMeta'
import Reveal from '../components/Reveal'
import Button from '../components/Button'
import { blog as blogApi } from '../utils/api'
import { breadcrumbJsonLd, blogPostingJsonLd } from '../constants/seo'
import { renderMarkdown } from '../utils/markdown'

export default function BlogPost() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    blogApi
      .get(slug)
      .then(setPost)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  // Counts one view per post per browser tab session (sessionStorage, same
  // convention as the booking draft elsewhere in the app) — a refresh or
  // re-open of the same post in the same tab doesn't inflate the number.
  // Fire-and-forget: a failed tracking call must never affect reading.
  useEffect(() => {
    if (!post) return
    const key = `bc_blog_viewed_${post.slug}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      // sessionStorage unavailable — fall through and count the view.
    }
    blogApi.trackView(post.slug).catch(() => {})
  }, [post])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center md:px-8">
        <p className="text-brand-black/50">Loading…</p>
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center md:px-8">
        <PageMeta title="Post Not Found" description="This blog post couldn't be found." />
        <h1 className="font-heading text-3xl text-brand-black">Post not found</h1>
        <p className="mt-3 text-brand-black/60">This post may have been unpublished or moved.</p>
        <Button to="/blog" className="mt-8 !inline-flex">Back to Blog</Button>
      </div>
    )
  }

  const jsonLd = [
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: post.title, path: `/blog/${post.slug}` },
    ]),
    blogPostingJsonLd({
      title: post.title,
      description: post.meta_description || post.excerpt,
      path: `/blog/${post.slug}`,
      image: post.cover_image,
      publishedAt: post.published_at,
    }),
  ]

  return (
    <div>
      <PageMeta
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt}
        image={post.cover_image}
        jsonLd={jsonLd}
      />

      <article className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <Reveal>
          <Link to="/blog" className="flex items-center gap-1 text-sm text-brand-gold hover:underline">
            <ArrowLeft size={14} /> Back to Blog
          </Link>
          {post.published_at && (
            <p className="mt-6 text-xs uppercase tracking-widest text-brand-gold">
              {new Date(post.published_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
          <h1 className="mt-2 font-heading text-4xl text-brand-black">{post.title}</h1>
          {post.excerpt && <p className="mt-4 text-lg text-brand-black/60">{post.excerpt}</p>}
        </Reveal>

        {post.cover_image && (
          <Reveal delay={100}>
            <img
              src={post.cover_image}
              alt={post.title}
              className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover"
            />
          </Reveal>
        )}

        <Reveal delay={150}>
          <div
            className="prose-blog mt-10"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
          />
        </Reveal>

        <div className="mt-14 flex flex-col items-start gap-3 border-t border-black/10 pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-black/60">Ready to book your ride?</p>
          <Button to="/booking">Book a Chauffeur</Button>
        </div>
      </article>
    </div>
  )
}
