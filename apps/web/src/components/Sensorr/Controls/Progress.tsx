import { memo, useEffect, useMemo, useRef, useState } from 'react'
import Tippy from '@tippyjs/react'

const UIProgress = ({ progress: { id = null, tasks = [] } = {}, style, ...props }) => (
  <div sx={UIProgress.styles.element} style={style}>
    {!!tasks.length && (
      <div sx={UIProgress.styles.steps}>
        {tasks.map((task, index) => (
          <Task key={`${id}-${index}`} {...task} />
        ))}
      </div>
    )}
  </div>
)

UIProgress.styles = {
  element: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  steps: {
    display: 'flex',
    flex: 1,
    overflowX: 'auto',
    borderRight: '1px solid',
    borderLeft: '1px solid',
    borderColor: 'dark',
  },
  step: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    backgroundColor: 'highlight',
    '&:not(:last-child)': {
      borderRight: '1px solid',
      borderColor: 'dark',
    },
    '&:before': {
      content: '""',
      position: 'absolute',
      top: '0px',
      left: '0px',
      height: '100%',
      backgroundColor: 'accent',
    },
    '>div': {
      position: 'relative',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingX: 2,
      transition: 'opacity 200ms ease-in-out',
      '>code': {
        display: 'block',
        fontSize: 5,
        whiteSpace: 'nowrap',
        margin: 11,
      },
      '>span': {
        display: 'block',
        margin: 10,
      },
    }
  }
}

export const Progress = memo(UIProgress)

const Task = ({ releases, znab, term, ongoing, done, ...props }) => {
  const ref = useRef(null)
  const results = {
    total: releases?.length || 0,
    matches: releases?.filter(release => release.valid && !release.warning).length || 0,
    dropped: releases?.filter(release => !release.valid && release.warning <= 10).length || 0,
    mismatch: releases?.filter(release => !release.valid && release.warning > 10).length || 0,
  }

  useEffect(() => {
    if (ongoing) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    }
  }, [ongoing])

  return (
    <Tippy disabled={!done} content={<TaskDetails results={results} />} >
      <div
        ref={ref}
        sx={{
          ...UIProgress.styles.step,
          cursor: done ? 'context-menu' : ongoing ? 'progress' : 'default',
          '&:before': {
            ...UIProgress.styles.step['&:before'],
            width: done ? '100%' : ongoing ? '99%' : '0%',
            transition: `width ${done ? '200ms' : '60000ms'} ${done ? 'linear' : 'cubic-bezier(0.000, 1.000, 0.000, 1.000)'} ${ongoing ? '200ms' : '0ms'}`,
          }
        }}
      >
        <div sx={{ opacity: (ongoing || done) ? 1 : 0.25 }}>
          <code><strong>{znab.name}</strong></code>
          <code>“{term}”</code>
          <span>
            {ongoing ? (
              <TaskTime />
            ) : done ? (
              <span>
                {(
                  !!results.matches ? '🎉' :
                  (results.dropped && !results.mismatch) ? '🚨' :
                  (results.mismatch && !results.dropped) ? '💩' :
                  '📭'
                )} &nbsp; <code sx={{ fontSize: 6 }}>({results.matches ? results.matches : results.total})</code>
              </span>
            ) : '-'}
          </span>
        </div>
      </div>
    </Tippy>
  )
}

const TaskTime = ({ ...props }) => {
  const [time, setTime] = useState(0)
  const now = useMemo(() => Date.now(), [])

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now() - now), 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <em><small>{(time / 1000).toFixed(1)}s</small></em>
  )
}

const TaskDetails = ({ results, ...props }) => {
  const errors = [
    ...(results.dropped ? [<code key='dropped'>🚨 <span><strong>{results.dropped}</strong> Releases dropped by policy</span></code>] : []),
    ...(results.mismatch ? [<code key='mismatch'>💩 <span><strong>{results.mismatch}</strong> Releases mismatch</span></code>] : []),
  ]

  return (
    <span sx={{ display: 'block', withSpace: 'nowrap', margin: 10 }}>
      {(!!results.matches && !errors.length) ? (
        <code>🎉 <strong>{results.total}</strong> <em>matching</em> Releases found !</code>
      ) : (!!results.matches && errors.length) ? (
        <code>🎉 <strong>{results.total}</strong> Releases found :</code>
      ) : (!results.matches && errors.length === 1) ? (
        errors[0]
      ) : (!results.matches && errors.length) ? (
        <code>📭 No <em>matching</em> Releases found</code>
      ) : (
        <code>📭 No Releases found</code>
      )}
      {((!!results.matches && errors.length) || errors.length > 1) && (
        <ul sx={{ margin: 8, marginBottom: 12, padding: 12, paddingLeft: 2, '>li': { margin: 12, padding: 12, '>span': { fontSize: 5 } } }}>
          {!!results.matches && <li><code>👍 <span><strong>{results.matches}</strong> Releases matches </span></code></li>}
          {errors.map((error, index) => <li key={index}>{error}</li>)}
        </ul>
      )}
    </span>
  )
}
