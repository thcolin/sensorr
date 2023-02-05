import { memo, useMemo } from 'react'
import { compose, emojize } from '@sensorr/utils'
import { Icon, Sorting, Warning, Pane, withControls, Select, QuerySelect } from '@sensorr/ui'
import { Policy } from '@sensorr/sensorr'
import toast from 'react-hot-toast'
import usePortal from 'react-useportal'
import { useMoviesMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import withProps from '../enhancers/withProps'
import { withSensorrRequest } from './withSensorrRequest'
import { EncodingFilter, ResolutionFilter, SourceFilter, DubFilter, LanguageFilter, FlagsFilter, ZNABFilter } from './Controls/Oleoo'
import { Progress } from './Controls/Progress'
import { Release } from './Release'
import sensorr from '../../store/sensorr'

const UISensorr = compose(
  withSensorrRequest(),
  withControls({
    title: 'Releases',
    level: 1,
    useStatistics: () => ({}),
    watch: [['policy'], (next, onChange) => {
      const policy = new Policy(next.policy.value, sensorr.policies)

      onChange({
        ...next,
        sorting: {
          value: policy.sorting,
          sort: policy.descending,
        },
        ...Object.keys(policy.prefer).reduce((acc, key) => ({
          ...acc,
          [key]: [
            ...policy.prefer[key].map(value => ({ value, label: value, group: 'prefer' })),
            ...policy.avoid[key].map(value => ({ value, label: value, group: 'avoid' })),
          ],
        }), {}),
        ...Object.keys(policy.avoid).reduce((acc, key) => ({
          ...acc,
          [key]: [
            ...policy.prefer[key].map(value => ({ value, label: value, group: 'prefer' })),
            ...policy.avoid[key].map(value => ({ value, label: value, group: 'avoid' })),
          ],
        }), {}),
      }, false)
    }],
    layout: {
      nav: {
        display: 'grid',
        gridTemplateColumns: '1fr minmax(0, 2fr) minmax(0, 1fr) min-content min-content',
        gridTemplateRows: 'auto',
        gap: '3em',
        gridTemplateAreas: `"title terms years refresh toggle"`,
      },
      aside: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gridTemplateRows: 'auto',
        gap: '2em',
        gridTemplateAreas: `
          "head"
          "policy"
          "sorting"
          "znab"
          "encoding"
          "resolution"
          "source"
          "dub"
          "language"
          "flags"
        `,
      },
    },
    components: {
      results: () => null,
      refresh: ({ ongoing, refresh, style, ...props }) => (
        <button sx={{ variant: 'button.reset', minWidth: '3em' }} style={style} onClick={refresh} disabled={ongoing}>
          <Icon value={ongoing ? 'spinner' : 'refresh'} color='gray-100' sx={ongoing ? { height: '1.5em', width: '1.5em' } : { height: '1em', width: '1em' }} />
        </button>
      ),
      toggle: ({ toggleOpen, fields, values, refresh, ongoing, ...props }) => (
        <button
          {...props}
          type='button'
          onClick={toggleOpen}
          sx={{
            variant: 'button.reset',
            display: 'flex',
            alignItems: 'center',
            minWidth: '8em',
            '>svg': {
              height: '1em',
              width: '1em',
              marginRight: 6,
            },
          }}
        >
          <Icon value='filters' />
          <span sx={{ textTransform: 'capitalize' }}>{values.policy?.label ? `"${values.policy?.label}" Policy` : 'Customize Policy'}</span>
        </button>
      ),
    },
    fields: {
      terms: {
        initial: [],
        serialize: (key, values) => ({ [key]: values.filter(({ disabled }) => !disabled).map(({ value }) => value) }),
        component: ({ style, ...props }) => (
          <div style={{ display: 'flex', alignItems: 'center', ...style }}>
            <QuerySelect
              label='🔍'
              options={[]}
              isClearable={false}
              defaultOptions={true}
              resetable={false}
              direction='row'
              {...props}
             />
          </div>
        ),
      },
      years: {
        initial: [],
        serialize: (key, values) => ({ [key]: values.filter(({ disabled }) => !disabled).map(({ value }) => value) }),
        component: ({ style, ...props }) => (
          <div style={{ display: 'flex', alignItems: 'center', ...style }}>
            <QuerySelect
              label='📅'
              options={[]}
              isClearable={false}
              defaultOptions={true}
              resetable={false}
              direction='row'
              {...props}
             />
          </div>
        ),
      },
      policy: {
        initial: null,
        serialize: (key, { value }) => ({ [key]: value }),
        component: ({ style, ...props }) => (
          <div style={style}>
            <Select
              label={emojize('🚨', 'Default Policy')}
              menuPlacement={'auto'}
              options={sensorr.policies.map(policy => ({ value: policy.name, label: policy.name }))}
              closeMenuOnSelect={true}
              isSearchable={false}
              isClearable={false}
              defaultOptions={true}
              resetable={false}
              sx={{
                fontFamily: 'monospace',
                fontWeight: 'semibold',
              }}
              {...props}
             />
          </div>
        ),
      },
      head: {
        initial: null,
        component: ({ ...props }) => (
          <div sx={{ paddingBottom: 4, whiteSpace: 'normal !important', '>div': { padding: 12 } }}>
            <Warning
              emoji="🚨"
              title="Custom Policy"
              subtitle={(
                <span>
                  Narrow your releases search with <strong>temporary</strong> policy,
                  <br/>
                  <span style={{ textDecoration: 'underline' }}>define</span> and <span style={{ textDecoration: 'underline' }}>order</span> each rule tag by your preferences
                  <br/>
                  <span sx={{ display: 'inline-block', marginTop: 4, marginBottom: 8 }}>
                    <code sx={{ variant: 'code.reset', paddingX: 6, paddingY: 8, fontSize: 6, fontFamily: 'monospace', fontWeight: 'semibold', backgroundColor: 'primaryDarkest', borderRadius: '2px', marginX: 8 }}>⭐ PREFER</code>
                    <code sx={{ variant: 'code.reset', paddingX: 6, paddingY: 8, fontSize: 6, fontFamily: 'monospace', fontWeight: 'semibold', backgroundColor: 'error', borderRadius: '2px', marginX: 8 }}>⛔ AVOID</code>
                    <code sx={{ variant: 'code.reset', paddingX: 6, paddingY: 8, fontSize: 6, fontFamily: 'monospace', fontWeight: 'semibold', border: '1px solid white', borderRadius: '2px', marginX: 8 }}>🔕 N/A</code>
                  </span>
                </span>
              )}
            />
          </div>
        ),
      },
      sorting: {
        initial: { value: 'seeders', sort: true },
        component: withProps({
          display: 'radio',
          label: emojize('💈', 'Sorting'),
          options: [{ label: emojize('🌍', 'Seeders'), value: 'seeders' }, { label: emojize('📦', 'Size'), value: 'size' }],
        })(Sorting),
        serialize: (key, { value: sorting, sort: descending }) => ({ sorting, descending }),
      },
      znab: {
        initial: [],
        component: ZNABFilter,
        serialize: (key, values) => ({ [key]: values }),
      },
      encoding: {
        initial: [],
        component: EncodingFilter,
        serialize: (key, values) => ({ [key]: values }),
      },
      resolution: {
        initial: [],
        component: ResolutionFilter,
        serialize: (key, values) => ({ [key]: values }),
      },
      source: {
        initial: [],
        component: SourceFilter,
        serialize: (key, values) => ({ [key]: values }),
      },
      dub: {
        initial: [],
        component: DubFilter,
        serialize: (key, values) => ({ [key]: values }),
      },
      language: {
        initial: [],
        component: LanguageFilter,
        serialize: (key, values) => ({ [key]: values }),
      },
      flags: {
        initial: [],
        component: FlagsFilter,
        serialize: (key, values) => ({ [key]: values }),
      },
    },
  }),
)(({ override, movie, entities = [], controls, progress, toggle, ...props }) => {
  const { proceedMovieRelease } = useMoviesMetadataContext() as any
  const statistics = useMemo(() => ({
    lowest: {
      score: ([...entities].sort((a, b) => b.score - a.score).pop() || { score: 0 }).score,
      peers: ([...entities].sort((a, b) => b.peers - a.peers).pop() || { peers: 0 }).peers,
      size: ([...entities].sort((a, b) => b.size - a.size).pop() || { size: 0 }).size,
    },
    highest: {
      score: ([...entities].sort((a, b) => a.score - b.score).pop() || { score: 0 }).score,
      peers: ([...entities].sort((a, b) => a.peers - b.peers).pop() || { peers: 0 }).peers,
      size: ([...entities].sort((a, b) => a.size - b.size).pop() || { size: 0 }).size,
    },
  }), [entities])

  return (
    <div sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <Progress progress={progress} />
      {override || (
        <div sx={{ flexGrow: 1, flexShrink: 1, height: '100%', overflowX: 'hidden', overflowY: 'auto', color: 'text' }}>
          {entities.map(release => (
            <Release
              key={release.link}
              entity={release}
              statistics={statistics}
              downloadable={true}
              proceed={async (release, choice) => {
                toggle()

                try {
                  await proceedMovieRelease(movie.id, release, choice)
                } catch (err) {
                  console.warn(err)
                  toast.error('Error while processing release')
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
})

const UISensorrWrapper = ({ entity, metadata, onChange = null, button = null, loading = false, portal = null, ...props }) => {
  const { Portal, togglePortal, isOpen: open } = portal || usePortal({ closeOnOutsideClick: false, closeOnEsc: false })

  if (props.setPortalToggle) {
    props.setPortalToggle(togglePortal)
  }

  return (
    <>
      {!!button && (
        <button onClick={togglePortal} sx={{ variant: 'button.reset' }} disabled={!entity?.id || loading}>
          {button}
        </button>
      )}
      <Portal>
        <Pane position='bottom' toggleOpen={togglePortal} open={open}>
          <div sx={UISensorrWrapper.styles.container}>
            <UISensorr
              metadata={metadata}
              onChange={onChange}
              entity={!loading && entity?.id ? entity : {}}
              ready={!loading && entity?.id}
              toggle={togglePortal}
            />
          </div>
        </Pane>
      </Portal>
    </>
  )
}

UISensorrWrapper.styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: '60vh',
    width: '100%',
    backgroundColor: 'white',
  },
}

export const Sensorr = memo(UISensorrWrapper)
