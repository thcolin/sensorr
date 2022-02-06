import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useFieldComputedRangeProps } from '@sensorr/tmdb'
import { Range, RangeProps } from '../../../../inputs/Range/Range'

export interface FilterVoteAverageProps extends Omit<RangeProps, 'label' | 'data'> {
  statistics: { _id: any, count: number }[]
}

const UIFilterVoteAverage = ({ statistics, ...props }: FilterVoteAverageProps) => {
  const { t } = useTranslation()
  const field = useFieldComputedRangeProps('vote_average', statistics)

  return (
    <Range
      {...props as any}
      {...field}
      label={t('ui.filters.vote_average')}
      value={props.value || [field.min, field.max]}
    />
  )
}

export const FilterVoteAverage = memo(UIFilterVoteAverage)
