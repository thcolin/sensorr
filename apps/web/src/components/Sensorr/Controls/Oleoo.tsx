import { useCallback, useMemo } from 'react'
import oleoo from 'oleoo'
import { SortableSelect } from '@sensorr/ui'
import { emojize } from '@sensorr/utils'
import { useSensorr } from '../../../store/sensorr'
import { withProps } from '../../enhancers/withProps'

const MARKS = {
  prefer: { label: '⭐', title: 'Prefer' },
  avoid: { label: '⛔', title: 'Avoid' },
  source: { label: '📀', title: 'Source: an owned release carries one of them' },
  target: { label: '💿', title: 'Target: the proposed release carries one of them' },
  ignore: { label: '🔕', title: 'Ignored' },
}

// A click moves a value to the next group of `groups`, then back to 🔕. Swaps passes
// `['source', 'target']`: which side of the swap has to carry the value.
const RULES = ['prefer', 'avoid']

const RuleSortableSelect = ({ onChange, options, requirable = false, groups = RULES, ...props }) => {
  const value = useMemo(() => {
    const ignore = [
      ...props.value.filter(v => !v.group && v.required),
      ...options
        .filter(option => !props.value.find(v => v.value === option.value && (v.group || v.required)))
        .map((option) => ({ ...option, group: null })),
    ]

    return [
      ...groups.flatMap(group => {
        const values = props.value.filter(v => v.group === group)
        return values.length ? [MARKS[group], ...values, { separator: true }] : []
      }),
      ...(ignore.length ? [MARKS.ignore, ...ignore, { separator: true }] : []),
    ]
  }, [props.value, options, groups])

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
          { ...removedValue, group: next, ...(removedValue.group ? { required: false } : {}) },
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
  const sensorr = useSensorr()

  return (
    <RuleSortableSelect
      {...props as any}
      label={emojize('☠️', 'Indexer')}
      options={sensorr.znabs.map(({ name }) => ({ label: name, value: name }))}
      isClearable={false}
      defaultOptions={true}
      resetable={false}
    />
  )
}

export const EncodingFilter = withProps({
  label: emojize('🎥', 'Encoding'),
  options: rules.encoding.map(source => ({ label: source, value: source })),
  isClearable: false,
  defaultOptions: true,
  resetable: false,
})(RuleSortableSelect)

export const ResolutionFilter = withProps({
  label: emojize('🎞️', 'Resolution'),
  options: rules.resolution.map(source => ({ label: source, value: source })),
  isClearable: false,
  defaultOptions: true,
  resetable: false,
})(RuleSortableSelect)

export const SourceFilter = withProps({
  label: emojize('💽', 'Source'),
  options: rules.source.map(source => ({ label: source, value: source })),
  isClearable: false,
  defaultOptions: true,
  resetable: false,
})(RuleSortableSelect)

export const DubFilter = withProps({
  label: emojize('🔈', 'Dub'),
  options: rules.dub.map(source => ({ label: source, value: source })),
  isClearable: false,
  defaultOptions: true,
  resetable: false,
})(RuleSortableSelect)

export const LanguageFilter = withProps({
  label: emojize('🇺🇳', 'Language'),
  options: rules.language.map(source => ({ label: source, value: source })),
  isClearable: false,
  defaultOptions: true,
  resetable: false,
})(RuleSortableSelect)

export const FlagsFilter = withProps({
  label: emojize('🚩', 'Flags'),
  options: rules.flags.map(source => ({ label: source, value: source })),
  isClearable: false,
  defaultOptions: true,
  resetable: false,
})(RuleSortableSelect)
