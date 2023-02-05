import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox, CheckboxProps } from '../../../../inputs/Checkbox/Checkbox'

export interface FilterRequestedByProps extends Omit<CheckboxProps, 'label' | 'options'> {
  statistics: { _id: any, count: number }[]
  value: any
  onChange: any
}

const UIFilterRequestedBy = ({ statistics, ...props }: FilterRequestedByProps) => {
  const { t } = useTranslation()
  const options = useMemo(() => (statistics || []).map(({ _id, count }) => ({ label: _id, value: _id, count: count })), [statistics])

  return (
    <Checkbox
      {...props as any}
      label={t('ui.filters.requested_by')}
      options={options}
      value={props.value.values}
      onChange={values => props.onChange({ ...props.value, values })}
      behavior={props.value.behavior}
      onBehavior={behavior => props.onChange({ ...props.value, behavior })}
    />
  )
}

export const FilterRequestedBy = memo(UIFilterRequestedBy)
