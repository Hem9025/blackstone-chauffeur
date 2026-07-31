import { Link } from 'react-router-dom'

const base =
  'inline-flex items-center justify-center px-6 py-3 font-medium tracking-wide transition-colors rounded-sm'
const variants = {
  primary: 'bg-brand-gold text-brand-black hover:bg-brand-champagne',
  secondary:
    'border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-black',
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
