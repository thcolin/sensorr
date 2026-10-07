import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '@sensorr/i18n'
import oleoo from 'oleoo'
import { SortableSelect } from '@sensorr/ui'
import { useSensorr } from '../../../store/sensorr'
import { withProps } from '../../enhancers/withProps'

const MARKS = {
  prefer: '⭐',
  avoid: '⛔',
  current: '📀',
  proposed: '💿',
  ignore: '🔕',
}

// A click moves a value to the next group of `groups`, then back to 🔕. Swaps passes
// `['current', 'proposed']`: which side of the swap has to carry the value.
const RULES = ['prefer', 'avoid']

const RuleSortableSelect = ({ onChange, options, requirable = false, groups = RULES, ...props }) => {
  const { t } = useTranslation()
  const value = useMemo(() => {
    const mark = (group) => ({ label: MARKS[group], title: t(`sensorr.oleoo.marks.${group}`) })
    const ignore = [
      ...props.value.filter(v => !v.group && v.required),
      ...options
        .filter(option => !props.value.find(v => v.value === option.value && (v.group || v.required)))
        .map((option) => ({ ...option, group: null })),
    ]

    return [
      ...groups.flatMap(group => {
        const values = props.value.filter(v => v.group === group)
        return values.length ? [mark(group), ...values, { separator: true }] : []
      }),
      ...(ignore.length ? [mark('ignore'), ...ignore, { separator: true }] : []),
    ]
  }, [props.value, options, groups, t])

  const handleChange = useCallback((values, { action, removedValue } = { action: null, removedValue: null }) => {
    switch (action) {
      case 'toggle-require-value':
        onChange(values)
        return
      case 'remove-value':
      case 'pop-value': {
        const next = groups[groups.indexOf(removedValue.group) + 1] || null
        onChange([
          ...values.filter(v => v.value),
          { ...removedValue, group: next, rank: undefined, ...(removedValue.group ? { required: false } : {}) },
        ])
        return
      }
      default:
        onChange(values.filter(v => v.value))
        return
    }
  }, [onChange, groups])

  return (
    <SortableSelect {...props} requirable={requirable} value={value} onChange={handleChange} />
  )
}

const rules = {
  source: Object.keys(oleoo.rules.source),
  encoding: Object.keys(oleoo.rules.encoding),
  resolution: Object.keys(oleoo.rules.resolution),
  language: ['MULTi-VF2', 'MULTi-VFF', 'MULTi-VFQ', ...Object.keys(oleoo.rules.language)],
  dub: Object.keys(oleoo.rules.dub),
  flags: Object.keys(oleoo.rules.flags),
}

export const ZNABFilter = ({ ...props }) => {
  const { t } = useTranslation()
  const sensorr = useSensorr()

  return (
    <RuleSortableSelect
      {...props as any}
      label={t('sensorr.oleoo.filters.indexer')}
      options={sensorr.znabs.map(({ name }) => ({ label: name, value: name }))}
      isClearable={false}
      defaultOptions={true}
      resetable={false}
    />
  )
}

export const EncodingFilter = withProps({
  // A getter: `withProps` spreads it at each render, the label follows the language
  get label() { return i18n.t('sensorr.oleoo.filters.encoding') },
  options: rules.encoding.map(source => ({ label: source, value: source })),
  isClearable: false,
  defaultOptions: true,
  resetable: false,
})(RuleSortableSelect)

export const ResolutionFilter = withProps({
  get label() { return i18n.t('sensorr.oleoo.filters.resolution') },
  options: rules.resolution.map(source => ({ label: source, value: source })),
  isClearable: false,
  defaultOptions: true,
  resetable: false,
})(RuleSortableSelect)

export const SourceFilter = withProps({
  get label() { return i18n.t('sensorr.oleoo.filters.source') },
  options: rules.source.map(source => ({ label: source, value: source })),
  isClearable: false,
  defaultOptions: true,
  resetable: false,
})(RuleSortableSelect)

export const DubFilter = withProps({
  get label() { return i18n.t('sensorr.oleoo.filters.dub') },
  options: rules.dub.map(source => ({ label: source, value: source })),
  isClearable: false,
  defaultOptions: true,
  resetable: false,
})(RuleSortableSelect)

export const LanguageFilter = withProps({
  get label() { return i18n.t('sensorr.oleoo.filters.language') },
  options: rules.language.map(source => ({ label: source, value: source })),
  isClearable: false,
  defaultOptions: true,
  resetable: false,
})(RuleSortableSelect)

export const FlagsFilter = withProps({
  get label() { return i18n.t('sensorr.oleoo.filters.flags') },
  rankable: false,
  options: rules.flags.map(source => ({ label: source, value: source })),
  isClearable: false,
  defaultOptions: true,
  resetable: false,
})(RuleSortableSelect)
