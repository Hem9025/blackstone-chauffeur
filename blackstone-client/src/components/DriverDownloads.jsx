import { useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { bookings as bookingsApi } from '../utils/api'

// CSV / PDF download of the driver's own rides (shows their pay only — the
// server never includes the customer's price). Used on the website driver
// page and in the phone app.
export default function DriverDownloads({ disabled, className = '' }) {
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  async function run(kind) {
    setBusy(kind)
    setError('')
    try {
      await (kind === 'csv' ? bookingsApi.downloadDriverCsv() : bookingsApi.downloadDriverReport())
    } catch (err) {
      setError(err.message || 'Download failed')
    } finally {
      setBusy('')
    }
  }

  const btn =
    'flex items-center justify-center gap-1 border border-brand-black/20 px-3 py-2 text-xs text-brand-black hover:bg-brand-black hover:text-white disabled:opacity-40'

  return (
    <div className={className}>
      <div className="flex gap-2">
        <button type="button" onClick={() => run('csv')} disabled={disabled || !!busy} className={btn}>
          <Download size={13} /> {busy === 'csv' ? 'Preparing…' : 'CSV'}
        </button>
        <button type="button" onClick={() => run('pdf')} disabled={disabled || !!busy} className={btn}>
          <FileText size={13} /> {busy === 'pdf' ? 'Preparing…' : 'PDF'}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
