import { memo, useCallback, useMemo } from 'react'
import { Policy } from '@sensorr/sensorr'
import { emojize } from '@sensorr/utils'
import { Controls, Select, QuerySelect, Warning } from '@sensorr/ui'
import { useSensorr, SENSORR_POLICIES } from '../../../store/sensorr'
import withProps from '../../../components/enhancers/withProps'

const UIMetadata = ({ entity, metadata, onChange, button = null, loading = false, ...props }) => {
  const policy = new Policy(metadata.policy, SENSORR_POLICIES)
  const sensorr = useSensorr()
  const [query, defaultQuery] = sensorr.useQuery(entity, metadata.query)

  const values = useMemo(() => ({
    policy: { value: policy.name, label: policy.name },
    terms: [
      ...defaultQuery?.terms?.map(term => ({ value: term, label: term, pinned: true, disabled: !query?.terms?.includes(term) })),
      ...query?.terms?.filter(term => !defaultQuery?.terms?.includes(term)).map(term => ({ value: term, label: term })),
    ],
    years: [
      ...defaultQuery?.years?.map(term => ({ value: term, label: term, pinned: true, disabled: !query?.years?.includes(term) })),
      ...query?.years?.filter(term => !defaultQuery?.years?.includes(term)).map(term => ({ value: term, label: term })),
    ],
  }), [policy, defaultQuery, query])

  const handleChange = useCallback(({ policy, terms, years }) => {
    onChange('policy', policy.value)
    onChange('query', {
      ...defaultQuery,
      terms: terms.filter(({ disabled }) => !disabled).map(({ value }) => value),
      years: years.filter(({ disabled }) => !disabled).map(({ value }) => value),
    })
  }, [defaultQuery])

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
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'auto',
      gap: '2em',
      gridTemplateAreas: `
        "head"
        "policy"
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
            emoji="🎟"
            title="Sensorr movie preferences"
            subtitle={(
              <span>
                You can make changes to Sensorr query <strong>search terms</strong>, <strong>years filtering</strong> and <strong>policy</strong> to refine releases results
                <br/>
                <small><em>Sensorr use your preferences in daily record jobs</em></small>
              </span>
            )}
          />
        </div>
      ),
    },
    policy: {
      initial: null,
      component: withProps({
        label: emojize('🚨', 'Policy'),
        menuPlacement: 'auto',
        options: SENSORR_POLICIES.map(policy => ({ value: policy.name, label: policy.name })),
        closeMenuOnSelect: true,
        isSearchable: false,
        isClearable: false,
        defaultOptions: true,
        resetable: false,
        sx: {
          fontFamily: 'monospace',
          fontWeight: 'semibold',
        },
      })(Select),
    },
    terms: {
      initial: [],
      component: withProps({
        label: emojize('✏️', 'Terms'),
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
  }
})(Controls)

export const Metadata = memo(UIMetadata)
