import { useCallback, useMemo } from 'react'
import { SortableSelect } from '@sensorr/ui'
import { emojize } from '@sensorr/utils'
import { SENSORR_POLICIES, useSensorr } from '../../../store/sensorr'
import { withProps } from '../../enhancers/withProps'

const RuleSortableSelect = ({ onChange, ...props }) => {
  const value = useMemo(() => {
    const prefer = props.value.filter(v => v.group === 'prefer')
    const avoid = props.value.filter(v => v.group === 'avoid')
    const ignore = props.options.filter(option => !props.value.find(v => v.value === option.value && v.group)).map((option) => ({ ...option, group: null }))

    return [
      ...(prefer.length ? [{ label: '👍' }, ...prefer, { separator: true }] : []),
      ...(avoid.length ? [{ label: '🚨' }, ...avoid, { separator: true }] : []),
      ...(ignore.length ? [{ label: '🔕' }, ...ignore, { separator: true }] : []),
    ]
  }, [props.value, props.options])

  const handleChange = useCallback((values, { action, removedValue } = {}) => {
    switch (action) {
      case 'remove-value':
      case 'pop-value':
        onChange([...values.filter(v => v.value), { ...removedValue, group: { [null as any]: 'prefer', prefer: 'avoid', avoid: null }[removedValue.group] }])
        return
      default:
        onChange(values.filter(v => v.value))
        return
    }
  }, [onChange])

  return (
    <SortableSelect {...props} value={value} onChange={handleChange} />
  )
}

const rules = require('oleoo/src/rules.json')

const standards = {
  source: Object.keys(rules.source),
  encoding: Object.keys(rules.encoding),
  resolution: Object.keys(rules.resolution),
  language: Object.keys(rules.language),
  dub: Object.keys(rules.dub),
  flags: Object.keys(rules.flags),
}

export const ZNABFilter = ({ ...props }) => {
  const sensorr = useSensorr()

  return (
    <RuleSortableSelect
      {...props as any}
      label={emojize('☠️', 'ZNAB')}
      options={sensorr.znabs.map(({ name }) => ({ label: name, value: name }))}
      isClearable={false}
      defaultOptions={true}
      resetable={false}
    />
  )
}

export const EncodingFilter = withProps({
  label: emojize('🎥', 'Encoding'),
  options: standards.encoding.map(source => ({ label: source, value: source })),
  isClearable: false,
  defaultOptions: true,
  resetable: false,
})(RuleSortableSelect)

export const ResolutionFilter = withProps({
  label: emojize('🎞️', 'Resolution'),
  options: standards.resolution.map(source => ({ label: source, value: source })),
  isClearable: false,
  defaultOptions: true,
  resetable: false,
})(RuleSortableSelect)

export const SourceFilter = withProps({
  label: emojize('📀', 'Source'),
  options: standards.source.map(source => ({ label: source, value: source })),
  isClearable: false,
  defaultOptions: true,
  resetable: false,
})(RuleSortableSelect)

export const DubFilter = withProps({
  label: emojize('🔈', 'Dub'),
  options: standards.dub.map(source => ({ label: source, value: source })),
  isClearable: false,
  defaultOptions: true,
  resetable: false,
})(RuleSortableSelect)

export const LanguageFilter = withProps({
  label: emojize('🇺🇳', 'Language'),
  options: standards.language.map(source => ({ label: source, value: source })),
  isClearable: false,
  defaultOptions: true,
  resetable: false,
})(RuleSortableSelect)

export const FlagsFilter = withProps({
  label: emojize('🚩', 'Flags'),
  options: standards.flags.map(source => ({ label: source, value: source })),
  isClearable: false,
  defaultOptions: true,
  resetable: false,
})(RuleSortableSelect)
