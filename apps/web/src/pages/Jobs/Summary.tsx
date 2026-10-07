import Tippy from '@tippyjs/react'
import { formatDuration, intervalToDuration } from 'date-fns'
import i18n from '@sensorr/i18n'
import { filesize } from '@sensorr/utils'

// Freeing space is the usual outcome of a job, so it goes unsigned; only growing the disk carries a sign
export const freed = (change) => change > 0 ? `+${filesize.stringify(change)}` : filesize.stringify(-change)

// The `side` of the `jobs.space` sentences
export const sideOf = (change) => change > 0 ? 'more' : 'freed'

// date-fns writes the units in English, each one is then shortened in the language shown
export const durationOf = ({ start, end }) => formatDuration(intervalToDuration({ start: new Date(start), end: new Date(end) }), { format: ['hours', 'minutes', 'seconds'] })
  .replace(/ hours?/, i18n.t('jobs.duration.hours'))
  .replace(/ minutes?/, i18n.t('jobs.duration.minutes'))
  .replace(/ seconds?/, i18n.t('jobs.duration.seconds'))

export const Summary = ({ error = null, meta }) => (
  <span sx={Summary.styles.element}>
    {error ? (
      <Tippy maxWidth='80vw' content={<code>💢 <span>{error?.message || error}</span></code>}>
        <span>💢</span>
      </Tippy>
    ) : meta.map(({ emoji, title, length, props = {} }, index) => (
      <Tippy maxWidth='80vw' key={index} content={<code>{emoji} <span>{title}</span></code>}>
        <span {...props}>{emoji} {length}</span>
      </Tippy>
    ))}
  </span>
)

Summary.styles = {
  element: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: ['center', 'flex-start'],
    flexWrap: 'wrap',
    '>span': {
      backgroundColor: 'grayLight',
      marginRight: 8,
      marginBottom: 8,
      color: 'text',
      fontWeight: 'bold',
      fontFamily: 'monospace',
      borderRadius: '1em',
      whiteSpace: 'nowrap',
      paddingX: 5,
      paddingY: 9,
      transition: 'all ease 100ms',
    },
    '>span[role=button]:focus-visible': {
      outline: '2px solid',
      outlineColor: 'text',
      outlineOffset: '2px',
    },
  },
}
