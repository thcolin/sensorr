import { Checkbox } from '@sensorr/ui'
import { STATUS_GROUPS } from '@sensorr/sensorr'
import { emojize } from '@sensorr/utils'
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
