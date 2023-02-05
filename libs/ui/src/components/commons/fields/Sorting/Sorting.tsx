import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '../../../../inputs/Select/Select'
import { Radio } from '../../../../inputs/Radio/Radio'
import { Icon } from '../../../../atoms/Icon/Icon'

export interface SortingProps {
  display?: 'default' | 'radio' | 'select'
  value: any
  onChange: any
  options: { value: string, label: string }[]
}

const UISorting = ({ display = 'default', options, value, onChange, ...props }: SortingProps) => {
  const { t } = useTranslation()

  switch (display) {
    case 'radio':
      return (
        <Radio
          {...props as any}
          options={options}
          value={value?.value}
          onChange={next => onChange({ ...value, value: next })}
          sort={value?.sort}
          onSort={sort => onChange({ ...value, sort })}
        />
      )
    case 'select':
      return (
        <Select
          label={t('ui.sorting')}
          {...props as any}
          options={options}
          multi={false}
          closeMenuOnSelect={true}
          isSearchable={false}
          isClearable={false}
          defaultOptions={true}
        />
      )
    default:
      return (
        <div sx={UISorting.styles.default}>
          <label htmlFor='sorting'>{t('ui.sorting')}</label>
          <button onClick={() => onChange({ ...value, sort: !value?.sort })}>
            <Icon value='sort' direction={value?.sort} />
          </button>
          <div>
            <span>{options.find(option => option.value === value?.value)?.label}</span>
            <select
              id='sorting'
              value={value?.value}
              onChange={e => onChange({ ...value, value: e.target.value })}
            >
              {options.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      )
  }
}

UISorting.styles = {
  default: {
    display: 'flex',
    alignItems: 'center',
    minWidth: '17em',
    '>label': {
      marginRight: 6,
    },
    '>button': {
      variant: 'button.reset',
      marginRight: 4,
      '>svg': {
        height: '1em',
      },
    },
    '>div': {
      position: 'relative',
      '>span': {
        color: 'textShadow',
        fontSize: 4,
        fontWeight: 'semibold',
      },
      '>select': {
        variant: 'select.reset',
        position: 'absolute',
        width: '100%',
        right: '0px',
        opacity: 0,
        fontSize: 4,
        fontWeight: 'semibold',
      },
    },
  },
}

export const Sorting = memo(UISorting)
