import { memo, useCallback, useMemo } from 'react'
import { Policy } from '@sensorr/sensorr'
import { emojize } from '@sensorr/utils'
import { Controls, Select, QuerySelect, Warning } from '@sensorr/ui'
import { useSensorr } from '../../../store/sensorr'
import withProps from '../../../components/enhancers/withProps'

const UIMetadata = ({ entity, metadata, onChange, button = null, loading = false, ...props }) => {
  const sensorr = useSensorr()
  // const policy = new Policy(metadata.policy, sensorr.policies)
  const query = sensorr.getQuery(entity, metadata.query)

  const values = useMemo(() => ({
    // policy: { value: policy.name, label: policy.name },
    terms: [
      ...(query?._defaults?.terms || []).map(term => ({ value: term, label: term, pinned: true, disabled: !query?.terms?.includes(term) })),
      ...(query?.titles || []).filter(title => !(query?._defaults?.terms || []).includes(title)).map(title => ({ value: title, label: title, pinned: true, disabled: !(query?.terms || []).includes(title) })),
      ...(query?.terms || []).filter(term => !(query?._defaults?.terms || []).includes(term) && !(query?.titles || []).includes(term)).map(term => ({ value: term, label: term })),
    ],
    years: [
      ...(query?._defaults?.years || []).map(term => ({ value: term, label: term, pinned: true, disabled: !query?.years?.includes(term) })),
      ...(query?.years || []).filter(term => !query?._defaults?.years?.includes(term)).map(term => ({ value: term, label: term })),
    ],
  }), [query?._defaults, query?.titles, query])

  const handleChange = useCallback(({ terms, years }) => {
    // onChange('policy', policy.value)
    onChange('query', {
      ...query?._defaults,
      terms: terms.filter(({ disabled }) => !disabled).map(({ value }) => value),
      years: years.filter(({ disabled }) => !disabled).map(({ value }) => value),
    })
  }, [query?._defaults, query?.titles])

  return (
    <ControlsMetadata
      loading={loading}
      values={values as any}
      onChange={handleChange}
      statistics={{}}
      components={props.components || {
        toggle: ({ toggleOpen }) => (
          <button onClick={toggleOpen} sx={{ variant: 'button.reset' }} disabled={!entity.id || loading}>
            {button}
          </button>
        )
      }}
    />
  )
}

const ControlsMetadata = withProps({
  layout: {
    aside: {
      position: 'right',
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr)',
      gridTemplateRows: 'auto',
      gap: '2em',
      gridTemplateAreas: `
        "head"
        "terms"
        "years"
      `,
    },
  },
  fields: {
    head: {
      initial: null,
      component: () => (
        <div sx={{ paddingBottom: 4, whiteSpace: 'normal !important', '>div': { padding: 12 } }}>
          <Warning
            emoji="💬"
            title="Sensorr movie query"
            subtitle={(
              <span>
                You can make changes to Sensorr default query <strong>search terms</strong>, <strong>years filtering</strong> and <strong>policy</strong> to refine releases results
                <br/>
                <small><em>Sensorr will use your preferences in daily record jobs</em></small>
              </span>
            )}
          />
        </div>
      ),
    },
    terms: {
      initial: [],
      component: withProps({
        label: emojize('🔍', 'Terms'),
        options: [],
        isClearable: false,
        defaultOptions: true,
        resetable: false,
      })(QuerySelect),
    },
    years: {
      initial: [],
      component: withProps({
        label: emojize('📅', 'Years'),
        options: [],
        isClearable: false,
        defaultOptions: true,
        resetable: false,
      })(QuerySelect),
    },
    // policy: {
    //   initial: null,
    //   component: withProps({
    //     label: emojize('🚨', 'Policy'),
    //     menuPlacement: 'top',
    //     options: SENSORR_POLICIES.map(policy => ({ value: policy.name, label: policy.name })),
    //     closeMenuOnSelect: true,
    //     isSearchable: false,
    //     isClearable: false,
    //     defaultOptions: true,
    //     resetable: false,
    //     sx: {
    //       fontFamily: 'monospace',
    //       fontWeight: 'semibold',
    //     },
    //   })(Select),
    // },
  }
})(Controls)

export const Metadata = memo(UIMetadata)
