import { useMemo, useCallback } from 'react'
import CreatableSelect from 'react-select/creatable'
import { useThemeUI } from 'theme-ui'
import { Select } from './Select'

export const QuerySelect = ({ onChange, ...props }) => {
  const { theme } = useThemeUI()

  const handleChange = useCallback((values, { action, removedValue }) => {
    switch (action) {
      case 'remove-value':
      case 'pop-value':
        if (removedValue.pinned) {
          onChange([...values, { ...removedValue, disabled: !removedValue.disabled }])
          return
        }
    }

    onChange(values)
  }, [onChange])

  const styles = useMemo(() => ({
    container: (style) => ({
      ...style,
      flex: 1,
      overflow: 'hidden',
    }),
    control: (style) => ({
      ...style,
      backgroundColor: 'transparent',
      borderColor: 'inherit !important',
      boxShadow: 'none',
      cursor: 'text',
      '>div:first-of-type': {
        display: 'flex',
        padding: '0.5em',
      }
    }),
    placeholder: (style) => ({
      ...style,
      color: 'inherit',
      opacity: 0.75,
    }),
    input: (style) => ({
      ...style,
      flex: 1,
      color: 'inherit',
      fontSize: '1em',
      textAlign: 'left',
      marginLeft: '0.25em',
      '>div>input': {
        fontSize: '0.75em !important',
        fontFamily: (theme.fonts as any).monospace,
      },
    }),
    valueContainer: (style) => ({
      ...style,
      overflowX: 'auto',
      flexWrap: { row: 'nowrap', column: 'wrap' }[props.direction] || 'wrap',
    }),
    multiValue: (style, { data: { pinned, disabled } }) => ({
      ...style,
      position: 'relative',
      flexShrink: 0,
      backgroundColor: pinned ? disabled ? 'transparent' : theme.rawColors.accent : '#FFF',
      color: pinned ? disabled ? theme.rawColors.primaryDarker : '#FFF' : theme.rawColors.primaryDark,
      border: pinned ? `1px solid ${disabled ? theme.rawColors.primaryDarker : theme.rawColors.accent}` : 'none',
      marginRight: '0.25em',
      opacity: disabled ? 0.75 : 1,
      ':hover': {
        opacity: disabled ? 0.9 : 1,
      },
    }),
    multiValueLabel: (style, { data: { pinned, disabled } }) => ({
      ...style,
      color: pinned ? disabled ? theme.rawColors.primaryDarker : '#FFF' : theme.rawColors.primaryDark,
      fontSize: '0.75em',
      fontFamily: (theme.fonts as any).monospace,
      fontWeight: 600,
      paddingRight: pinned ? '6px' : '0px',
    }),
    multiValueRemove: (style, { data: { pinned } }) => (pinned ? {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      cursor: 'pointer',
      opacity: 0,
    } : {
      ...style,
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      borderLeft: `1px solid ${theme.rawColors.primary}`,
      marginLeft: '0.25em',
      cursor: 'pointer',
      ':hover': {
        backgroundColor: '#FFF',
        color: theme.rawColors.primaryDark,
      },
    }),
    indicatorSeparator: (style) => ({
      ...style,
      backgroundColor: 'inherit',
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
    <Select
      {...props as any}
      onChange={handleChange}
      closeMenuOnSelect={false}
      multi={true}
      styles={styles}
      components={{
        root: CreatableSelect,
      }}
    />
  )
}
