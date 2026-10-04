import { useMemo } from 'react'
import { FilterStatistics } from '@sensorr/ui'
import { emojize } from '@sensorr/utils'
import { useConfigContext } from '../../contexts/Config/Config'
import { listsOf } from '../../pages/Home/rows'

// The lists added to by hand, by name: a deleted list leaves its id on the movies, it is not offered
export const FilterLists = ({ statistics, ...props }: { statistics: { _id: string, count: number }[], value: any, onChange: any, [key: string]: any }) => {
  const { config } = useConfigContext()
  const names = useMemo(() => Object.fromEntries(listsOf(config).map((list) => [list.id, list.name])), [config])
  const known = useMemo(() => (statistics || []).filter(({ _id }) => names[_id]), [statistics, names])

  return (
    <FilterStatistics
      {...props}
      label='ui.filters.lists'
      statistics={known}
      labelize={(id) => emojize('🗂️', names[id])}
    />
  )
}
