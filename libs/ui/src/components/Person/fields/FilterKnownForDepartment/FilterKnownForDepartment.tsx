import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { fixtures } from '@sensorr/tmdb'
import { Checkbox } from '../../../../inputs/Checkbox/Checkbox'

export interface FilterKnownForDepartmentProps {
  display?: 'checkbox' | 'select'
  statistics: { _id: any, count: number }[]
  value: any
  onChange: any
}

const UIFilterKnownForDepartment = ({ statistics, display, ...props }: FilterKnownForDepartmentProps) => {
  const { t } = useTranslation()

  const options = useMemo(() => (fixtures.departments
    .map(department => ({
      value: department,
      label: department,
      count: statistics?.find(obj => obj._id === department)?.count || 0,
    }))
    .sort((a, b) => b.count - a.count)
  ), [statistics])

  return (
    <Checkbox
      {...props as any}
      label={t('ui.filters.known_for_department')}
      options={options}
    />
  )
}

export const FilterKnownForDepartment = memo(UIFilterKnownForDepartment)
