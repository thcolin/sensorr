import { memo, useState, useMemo } from 'react'
import { useThemeUI } from 'theme-ui'
import { useTranslation } from 'react-i18next'
import ReactSelect from 'react-select'
import nanobounce from 'nanobounce'

export interface SelectProps {
  label?: string
  options: {
    label: string
    value: string
  }[],
  loadOptions?: (query: string) => { label: string; value: string }[]
  value: string | string[]
  onChange: (value: { label: string; value: string } | { label: string; value: string }[], changes?: any) => void
  behavior?: 'or' | 'and'
  onBehavior?: (value: 'or' | 'and') => void
  disabled?: boolean
  resetable?: boolean
  multi?: boolean
  noOptionsMessage?: (foo: { inputValue: string }) => string
  styles?: { [key: string]: any },
  components?: { [key: string]: any },
  direction?: 'row' | 'column'
  [key: string]: any
}

const UISelect = ({
  label,
  loadOptions,
  value,
  onChange,
  behavior,
  onBehavior,
  components: { root: Element, ...components } = {},
  disabled,
  resetable = true,
  multi,
  direction = 'column',
  ...props
}: SelectProps) => {
  const { t } = useTranslation()
  const SelectElement = Element || ReactSelect
  const { theme } = useThemeUI()
  const debounce = useMemo(() => nanobounce(500), [])
  const [query, setQuery] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [options, setOptions] = useState([])
  const styles = useMemo(() => ({
    container: (style) => ({
      ...style,
      flex: 1,
    }),
    control: (style) => ({
      ...style,
      backgroundColor: 'transparent',
      borderColor: 'inherit !important',
      boxShadow: 'none',
      cursor: 'pointer',
      '>div:first-of-type': {
        display: 'flex',
        // flexWrap: 'nowrap',
        // width: 0,
        // overflowX: 'auto',
        padding: '0.5em',
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
      color: 'inherit',
      fontSize: '0.875em',
      opacity: 0.75,
      padding: '5px 0px',
    }),
    input: (style) => ({
      ...style,
      color: 'inherit',
      fontSize: '0.875em',
      margin: '4px',
    }),
    singleValue: (style) => ({
      ...style,
      color: 'inherit',
      fontSize: '0.875em',
    }),
    multiValue: (style) => ({
      ...style,
      flexShrink: 0,
      backgroundColor: theme.rawColors.accent,
      color: 'white',
    }),
    multiValueLabel: (style) => ({
      ...style,
      color: 'white',
    }),
    multiValueRemove: (style, props) => ({
      ...style,
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      borderLeft: `1px solid ${theme.rawColors.primary}`,
      marginLeft: '0.25em',
      cursor: 'pointer',
      ':hover': {
        backgroundColor: theme.rawColors.accent,
        color: 'white',
      },
    }),
    indicatorSeparator: (style) => ({
      ...style,
      backgroundColor: 'inherit',
    }),
    loadingIndicator: () => ({
      display: 'none',
    }),
    dropdownIndicator: (style) => ({
      ...style,
      color: 'inherit',
      ':hover': {
        color: 'inherit',
      }
    }),
    menu: (style) => ({
      ...style,
      color: theme.rawColors.primary,
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
      backgroundColor: 'inherit',
    }),
    option: (style, props) => ({
      ...style,
      backgroundColor: props.isFocused ? theme.rawColors.primary : props.isSelected ? theme.rawColors.accent : 'white',
      color: (props.isSelected || props.isFocused) ? 'white' : theme.rawColors.primary,
      fontSize: '0.875em',
      cursor: 'pointer',
      ':active': {
        backgroundColor: theme.rawColors.accent,
      },
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
    }),
    ...props.styles,
  }), [theme, props.styles])

  if (loadOptions) {
    (props as any).onInputChange = (query) => {
      if (!query) {
        setOptions([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setQuery(query)
      debounce(async () => {
        setOptions(await loadOptions(query))
        setIsLoading(false)
      })
    }
  }

  return (
    <div sx={UISelect.styles.element} style={{ flexDirection: direction }}>
      <label sx={UISelect.styles.label} style={{ row: { paddingRight: '1em' }, column: { paddingBottom: '1em' } }[direction]}>
        <span
          onClick={() => !disabled && resetable && onChange(multi ? [] : null)}
          style={!disabled && resetable ? { cursor: 'pointer' } : {}}
        >
          {label}
        </span>
        {!!(behavior && onBehavior) && (
          <span
            sx={UISelect.styles.badge}
            onClick={() => onBehavior({ and: 'or', or: 'and' }[behavior] as any)}
            style={!disabled ? { cursor: 'pointer' } : {}}
          >
            {behavior}
          </span>
        )}
      </label>
      <SelectElement
        placeholder={loadOptions ? t('ui.select.placeholder_search') : t('ui.select.placeholder_select')}
        loadingMessage={() => t('ui.select.loading', { query })}
        noOptionsMessage={({ inputValue }) => loadOptions && !inputValue ? t('ui.select.option') : t('ui.select.empty')}
        {...props}
        value={value}
        onChange={onChange}
        options={props.options || options}
        isLoading={isLoading}
        isDisabled={disabled}
        isMulti={multi}
        styles={styles}
        components={{
          ...components,
          ClearIndicator: null,
        }}
      />
    </div>
  )
}

UISelect.styles = {
  element: {
    display: 'flex',
    width: '100%',
  },
  label: {
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: 'semibold',
    '>*:first-of-type': {
      flex: 1,
    },
  },
  badge: {
    padding: '0.25em 0.375em 0.125em 0.375em',
    paddingY: 10,
    paddingX: 9,
    border: '1px solid',
    borderColor: 'inherit',
    borderRadius: '0.25em',
    fontFamily: 'monospace',
    fontSize: 6,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: 'inherit',
  },
}

export const Select = memo(UISelect)
