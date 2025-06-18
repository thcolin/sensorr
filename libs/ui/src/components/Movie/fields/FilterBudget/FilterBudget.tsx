import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useFieldComputedRangeProps } from '@sensorr/tmdb'
import { Range, RangeProps } from '../../../../inputs/Range/Range'

export interface FilterBudgetProps extends Omit<RangeProps, 'label' | 'labelize' | 'step' | 'data'> {
  statistics: { _id: any, count: number }[]
}

const UIFilterBudget = ({ statistics, ...props }: FilterBudgetProps) => {
  const { t } = useTranslation()
  const field = useFieldComputedRangeProps('budget', statistics)

  return (
    <Range
      {...props as any}
      {...field}
      label={t('ui.filters.budget')}
      labelize={(value) => `${value}M$`}
      value={props.value || [field.min, field.max]}
      step={null}
    />
  )
}

export const FilterBudget = memo(UIFilterBudget)
