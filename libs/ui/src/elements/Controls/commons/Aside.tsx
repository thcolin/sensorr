import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useThemeUI } from 'theme-ui'
import { Button } from '../../../atoms/Button/Button'
import { Shadow } from '../../../atoms/Shadow/Shadow'
import { Icon } from '../../../atoms/Icon/Icon'
import { Inputs, InputsProps } from './Inputs'

export interface AsideProps extends Omit<InputsProps, 'control'> {
  toggleOpen: () => void
}

const UIAside = ({ layout: { position = 'left', ...layout }, fields, defaultValues, onChange, statistics, open, toggleOpen, ...props }) => {
  const { t } = useTranslation()
  const { theme } = useThemeUI()
  const [ready, setReady] = useState(open)
  const { control, reset, handleSubmit } = useForm({ defaultValues })

  const close = useCallback(() => {
    reset(defaultValues)
    toggleOpen()
  }, [reset, defaultValues, toggleOpen])

  const escape = useRef(null)
  escape.current = () => e => e.key === 'Escape' && close()

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues])

  useEffect(() => {
    if (open) {
      setReady(true)
      document.addEventListener('keydown', escape.current)
      return () => {
        setTimeout(() => setReady(false), 300)
        document.removeEventListener('keydown', escape.current)
      }
    }
  }, [open])

  return (
    <>
      <aside sx={UIAside.styles.element} style={{ [position]: '0px', transform: `translate3d(${open ? '0px' : { left: '-100%', right: '100%' }[position]}, 0px, 0px)` }}>
        <div sx={UIAside.styles.wrapper} style={{ opacity: ready ? 1 : 0 }}>
          {ready && (
            <form sx={UIAside.styles.form} onSubmit={handleSubmit(onChange)} onKeyPress={e => e.key === 'Enter' && e.preventDefault()}>
              <div sx={UIAside.styles.container}>
                <Inputs layout={layout as any} fields={fields} statistics={statistics} control={control} />
              </div>
              <div sx={UIAside.styles.buttons}>
                <Button type='button' variant='outline' onClick={close}>{t('ui.controls.cancel')}</Button>
                <Button type='submit'>{t('ui.controls.apply')}</Button>
              </div>
            </form>
          )}
        </div>
        <div sx={UIAside.styles.spinner} style={{ visibility: ready ? 'hidden' : 'visible' }}>
          <Icon value='spinner' />
        </div>
      </aside>
      <button
        key='shadow'
        sx={UIAside.styles.shadow}
        onClick={close}
        style={{
          zIndex: open ? 4 : -1,
          transition: `opacity 400ms ease, z-index ${open ? '0ms' : '400ms'} linear`,
          opacity: open ? 1 : 0,
        }}
      >
        <Shadow palette={{ backgroundColor: theme.rawColors.muted }} fade={0.1} />
      </button>
    </>
  )
}

UIAside.styles = {
  element: {
    position: 'fixed',
    display: 'flex',
    height: '100vh',
    width: '25em',
    top: '0em',
    bottom: '0em',
    backgroundColor: 'primary',
    color: '#FFF',
    transition: 'transform 400ms ease',
    zIndex: 5,
    transform: 'translateZ(0)',
  },
  wrapper: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    zIndex: 5,
    transition: 'opacity 200ms ease',
  },
  form: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'primary',
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    paddingX: 2,
    paddingY: 0,
    overflow: 'auto',
  },
  spinner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    transition: 'visibility 0ms ease 5000ms',
  },
  buttons: {
    variant: 'layout.row',
    backgroundColor: 'highlight',
    paddingX: 4,
    paddingY: 0,
    '>*': {
      flex: 1,
      '&:not(:first-of-type)': {
        marginLeft: 6,
      },
      '&:not(:last-of-type)': {
        marginRight: 6,
      },
    },
  },
  shadow: {
    variant: 'button.reset',
    position: 'absolute',
    height: '100%',
    width: '100%',
    top: '0em',
    '>div': {
      top: '0em',
    },
  },
}

export const Aside = memo(UIAside)
