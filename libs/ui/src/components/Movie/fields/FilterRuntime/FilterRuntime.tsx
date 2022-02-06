import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { humanize } from '@sensorr/utils'
import { useFieldComputedRangeProps } from '@sensorr/tmdb'
import { Range, RangeProps } from '../../../../inputs/Range/Range'

export interface FilterRuntimeProps extends Omit<RangeProps, 'label' | 'labelize' | 'step' | 'data'> {
  statistics: { _id: any, count: number }[]
}

const UIFilterRuntime = ({ statistics, ...props }: FilterRuntimeProps) => {
  const { t } = useTranslation()
  const field = useFieldComputedRangeProps('runtime', statistics)

  return (
    <Range
      {...props as any}
      {...field}
      label={t('ui.filters.runtime')}
      labelize={(value) => humanize.time(value as string).replace(/ /, '')}
      value={props.value || [field.min, field.max]}
      step={null}
    />
  )
}

export const FilterRuntime = memo(UIFilterRuntime)
