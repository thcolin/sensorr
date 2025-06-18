import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox, CheckboxProps } from '../../../../inputs/Checkbox/Checkbox'
import { Select } from '../../../../inputs/Select/Select'

export interface FilterStatisticsProps extends Omit<CheckboxProps, 'label' | 'options' | 'display'> {
  statistics: { _id: any, count: number }[]
  display?: 'select' | 'checkbox'
  label: string
  labelize?: (_id: string, count: number) => string
  value: any
  onChange: any
}

const UIFilterStatistics = ({ display = 'checkbox', statistics, label, labelize, ...props }: FilterStatisticsProps) => {
  const { t } = useTranslation()
  const options = useMemo(() => (statistics || []).map(({ _id, count }) => ({ label: typeof labelize === 'function' ? labelize(_id, count) : display === 'select' ? `${_id} (${count})` : _id, value: _id, count: count })), [statistics]).sort(({ count: a }, { count: b }) => b - a)

  switch (display) {
    case 'select':
      return (
        <Select
          label={t(label)}
          {...props as any}
          placeholder={`${options.map(option => option.label.replace(/\s\(\d+\)$/, '')).slice(0, 3).join(', ')}...`}
          options={options.slice(0, 500)}
          value={props.value.values}
          onChange={values => props.onChange({ ...props.value, values })}
          behavior={props.value.behavior}
          onBehavior={behavior => props.onChange({ ...props.value, behavior })}
          multi={true}
          closeMenuOnSelect={false}
          isSearchable={true}
          isClearable={false}
          defaultOptions={true}
          cacheOptions={true}
        />
      )
    case 'checkbox':
    default:
      return (
        <Checkbox
          {...props as any}
          label={t(label)}
          options={options}
          value={props.value.values}
          onChange={values => props.onChange({ ...props.value, values })}
          behavior={props.value.behavior}
          onBehavior={behavior => props.onChange({ ...props.value, behavior })}
        />
      )
  }
}

export const FilterStatistics = memo(UIFilterStatistics)
