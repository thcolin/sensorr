import { useCallback, useEffect, useRef } from 'react'
import type { Meta, Release as File } from '../../data'
import { LANGUAGES, SOURCES } from './logos'

export const gb = (bytes: number) => `${(Math.abs(bytes) / 1024 ** 3).toFixed(1)} GB`

// The language a release names, or the original version when it names none, as the app's parser reads it
export const language = (value?: string | null) => value || 'VO'

// A release name stays on one line and scrolls along it, each cut edge fading out as the app's bulk bar does
export const Name = ({ title, ...props }: { title: string } & React.HTMLAttributes<HTMLSpanElement>) => {
  const ref = useRef<HTMLSpanElement>(null)

  const onScroll = useCallback(() => {
    const node = ref.current

    if (node) {
      node.dataset.start = String(node.scrollLeft > 1)
      node.dataset.end = String(node.scrollLeft + node.clientWidth < node.scrollWidth - 1)
    }
  }, [])

  // Its width follows the layout, and its text the font once loaded
  useEffect(() => {
    const observer = new ResizeObserver(onScroll)

    observer.observe(ref.current as HTMLSpanElement)
    document.fonts.ready.then(onScroll)
    document.fonts.addEventListener('loadingdone', onScroll)

    return () => {
      observer.disconnect()
      document.fonts.removeEventListener('loadingdone', onScroll)
    }
  }, [onScroll])

  return <span ref={ref} title={title} onScroll={onScroll} sx={Release.styles.name} {...props}>{title}</span>
}

// The axes a release row tags, in the app's order
const TAGGED = ['source', 'encoding', 'resolution', 'dub', 'language'] as const

const Flag = ({ value }: { value: string }) => {
  const [first, second] = LANGUAGES[value] || []

  return first ? (
    <abbr title={`language: ${value}`} sx={Release.styles.flag}>
      <span>{first}</span>
      {second && <span sx={Release.styles.over}>{second}</span>}
    </abbr>
  ) : <code title={`language: ${value}`}>{value}</code>
}

// One tag per known axis: the source's logo, the language's flags, a value in a gray box for the others
export const Tags = ({ meta, ...props }: { meta: Meta } & React.HTMLAttributes<HTMLSpanElement>) => (
  <span {...props} sx={Release.styles.tags}>
    {TAGGED.filter((axis) => meta[axis]).map((axis) => {
      const value = meta[axis] as string

      return axis === 'language' ? <Flag key={axis} value={value} />
        : axis === 'source' && SOURCES[value] ? <span key={axis} title={`source: ${value}`} sx={Release.styles.logo}>{SOURCES[value]}</span>
        : <code key={axis} title={`${axis}: ${value}`}>{axis === 'resolution' && value === '2160p' ? '4K' : value}</code>
    })}
  </span>
)

export type Range = { score: [number, number], seeders: [number, number], size: number }

export const rangeOf = (releases: File[]): Range => ({
  score: [Math.min(...releases.map(({ score }) => score)), Math.max(...releases.map(({ score }) => score))],
  seeders: [Math.min(...releases.map(({ seeders }) => seeders)), Math.max(...releases.map(({ seeders }) => seeders))],
  size: Math.max(...releases.map(({ size }) => size)),
})

const ratio = (value: number, [low, high]: [number, number]) => Math.max(1, value - low) / Math.max(1, high - low)

// 💯 🌍 📦 as the app's statistics draw them: a thin bar filled to where the release sits among the others
export const Statistics = ({ release, range, ...props }: { release: File, range: Range } & React.HTMLAttributes<HTMLSpanElement>) => (
  <span {...props} sx={Release.styles.statistics}>
    {([
      ['💯', 'score', release.score, ratio(release.score, range.score)],
      ['🌍', 'seeders', release.seeders, ratio(release.seeders, range.seeders)],
      ['📦', 'size', gb(release.size), Math.min(1, Math.max(0.01, release.size / range.size))],
    ] as const).map(([emoji, name, value, fill]) => (
      <span key={name} title={`${name}: ${value}`} sx={Release.styles.statistic}>
        <span aria-hidden='true'>{emoji}</span>
        <span sx={Release.styles.bar} style={{ ['--fill' as string]: `${fill * 100}%` }} />
        <code>{value}</code>
      </span>
    ))}
  </span>
)

export const Release = {
  styles: {
    name: {
      display: 'block',
      maxWidth: '100%',
      overflowX: 'auto',
      scrollbarWidth: 'none',
      whiteSpace: 'nowrap',
      '::-webkit-scrollbar': {
        display: 'none',
      },
      '&[data-start=true]': {
        maskImage: 'linear-gradient(to right, transparent, black 2em)',
      },
      '&[data-end=true]': {
        maskImage: 'linear-gradient(to left, transparent, black 2em)',
      },
      '&[data-start=true][data-end=true]': {
        maskImage: 'linear-gradient(to right, transparent, black 2em, black calc(100% - 2em), transparent)',
      },
    },
    tags: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 9,
      '>code': {
        paddingX: 9,
        paddingY: 11,
        borderRadius: '0.25em',
        backgroundColor: 'gray',
        fontFamily: 'monospace',
        fontWeight: 600,
        fontSize: 6,
        color: 'text',
        whiteSpace: 'nowrap',
      },
    },
    logo: {
      display: 'inline-flex',
      color: 'textLightest',
      svg: {
        display: 'block',
        height: '1.2em',
        width: 'auto',
        // A wide logo stays as wide as a value box
        maxWidth: '2.5em',
      },
    },
    flag: {
      position: 'relative',
      display: 'inline-block',
      paddingRight: '0.375em',
      fontSize: 4,
      lineHeight: 1,
      textDecoration: 'none',
    },
    over: {
      position: 'absolute',
      top: '0.375em',
      left: '0.375em',
    },
    // One line, a short bar under each value on a wide screen, none on a phone, as the app's rows draw them without room
    // One under the other, as the app's release rows stack them
    statistics: {
      display: 'flex',
      flexDirection: 'column',
      rowGap: 11,
      fontSize: 7,
    },
    statistic: {
      display: 'grid',
      gridTemplateColumns: ['1.25em auto', '1.25em 4em auto'],
      alignItems: 'center',
      columnGap: 8,
      whiteSpace: 'nowrap',
      code: {
        fontFamily: 'monospace',
        color: 'textLight',
        fontVariantNumeric: 'tabular-nums',
      },
    },
    bar: {
      display: ['none', 'block'],
      height: '2px',
      background: 'linear-gradient(90deg, var(--theme-ui-colors-primary) var(--fill), var(--theme-ui-colors-gray) var(--fill))',
    },
  },
}
