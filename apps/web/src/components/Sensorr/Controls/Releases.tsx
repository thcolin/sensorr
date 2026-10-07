import { Trans, useTranslation } from 'react-i18next'
import { Button, Checkbox, Range, Warning } from '@sensorr/ui'
import i18n from '@sensorr/i18n'
import { emojize } from '@sensorr/utils'
import { EncodingFilter, ResolutionFilter, SourceFilter, DubFilter, LanguageFilter, FlagsFilter, ZNABFilter } from './Oleoo'

export const RELEASES_AREAS = `
  "head_release"
  "job"
  "size"
  "znab"
  "encoding"
  "resolution"
  "source"
  "dub"
  "language"
  "flags"
`

export const JOBS = {
  sync: emojize('🔗', 'Sync'),
  record: emojize('📹', 'Record'),
  airing: emojize('🛰️', 'Airing'),
  refine: emojize('✨', 'Refine'),
  shrink: emojize('✂️', 'Shrink'),
}

export const ReleasesToggle = ({ toggleOpen, ...props }) => {
  const { t } = useTranslation()

  return (
  <div
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gridArea: 'toggle_sub_asides_0',
    }}
  >
    <label
      sx={{
        display: 'inline-flex',
        paddingBottom: 4,
        alignItems: 'center',
        fontWeight: 'semibold',
        '>*:first-of-type': {
          flex: 1,
        },
      }}
    >
      <span>
        {t('sensorr.releases.label')}
      </span>
    </label>
    <Button {...props} variant='contain' color={'primaryDark' as any} type='button' onClick={toggleOpen}>
      <Trans t={t} i18nKey='sensorr.releases.toggle' components={[<strong />]} />
    </Button>
  </div>
  )
}

const RULE = { variant: 'code.reset', paddingX: 6, paddingY: 8, fontSize: 6, fontFamily: 'monospace', fontWeight: 'semibold', borderRadius: '2px', marginX: 8 }

const tags = (key, values) => ({
  ...(values.some(({ group }) => group === 'prefer') ? { [`release_${key}.prefer`]: values.filter(({ group }) => group === 'prefer').map(({ value }) => value).join('|') } : {}),
  ...(values.some(({ group }) => group === 'avoid') ? { [`release_${key}.avoid`]: values.filter(({ group }) => group === 'avoid').map(({ value }) => value).join('|') } : {}),
})

export const releasesFields = ({ noun, jobs }: { noun: string, jobs: (keyof typeof JOBS)[] }) => ({
  head_release: {
    initial: null,
    component: ({ ...props }) => (
      <div sx={{ paddingBottom: 4, whiteSpace: 'normal !important', '>div': { padding: 12 }, gridArea: 'head_release' }}>
        <Warning
          emoji="📀"
          title={i18n.t('sensorr.releases.title')}
          subtitle={(
            <span>
              {i18n.t('sensorr.releases.subtitle', { noun })}
              <br/>
              <span sx={{ display: 'inline-block', marginTop: 4, marginBottom: 8 }}>
                <code sx={{ ...RULE, backgroundColor: 'primaryDarkest' }}>{i18n.t('sensorr.releases.accept')}</code>
                <code sx={{ ...RULE, backgroundColor: 'error' }}>{i18n.t('sensorr.releases.filter')}</code>
                <code sx={{ ...RULE, border: '1px solid white' }}>{i18n.t('sensorr.releases.ignore')}</code>
              </span>
            </span>
          )}
        />
      </div>
    ),
  },
  size: {
    initial: [0, 50],
    serialize: (key, raw) => {
      if (raw[0] === 0 && raw[1] === 50) {
        return {}
      }

      return Array.isArray(raw) ? { [`release_size.gte`]: raw[0], ...(raw[1] === 50 ? {} : { [`release_size.lte`]: raw[1] }) } : {}
    },
    component: ({ ...props }) => (
      <Range
        {...props as any}
        min={0}
        max={50}
        marks={[...Array(50).fill(true).map((foo, value) => ({ value }))]}
        data={null}
        label={i18n.t('ui.filters.size')}
        labelize={(value) => `${value} GB`}
        value={props.value || [0, 50]}
        step={null}
      />
    )
  },
  job: {
    initial: { values: [] },
    serialize: (key, raw) => !raw?.values?.length ? {} : { 'release_from': raw?.values.join('|') },
    component: ({ ...props }) => (
      <Checkbox
        {...props as any}
        label={i18n.t('ui.filters.job')}
        options={jobs.map(value => ({ value, label: JOBS[value] }))}
        value={props.value.values}
        onChange={values => props.onChange({ ...props.value, values })}
      />
    )
  },
  znab: {
    initial: [],
    component: ZNABFilter,
    serialize: tags,
  },
  encoding: {
    initial: [],
    component: EncodingFilter,
    serialize: tags,
  },
  resolution: {
    initial: [],
    component: ResolutionFilter,
    serialize: tags,
  },
  source: {
    initial: [],
    component: SourceFilter,
    serialize: tags,
  },
  dub: {
    initial: [],
    component: DubFilter,
    serialize: tags,
  },
  language: {
    initial: [],
    component: LanguageFilter,
    serialize: tags,
  },
  flags: {
    initial: [],
    component: FlagsFilter,
    serialize: tags,
  },
})
