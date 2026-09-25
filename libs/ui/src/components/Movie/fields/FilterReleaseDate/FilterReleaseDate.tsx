import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useFieldComputedRangeProps } from '@sensorr/tmdb'
import { Range, RangeProps } from '../../../../inputs/Range/Range'
import { DatePicker, DatePickerProps } from '../../../../inputs/DatePicker/DatePicker'

export interface FilterReleaseDateProps extends Omit<RangeProps, 'label' | 'data'>, Omit<DatePickerProps, 'value' | 'onChange'> {
  display?: 'range' | 'datePicker'
  statistics?: { _id: any, count: number }[]
}

const parse = date => date.getFullYear()
const serialize = year => new Date(`01/01/${year}`)

const UIFilterReleaseDate = ({ display = 'range', statistics, ...props }) => {
  const { t } = useTranslation()
  const field = useFieldComputedRangeProps('release_date', statistics)

  switch (display) {
    case 'datePicker':
      return (
        <DatePicker
          {...props as any}
          {...field}
          label={props.label || t('ui.filters.release_date')}
        />
      )
    case 'range':
    default:
      return (
        <Range
          {...props as any}
          {...field}
          label={props.label || t('ui.filters.release_date')}
          value={props.value?.map(parse) || [field.min, field.max]}
          onChange={(value) => props.onChange(value.map(serialize))}
        />
      )
  }
}

export const FilterReleaseDate = memo(UIFilterReleaseDate)

const UICalendarMonthPicker = ({ ...props }: FilterReleaseDateProps) => (
  <div sx={UICalendarMonthPicker.styles.element}>
    <FilterReleaseDate {...props as any} display='datePicker' />
  </div>
)

// On a desktop the months take no more than they need, so the picker keeps one width whatever the bar holds beside it
UICalendarMonthPicker.styles = {
  element: {
    display: 'flex',
    maxWidth: ['none', 'min-content'],
    marginLeft: ['-2em', '2em'],
    marginRight: ['0em', '2em'],
    '>*': {
      flex: 1,
    },
  },
}

export const CalendarMonthPicker = memo(UICalendarMonthPicker)
