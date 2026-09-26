import { forwardRef, ReactNode, useId } from 'react'

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

// A fixed heading painted along a curve, one arc per line, its edges roughened like a dry brush
export const Brushed = ({ lines, as: Tag = 'h2', className, seed = 1 }: { lines: string[], as?: 'h1' | 'h2', className?: string, seed?: number }) => {
  const id = useId().replace(/:/g, '')

  return (
    <Tag className={`brushed ${className || ''}`}>
      <span className="visually-hidden">{lines.join(' ')}</span>
      <svg viewBox={`0 0 400 ${lines.length * 84 + 16}`} aria-hidden="true">
        <defs>
          <filter id={`${id}-dry`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9 0.06" numOctaves="2" seed={seed} />
            <feDisplacementMap in="SourceGraphic" scale="4" />
          </filter>
          {lines.map((line, index) => {
            const bend = (lean(index, seed) - 0.5) * 36
            const y = 70 + index * 84
            return <path key={index} id={`${id}-${index}`} d={`M8 ${y + bend} Q200 ${y - bend} 392 ${y + bend}`} />
          })}
        </defs>
        {lines.map((line, index) => (
          <text key={index} filter={`url(#${id}-dry)`} style={{ fontSize: Math.min(78, 560 / Math.max(line.length, 1)) }}>
            <textPath href={`#${id}-${index}`} startOffset="50%" textAnchor="middle">{line}</textPath>
          </text>
        ))}
      </svg>
    </Tag>
  )
}
