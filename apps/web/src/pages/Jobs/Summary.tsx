import Tippy from '@tippyjs/react'
import { filesize } from '@sensorr/utils'

// Freeing space is the usual outcome of a job, so it goes unsigned; only growing the disk carries a sign
export const freed = (change) => change > 0 ? `+${filesize.stringify(change)}` : filesize.stringify(-change)

export const freedLabel = (change) => change > 0 ? 'more on disk' : 'freed on disk'

export const Summary = ({ error = null, meta }) => (
  <span sx={Summary.styles.element}>
    {!!error ? (
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
  },
}
