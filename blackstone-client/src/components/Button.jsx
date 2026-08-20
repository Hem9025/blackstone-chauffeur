import { Link } from 'react-router-dom'

// disabled:* utilities matter here: without them, a disabled <button> is
// functionally inert (the browser silently blocks the click) but looks
// completely normal — which reads as "the button doesn't work" rather than
// "a required field is still missing." This one line fixes that everywhere
// this component is used with a `disabled` prop.
const base =
  'inline-flex items-center justify-center px-6 py-3 font-medium tracking-wide transition-colors rounded-sm disabled:cursor-not-allowed disabled:opacity-40'
const variants = {
  // Gold is used sparingly, as the one accent color — everything else is black/white.
  primary: 'bg-brand-gold text-brand-black hover:bg-brand-champagne',
  secondary:
    'border border-brand-black text-brand-black hover:bg-brand-black hover:text-white',
  secondaryOnDark:
    'border border-white text-white hover:bg-white hover:text-brand-black',
}

/**
 * Renders as a Link if `to` is provided, otherwise a <button>.
 */
export default function Button({
  children,
  variant = 'primary',
  to,
  className = '',
  ...props
}) {
  const classes = `${base} ${variants[variant] || variants.primary} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}
