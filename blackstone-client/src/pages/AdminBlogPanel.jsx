import { useEffect, useState } from 'react'
import { Plus, X, Trash2 } from 'lucide-react'
import PageMeta from '../components/PageMeta'
import Button from '../components/Button'
import { blog as blogApi } from '../utils/api'
import { renderMarkdown } from '../utils/markdown'

const BLANK_FORM = {
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  cover_image: '',
  status: 'draft',
  meta_title: '',
  meta_description: '',
}

function postToForm(p) {
  return {
    title: p.title || '',
    slug: p.slug || '',
    excerpt: p.excerpt || '',
    body: p.body || '',
    cover_image: p.cover_image || '',
    status: p.status || 'draft',
    meta_title: p.meta_title || '',
    meta_description: p.meta_description || '',
  }
}

function slugify(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function AdminBlogPanel() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState(null)

  // editingId === 'new' means the create form; null means the panel is closed.
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(BLANK_FORM)
  // Tracks whether the slug was hand-edited this session — once it has,
  // typing in Title stops silently overwriting it, matching the usual
  // "auto-fill until the user takes over" pattern.
  const [slugTouched, setSlugTouched] = useState(false)

  function load() {
    setLoading(true)
    blogApi
      .adminList()
      .then(setList)
      .catch((err) => setError(err.message || 'Failed to load posts'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function openCreate() {
    setForm(BLANK_FORM)
    setSlugTouched(false)
    setEditingId('new')
    setError('')
  }

  async function openEdit(p) {
    setEditingId(p.id)
    setError('')
    try {
      const full = await blogApi.adminGet(p.id)
      setForm(postToForm(full))
      setSlugTouched(true)
    } catch (err) {
      setError(err.message || 'Failed to load post')
    }
  }

  function closeForm() {
    setEditingId(null)
  }

  function update(field) {
    return (e) => {
      const value = e.target.value
      setForm((f) => {
        const next = { ...f, [field]: value }
        if (field === 'title' && !slugTouched) next.slug = slugify(value)
        return next
      })
      if (field === 'slug') setSlugTouched(true)
    }
  }

  async function handleSubmit(e, publish) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      ...form,
      slug: form.slug.trim() || slugify(form.title),
      status: publish ?? (form.status === 'published' ? 'published' : 'draft'),
    }

    try {
      if (editingId === 'new') {
        await blogApi.create(payload)
      } else {
        await blogApi.update(editingId, payload)
      }
      closeForm()
      load()
    } catch (err) {
      setError(err.message || 'Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(p) {
    if (!window.confirm(`Delete "${p.title}"? This can't be undone.`)) return
    setRemovingId(p.id)
    try {
      await blogApi.remove(p.id)
      setList((prev) => prev.filter((x) => x.id !== p.id))
    } catch (err) {
      setError(err.message || 'Failed to delete post')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div>
      <PageMeta title="Manage Blog" description="Blog posts — BlackStone Chauffeur admin." />

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-heading text-3xl text-brand-black">Blog</h1>
          <Button onClick={openCreate} className="!px-4 !py-2 text-sm">
            <Plus size={16} className="mr-1" /> New Post
          </Button>
        </div>
        <p className="mt-2 text-sm text-brand-black/50">
          Written in Markdown — save as a draft any time, and only Published posts appear on the
          public /blog page.
        </p>

        {loading && <p className="mt-8 text-brand-black/50">Loading…</p>}
        {error && editingId === null && <p className="mt-8 text-red-500">{error}</p>}

        {!loading && (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-black/10 text-left text-brand-black/50">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Published</th>
                  <th className="py-2 pr-4">Updated</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className="border-b border-brand-black/5">
                    <td className="py-2 pr-4">{p.title}</td>
                    <td className="py-2 pr-4">
                      <span className={p.status === 'published' ? 'text-green-600' : 'text-brand-black/40'}>
                        {p.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{p.published_at ? new Date(p.published_at).toLocaleDateString('en-NZ') : '—'}</td>
                    <td className="py-2 pr-4">{p.updated_at ? new Date(p.updated_at).toLocaleDateString('en-NZ') : '—'}</td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEdit(p)}
                          className="border border-brand-gold px-3 py-1 text-xs text-brand-gold hover:bg-brand-gold hover:text-brand-black"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemove(p)}
                          disabled={removingId === p.id}
                          aria-label="Delete post"
                          className="text-brand-black/40 hover:text-red-500 disabled:opacity-40"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!list.length && <p className="py-8 text-brand-black/50">No posts yet.</p>}
          </div>
        )}

        {editingId !== null && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 py-10">
            <div className="mx-auto w-full max-w-5xl bg-white p-6 md:p-8">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl text-brand-black">
                  {editingId === 'new' ? 'New Post' : 'Edit Post'}
                </h2>
                <button onClick={closeForm} aria-label="Close">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={(e) => handleSubmit(e)} className="mt-6 flex flex-col gap-4">
                <input
                  required
                  placeholder="Post title"
                  value={form.title}
                  onChange={update('title')}
                  className="border border-brand-black/15 px-3 py-2 text-lg"
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="text-xs text-brand-black/50">
                    URL slug
                    <div className="mt-1 flex items-center border border-brand-black/15">
                      <span className="shrink-0 bg-black/5 px-2 py-2 text-xs text-brand-black/40">/blog/</span>
                      <input
                        value={form.slug}
                        onChange={update('slug')}
                        className="w-full px-2 py-2 text-sm"
                      />
                    </div>
                  </label>
                  <label className="text-xs text-brand-black/50">
                    Cover image URL (optional)
                    <input
                      placeholder="/images/blog/…"
                      value={form.cover_image}
                      onChange={update('cover_image')}
                      className="mt-1 w-full border border-brand-black/15 px-3 py-2 text-sm"
                    />
                  </label>
                </div>

                <label className="text-xs text-brand-black/50">
                  Excerpt (optional — shown on the blog list and used as the meta description if none is set below)
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={form.excerpt}
                    onChange={update('excerpt')}
                    className="mt-1 w-full border border-brand-black/15 px-3 py-2 text-sm"
                  />
                </label>

                <div>
                  <p className="text-xs text-brand-black/50">Body (Markdown) — headings with #, **bold**, *italic*, [links](url), - lists</p>
                  <div className="mt-1 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <textarea
                      required
                      rows={18}
                      value={form.body}
                      onChange={update('body')}
                      className="w-full resize-y border border-brand-black/15 p-3 font-mono text-sm"
                      placeholder={'## A great heading\n\nStart writing here...'}
                    />
                    <div className="max-h-[28rem] overflow-y-auto border border-brand-black/10 bg-black/[0.015] p-4">
                      <p className="mb-3 text-xs uppercase tracking-widest text-brand-black/30">Preview</p>
                      {form.body ? (
                        <div
                          className="prose-blog"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(form.body) }}
                        />
                      ) : (
                        <p className="text-sm text-brand-black/30">Nothing to preview yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="text-xs text-brand-black/50">
                    Meta title (optional — defaults to the post title)
                    <input
                      value={form.meta_title}
                      onChange={update('meta_title')}
                      className="mt-1 w-full border border-brand-black/15 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-xs text-brand-black/50">
                    Meta description (optional — defaults to the excerpt)
                    <input
                      value={form.meta_description}
                      onChange={update('meta_description')}
                      className="mt-1 w-full border border-brand-black/15 px-3 py-2 text-sm"
                    />
                  </label>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    disabled={saving}
                    onClick={(e) => handleSubmit(e, 'draft')}
                    variant="secondary"
                    className="!px-6 !py-2 text-sm"
                  >
                    {saving ? 'Saving…' : 'Save Draft'}
                  </Button>
                  <Button
                    type="button"
                    disabled={saving}
                    onClick={(e) => handleSubmit(e, 'published')}
                    className="!px-6 !py-2 text-sm"
                  >
                    {saving ? 'Saving…' : 'Publish'}
                  </Button>
                  <button type="button" onClick={closeForm} className="text-sm text-brand-black/50">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
