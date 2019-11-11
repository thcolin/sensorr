import React, { useState, useMemo } from 'react'
import ReactSelect from 'react-select'
import nanobounce from 'nanobounce'
import theme from 'theme'

const styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    '>label': {
      padding: '0 0 1em 0',
      fontWeight: 600,
    },
  },
  select: {
    control: (style) => ({
      ...style,
      backgroundColor: 'transparent',
      borderColor: 'white !important',
      boxShadow: 'none',
      cursor: 'pointer',
      '>div:first-child': {
        display: 'flex',
        flexWrap: 'nowrap',
        width: 0,
        overflowX: 'auto',
        paddingTop: '5px',
        paddingBottom: '5px',
        '>input': {
          left: 0,
          margin: '2px',
          padding: '2px 0',
          transform: 'unset',
        },
      }
    }),
    placeholder: (style) => ({
      ...style,
      color: theme.colors.smoke,
      fontSize: '0.875em',
    }),
    input: (style) => ({
      ...style,
      color: 'white',
      fontSize: '0.875em',
    }),
    singleValue: (style) => ({
      ...style,
      color: 'white',
      fontSize: '0.875em',
    }),
    multiValue: (style) => ({
      ...style,
      flexShrink: 0,
      backgroundColor: 'white',
      color: theme.colors.primary,
    }),
    multiValueLabel: (style) => ({
      ...style,
      color: theme.colors.primary,
    }),
    multiValueRemove: (style, props) => ({
      ...style,
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      borderLeft: `1px solid ${theme.colors.primary}`,
      marginLeft: '0.25em',
      cursor: 'pointer',
      ':hover': {
        backgroundColor: theme.colors.tertiary,
        color: 'white',
      },
    }),
    indicatorSeparator: (style) => ({
      ...style,
      backgroundColor: 'white',
    }),
    loadingIndicator: () => ({
      display: 'none',
    }),
    dropdownIndicator: (style) => ({
      ...style,
      color: 'white',
      ':hover': {
        color: 'white',
      }
    }),
    menu: (style) => ({
      ...style,
      color: theme.colors.tertiary,
    }),
    menuList: (style) => ({
      ...style,
      borderRadius: '4px',
    }),
    groupHeading: (style) => ({
      ...style,
      textTransform: 'capitalize',
      paddingTop: '1em',
      paddingBottom: '1em',
      backgroundColor: theme.colors.storm,
    }),
    option: (style, props) => ({
      ...style,
      backgroundColor: props.isFocused ? theme.colors.tertiary : props.isSelected ? theme.colors.primary : 'white',
      fontSize: '0.875em',
      color: (props.isSelected || props.isFocused) ? 'white' : theme.colors.tertiary,
      cursor: 'pointer',
    }),
    loadingMessage: (style) => ({
      ...style,
      fontSize: '0.875em',
      padding: '1em 0',
    }),
    noOptionsMessage: (style) => ({
      ...style,
      fontSize: '0.875em',
      padding: '1em 0',
    })
  }
}

const Select = ({ label, value, onChange, options = [], loadOptions, disabled, isMulti, data = {}, ...props }) => {
  const debounce = useMemo(() => nanobounce(500), [])
  const [isLoading, setIsLoading] = useState(false)
  const [options_, setOptions_] = useState([])

  if (loadOptions) {
    props.onInputChange = (query) => {
      if (!query) {
        setOptions_([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      debounce(async () => {
        setOptions_(await loadOptions(query))
        setIsLoading(false)
      })
    }
  }

  return (
    <div css={styles.element}>
      <label onClick={() => !disabled && onChange(isMulti ? [] : '')} style={!disabled ? { cursor: 'pointer' } : {}}>
        {label}
      </label>
      <ReactSelect
        isLoading={isLoading}
        loadingMessage={() => '⌛ Searching...'}
        noOptionsMessage={({ inputValue }) => loadOptions && !inputValue ? '🔍 Search for anything !' : '🔦 No options left'}
        {...props}
        value={value}
        onChange={onChange}
        options={[...options, ...options_]}
        isMulti={isMulti}
        disabled={disabled}
        styles={styles.select}
      />
    </div>
  )
}

export default Select
