import { useCallback, useMemo } from 'react'
import oleoo from 'oleoo'
import { SortableSelect } from '@sensorr/ui'
import { emojize } from '@sensorr/utils'
import { useSensorr } from '../../../store/sensorr'
import { withProps } from '../../enhancers/withProps'

const RuleSortableSelect = ({ onChange, options, requirable = false, ...props }) => {
  const value = useMemo(() => {
    const prefer = props.value.filter(v => v.group === 'prefer')
    const avoid = props.value.filter(v => v.group === 'avoid')
    const ignore = [
      ...props.value.filter(v => !v.group && v.required),
      ...options
        .filter(option => !props.value.find(v => v.value === option.value && (v.group || v.required)))
        .map((option) => ({ ...option, group: null })),
    ]

    return [
      ...(prefer.length ? [{ label: '⭐' }, ...prefer, { separator: true }] : []),
      ...(avoid.length ? [{ label: '⛔' }, ...avoid, { separator: true }] : []),
      ...(ignore.length ? [{ label: '🔕' }, ...ignore, { separator: true }] : []),
    ]
  }, [props.value, options])

  const handleChange = useCallback((values, { action, removedValue } = { action: null, removedValue: null }) => {
    switch (action) {
      case 'toggle-require-value':
        onChange(values)
        return
      case 'remove-value':
      case 'pop-value':
        onChange([
          ...values.filter(v => v.value),
          {
            ...removedValue,
            ...({
              [null as any]: {
                group: 'prefer',
              },
              prefer: {
                group: 'avoid',
                required: false,
              },
              avoid: {
                group: null,
                required: false,
              },
            }[removedValue.group]),
          }
        ])
        return
      default:
        onChange(values.filter(v => v.value))
        return
    }
  }, [onChange])

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
