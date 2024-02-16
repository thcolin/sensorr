import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MovieStateOptions } from '../../../../components/Movie/State/State'
import { PersonStateOptions } from '../../../../components/Person/State/State'
import { Checkbox, CheckboxProps } from '../../../../inputs/Checkbox/Checkbox'

export interface FilterStatesProps extends Omit<CheckboxProps, 'label' | 'options'> {
  type: 'movie' | 'person'
  statistics: { _id: any, count: number }[]
  ignoreOptions: string[]
  additionalOptions: { emoji: string, label: string, value: string }[]
}

const UIFilterStates = ({ type, statistics, additionalOptions = [], ignoreOptions = ['loading', 'ignored'], ...props }: FilterStatesProps) => {
  const { t } = useTranslation()
  const options = useMemo(() => (
    [
      ...{ movie: MovieStateOptions, person: PersonStateOptions }[type],
      ...additionalOptions,
    ]
    .filter(option => !ignoreOptions.includes(option.value))
    .map(option => ({
      ...option,
      label: t(`state.${option.value}`),
      count: statistics?.find(obj => obj._id === option.value)?.count || 0,
    }))
    .reverse()
  ), [statistics])

  return (
    <Checkbox
      {...props as any}
      label={t('ui.filters.state')}
      options={options}
    />
  )
}

export const FilterStates = memo(UIFilterStates)