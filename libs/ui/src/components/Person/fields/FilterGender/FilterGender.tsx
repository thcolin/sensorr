import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '../../../../inputs/Checkbox/Checkbox'

export interface FilterGenderProps {
  display?: 'checkbox' | 'select'
  statistics: { _id: any, count: number }[]
  value: any
  onChange: any
}

const UIFilterGender = ({ statistics, display, ...props }: FilterGenderProps) => {
  const { t } = useTranslation()

  const options = useMemo(() => [
    {
      value: 1,
      label: t('ui.gender.female'),
      count: statistics?.find(obj => obj._id === 1)?.count || 0,
    },
    {
      value: 2,
      label: t('ui.gender.male'),
      count: statistics?.find(obj => obj._id === 2)?.count || 0,
    },
    {
      value: 3,
      label: t('ui.gender.nonBinary'),
      count: statistics?.find(obj => obj._id === 3)?.count || 0,
    },
    {
      value: 0,
      label: t('ui.gender.unknown'),
      count: statistics?.find(obj => obj._id === 0)?.count || 0,
    },
  ], [statistics, t])

  return (
    <Checkbox
      {...props as any}
      label={t('ui.filters.gender')}
      options={options}
    />
  )
}

export const FilterGender = memo(UIFilterGender)
