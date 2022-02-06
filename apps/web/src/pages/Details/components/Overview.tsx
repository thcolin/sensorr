import { memo, useRef, useEffect, useState } from 'react'
import { createHistoryState } from '@sensorr/utils'
import { Icon } from '@sensorr/ui'

const useHistoryState = createHistoryState('overview', false)

const UIOverview = ({ children, ...props }) => {
  const ref = useRef(null)
  const [expanded, setExpanded] = useHistoryState() as [any, any]
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
            WebkitLineClamp: '3',
          },
        }}
      >
        {children}
      </p>
      {clamp && (
        <button onClick={() => setExpanded(expanded => !expanded)} sx={UIOverview.styles.reduce}>
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
