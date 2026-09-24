import { memo, useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { TMDB, fixtures } from '@sensorr/tmdb'
import { Checkbox } from '../../../../inputs/Checkbox/Checkbox'
import { Select } from '../../../../inputs/Select/Select'

export interface FilterGenresProps {
  display?: 'checkbox' | 'select'
  type?: 'movie' | 'tv'
  statistics: { _id: any, count: number }[]
  tmdb: TMDB
  value: any
  onChange: any
}

const UIFilterGenres = ({ statistics, tmdb, display, type = 'movie', ...props }: FilterGenresProps) => {
  const { t } = useTranslation()
  const [genres, setGenres] = useState(type === 'tv' ? fixtures.tvGenres : fixtures.genres)

  useEffect(() => {
    const cb = async () => {
      try {
        const res = (await tmdb.fetch(`genre/${type}/list`, {}, {}, true))
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
      label: `${{
        28: '💥', // 🔥
        12: '🗺️', // 🏔️, 🧭, 🧳
        16: '🎨',
        35: '🤡', // 😂
        80: '🔪', // 🕵️, 🚓
        99: '🌍', // 🍃
        18: '🎭',
        10751: '🧸', // 👨‍👩‍👧‍👦
        14: '🧙', // 🏰, 🐉
        36: '🕰️', // 📜
        27: '🧟', // 👻
        10402: '🎸', // 🎵, 🎹, 🎤
        9648: '🧩', // ❓, 🔎
        10749: '🌹', // 💑, 💌
        878: '👽', // 🪐, 🚀, 🤖
        10770: '📺', // 🛋️
        53: '😬',
        10752: '🪖', // 🎖️
        37: '🌵', // 🤠, 🐎
        10759: '💥',
        10762: '🎈',
        10763: '📰',
        10764: '🎥',
        10765: '👽',
        10766: '💔',
        10767: '🎙️',
        10768: '🪖',
      }[genre.id || '🐎']}  ${genre.name}`,
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
