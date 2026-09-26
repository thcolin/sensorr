import { forwardRef, ReactNode } from 'react'

export const Sheet = forwardRef<HTMLElement, { className?: string, label?: string, children: ReactNode }>(({ className, label, children }, ref) => (
  <section ref={ref} className={`sheet ${className || ''}`} aria-label={label}>
    {children}
  </section>
))

// Hand lettering: each word leans and grows a little on its own, the same way on every visit
const lean = (index: number, seed: number) => {
  const value = Math.sin((index + 1) * 12.9898 + seed * 78.233) * 43758.5453
  return value - Math.floor(value)
}

export const Lettering = ({ text, highlight, as: Tag = 'h2', className, seed = 1 }: { text: string, highlight?: string, as?: 'h1' | 'h2' | 'h3' | 'p', className?: string, seed?: number }) => {
  const words = text.split(/\s+/).filter(Boolean)
  const highlighted = new Set((highlight || '').split(/\s+/).filter(Boolean))

  return (
    <Tag className={`lettering ${className || ''}`} aria-label={text}>
      {words.map((word, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={highlighted.has(word) ? 'lettering-highlight' : undefined}
          style={{
            '--lean': `${(lean(index, seed) - 0.5) * 7}deg`,
            '--grow': 0.9 + lean(index + 7, seed) * 0.22,
          } as React.CSSProperties}
        >
          {word}
        </span>
      ))}
    </Tag>
  )
}
