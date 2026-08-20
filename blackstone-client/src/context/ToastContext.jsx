import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

const AUTO_DISMISS_MS = 5000

// A small floating confirmation banner (bottom-right, stacks upward) for
// actions that finish somewhere the user might not be looking — e.g.
// creating a booking from a long form. Complements the in-app notification
// bell (which is for things worth reading again later) rather than
// replacing it: the toast is "yes, that just worked," the bell is the
// ongoing record.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message, { type = 'success' } = {}) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 border bg-white px-4 py-3 shadow-lg ${
              t.type === 'error' ? 'border-red-300' : 'border-brand-gold/40'
            }`}
          >
            {t.type === 'error' ? (
              <XCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
            ) : (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand-gold" />
            )}
            <p className="flex-1 text-sm text-brand-black">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="shrink-0 text-brand-black/30 hover:text-brand-black/60"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Falls back to a no-op if used outside the provider (shouldn't happen once
// mounted at the app root, but keeps this safe rather than throwing).
export function useToast() {
  const ctx = useContext(ToastContext)
  return ctx || { showToast: () => {} }
}
