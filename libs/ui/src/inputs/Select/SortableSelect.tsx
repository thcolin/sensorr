import { useMemo, useCallback } from 'react'
import { components } from 'react-select'
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc'
import { useThemeUI } from 'theme-ui'
import { Select } from './Select'

const SortableSelectContainer = SortableContainer(Select) as any

export const SortableSelect = ({ value, onChange, requirable = false, ...props }) => {
  const { theme } = useThemeUI()

  const SortableComponents = useMemo(() => ({
    MultiValueRemove: SortableHandle((props) => <components.MultiValueRemove {...props} />),
    MultiValue: SortableElement((props) => {
      const { theme } = useThemeUI()

      // prevents menu from being opened/closed when the user clicks on a value to begin dragging it.
      const onMouseDown = (e) => {
        e.preventDefault()
        e.stopPropagation()
      }

      if (typeof props.data.value === 'undefined') {
        return (
          <components.MultiValue {...props} innerProps={{ ...props.innerProps, onMouseDown }} />
        )
      }

      return (
        <div
          sx={{
            display: 'flex',
            alignItems: 'stretch',
            margin: '0.25em',
            border: `1px solid`,
            borderColor: { prefer: theme.rawColors.primaryDarker, avoid: theme.rawColors.error }[props.data.group] || '#FFF',
            borderRadius: 2,
          }}
        >
          {requirable && ['prefer', null].includes(props.data.group) && (
            <div
              title={props.data.required ? `Required` : `Non Required`}
              onClick={() => {
                console.log(
                  props.selectProps,
                  props.selectProps.value.map(data => ({ ...data, ...(data.value === props.data.value ? { required: !data.required } : {}) })),
                )

                props.selectProps.onChange(
                  props.selectProps.value.map(data => ({ ...data, ...(data.value === props.data.value ? { required: !data.required } : {}) })),
                  { action: 'toggle-require-value', removedValue: { ...props.data, required: !props.data.required } }
                )
              }}
              sx={{
                backgroundColor: { prefer: theme.rawColors.accentDark }[props.data.group] || '#FFF',
                paddingX: 10,
                color: props.data.required ? ({ prefer: '#FFF' }[props.data.group] || theme.rawColors.primaryDarker) : ({ prefer: theme.rawColors.accentDarkest }[props.data.group] || theme.rawColors.textDarkest),
                cursor: 'pointer',
                ':hover': {
                  backgroundColor: { prefer: theme.rawColors.accentDarker }[props.data.group] || theme.rawColors.textDark,
                },
              }}
            >
              ＊
            </div>
          )}
          <components.MultiValue {...props} innerProps={{ ...props.innerProps, onMouseDown }} />
        </div>
      )
    }),
  }), [requirable])

  const onSortEnd = useCallback(({ oldIndex: from, newIndex: to }) => {
    const next = value.slice()
    next.splice(to < 0 ? value.length + to : to, 0, next.splice(from, 1)[0])
    onChange(next.filter(v => v.value))
  }, [value, onChange])

  const styles = useMemo(() => ({
    control: (style) => ({
      ...style,
      backgroundColor: 'transparent',
      borderColor: 'inherit !important',
      boxShadow: 'none',
      '>div:first-of-type': {
        display: 'flex',
        padding: '0.5em',
      }
    }),
    input: () => ({
      display: 'none',
    }),
    multiValue: (style, { data: { value, group, separator } }) => (value ? {
      ...style,
      position: 'relative',
      flexShrink: 0,
      backgroundColor: { prefer: theme.rawColors.primaryDarker, avoid: theme.rawColors.error }[group] || 'transparent',
      color: { prefer: '#FFF', avoid: '#FFF' }[group] || '#FFF',
      margin: '0px',
      zIndex: 5,
      borderRadius: '0px',
    } : separator ? {
      position: 'relative',
      flex: 1,
      flexBasis: '100%',
      height: '4px',
      '>div:last-of-type': {
        display: 'none',
      },
    } : {
      position: 'relative',
      '>div:first-of-type': {
        fontSize: '1em !important',
        paddingRight: '8px',
      },
      '>div:last-of-type': {
        display: 'none',
      },
    }),
    multiValueLabel: (style, { data: { group } }) => ({
      ...style,
      color: { prefer: '#FFF', avoid: '#FFF' }[group] || '#FFF',
      fontSize: '0.75em',
      fontFamily: (theme.fonts as any).monospace,
      fontWeight: 600,
      paddingRight: '6px',
    }),
    multiValueRemove: () => ({
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      cursor: 'pointer',
      opacity: 0,
    }),
    loadingIndicator: () => ({
      display: 'none',
    }),
    dropdownIndicator: () => ({
      display: 'none',
    }),
    menu: () => ({
      display: 'none',
    }),
  }), [theme])

  return (
    <SortableSelectContainer
      {...props}
      value={value}
      onChange={onChange}
      axis="xy"
      onSortEnd={onSortEnd}
      distance={4}
      getHelperDimensions={({ node }) => node.getBoundingClientRect()}
      useDragHandle={true}
      closeMenuOnSelect={false}
      multi={true}
      styles={styles}
      // @ts-ignore We're failing to provide a required index prop to SortableElement
      components={SortableComponents}
    />
  )
}
