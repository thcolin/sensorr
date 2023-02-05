import Tippy from '@tippyjs/react'

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
    '>span': {
      backgroundColor: 'grayLight',
      marginRight: 8,
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
