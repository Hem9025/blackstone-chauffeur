import { useEffect } from 'react'
import { X } from 'lucide-react'

// Minimal reusable popup shell — dark overlay, centered panel, closes on
// Escape, outside click, or the × button. Deliberately unopinionated about
// content: callers pass title + children (used for booking/driver/provider
// detail popups so the underlying table/card list can stay short).
export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl border border-black/10 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <p className="font-heading text-lg text-black">{title}</p>
          <button onClick={onClose} aria-label="Close" className="text-black/40 hover:text-black">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
