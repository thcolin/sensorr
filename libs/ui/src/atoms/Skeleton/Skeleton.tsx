import { animations } from '@sensorr/theme'

// The house transition. Whatever arrives after the rest, a badge, a pill, a row of links, takes it
// as an animation rather than a transition: an animation plays when the element mounts, or when
// it is set on an element already there, where a transition only plays on a value that changes.
export const REVEAL = '400ms ease-in-out'

export const reveal = {
  animation: `${animations.reveal} ${REVEAL} backwards`,
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
}

export interface BarProps {
  width?: string
  height?: string
  pill?: boolean
  color?: string
  [prop: string]: any
}

// Where a text or a pill goes while it loads: still, like an empty poster anywhere else.
export const Bar = ({ width = '100%', height = '1em', pill = false, color = 'gray', ...props }: BarProps) => (
  <span
    {...props}
    aria-hidden={true}
    sx={{
      display: 'block',
      width,
      maxWidth: '100%',
      height,
      borderRadius: pill ? '1em' : '0.25em',
      backgroundColor: color,
    }}
  />
)

export interface SkeletonProps {
  ready: boolean
  bar?: BarProps
  // In place of the bar, for a content of several parts drawn in its own shape
  placeholder?: React.ReactNode
  children?: React.ReactNode
  [prop: string]: any
}

// A bar that becomes its content: both sit in the same grid cell, the bar fades out as the content
// fades in, and the cell keeps the larger of the two, so nothing around it moves. A blank line holds
// the cell at the height of one line of the text it waits for.
export const Skeleton = ({ ready, bar = {}, placeholder = null, children, ...props }: SkeletonProps) => (
  <span {...props} sx={Skeleton.styles.element}>
    <span aria-hidden={true} sx={Skeleton.styles.strut}>&nbsp;</span>
    {placeholder ? (
      <span aria-hidden={true} sx={{ ...Skeleton.styles.bar, opacity: ready ? 0 : 1 }}>{placeholder}</span>
    ) : (
      <Bar {...bar} sx={{ ...Skeleton.styles.bar, opacity: ready ? 0 : 1 }} />
    )}
    {ready && <span sx={{ ...Skeleton.styles.content, ...reveal }}>{children}</span>}
  </span>
)

Skeleton.styles = {
  element: {
    display: 'grid',
    alignItems: 'center',
    minWidth: '0px',
    '>*': {
      gridArea: '1 / 1',
      minWidth: '0px',
    },
  },
  strut: {
    visibility: 'hidden',
    width: '0px',
  },
  bar: {
    alignSelf: 'center',
    transition: `opacity ${REVEAL}`,
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
  },
  content: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}
