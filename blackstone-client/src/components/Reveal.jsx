import { useEffect, useRef, useState } from 'react'

/**
 * Scroll-in reveal wrapper. Renders `children` inside `as` (default div),
 * starts hidden/offset, and animates to its natural resting position the
 * first time it scrolls into view — it doesn't move again after that.
 *
 * variant:
 *   'up'    — rises from below (default, the classic "comes up and settles")
 *   'fade'  — opacity only, no movement
 *   'left'  / 'right' — slides in from the side
 *   'scale' — grows in from slightly smaller
 *
 * delay (ms) staggers a group of siblings, e.g. delay={i * 80} in a .map().
 */
export default function Reveal({ children, as: Tag = 'div', variant = 'up', delay = 0, className = '', once = true }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (once) observer.unobserve(el)
        } else if (!once) {
          setVisible(false)
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [once])

  const variantClass = variant === 'up' ? '' : `reveal-${variant}`

  return (
    <Tag
      ref={ref}
      className={['reveal', variantClass, visible ? 'is-visible' : '', className].filter(Boolean).join(' ')}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
