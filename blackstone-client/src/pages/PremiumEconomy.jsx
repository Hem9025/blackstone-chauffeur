import { useEffect, useState } from 'react'
import PageMeta from '../components/PageMeta'
import VehicleCard from '../components/VehicleCard'
import { vehicles as vehiclesApi } from '../utils/api'

export default function PremiumEconomy() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    vehiclesApi
      .list()
      .then((data) => setList(data.filter((v) => v.type === 'economy')))
      .catch((err) => setError(err.message || 'Failed to load fleet'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageMeta title="Premium Economy" description="Premium Economy Fleet available for booking with BlackStone Chauffeur." />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <h1 className="font-heading text-4xl text-brand-black">Premium Economy Fleet</h1>

        {loading && <p className="mt-8 text-brand-black/50">Loading fleet…</p>}
        {error && <p className="mt-8 text-red-500">{error}</p>}
        {!loading && !error && list.length === 0 && (
          <p className="mt-8 text-brand-black/50">No vehicles available yet — check back soon.</p>
        )}

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {list.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      </section>
    </div>
  )
}
