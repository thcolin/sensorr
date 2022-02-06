import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useFieldComputedRangeProps } from '@sensorr/tmdb'
import { Range, RangeProps } from '../../../../inputs/Range/Range'

export interface FilterPopularityProps extends Omit<RangeProps, 'label' | 'labelize' | 'unit' | 'data' | 'marks' | 'step' | 'min' | 'max'> {
  statistics: { _id: any, count: number }[]
}

const UIFilterPopularity = ({ statistics, ...props }: FilterPopularityProps) => {
  const { t } = useTranslation()
  const field = useFieldComputedRangeProps('popularity', statistics)

  return (
    <Range
      {...props as any}
      {...field}
      label={t('ui.filters.popularity')}
      value={props.value || [field.min, field.max]}
      step={null}
    />
  )
}

export const FilterPopularity = memo(UIFilterPopularity)
