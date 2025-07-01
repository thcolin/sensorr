import { memo, useMemo, useRef } from 'react'
import { compose, emojize } from '@sensorr/utils'
import { Icon, Sorting, Warning, Drawer, withControls, QuerySelect } from '@sensorr/ui'
import { Policy, SENSORR_POLICY_FALLBACK } from '@sensorr/sensorr'
import { useBreakpointIndex } from '@sensorr/utils'
import { useThemeUI } from 'theme-ui'
import toast from 'react-hot-toast'
import usePortal from 'react-useportal'
import { useMoviesMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import withProps from '../enhancers/withProps'
import sensorr from '../../store/sensorr'
import { withSensorrRequest } from './withSensorrRequest'
import { EncodingFilter, ResolutionFilter, SourceFilter, DubFilter, LanguageFilter, FlagsFilter, ZNABFilter } from './Controls/Oleoo'
import { Progress } from './Controls/Progress'
import { Release } from './Release'

const UISensorr = compose(
  withSensorrRequest(),
  withControls({
    level: 1,
    useStatistics: () => ({}),
    layout: {
      nav: {
        display: 'grid',
        gridTemplateColumns: ['minmax(0, 1fr)', 'minmax(0, 4fr) minmax(0, 1fr) min-content'],
        gridTemplateRows: 'auto',
        gap: '0em',
        gridTemplateAreas: [
          `
            "terms"
            "years"
            "toggle"
          `,
          `"terms years toggle"`
        ],
      },
      aside: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gridTemplateRows: 'auto',
        gap: '2em',
        gridTemplateAreas: `
          "head"
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
      toggle: ({ toggleOpen, fields, values, handleChange, ongoing, ...props }) => {
        return (
          <div
            sx={{
              gridArea: 'toggle',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '10em',
              '>div': {
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                '>strong': {
                  fontSize: 5,
                  fontWeight: 'strong',
                  marginTop: 6,
                  marginLeft: 3,
                },
                '>label': {
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 3,
                  paddingRight: 0,
                  paddingY: 4,
                  '>select': {
                    variant: 'select.reset',
                    color: 'whitePure',
                    fontWeight: 'semibold',
                    textAlign: 'center',
                    fontSize: 5,
                    paddingY: '3px',
                    paddingX: '6px',
                    backgroundColor: 'accentDarkest',
                    borderRadius: '2px',
                  },
                },
              },
              '>button': {
                variant: 'button.reset',
                height: '100%',
                backgroundColor: 'accentDark',
                paddingX: 4,
              },
            }}
          >
            <div title="Sensorr will apply selected policy to sort and filter releases">
              <strong>Policy</strong>
              <label>
                <select
                  value={values.policy?.value}
                  onChange={e => {
                    const policy = new Policy(!e.target.value ? SENSORR_POLICY_FALLBACK : e.target.value, sensorr.policies)

                    handleChange({
                      policy: { label: e.target.value, value: e.target.value },
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

                    if (!e.target.value) {
                      toggleOpen(e)
                    }
                  }}
                >
                  <option value=''>(blank)</option>
                  <hr/>
                  {sensorr.policies.map(policy => (
                    <option value={policy.name}>{policy.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <button onClick={toggleOpen}>
              <Icon value='filters' height='1em' width='1em' />
            </button>
          </div>
        )
      },
    },
    fields: {
      terms: {
        initial: [],
        serialize: (key, values) => ({ [key]: values.filter(({ disabled }) => !disabled).map(({ value }) => value) }),
        component: ({ style, ...props }) => (
          <div title="Sensorr will search for all selected terms on configured indexers" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', paddingLeft: 4, borderRight: ['unset', '2px solid'], borderBottom: ['2px solid', 'unset'], borderColor: ['accentDark', 'accentDark'], ...style }}>
            <strong sx={{ fontSize: 5, fontWeight: 'strong', marginTop: 6 }}>Terms</strong>
            <div sx={{ flex: 1, marginBottom: 8 }}><QueryInput direction='row' {...props} /></div>
          </div>
        ),
      },
      years: {
        initial: [],
        serialize: (key, values) => ({ [key]: values.filter(({ disabled }) => !disabled).map(({ value }) => value) }),
        component: ({ style, ...props }) => (
          <div title="Sensorr will filter releases with selected years" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', paddingLeft: 4, borderRight: ['unset', '2px solid'], borderBottom: ['2px solid', 'unset'], borderColor: ['accentDark', 'accentDark'], ...style }}>
            <strong sx={{ fontSize: 5, fontWeight: 'strong', marginTop: 6 }}>Years</strong>
            <div sx={{ flex: 1, marginBottom: 8 }}><QueryInput direction='row' {...props} /></div>
          </div>
        ),
      },
      policy: {
        initial: null,
        serialize: (key, { value }) => ({ [key]: value }),
        component: () => null,
      },
      head: {
        initial: null,
        component: ({ ...props }) => (
          <div sx={{ paddingBottom: 4, whiteSpace: 'normal !important', '>div': { padding: 12 } }}>
            <Warning
              emoji="🚨"
              title="Policy"
              subtitle={(
                <span>
                  Narrow your releases search with custom policy, <span style={{ textDecoration: 'underline' }}>define</span> and <span style={{ textDecoration: 'underline' }}>order</span> each rule tag according to your preferences
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
  const { setMovieMetadata, metadata: { [movie.id]: metadata = {} } } = useMoviesMetadataContext() as any
  console.log(metadata)
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
    <div sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: ['visible', 'hidden'] }}>
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
                  await setMovieMetadata(movie.id, 'release', { ...release, from: 'record', job: 'manual', proposal: true, choice: true })
                } catch (err) {
                  console.warn(err)
                  toast.error('Error while processing release')
                }
              }}
              banned={(metadata?.banned_releases || []).includes(release?.title)}
              ban={() => setMovieMetadata(
                movie?.id,
                'banned_releases',
                (metadata?.banned_releases || []).includes(release?.title) ?
                  [...(metadata?.banned_releases || [])].filter(r => r !== release?.title) :
                  [...(metadata?.banned_releases || []), release?.title]
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
})

const UISensorrWrapper = ({ entity, metadata, onChange = null, button = null, loading = false, portal = null, ...props }) => {
  const { Portal, closePortal, togglePortal, isOpen: open } = portal || usePortal({ closeOnOutsideClick: false, closeOnEsc: false })

  if (props.setPortalToggle) {
    props.setPortalToggle(togglePortal)
  }

  return (
    <>
      {!!button && (
        <button onClick={closePortal} sx={{ variant: 'button.reset' }} disabled={!entity?.id || loading}>
          {button}
        </button>
      )}
      <Portal>
        <Drawer close={closePortal} open={open} height='85vh'>
          <div sx={UISensorrWrapper.styles.container}>
            <div sx={UISensorrWrapper.styles.head}>
              <h4>Releases</h4>
            </div>
            <UISensorr
              metadata={metadata}
              onChange={onChange}
              entity={!loading && entity?.id ? entity : {}}
              ready={!loading && entity?.id}
              toggle={togglePortal}
            />
          </div>
        </Drawer>
      </Portal>
    </>
  )
}

UISensorrWrapper.styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: '85vh',
    width: '100%',
    backgroundColor: 'white',
    overflow: ['scroll', 'unset'],
    '>nav >div': {
      backgroundColor: 'accent',
      paddingX: 12,
      height: ['auto', '4.75rem'],
    },
  },
  head: {
    display: 'flex',
    position: ['sticky', 'relative'],
    top: ['0px', 'unset'],
    zIndex: [5, 'unset'],
    width: '100%',
    backgroundColor: 'primary',
    paddingX: 0,
    paddingY: 2,
    '>h4': {
      variant: 'heading.default',
      color: 'whitePure',
      margin: 12,
    },
  },
}

export const Sensorr = memo(UISensorrWrapper)

const UIQueryInput = ({ value, onChange, direction = 'row', ...props }) => {
  const { theme } = useThemeUI()
  const breakpoint = useBreakpointIndex()

  const ref = useRef()
  const styles = useMemo(() => ({
    container: (style) => ({
      ...style,
      flex: 1,
      overflow: 'hidden',
      margin: '0px',
    }),
    control: (style) => ({
      ...style,
      height: '100%',
      backgroundColor: 'transparent',
      border: 'none',
      boxShadow: 'none',
      cursor: 'text',
      minHeight: 'unset',
      '>div:first-of-type': {
        display: 'flex',
        padding: '0px 0.25em',
      }
    }),
    input: (style) => ({
      ...style,
      flex: 1,
      color: 'inherit',
      fontSize: '1em',
      textAlign: 'left',
      marginLeft: '0.25em',
      '>div>input': {
        fontSize: '0.875em !important',
        fontFamily: (theme.fonts as any).body,
      },
    }),
    valueContainer: (style) => ({
      ...style,
      height: '100%',
      padding: ['0.75em 0em 0.25em !important', '0em !important'][breakpoint],
      flexWrap: { row: 'nowrap', column: 'wrap' }[direction] || 'wrap',
      ...({
        row: {
          overflowX: 'auto',
        },
        column: {
          overflow: 'auto',
          maxHeight: '8em',
        },
      }[direction]),
    }),
    multiValue: (style, { data: { pinned, disabled } }) => ({
      ...style,
      position: 'relative',
      flexShrink: 0,
      backgroundColor: pinned ? disabled ? theme.rawColors['gray-300'] : theme.rawColors.accentDarkest : theme.rawColors.accentDark,
      color: theme.rawColors.whitePure,
      border: pinned ? `1px solid ${disabled ? theme.rawColors['gray-300'] : theme.rawColors.accentDarkest}` : 'none',
      marginRight: '0.25em',
    }),
    multiValueLabel: (style, { data: { pinned, disabled } }) => ({
      ...style,
      color: theme.rawColors.whitePure,
      fontSize: '0.875em',
      fontFamily: (theme.fonts as any).body,
      fontWeight: 600,
      paddingRight: pinned ? '6px' : '0px',
    }),
    multiValueRemove: (style, { data: { pinned } }) => (pinned ? {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      cursor: 'pointer',
      opacity: 0,
    } : {
      ...style,
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      borderLeft: `1px solid ${theme.rawColors.accent}`,
      marginLeft: '0.25em',
      cursor: 'pointer',
      ':hover': {
        backgroundColor: theme.rawColors.accentDarker,
      },
    }),
  }), [theme.rawColors, theme.fonts, breakpoint])

  return (
    <div
      sx={{
        display: 'flex',
        flexDirection: direction,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <QuerySelect
        ref={ref}
        options={[]}
        isClearable={false}
        defaultOptions={true}
        resetable={false}
        direction='column'
        value={value}
        onChange={onChange}
        styles={styles}
      />
    </div>
  )
}

const QueryInput = memo(UIQueryInput)
