import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast, { useToaster, CheckmarkIcon, ErrorIcon, LoaderIcon } from 'react-hot-toast'
import Markdown from 'react-markdown'
import { useThemeUI } from 'theme-ui'
import { Icon } from '@sensorr/ui'
import { useDeviceContext } from '../Device/Device'

// Past this many toasts on screen, they fold into a deck that unfolds on hover
const STACK_THRESHOLD = 3
const STACK_DEPTH = 3
const STACK_PEEK = 10
const GUTTER = 8
const STRIPES = { success: 'success', error: 'error', loading: 'grayDarkest' }
const TRANSITION = 'transform 230ms cubic-bezier(.21,1.02,.73,1), opacity 230ms, filter 230ms'
const stripeOf = (type) => STRIPES[type] || 'info'

const ToastWrapper = ({ id, onHeightUpdate, style, card, children }) => {
  const ref = useCallback((el) => {
    if (el) {
      const updateHeight = () => onHeightUpdate(id, el.getBoundingClientRect().height)
      updateHeight()
      new MutationObserver(updateHeight).observe(el, { subtree: true, childList: true, characterData: true })
    }
  }, [id, onHeightUpdate])

  return (
    <div style={style}>
      <div style={card}>
        <div ref={ref}>{children}</div>
      </div>
    </div>
  )
}

const UIToasts = ({ ...props }) => {
  const { i18n } = useTranslation()
  const { device, pwa } = useDeviceContext()
  const { theme } = useThemeUI()
  const [expanded, setExpanded] = useState(false)
  const { toasts, handlers } = useToaster({
    blank: { duration: 4000 },
    success: { duration: 4000 },
    error: { duration: 6000 },
  })

  const visible = toasts.filter(t => t.visible)
  const stacked = !expanded && visible.length > STACK_THRESHOLD
  const front = visible[0]
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        zIndex: 9999,
        inset: 16,
        pointerEvents: 'none',
        ...(device === 'mobile' && pwa ? { marginBottom: 'calc(2.5em + env(safe-area-inset-bottom))' } : {}),
      }}
      onMouseEnter={() => { handlers.startPause(); setExpanded(true) }}
      onMouseLeave={() => { handlers.endPause(); setExpanded(false) }}
      onFocus={() => { handlers.startPause(); setExpanded(true) }}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) { handlers.endPause(); setExpanded(false) } }}
      onClick={() => stacked && setExpanded(true)}
    >
      {toasts.map((t) => {
        const depth = visible.indexOf(t)
        const stripe = stripeOf(t.type)
        const behind = stacked && depth > 0
        const layer = Math.min(depth, STACK_DEPTH)
        const transition = reduced ? undefined : TRANSITION

        return (
          <ToastWrapper
            key={t.id}
            id={t.id}
            onHeightUpdate={handlers.updateHeight}
            card={{
              transform: behind ? `scale(${1 - layer * 0.05})` : undefined,
              transformOrigin: 'center top',
              filter: behind ? `brightness(${1 - layer * 0.2})` : undefined,
              transition,
              ...(behind ? { height: front?.height, overflow: 'hidden', borderRadius: '0.25em' } : {}),
            }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: device === 'mobile' ? 'center' : 'flex-end',
              zIndex: t.visible ? visible.length - depth : 0,
              transform: `translateY(${-(stacked ? layer * STACK_PEEK : handlers.calculateOffset(t, { gutter: GUTTER }))}px)`,
              opacity: stacked && depth >= STACK_DEPTH ? 0 : 1,
              transition,
              pointerEvents: t.visible ? 'auto' : 'none',
            }}
          >
            <div
              sx={{
                display: 'flex',
                minWidth: '20em',
                background: 'gray',
                color: 'text',
                border: '1px solid',
                borderLeft: 'none',
                borderColor: 'grayDark',
                borderRadius: '0.25em',
                position: 'relative',
                opacity: t.visible ? 1 : 0,
                overflow: 'hidden',
              }}
            >
              <div
                sx={{
                  borderLeft: '4px solid',
                  borderColor: stripe,
                }}
              >
              </div>
              <div sx={{ flex: 1, padding: 4, paddingRight: typeof t.message !== 'string' && !t.title ? 2 : 4 }}>
                {typeof t.message !== 'string' && !t.title ? t.message : (
                  <>
                    <strong sx={{ display: 'flex', alignItems: 'center', marginBottom: 6, paddingRight: 2, fontFamily: 'heading' }}>
                      <span sx={{ marginRight: 8 }}>
                        {t.icon || (
                          t.type === 'blank' ? <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 416.979 416.979"><path fill={theme.colors.black} d="M356.004 61.156c-81.37-81.47-213.377-81.551-294.848-.182-81.47 81.371-81.552 213.379-.181 294.85 81.369 81.47 213.378 81.551 294.849.181 81.469-81.369 81.551-213.379.18-294.849zM237.6 340.786a5.821 5.821 0 0 1-5.822 5.822h-46.576a5.821 5.821 0 0 1-5.822-5.822V167.885a5.821 5.821 0 0 1 5.822-5.822h46.576a5.82 5.82 0 0 1 5.822 5.822v172.901zm-29.11-202.885c-18.618 0-33.766-15.146-33.766-33.765 0-18.617 15.147-33.766 33.766-33.766s33.766 15.148 33.766 33.766c0 18.619-15.149 33.765-33.766 33.765z"/></svg> :
                          t.type === 'success' ? <CheckmarkIcon primary={theme.rawColors.success} /> :
                          t.type === 'error' ? <ErrorIcon primary={theme.rawColors.error} /> :
                          t.type === 'loading' ? <LoaderIcon primary={theme.rawColors.grayDarkest} secondary={theme.rawColors.grayDark} /> : null
                        )}
                      </span>
                      <span> {t.title || i18n.t(`contexts.toasts.types.${t.type}`, { defaultValue: t.type })}</span>
                    </strong>
                    <span sx={{ display: 'block', fontSize: 5, 'p': { margin: 12 } }}>{typeof t.message === 'string' ? <Markdown>{t.message}</Markdown> : t.message}</span>
                    {t.actions && (
                      <span sx={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: '1fr', gap: 8, marginTop: 4, '>button': { margin: 12, fontSize: 5 } }}>
                        {t.actions}
                      </span>
                    )}
                    {t.type === 'error' && !t.actions && <span sx={{ display: 'block', fontSize: 7, marginTop: 6 }}>{i18n.t('contexts.toasts.console')}</span>}
                  </>
                )}
              </div>
              {t.countdown && (
                <div
                  key={t.createdAt}
                  aria-hidden='true'
                  sx={{
                    position: 'absolute',
                    left: '4px',
                    right: '0em',
                    bottom: '0em',
                    height: '0.1875em',
                    backgroundColor: 'grayDarkest',
                    transformOrigin: 'left',
                    '@keyframes sensorr-toast-countdown': {
                      from: { transform: 'scaleX(1)' },
                      to: { transform: 'scaleX(0)' },
                    },
                    animation: `sensorr-toast-countdown ${t.duration}ms linear forwards`,
                  }}
                />
              )}
              <div sx={{ position: 'absolute', top: '0em', right: '0em' }}>
                <button onClick={() => toast.dismiss(t.id)} sx={{ variant: 'button.reset', padding: 6 }}>
                  <Icon value="clear" height="1em" width="1em" />
                </button>
              </div>
            </div>
          </ToastWrapper>
        )
      })}
    </div>
  )
}

export const Toasts = memo(UIToasts)
