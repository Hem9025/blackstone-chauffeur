import { useEffect, useState } from 'react'
import { Download, Trash2 } from 'lucide-react'
import PageMeta from '../components/PageMeta'
import Button from '../components/Button'
import { subscribers as subscribersApi } from '../utils/api'

export default function AdminSubscribersPanel() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState(null)

  function load() {
    setLoading(true)
    subscribersApi
      .list()
      .then(setList)
      .catch((err) => setError(err.message || 'Failed to load subscribers'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleRemove(s) {
    setRemovingId(s.id)
    try {
      await subscribersApi.remove(s.id)
      setList((prev) => prev.filter((x) => x.id !== s.id))
    } catch (err) {
      setError(err.message || 'Failed to remove subscriber')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div>
      <PageMeta title="Subscribers" description="Newsletter signups — BlackStone Chauffeur admin." />

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-heading text-3xl text-brand-black">Subscribers</h1>
          <Button onClick={() => subscribersApi.downloadCsv()} className="!px-4 !py-2 text-sm" disabled={!list.length}>
            <Download size={16} className="mr-1" /> Export CSV
          </Button>
        </div>
        <p className="mt-2 text-sm text-brand-black/50">
          Everyone who's signed up via the newsletter form in the site footer. There's no
          send-a-campaign feature here — export the list and use it with whatever email tool you
          send from.
        </p>

        {loading && <p className="mt-8 text-brand-black/50">Loading…</p>}
        {error && <p className="mt-8 text-red-500">{error}</p>}

        {!loading && (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-black/10 text-left text-brand-black/50">
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Source</th>
                  <th className="py-2 pr-4">Subscribed</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id} className="border-b border-brand-black/5">
                    <td className="py-2 pr-4">{s.email}</td>
                    <td className="py-2 pr-4">{s.name || '—'}</td>
                    <td className="py-2 pr-4 capitalize">{s.source || '—'}</td>
                    <td className="py-2 pr-4">{s.created_at ? new Date(s.created_at).toLocaleDateString('en-NZ') : '—'}</td>
                    <td className="py-2 pr-4">
                      <button
                        onClick={() => handleRemove(s)}
                        disabled={removingId === s.id}
                        aria-label="Remove subscriber"
                        className="text-brand-black/40 hover:text-red-500 disabled:opacity-40"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!list.length && <p className="py-8 text-brand-black/50">No subscribers yet.</p>}
          </div>
        )}
      </section>
    </div>
  )
}
