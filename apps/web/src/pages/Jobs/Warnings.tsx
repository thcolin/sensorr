export const Warnings = ({ logs = [], ...props }) => !logs.length ? null : (
  <div sx={Warnings.styles.element}>
    <span>Warnings</span>
    <div>
      <div>
        {logs.map(({ message, timestamp }, index) => (
          <code key={index}>
            {timestamp && <time>{new Date(timestamp).toLocaleString()}</time>}
            <span>{message}</span>
          </code>
        ))}
      </div>
    </div>
  </div>
)

Warnings.styles = {
  element: {
    '>span': {
      display: 'block',
      paddingBottom: 4,
      fontFamily: 'heading',
      fontWeight: 'strong',
    },
    '>div': {
      flex: 1,
      overflowY: 'scroll',
      maxHeight: '30vh',
      marginBottom: 0,
      borderTop: '1px solid',
      borderBottom: '1px solid',
      borderColor: 'grayLight',
      '>div': {
        margin: 12,
        paddingY: 4,
        paddingX: 12,
        display: 'inline-block',
        whiteSpace: 'nowrap',
        minWidth: '100%',
        '>code': {
          display: 'flex',
          alignItems: 'center',
          paddingX: 6,
          whiteSpace: 'nowrap',
          cursor: 'default',
          '>span': {
            color: 'grayDarkest',
            marginX: 4,
          },
          opacity: 0.75,
          transition: 'all ease 100ms',
          '&:hover': {
            backgroundColor: 'gray',
            opacity: 1,
            '>i': {
              opacity: 1,
            },
          },
        },
      },
    },
  },
}
