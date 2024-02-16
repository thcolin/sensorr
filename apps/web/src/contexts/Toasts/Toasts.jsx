import { memo } from 'react'
import { Toaster, CheckmarkIcon, ErrorIcon, LoaderIcon } from 'react-hot-toast'
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
                borderColor: { success: 'success', error: 'error', loading: 'grayDarkest' }[t.type] || 'grayDarkest',
              }}
            >
            </div>
            <div sx={{ padding: 4 }} >
              <strong sx={{ display: 'flex', alignItems: 'center', marginBottom: 6, fontFamily: 'heading', textTransform: 'capitalize' }}>
                <span sx={{ marginRight: 8 }}>
                  {t.icon || (
                    t.type === 'success' ? <CheckmarkIcon primary={theme.rawColors.success} /> :
                    t.type === 'error' ? <ErrorIcon primary={theme.rawColors.error} /> :
                    t.type === 'loading' ? <LoaderIcon primary={theme.rawColors.grayDarkest} secondary={theme.rawColors.grayDark} /> : null
                  )}
                </span>
                <span> {t.type}</span>
              </strong>
              <span sx={{ display: 'block', fontSize: 5 }}>{t.message}</span>
              {t.type === 'error' && <span sx={{ display: 'block', fontSize: 7, marginTop: 6 }}>See browser console for more details</span>}
            </div>
          </div>
        )
      }}
    </Toaster>
  )
}

export const Toasts = memo(UIToasts)
