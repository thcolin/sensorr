import { memo } from 'react'
import { Toaster, CheckmarkIcon, ErrorIcon, LoaderIcon } from 'react-hot-toast'
import Markdown from 'react-markdown'
import { useThemeUI } from 'theme-ui'

const UIToasts = ({ ...props }) => {
  const { theme } = useThemeUI()

  return (
    <Toaster
      position='bottom-right'
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        // duration: 4000,
        success: { duration: 4000 },
        error: { duration: 6000 },
      }}
    >
      {(t) => {
        return ( // { id, type, message, icon, createdAt }
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
              opacity: t.visible ? 1 : 0,
              overflow: 'hidden',
            }}
          >
            <div
              sx={{
                borderLeft: '4px solid',
                borderColor: { success: 'success', error: 'error', loading: 'grayDarkest' }[t.type] || 'info',
              }}
            >
            </div>
            <div sx={{ padding: 4 }} >
              <strong sx={{ display: 'flex', alignItems: 'center', marginBottom: 6, fontFamily: 'heading', textTransform: 'capitalize' }}>
                <span sx={{ marginRight: 8 }}>
                  {t.icon || (
                    t.type === 'blank' ? <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 416.979 416.979"><path fill={theme.colors.black} d="M356.004 61.156c-81.37-81.47-213.377-81.551-294.848-.182-81.47 81.371-81.552 213.379-.181 294.85 81.369 81.47 213.378 81.551 294.849.181 81.469-81.369 81.551-213.379.18-294.849zM237.6 340.786a5.821 5.821 0 0 1-5.822 5.822h-46.576a5.821 5.821 0 0 1-5.822-5.822V167.885a5.821 5.821 0 0 1 5.822-5.822h46.576a5.82 5.82 0 0 1 5.822 5.822v172.901zm-29.11-202.885c-18.618 0-33.766-15.146-33.766-33.765 0-18.617 15.147-33.766 33.766-33.766s33.766 15.148 33.766 33.766c0 18.619-15.149 33.765-33.766 33.765z"/></svg> :
                    t.type === 'success' ? <CheckmarkIcon primary={theme.rawColors.success} /> :
                    t.type === 'error' ? <ErrorIcon primary={theme.rawColors.error} /> :
                    t.type === 'loading' ? <LoaderIcon primary={theme.rawColors.grayDarkest} secondary={theme.rawColors.grayDark} /> : null
                  )}
                </span>
                <span> {t.type === 'blank' ? 'Info' : t.type}</span>
              </strong>
              <span sx={{ display: 'block', fontSize: 5, 'p': { margin: 12 } }}><Markdown>{t.message}</Markdown></span>
              {t.type === 'error' && <span sx={{ display: 'block', fontSize: 7, marginTop: 6 }}>See browser console for more details</span>}
            </div>
          </div>
        )
      }}
    </Toaster>
  )
}

export const Toasts = memo(UIToasts)
