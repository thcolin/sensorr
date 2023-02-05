import { memo, useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { TMDB, fixtures } from '@sensorr/tmdb'
import { Checkbox } from '../../../../inputs/Checkbox/Checkbox'
import { Select } from '../../../../inputs/Select/Select'

export interface FilterGenresProps {
  display?: 'checkbox' | 'select'
  statistics: { _id: any, count: number }[]
  tmdb: TMDB
  value: any
  onChange: any
}

const UIFilterGenres = ({ statistics, tmdb, display, ...props }: FilterGenresProps) => {
  const { t } = useTranslation()
  const [genres, setGenres] = useState(fixtures.genres)

  useEffect(() => {
    const cb = async () => {
      try {
        const res = (await tmdb.fetch('genre/movie/list', {}, {}, true))
        setGenres(res.genres)
      } catch (e) {
        console.warn(e)
      }
    }

    cb()
  }, [])

  const options = useMemo(() => (genres
    .map(genre => ({
      value: genre.id,
      label: genre.name,
      count: statistics?.find(obj => obj._id === genre.id)?.count || 0,
    }))
    .sort((a, b) => b.count - a.count)
  ), [genres, statistics])

  switch (display) {
    case 'select':
      return (
        <Select
          label={t('ui.filters.genres')}
          {...props as any}
          placeholder={`${options.map(option => option.label).slice(0, 3).join(', ')}...`}
          options={options}
          value={props.value.values}
          onChange={values => props.onChange({ ...props.value, values })}
          behavior={props.value.behavior}
          onBehavior={behavior => props.onChange({ ...props.value, behavior })}
          multi={true}
          closeMenuOnSelect={false}
          isSearchable={true}
          isClearable={false}
          defaultOptions={true}
          cacheOptions={true}
        />
      )
    case 'checkbox':
    default:
      return (
        <Checkbox
          {...props as any}
          label={t('ui.filters.genres')}
          options={options}
          value={props.value.values}
          onChange={values => props.onChange({ ...props.value, values })}
          behavior={props.value.behavior}
          onBehavior={behavior => props.onChange({ ...props.value, behavior })}
        />
      )
  }
}

export const FilterGenres = memo(UIFilterGenres)
