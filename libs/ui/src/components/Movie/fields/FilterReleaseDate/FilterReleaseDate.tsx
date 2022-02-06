import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useFieldComputedRangeProps } from '@sensorr/tmdb'
import { Range, RangeProps } from '../../../../inputs/Range/Range'
import { Wheel, WheelProps } from '../../../../inputs/Wheel/Wheel'

export interface FilterReleaseDateProps extends Omit<RangeProps, 'label' | 'data'>, Omit<WheelProps, 'value' | 'onChange'> {
  display?: 'range' | 'wheel'
  statistics?: { _id: any, count: number }[]
}

const parse = date => date.getFullYear()
const serialize = year => new Date(`01/01/${year}`)

const UIFilterReleaseDate = ({ display = 'range', statistics, ...props }) => {
  const { t } = useTranslation()
  const field = useFieldComputedRangeProps('release_date', statistics)

  switch (display) {
    case 'wheel':
      return (
        <Wheel
          {...props as any}
          {...field}
          label={t('ui.filters.release_date')}
        />
      )
    case 'range':
    default:
      return (
        <Range
          {...props as any}
          {...field}
          label={t('ui.filters.release_date')}
          value={props.value?.map(parse) || [field.min, field.max]}
          onChange={(value) => props.onChange(value.map(serialize))}
        />
      )
  }
}

export const FilterReleaseDate = memo(UIFilterReleaseDate)
