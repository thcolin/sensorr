import { memo, useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../atoms/Button/Button'
import { Inputs, InputsProps } from './Inputs'
import { Pane } from 'libs/ui/src/atoms/Pane/Pane'

export interface AsideProps extends Omit<InputsProps, 'control'> {
  toggleOpen: () => void
  level?: number
}

const UIAside = ({ layout: { position = 'left', ...layout }, fields, defaultValues, onChange, statistics, open, toggleOpen, level, watch: watcher, ...props }) => {
  const { t } = useTranslation()
  const { control, reset, watch, handleSubmit } = useForm({ defaultValues })
  const watching = !!(watcher || [])[0] && watch(watcher[0]).reduce((acc, curr, i) => ({ ...acc, [watcher[i]]: curr }), {})

  const toggle = useCallback(() => {
    reset(defaultValues)
    toggleOpen()
  }, [reset, defaultValues, toggleOpen])

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues])

  useEffect(() => {
    if (watching) {
      const next = { ...defaultValues, ...watching }
      watcher[1](next, onChange)
    }
  }, [JSON.stringify(watching)])

  return (
    <Pane position={position as any} open={open} toggleOpen={toggle} level={level}>
      <form sx={UIAside.styles.form} onSubmit={handleSubmit(onChange)} onKeyPress={e => e.key === 'Enter' && e.preventDefault()}>
        <div sx={UIAside.styles.container}>
          <Inputs layout={layout as any} fields={fields} statistics={statistics} control={control} />
        </div>
        <div sx={UIAside.styles.buttons}>
          <Button type='button' variant='outline' onClick={toggle}>{t('ui.controls.cancel')}</Button>
          <Button type='submit'>{t('ui.controls.apply')}</Button>
        </div>
      </form>
    </Pane>
  )
}

UIAside.styles = {
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
  buttons: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: 'primaryDarker',
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
}

export const Aside = memo(UIAside)
