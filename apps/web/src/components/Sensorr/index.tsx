import { memo, useMemo } from 'react'
import { compose, emojize } from '@sensorr/utils'
import { Icon, Sorting, Warning, withControls } from '@sensorr/ui'
import { EncodingFilter, ResolutionFilter, SourceFilter, DubFilter, LanguageFilter, FlagsFilter, ZNABFilter } from './Controls/Oleoo'
import { Progress } from './Controls/Progress'
import { Release } from './Release'
import withProps from '../enhancers/withProps'
import { withSensorrRequest } from './withSensorrRequest'

const UISensorr = compose(
  withSensorrRequest(),
  withControls({
    useStatistics: () => ({}),
    layout: {
      nav: {
        display: 'grid',
        gridTemplateColumns: '0fr 0fr 1fr',
        gridTemplateRows: 'auto',
        gap: '3em',
        gridTemplateAreas: `"toggle refresh results"`,
      },
      aside: {
        display: 'grid',
        gridTemplateColumns: '1fr',
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
      results: Progress,
      refresh: ({ progress, refresh, style, ...props }) => (
        <button sx={{ variant: 'button.reset', minWidth: '3em' }} style={style} onClick={refresh} disabled={progress.loading}>
          <Icon value={progress.loading ? 'spinner' : 'refresh'} sx={progress.loading ? { height: '1.5em', width: '1.5em' } : { height: '1em', width: '1em' }} />
        </button>
      ),
      toggle: ({ toggleOpen, fields, values, refresh, progress, ...props }) => (
        <button
          {...props}
          type='button'
          onClick={toggleOpen}
          sx={{
            variant: 'button.reset',
            display: 'flex',
            alignItems: 'center',
            '>svg': {
              height: '1em',
              marginRight: 6,
            },
          }}
        >
          <Icon value='filters' /> Show Policy
        </button>
      ),
    },
    fields: {
      head: {
        initial: null,
        component: ({ ...props }) => (
          <div sx={{ paddingBottom: 4, whiteSpace: 'normal !important', '>div': { padding: 12 } }}>
            <Warning
              emoji="🚨"
              title="Policy"
              subtitle={(
                <span>
                  Narrow your releases search with policy,
                  <br/>
                  define and <span style={{ textDecoration: 'underline' }}>order</span> each rule tag by preferences :
                  <br/>
                  <span sx={{ display: 'inline-block', marginY: 8 }}>
                    <code sx={{ variant: 'code.reset', marginX: 8 }}>👍 prefer</code> <code sx={{ variant: 'code.reset', marginX: 8 }}>🚨 avoid</code> <code sx={{ variant: 'code.reset', marginX: 8 }}>🔕 n/a</code>
                  </span>
                  <br/>
                  <small><em>Use another policy for this movie with <code sx={{ variant: 'code.reset', marginX: 6, fontStyle: 'normal' }}><strong>Sensorr</strong></code> button</em></small>
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
)(({ override, entities = [], ...props }) => {
  const statistics = useMemo(() => ({
    lowest: {
      score: (entities.filter(release => release.valid).sort((a, b) => b.score - a.score).pop() || { score: 0 }).score,
      peers: (entities.filter(release => release.valid).sort((a, b) => b.peers - a.peers).pop() || { peers: 0 }).peers,
      size: (entities.filter(release => release.valid).sort((a, b) => b.size - a.size).pop() || { size: 0 }).size,
    },
    highest: {
      score: (entities.filter(release => release.valid).sort((a, b) => a.score - b.score).pop() || { score: 0 }).score,
      peers: (entities.filter(release => release.valid).sort((a, b) => a.peers - b.peers).pop() || { peers: 0 }).peers,
      size: (entities.filter(release => release.valid).sort((a, b) => a.size - b.size).pop() || { size: 0 }).size,
    },
  }), [entities])

  if (override) {
    return override
  }

  return (
    <div sx={{ flexGrow: 1, flexShrink: 1, height: '100%', overflowX: 'hidden', overflowY: 'auto' }}>
      {entities.map(release => (
        <Release key={release.link} entity={release} statistics={statistics} />
      ))}
    </div>
  )
})

const UISensorrWrapper = (props) => (
  <div sx={UISensorrWrapper.styles.element}>
    <UISensorr {...props} />
  </div>
)

UISensorrWrapper.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: '60vh',
  },
}

export const Sensorr = memo(UISensorrWrapper)
