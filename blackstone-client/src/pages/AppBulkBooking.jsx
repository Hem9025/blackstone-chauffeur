import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Wand2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { bookings as bookingsApi } from '../utils/api'

// Splits a pasted block into one chunk per booking: blank lines first; if the
// text has no blank lines, fall back to numbered/“Booking N” starts.
function splitBookings(text) {
  const clean = String(text || '').replace(/\r/g, '').trim()
  if (!clean) return []
  let chunks = clean.split(/\n\s*\n+/)
  if (chunks.length === 1) {
    const lines = clean.split('\n')
    const startRe = /^\s*(?:\d{1,2}[.)]\s|#\d+\b|booking\s*\d+\b)/i
    if (lines.filter((l) => startRe.test(l)).length > 1) {
      chunks = []
      let cur = []
      for (const line of lines) {
        if (startRe.test(line) && cur.length) {
          chunks.push(cur.join('\n'))
          cur = []
        }
        cur.push(line)
      }
      if (cur.length) chunks.push(cur.join('\n'))
    }
  }
  return chunks.map((c) => c.trim()).filter(Boolean)
}

const field = 'w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm'

// Phone-app page (admin): paste several bookings at once, check/edit the list,
// create them all in one go. Uses the same text reader as the single
// "Paste from WhatsApp" box, once per booking.
export default function AppBulkBooking() {
  const [text, setText] = useState('')
  const [rows, setRows] = useState([])
  const [parsing, setParsing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function handleParse() {
    setParsing(true)
    setError('')
    try {
      const chunks = splitBookings(text)
      const results = await Promise.all(chunks.map((c) => bookingsApi.parseWhatsapp(c).catch(() => null)))
      setRows(
        chunks.map((raw, i) => {
          const r = results[i] || {}
          return {
            key: i,
            raw,
            include: true,
            state: 'ready', // ready | creating | done | failed
            message: '',
            passenger_name: r.passenger_name || '',
            passenger_phone: r.passenger_phone || '',
            passenger_email: r.passenger_email || '',
            pickup: r.pickup || '',
            dropoff: r.dropoff || '',
            date: r.date || '',
            time: r.time || '',
            trip_type: r.trip_type || 'one_way',
            service_type: r.service_type || 'Chauffeur Service',
            hours: r.hours ? String(r.hours) : '',
            flight_number: r.flight_number || '',
            passengers: r.passengers || 1,
            suitcases: r.suitcases ?? 0,
            vehicle_id: r.vehicle_id || '',
            notes: [r.reference_number ? `Reference: ${r.reference_number}` : '', r.notes || ''].filter(Boolean).join('\n').slice(0, 250),
            price: '',
          }
        }),
      )
    } catch (err) {
      setError(err.message || 'Could not read the text')
    } finally {
      setParsing(false)
    }
  }

  function update(key, patch) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function problem(r) {
    if (!r.passenger_name.trim()) return 'Needs a passenger name'
    if (r.trip_type === 'hourly' && !r.hours) return 'Needs hours'
    if (r.price !== '' && !(Number(r.price) >= 0)) return 'Price is not valid'
    return ''
  }

  const selectable = rows.filter((r) => r.include && r.state !== 'done')
  const blocked = selectable.filter((r) => problem(r))

  async function createAll() {
    setCreating(true)
    setError('')
    for (const r of selectable) {
      if (problem(r)) continue
      update(r.key, { state: 'creating', message: '' })
      try {
        const { booking } = await bookingsApi.createProvider({
          vehicle_id: r.vehicle_id || undefined,
          passenger_name: r.passenger_name.trim(),
          passenger_phone: r.passenger_phone,
          passenger_email: r.passenger_email,
          pickup: r.pickup,
          dropoff: r.trip_type === 'hourly' ? undefined : r.dropoff,
          date: r.date || undefined,
          time: r.time || undefined,
          trip_type: r.trip_type,
          service_type: r.service_type,
          hours: r.trip_type === 'hourly' ? Number(r.hours) : undefined,
          flight_number: r.service_type === 'Airport Transfer' ? r.flight_number : undefined,
          stop_addresses: [],
          child_seats: 0,
          passengers: r.passengers,
          suitcases: r.suitcases,
          notes: r.notes,
          extras: [],
          total_price: r.price === '' ? 0 : Number(r.price),
        })
        update(r.key, { state: 'done', message: `Booking #${booking.id} created` })
      } catch (err) {
        update(r.key, { state: 'failed', message: err.message || 'Failed' })
      }
    }
    setCreating(false)
  }

  const doneCount = rows.filter((r) => r.state === 'done').length

  return (
    <div className="mx-auto max-w-md pb-6">
      {rows.length === 0 ? (
        <>
          <p className="text-sm text-black/55">
            Paste several bookings below. Put a blank line between each one (or number them 1., 2., 3.). You'll check
            the list before anything is created.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            placeholder={'John Smith\nPickup: Auckland Airport\nDrop: Sky Tower\n25 Nov 3pm\n\nMary Lee\nFrom Hilton Hotel to Waiheke Ferry\n26/11 9:30am'}
            className="mt-3 w-full rounded-2xl border border-black/10 bg-white p-4 text-[15px]"
          />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          <button
            type="button"
            onClick={handleParse}
            disabled={!text.trim() || parsing}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-gold py-3.5 text-base font-semibold text-brand-black disabled:opacity-50"
          >
            <Wand2 size={18} /> {parsing ? 'Reading…' : 'Read bookings'}
          </button>
          <Link to="/admin?view=new" className="mt-4 block text-center text-sm text-black/50">
            Add a single booking instead
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm text-black/55">
            Found {rows.length} booking{rows.length === 1 ? '' : 's'}. Check each one, fix anything wrong, untick any
            you don't want.
          </p>

          <div className="mt-3 flex flex-col gap-3">
            {rows.map((r, i) => {
              const p = r.state === 'done' ? '' : problem(r)
              return (
                <div key={r.key} className={`rounded-2xl bg-white p-4 shadow-sm ${r.state === 'done' ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-semibold text-brand-black">
                      <input
                        type="checkbox"
                        checked={r.include}
                        disabled={r.state === 'done' || creating}
                        onChange={(e) => update(r.key, { include: e.target.checked })}
                        className="h-5 w-5"
                      />
                      Booking {i + 1}
                    </label>
                    {r.state === 'done' && (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                        <CheckCircle2 size={14} /> {r.message}
                      </span>
                    )}
                    {r.state === 'creating' && <span className="text-xs text-black/45">Creating…</span>}
                  </div>

                  {r.state !== 'done' && (
                    <div className="mt-3 grid gap-2">
                      <input className={field} placeholder="Passenger name *" value={r.passenger_name} onChange={(e) => update(r.key, { passenger_name: e.target.value })} />
                      <input className={field} placeholder="Phone" value={r.passenger_phone} onChange={(e) => update(r.key, { passenger_phone: e.target.value })} />
                      <input className={field} placeholder="Pickup" value={r.pickup} onChange={(e) => update(r.key, { pickup: e.target.value })} />
                      {r.trip_type !== 'hourly' && (
                        <input className={field} placeholder="Drop-off" value={r.dropoff} onChange={(e) => update(r.key, { dropoff: e.target.value })} />
                      )}
                      {r.trip_type === 'hourly' && (
                        <input className={field} inputMode="numeric" placeholder="Hours *" value={r.hours} onChange={(e) => update(r.key, { hours: e.target.value })} />
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <input type="date" className={field} value={r.date} onChange={(e) => update(r.key, { date: e.target.value })} />
                        <input type="time" className={field} value={r.time} onChange={(e) => update(r.key, { time: e.target.value })} />
                      </div>
                      <input className={field} inputMode="decimal" placeholder="Price (optional)" value={r.price} onChange={(e) => update(r.key, { price: e.target.value })} />
                    </div>
                  )}

                  {p && r.include && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                      <AlertTriangle size={13} /> {p}
                    </p>
                  )}
                  {r.state === 'failed' && <p className="mt-2 text-xs text-red-500">{r.message}</p>}
                  <details className="mt-2">
                    <summary className="text-xs text-black/40">Original text</summary>
                    <p className="mt-1 whitespace-pre-wrap text-xs text-black/50">{r.raw}</p>
                  </details>
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={createAll}
              disabled={creating || selectable.length === 0 || blocked.length > 0}
              className="w-full rounded-2xl bg-brand-gold py-3.5 text-base font-semibold text-brand-black disabled:opacity-50"
            >
              {creating ? 'Creating…' : `Create ${selectable.length} booking${selectable.length === 1 ? '' : 's'}`}
            </button>
            {blocked.length > 0 && (
              <p className="text-center text-xs text-amber-600">Fix the highlighted bookings (or untick them) to continue.</p>
            )}
            {doneCount > 0 && (
              <Link to="/admin" className="text-center text-sm font-medium text-brand-gold">
                View all bookings
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                setRows([])
                setText('')
              }}
              disabled={creating}
              className="text-center text-sm text-black/50"
            >
              Start over
            </button>
          </div>
        </>
      )}
    </div>
  )
}
