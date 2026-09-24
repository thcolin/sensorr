import { useTranslation, Trans } from 'react-i18next'
import { Icon } from '../../../atoms/Icon/Icon'

export const ControlsToggleButton = ({ toggleOpen, fields, values, handleChange, ...props }) => {
  const { t } = useTranslation()
  const active = Object.keys(values)
    .filter(key => !['sort_by'].includes(key) && !fields[key].hideFromFiltersCount)
    .reduce((acc, key) => acc + (values[key] && (JSON.stringify(values[key]) !== JSON.stringify(fields[key]?.initial) && fields[key]?.serialize) ? 1 : 0), 0)

  return (
    <button {...props} sx={ControlsToggleButton.styles.element} type='button' onClick={toggleOpen}>
      <Trans t={t} i18nKey={props.translateKey || 'ui.controls.toggle'} values={{ active }} components={[<span style={{ whiteSpace: 'pre' }} />, <strong />]} />
      <Icon value='filters' />
    </button>
  )
}

ControlsToggleButton.styles = {
  element: {
    variant: 'button.reset',
    display: 'flex',
    alignItems: 'center',
    marginY: 4,
    paddingX: 2,
    borderRadius: '0.25em',
    ':hover': {
      backgroundColor: 'accent',
    },
    ':active': {
      backgroundColor: 'accentDark',
    },
    '>svg': {
      height: '1em',
      marginLeft: 6,
    },
  },
}
