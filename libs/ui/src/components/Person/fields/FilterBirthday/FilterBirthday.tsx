import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useFieldComputedRangeProps } from '@sensorr/tmdb'
import { Range, RangeProps } from '../../../../inputs/Range/Range'

export interface FilterBirthdayProps extends Omit<RangeProps, 'label' | 'data'> {
  display?: 'range'
  statistics?: { _id: any, count: number }[]
}

const parse = date => date.getFullYear()
const serialize = year => new Date(`01/01/${year}`)

const UIFilterBirthday = ({ display = 'range', statistics, ...props }) => {
  const { t } = useTranslation()
  const field = useFieldComputedRangeProps('birthday', statistics)

  switch (display) {
    case 'range':
    default:
      return (
        <Range
          {...props as any}
          {...field}
          label={t('ui.filters.birthday')}
          value={props.value?.map(parse) || [field.min, field.max]}
          onChange={(value) => props.onChange(value.map(serialize))}
        />
      )
  }
}

export const FilterBirthday = memo(UIFilterBirthday)
