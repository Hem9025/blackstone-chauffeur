import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

// Drop-in replacement for a plain `<input type="password">` — same props,
// same look, just with a show/hide toggle on the right so people can check
// what they actually typed before submitting. Used on Login, Register,
// Profile (change password) and Reset Password.
export default function PasswordInput({ className = '', ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`w-full pr-11 ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-black/40 hover:text-brand-black/70"
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  )
}
