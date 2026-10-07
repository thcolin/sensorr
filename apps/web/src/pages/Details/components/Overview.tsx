import { memo, useRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistoryState } from '@sensorr/utils'
import { Icon } from '@sensorr/ui'

const UIOverview = ({ children, remembered = true, lines = 8, ...props }) => {
  const { t } = useTranslation()
  const ref = useRef(null)
  const history = useHistoryState('overview', false, { enabled: remembered })
  const local = useState(false)
  const [expanded, setExpanded] = remembered ? history : local
  const [clamp, setClamp] = useState(false)

  useEffect(() => {
    setClamp(expanded || ref.current?.scrollHeight > ref.current?.clientHeight)
  }, [children])

  return (
    <div sx={UIOverview.styles.element}>
      <p
        ref={ref}
        sx={{
          ...UIOverview.styles.paragraph,
          ...!expanded && {
            overflow: 'hidden',
            textOveflow: 'ellipsis',
            WebkitLineClamp: `${lines}`,
          },
        }}
      >
        {children}
      </p>
      {clamp && (
        <button onClick={() => setExpanded(expanded => !expanded)} sx={UIOverview.styles.reduce} aria-expanded={expanded} aria-label={expanded ? t('details.overview.less') : t('details.overview.more')}>
          <Icon value='chevron' direction={expanded} width='1em' height='1em' />
        </button>
      )}
    </div>
  )
}

UIOverview.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '3em',
    width: '100%',
  },
  paragraph: {
    display: '-webkit-box',
    width: '100%',
    margin: '0em',
    lineHeight: 'body',
    textAlign: ['center', 'left'],
    whiteSpace: 'pre-wrap',
    WebkitBoxOrient: 'vertical',
  },
  reduce: {
    variant: 'button.reset',
    width: '100%',
    padding: 6,
    color: 'text',
  }
}

export const Overview = memo(UIOverview)
