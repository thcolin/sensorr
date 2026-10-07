import { useTranslation } from 'react-i18next'
import { reveal } from '@sensorr/ui'

export const Warnings = ({ logs = [], ...props }) => {
  const { t, i18n } = useTranslation()

  return !logs.length ? null : (
  <div sx={{ ...Warnings.styles.element, ...reveal }}>
    <span>{t('jobs.warnings')}</span>
    <div>
      <div>
        {logs.map(({ message, timestamp }, index) => (
          <code key={index}>
            {timestamp && <time>{new Date(timestamp).toLocaleString(i18n.language)}</time>}
            <span>{message}</span>
          </code>
        ))}
      </div>
    </div>
  </div>
  )
}

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
      overflowY: 'auto',
      overflowX: 'hidden',
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
