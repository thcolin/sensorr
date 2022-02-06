import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useFieldComputedRangeProps } from '@sensorr/tmdb'
import { Range, RangeProps } from '../../../../inputs/Range/Range'

export interface FilterVoteCountProps extends Omit<RangeProps, 'label' | 'labelize' | 'step' | 'data'> {
  statistics: { _id: any, count: number }[]
}

const UIFilterVoteCount = ({ statistics, ...props }: FilterVoteCountProps) => {
  const { t } = useTranslation()
  const field = useFieldComputedRangeProps('vote_count', statistics)

  return (
    <Range
      {...props as any}
      {...field}
      label={t('ui.filters.vote_count')}
      value={props.value || [field.min, field.max]}
      step={null}
    />
  )
}

export const FilterVoteCount = memo(UIFilterVoteCount)
