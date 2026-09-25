import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { humanize } from '@sensorr/utils'
import { useFieldComputedRangeProps } from '@sensorr/tmdb'
import { Range, RangeProps } from '../../../../inputs/Range/Range'

export interface FilterRuntimeProps extends Omit<RangeProps, 'label' | 'labelize' | 'step' | 'data'> {
  statistics: { _id: any, count: number }[]
  field?: 'runtime' | 'episode_runtime'
  label?: string
}

const UIFilterRuntime = ({ statistics, field: key = 'runtime', label, ...props }: FilterRuntimeProps) => {
  const { t } = useTranslation()
  const field = useFieldComputedRangeProps(key, statistics)

  return (
    <Range
      {...props as any}
      {...field}
      label={label || t('ui.filters.runtime')}
      labelize={(value) => humanize.time(value as string).replace(/ /, '')}
      value={props.value || [field.min, field.max]}
      step={null}
    />
  )
}

export const FilterRuntime = memo(UIFilterRuntime)
