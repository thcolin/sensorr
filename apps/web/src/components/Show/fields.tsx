import { useMemo } from 'react'
import { Checkbox, EpisodeStatusOptions, FilterStatistics, INACTIVE, Range } from '@sensorr/ui'
import { STATUS_GROUPS } from '@sensorr/sensorr'
import { fields, useFieldComputedRangeProps } from '@sensorr/tmdb'
import i18n from '@sensorr/i18n'
import { countries, emojize } from '@sensorr/utils'
import withProps from '../enhancers/withProps'
import { multi, statuses, untouched } from '../Sensorr/Controls/serialize'

export { multi, untouched }

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
  component: (props) => (
    <OneOf
      {...props}
      label={i18n.t('ui.filters.status')}
      options={[
        { value: 'airing', label: emojize('📡', i18n.t('showFields.status.airing')) },
        { value: 'upcoming', label: emojize('📅', i18n.t('showFields.status.upcoming')) },
        { value: 'ended', label: emojize('🏁', i18n.t('showFields.status.ended')) },
      ]}
    />
  ),
}


// A TMDB type by its name, and by its index for `discover/tv`
export const TYPES = [
  { name: 'Scripted', key: 'scripted', index: 4, emoji: '🎬' },
  { name: 'Miniseries', key: 'miniseries', index: 2, emoji: '📕' },
  { name: 'Documentary', key: 'documentary', index: 0, emoji: '🎓' },
  { name: 'Reality', key: 'reality', index: 3, emoji: '🤳' },
  { name: 'Talk Show', key: 'talkShow', index: 5, emoji: '🛋️' },
  { name: 'News', key: 'news', index: 1, emoji: '🗞️' },
  { name: 'Video', key: 'video', index: 6, emoji: '📼' },
]

export const type = {
  initial: { values: [] },
  serialize: (key, raw) => raw?.values?.length ? { [key]: raw.values.join('|') } : {},
  component: (props) => (
    <OneOf
      {...props}
      label={i18n.t('ui.filters.type')}
      options={TYPES.map(({ name, key, emoji }) => ({ value: name, label: emojize(emoji, i18n.t(`showFields.types.${key}`)) }))}
    />
  ),
}

const FilterNetworks = ({ statistics, counted = true, ...props }) => {
  const names = useMemo(() => Object.fromEntries((statistics || []).map(({ _id, name }) => [_id, name])), [statistics])

  return (
    <FilterStatistics
      {...props as any}
      statistics={statistics}
      label='ui.filters.networks'
      display='select'
      labelize={(_id, count) => counted ? `${names[_id] || _id} (${count})` : `${names[_id] || _id}`}
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
    labelize: (_id, count) => `${countries[_id]?.emoji || '🏳️'}  ${countries[_id]?.name || i18n.t('showFields.unknown', { id: _id })} (${count})`,
  })(FilterStatistics),
}

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

const EPISODE_STATUSES = ['wanted', 'proposed', 'owned', 'upcoming', 'unmonitored'].map(value => {
  const { emoji, label, inactive } = EpisodeStatusOptions[value]
  return { value, label, emoji: (inactive ? <span sx={INACTIVE}>{emoji}</span> : emoji) as any }
})

// Uncounted: the list view loads its episodes page by page
export const episode_status = {
  initial: { values: [] },
  serialize: statuses,
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
