import { useMemo } from 'react'
import { Checkbox, EpisodeStatusOptions, FilterStatistics, Range } from '@sensorr/ui'
import { STATUS_GROUPS } from '@sensorr/sensorr'
import { fields, useFieldComputedRangeProps } from '@sensorr/tmdb'
import i18n from '@sensorr/i18n'
import { countries, emojize } from '@sensorr/utils'
import withProps from '../enhancers/withProps'

const OneOf = ({ label, options, statistics, ...props }) => (
  <Checkbox
    {...props as any}
    label={label}
    options={options.map(option => ({ ...option, count: statistics?.find(({ _id }) => _id === option.value)?.count || 0 }))}
    value={props.value.values}
    onChange={values => props.onChange({ ...props.value, values })}
  />
)

// The group of a TMDB status, the value the `status` filter counts and sends
export const statusGroupOf = (status: string) => Object.keys(STATUS_GROUPS).find(group => STATUS_GROUPS[group].includes(status))

export const status = {
  initial: { values: [] },
  serialize: (key, raw) => raw?.values?.length ? { [key]: raw.values.flatMap(value => STATUS_GROUPS[value]).join('|') } : {},
  component: withProps({
    label: emojize('🚦', 'Status'),
    options: [
      { value: 'airing', label: emojize('📡', 'Airing') },
      { value: 'upcoming', label: emojize('📅', 'Upcoming') },
      { value: 'ended', label: emojize('🏁', 'Ended') },
    ],
  })(OneOf),
}

// A range left where it starts sends nothing: its lower bound would drop every show TMDB gives no value for,
// 288 of 522 on the episode length
export const untouched = (field) => ({
  ...field,
  serialize: (key, raw) => JSON.stringify(raw) === JSON.stringify(field.initial) ? {} : field.serialize(key, raw),
})

const multi = (key, raw) => raw?.values?.length ? { [key]: raw.values.join({ or: '|', and: ',' }[raw.behavior]) } : {}

// The TMDB types of a show, as `/shows/statistics` counts them
export const type = {
  initial: { values: [] },
  serialize: (key, raw) => raw?.values?.length ? { [key]: raw.values.join('|') } : {},
  component: withProps({
    label: i18n.t('ui.filters.type'),
    options: [
      { value: 'Scripted', label: emojize('🎬', 'Scripted') },
      { value: 'Miniseries', label: emojize('📕', 'Miniseries') },
      { value: 'Documentary', label: emojize('🌍', 'Documentary') },
      { value: 'Reality', label: emojize('🎥', 'Reality') },
      { value: 'Talk Show', label: emojize('🎙️', 'Talk Show') },
      { value: 'News', label: emojize('📰', 'News') },
      { value: 'Video', label: emojize('📼', 'Video') },
    ],
  })(OneOf),
}

// The networks come counted with their name, the filter sends their TMDB id
const FilterNetworks = ({ statistics, ...props }) => {
  const names = useMemo(() => Object.fromEntries((statistics || []).map(({ _id, name }) => [_id, name])), [statistics])

  return (
    <FilterStatistics
      {...props as any}
      statistics={statistics}
      label='ui.filters.networks'
      display='select'
      labelize={(_id, count) => `${names[_id] || _id} (${count})`}
    />
  )
}

export const networks = {
  initial: { values: [], behavior: 'or' },
  serialize: multi,
  component: FilterNetworks,
}

export const origin_country = {
  initial: { values: [], behavior: 'or' },
  serialize: multi,
  component: withProps({
    label: 'ui.filters.origin_country',
    display: 'select',
    labelize: (_id, count) => `${countries[_id]?.emoji || '🏳️'}  ${countries[_id]?.name || `Unknown (${_id})`} (${count})`,
  })(FilterStatistics),
}

// The last mark stands for ten seasons and more, `Range` writes it `10+`
const FilterSeasons = ({ statistics, ...props }) => {
  const field = useFieldComputedRangeProps('number_of_seasons', statistics)

  return (
    <Range
      {...props as any}
      {...field}
      label={i18n.t('ui.filters.number_of_seasons')}
      value={props.value || [field.min, field.max]}
      step={null}
    />
  )
}

export const number_of_seasons = untouched({
  ...fields.number_of_seasons,
  component: FilterSeasons,
})

const EPISODE_STATUSES = ['wanted', 'proposed', 'owned', 'upcoming', 'unmonitored']
  .map(value => ({ value, label: emojize(EpisodeStatusOptions[value].emoji, EpisodeStatusOptions[value].label) }))

// The statuses of an episode, the badges of the calendar. Uncounted: the list view loads the episodes page by page
export const episode_status = {
  initial: { values: [] },
  serialize: (key, raw) => raw?.values?.length ? { status: raw.values.join('|') } : {},
  component: ({ statistics, ...props }) => (
    <Checkbox
      {...props as any}
      label={i18n.t('ui.filters.episode_status')}
      options={EPISODE_STATUSES}
      value={props.value.values}
      onChange={values => props.onChange({ ...props.value, values })}
    />
  ),
}
