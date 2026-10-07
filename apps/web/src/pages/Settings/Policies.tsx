import { forwardRef, useCallback, useMemo, useRef, useState } from 'react'
import { Button, Icon, Select } from '@sensorr/ui'
import { useOutletContext } from 'react-router-dom'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Controller, useFieldArray, UseFieldArrayReturn, useForm, UseFormReturn } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Trans, useTranslation } from 'react-i18next'
import { useConfigContext } from '../../contexts/Config/Config'
import { useDeviceContext } from '../../contexts/Device/Device'
import Body from '../../layout/Body/Body'
import { DubFilter, EncodingFilter, FlagsFilter, LanguageFilter, ResolutionFilter, SourceFilter, ZNABFilter } from '../../components/Sensorr/Controls/Oleoo'
import { Release, ReleaseTag, statisticsOf } from '../../components/Sensorr/Release'
import { emojize, languages, useTitle } from '@sensorr/utils'
import { rankOf, ranked, unranked } from '@sensorr/sensorr'
import { sandboxOf, summaryOf } from './sandbox'

const SUMMARY = {
  cursor: 'pointer',
  paddingX: 3,
  paddingY: 7,
  '>span': {
    fontFamily: 'monospace',
    fontWeight: 'semibold',
    fontSize: 5,
    marginLeft: 8,
  },
}

export const policiesOf = (config) => (config.get('policies') || []).map(policy => ({ ...policy, oldName: policy.name, removed: false }))

export const PoliciesIntro = () => {
  const { t } = useTranslation()
  return <>{t('settings.policies.intro')}</>
}

export const PoliciesFields = ({ form, onSubmit, children, examples = [], guard = false }) => {
  const { t } = useTranslation()
  const policies = useFieldArray({ name: 'policies', control: form.control })
  const policy = useForm({ defaultValues: { name: '', sorting: 'size', descending: false, require: {}, prefer: {}, avoid: {} } })

  const onAppend = useCallback((values) => {
    policies.append(values)
    policy.reset()
  }, [policies.append, policy.reset])

  return (
    <>
      <form onSubmit={policy.handleSubmit(onAppend)}>
        <div sx={{ display: 'flex', flexDirection: 'column', paddingTop: 8 }}>
          <PolicySettings form={policy} siblings={form.watch('policies')} behavior='create' />
        </div>
      </form>
      {!!examples.length && (
        <div sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingTop: 6 }}>
          <small>{t('settings.policies.examples')}</small>
          {examples.map((example) => (
            <Button
              key={example.name}
              type='button'
              variant='outline'
              color='gray'
              disabled={(form.watch('policies') || []).some(({ name }) => name === example.name)}
              onClick={() => policies.append(example)}
            >
              + {example.name}
            </Button>
          ))}
        </div>
      )}
      <hr sx={{ variant: 'hr.default', marginY: 6, marginX: '25%' }}></hr>
      <form sx={{ display: 'flex', flexDirection: 'column' }} onSubmit={form.handleSubmit((values) => (guard && policy.getValues('name')) ? toast.error(t('settings.policies.pending')) : onSubmit(values))}>
        <SortablePolicies
          policies={policies}
          form={form}
          onSortEnd={({ from, to }) => {
            if (from === 0 || to === 0) {
              toast.success(t('settings.policies.newDefault', { name: (policies.fields[to === 0 ? from : to] as any).name }))
            }

            policies.swap(from, to)
          }}
        />
        {children}
      </form>
    </>
  )
}

// A policy of the form, saved or not, ranking the sample releases
const PolicySandbox = ({ form, prefix }) => {
  const { t } = useTranslation()
  const { device } = useDeviceContext()
  const { config } = useConfigContext()
  const [open, setOpen] = useState(false)
  const policy = prefix ? form.watch(prefix) : form.watch()
  const znabs = (config.get('znabs') || []).filter((znab) => !znab.disabled).map((znab) => znab.name)
  const key = JSON.stringify([policy, znabs])
  const releases = useMemo(() => sandboxOf(policy, znabs), [key])
  const statistics = useMemo(() => statisticsOf(releases), [releases])
  const summary = summaryOf(releases)

  return (
    <details open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)} sx={PolicySandbox.styles.element}>
      <summary>
        <span>{t('settings.policies.sandbox.title')}</span>
        <small>
          <span><Trans t={t} i18nKey='settings.policies.sandbox.subtitle' components={[<em />]} /></span>
          <ReleaseTag title={t('settings.policies.sandbox.valid')}><code>⭐ {summary.valid}</code></ReleaseTag>
          <ReleaseTag title={t('settings.policies.sandbox.withdrawn')}><code>🚨 {summary.withdrawn}</code></ReleaseTag>
          <ReleaseTag title={t('settings.policies.sandbox.rejected')}><code>🗑️ {summary.rejected}</code></ReleaseTag>
        </small>
      </summary>
      {open && (
        <div>
          <div sx={PolicySandbox.styles.releases}>
            {releases.map((release) => (
              <Release
                key={release.id}
                entity={release}
                statistics={statistics}
                bars={true}
                display={device === 'mobile' ? 'column' : 'row'}
                actions={false}
                note={[release === summary.pick && t('settings.policies.sandbox.picked'), release.goal && t('settings.policies.sandbox.goal')].filter(Boolean).join(' · ') || null}
              />
            ))}
          </div>
        </div>
      )}
    </details>
  )
}

// Under Rules in the box of a policy, whose `>details >div` rules it undoes
PolicySandbox.styles = {
  element: {
    borderTop: '1px solid',
    borderColor: 'grayDark',
    '>summary': {
      position: 'relative',
      '>small': {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
        position: ['static', 'absolute'],
        top: '50%',
        right: 3,
        transform: ['none', 'translateY(-50%)'],
        marginTop: [6, '0px'],
        fontVariantNumeric: 'tabular-nums',
        '>span:first-of-type': {
          color: 'grayDarker',
          fontFamily: 'body',
          marginRight: 4,
        },
      },
    },
    // Settings boxes every `section code`, the release search leaves its titles and reasons bare
    '&& code:not(span[title] > code)': {
      backgroundColor: 'transparent',
      padding: '0px',
      fontSize: 'inherit',
    },
    '&& >div': {
      maxHeight: 'none',
      overflow: 'visible',
      '>div': {
        margin: '0px',
        paddingX: '0px',
      },
      '>div:first-of-type': {
        marginTop: '0px',
      },
    },
  },
  releases: {
    maxHeight: '50vh',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
  },
}

const Policies = ({ ...props }) => {
  const { t } = useTranslation()
  useTitle(t('settings.documentTitle', { page: t('settings.sections.policies') }))
  const { onSave } = useOutletContext() as any
  const { config } = useConfigContext()

  const form = useForm({
    defaultValues: {
      ...config.getProperties(),
      policies: policiesOf(config),
    }
  })

  return (
    <Body>

      <section>
        <article>
          <h2>{t('settings.sections.policies')}</h2>
          <p>
            <PoliciesIntro />
          </p>
          <ul>
            <li><Trans t={t} i18nKey='settings.policies.rules.avoid' components={[<code />]} /></li>
            <li><Trans t={t} i18nKey='settings.policies.rules.prefer' components={[<code />]} /></li>
            <li sx={{ listStyleType: 'none' }}>
              <ul>
                <li><Trans t={t} i18nKey='settings.policies.rules.require' components={[<code />, <strong />, <code />, <code />]} /></li>
              </ul>
            </li>
            <li><Trans t={t} i18nKey='settings.policies.rules.language' components={[<code />]} /></li>
          </ul>
          <h4>{t('settings.policies.score.title')}</h4>
          <p>
            <Trans t={t} i18nKey='settings.policies.score.base' components={[<strong />]} />
            <br/>
            <Trans t={t} i18nKey='settings.policies.score.prefer' components={[<code />, <strong />]} />
            <br/>
            <Trans t={t} i18nKey='settings.policies.score.tie' components={[<code />]} />
          </p>
          <PoliciesFields form={form} onSubmit={onSave}>
            <div sx={{ display: 'flex', marginTop: 4 }}>
              <Button type='submit' color='primary' sx={{ flex: 1 }}>{t('settings.save.label')}</Button>
            </div>
          </PoliciesFields>
        </article>
      </section>
    </Body>
  )
}

const SortablePolicies = ({ policies, form, onSortEnd }) => {
  const [active, setActive] = useState(null)
  const items = useMemo(() => policies.fields.filter((policy) => !policy.removed), [policies.fields])
  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragStart = useCallback((event) => setActive(event.active.id), [])

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const from = items.findIndex((i) => i.id === active.id)
      const to = items.findIndex((i) => i.id === over.id)
      onSortEnd({ from, to })
    }

    setActive(null)
  }, [items])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items}
        strategy={verticalListSortingStrategy}
      >
        {items.map((policy: any, index) => (
          <SortablePolicySettings
            key={policy.id}
            id={policy.id}
            form={form}
            policies={policies}
            prefix={`policies[${index}]`}
            remove={true}
            isDefault={index === 0}
            overlay={active === policy.id}
          />
        ))}
      </SortableContext>
      <DragOverlay>
        {active ? (
          <PolicySettings
            id={active}
            form={form}
            policies={policies}
            prefix={`policies[${items.findIndex(i => i.id === active)}]`}
            remove={true}
            isDefault={items.findIndex(i => i.id === active) === 0}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

const LANGUAGES = Object.entries(languages as Record<string, { name: string, emoji?: string }>)
  .sort(([, a], [, b]) => a.name.localeCompare(b.name))
  .map(([value, { name, emoji }]) => ({ value, label: `${emoji || '🏳️'}  ${name}` }))

const PolicySettings = forwardRef<any, any>(({
  form,
  policies = null,
  prefix = undefined,
  id,
  behavior = 'default',
  remove = null,
  isDefault = false,
  overlay = false,
  siblings = null,
  onPointerDown,
  role,
  ...props
}, ref) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const originalLanguages = form.watch(`${prefix ? `${prefix}.` : ''}match.original_languages`) || []
  const name = form.watch(`${prefix ? `${prefix}.` : ''}name`)
  const others = siblings || (prefix && form.watch('policies')) || []
  const winners = originalLanguages.reduce((acc, language) => ({
    ...acc,
    [language]: others.find(policy => !policy.removed && policy.match?.original_languages?.includes(language))?.name || name,
  }), {})
  const styles = useMemo(() => ({
    element: {
      display: 'flex',
      flexDirection: 'column',
      marginY: 6,
      opacity: overlay ? 0.5 : 1,
    },
    // One row on a desktop; on a phone the sorting goes under the name, at full width
    container: {
      display: ['grid', 'flex'],
      gridTemplateColumns: 'auto minmax(0, 1fr) auto auto auto auto',
      gridTemplateAreas: `"grip name default languages remove add" "direction sorting sorting sorting sorting sorting"`,
      alignItems: 'stretch',
      position: 'relative',
      '>*:not(button)': {
        backgroundColor: 'whiteDark',
        borderTopLeftRadius: '0rem !important',
        borderBottomLeftRadius: '0rem !important',
        borderTopRightRadius: '0rem !important',
        borderBottomRightRadius: '0rem !important',
      },
      '>*:first-child': {
        borderTopLeftRadius: '0.25rem !important',
        borderBottomLeftRadius: ['0rem !important', '0.25rem !important'],
      },
      '>*:last-child': {
        borderTopRightRadius: '0.25rem !important',
        borderBottomRightRadius: ['0rem !important', '0.25rem !important'],
      },
      '>[style*="grid-area: direction"]': {
        marginTop: ['-1px', '0px'],
        borderLeft: ['1px solid', 'none'],
        borderColor: 'grayDark',
        borderBottomLeftRadius: ['0.25rem !important', '0rem !important'],
      },
      '>[style*="grid-area: sorting"]': {
        marginTop: ['-1px', '0px'],
        borderBottomRightRadius: ['0.25rem !important', '0rem !important'],
      },
      '>label': {
        border: '1px solid',
        borderColor: 'grayDark',
        borderRight: 'none',
        margin: 12,
        paddingX: 8,
        ':hover': {
          backgroundColor: 'grayLight',
        },
      },
      '>select': {
        backgroundColor: 'whiteDark',
      },
      '>input': {
        zIndex: 0,
        backgroundColor: 'whiteDark',
        '&:hover,&:focus,&:active': {
          zIndex: 1,
        },
      },
      '>input:not(:last-of-type)': {
        marginRight: '-1px',
      },
    },
    button: {
      variant: 'button.reset',
      borderRadius: '0.25em',
      paddingX: 6,
      '>svg': {
        height: '0.75em',
        width: '0.75em',
      },
    },
    remove: {
      backgroundColor: 'error',
      color: 'whitePure',
      borderTopLeftRadius: '0rem !important',
      borderBottomLeftRadius: '0rem !important',
      '&:hover': {
        backgroundColor: 'errorDarker',
      },
      '&:active': {
        backgroundColor: 'errorDarkest',
      },
    },
    add: {
      backgroundColor: 'accent',
      color: 'whitePure',
      borderTopLeftRadius: '0rem !important',
      borderBottomLeftRadius: '0rem !important',
      '&:hover': {
        backgroundColor: 'accentDarker',
      },
      '&:active': {
        backgroundColor: 'accentDarkest',
      },
    },
    options: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      marginX: 8,
      fontSize: 5,
      backgroundColor: 'grayLighter',
      border: '1px solid',
      borderColor: 'grayDark',
      borderRadius: '0.25rem',
      borderTop: 'none',
      borderTopLeftRadius: '0rem',
      borderTopRightRadius: '0rem',
      lineHeight: 'body',
      '>details': {
        '>summary': SUMMARY,
        '>div': {
          maxHeight: '30em',
          borderTop: '1px solid',
          borderColor: 'grayDark',
          overflow: 'scroll',
          '>div': {
            width: 'unset',
            marginTop: 4,
            marginBottom: 2,
            paddingX: 2,
            ':first-of-type': {
              marginTop: 2,
            },
            ':last-of-type': {
              marginBottom: 0,
            },
          },
        },
      },
    },
  }), [overlay])

  return (
    <div {...props} ref={ref} sx={styles.element}>
      <div sx={styles.container}>
        {remove && (
          <div
            onPointerDown={onPointerDown}
            role={role}
            style={{ gridArea: 'grip' }}
            sx={{
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              border: '1px solid',
              borderColor: 'grayDark',
              borderRight: 'none',
              paddingX: 8,
              fontFamily: 'monospace',
            }}
          >
            ⁝
          </div>
        )}
        <Controller
          name={`${prefix ? `${prefix}.` : ''}name`}
          control={form.control}
          render={({ field: { ref, ...field } }) => (
            <input
              type='text'
              {...field}
              sx={{ variant: 'input.default', flex: 1, fontFamily: 'monospace', width: '100%' }}
              style={{ gridArea: 'name' }}
              placeholder={t('settings.policies.name')}
              required={true}
            />
          )}
        />
        {isDefault && (
          <div
            title={t('settings.policies.default.title')}
            style={{ gridArea: 'default' }}
            sx={{
              cursor: 'default',
              display: 'flex',
              alignItems: 'center',
              border: '1px solid',
              borderColor: 'grayDark',
              borderLeft: 'none',
              paddingX: 4,
              fontSize: 6,
              fontFamily: 'monospace',
              color: 'warning',
              whiteSpace: 'nowrap',
            }}
          >
            <span sx={{ display: ['none', 'inline'], marginRight: 6 }}>{t('settings.policies.default.label')}</span>
            <span>✓</span>
          </div>
        )}
        {!!originalLanguages.length && (
          <div
            style={{ gridArea: 'languages' }}
            title={originalLanguages.map(language => winners[language] === name ? t('settings.policies.languages.own', { language: languages[language]?.name || language }) : t('settings.policies.languages.other', { language: languages[language]?.name || language, policy: winners[language] })).join('\n')}
            sx={{
              cursor: 'default',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: '1px solid',
              borderColor: 'grayDark',
              borderLeft: 'none',
              paddingX: 4,
              fontSize: 6,
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
            }}
          >
            {originalLanguages.map(language => (
              <span key={language} sx={{ opacity: winners[language] === name ? 1 : 0.3 }}>
                <span role='img' aria-label={t('settings.policies.languages.other', { language: languages[language]?.name || language, policy: winners[language] })}>{languages[language]?.emoji || '🏳️'}</span>
                <span aria-hidden={true} sx={{ display: ['none', 'inline'], marginLeft: 6 }}>{language}</span>
              </span>
            ))}
          </div>
        )}
        <Controller
          name={`${prefix ? `${prefix}.` : ''}descending`}
          control={form.control}
          render={({ field: { ref, ...field } }) => (
            <div
              style={{ gridArea: 'direction' }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: 'grayDark',
                borderRight: 'none',
                borderLeft: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <label
                sx={{
                  display: ['none', 'flex'],
                  alignItems: 'center',
                  height: '100%',
                  fontSize: 5,
                  fontWeight: 'semibold',
                  paddingX: 4,
                  borderRight: '1px solid',
                  borderColor: 'grayDark',
                }}
              >
                {t('ui.sorting')}
              </label>
              <Icon
                value='sort'
                direction={field.value}
                sx={{ height: '2em', width: '3em', paddingX: 4, paddingY: 8 }}
                onClick={() => field.onChange(!field.value)}
              />
            </div>
          )}
        />
        <Controller
          name={`${prefix ? `${prefix}.` : ''}sorting`}
          control={form.control}
          render={({ field: { ref, ...field } }) => (
            <select
              {...field}
              style={{ gridArea: 'sorting' }}
              sx={{ variant: 'select.default', width: 'auto', borderRadius: '0px', paddingX: 4, fontSize: 6, fontFamily: 'monospace' }}
            >
              <option value='size'>{emojize('📦', t('settings.policies.sortings.size'))}</option>
              <option value='seeders'>{emojize('📡', t('settings.policies.sortings.seeders'))}</option>
              <option value='peers'>{emojize('🌍', t('settings.policies.sortings.peers'))}</option>
            </select>
          )}
        />
        {behavior === 'default' && (
          <Controller
            name={`${prefix ? `${prefix}.` : ''}removed`}
            control={form.control}
            render={({ field: { value, ...field } }) => (
              <button
                type='button'
                style={{ gridArea: 'remove' }}
                sx={{ ...styles.button, ...styles.remove }}
                title={value ? '' : t('settings.policies.remove.title')}
                onClick={() => {
                  if (window.confirm(t('settings.policies.remove.confirm'))) {
                    policies.update(policies.fields.findIndex(p => p.id === id), { ...policies.fields[policies.fields.findIndex(p => p.id === id)], removed: true })
                  }
                }}
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' style={{ transform: 'rotate(45deg)' }}>
                  <path fill='currentColor' d='M24 10h-10v-10h-4v10h-10v4h10v10h4v-10h10z' />
                </svg>
              </button>
            )}
          />
        )}
        {behavior === 'create' && (
          <button type='submit' sx={{ ...styles.button, ...styles.add }} style={{ gridArea: 'add' }} title={t('settings.policies.add')}>
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
              <path fill='currentColor' d='M24 10h-10v-10h-4v10h-10v4h10v10h4v-10h10z' />
            </svg>
          </button>
        )}
      </div>
      <div sx={styles.options}>
        <details open={open} onToggle={() => setOpen((open) => !open)}>
          <summary>
            <span>{t('settings.policies.rules.title')}</span>
          </summary>
          {open && (
            <div>
              <ControlledPolicyFilter form={form} prefix={prefix} name='znab' Component={ZNABFilter} />
              <ControlledPolicyFilter form={form} prefix={prefix} name='encoding' Component={EncodingFilter} />
              <ControlledPolicyFilter form={form} prefix={prefix} name='resolution' Component={ResolutionFilter} />
              <ControlledPolicyFilter form={form} prefix={prefix} name='source' Component={SourceFilter} />
              <ControlledPolicyFilter form={form} prefix={prefix} name='dub' Component={DubFilter} />
              <ControlledPolicyFilter form={form} prefix={prefix} name='language' Component={LanguageFilter} />
              <ControlledPolicyFilter form={form} prefix={prefix} name='flags' Component={FlagsFilter} />
              <Controller
                name={`${prefix ? `${prefix}.` : ''}match.original_languages`}
                control={form.control}
                render={({ field: { ref, value, onChange, ...field } }) => (
                  <Select
                    {...field}
                    label={(
                      <>
                        {emojize('🌐', t('settings.policies.languages.label'))}
                        <br />
                        <small sx={{ fontWeight: 'normal' }}>{t('settings.policies.languages.help')}</small>
                      </>
                    )}
                    placeholder={t('settings.policies.languages.none')}
                    options={LANGUAGES}
                    value={(value || []).map(language => LANGUAGES.find(option => option.value === language) || { value: language, label: `🏳️  ${t('settings.policies.languages.unknown', { language })}` })}
                    onChange={(options) => onChange((options || []).map(option => option.value))}
                    multi={true}
                    resetable={false}
                    menuPortalTarget={document.body}
                    closeMenuOnScroll={true}
                    menuPlacement='auto'
                    styles={{
                      menuPortal: (style) => ({ ...style, zIndex: 10 }),
                    }}
                  />
                )}
              />
            </div>
          )}
        </details>
        <PolicySandbox form={form} prefix={prefix} />
      </div>
    </div>
  )
})

const SortablePolicySettings = ({ ...props }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <PolicySettings ref={setNodeRef} style={style} {...attributes} {...listeners} {...props as any} />
  )
}

const ControlledPolicyFilter = ({ form, prefix, name, Component, ...props }) => {
  const requireValues = form.watch(`${prefix}.require.${name}`) || []
  const preferValues = form.watch(`${prefix}.prefer.${name}`) || []
  const avoidValues = form.watch(`${prefix}.avoid.${name}`) || []

  const value = useMemo(() => [
    ...unranked(preferValues).map(({ value, rank }) => ({ value, label: value, group: 'prefer', rank, required: requireValues.includes(value) })),
    ...avoidValues.map(value => ({ value, label: value, group: 'avoid' })),
    ...requireValues.filter(value => rankOf(preferValues, value) === -1).map(value => ({ value, label: value, group: null, required: true })),
  ], [requireValues, preferValues, avoidValues])

  const handleChange = useCallback((next) => {
    form.setValue(`${prefix}.require.${name}`, next.filter(item => item.required).map(item => item.value), { shouldDirty: true })
    form.setValue(`${prefix}.prefer.${name}`, ranked(next.filter(item => item.group === 'prefer')), { shouldDirty: true })
    form.setValue(`${prefix}.avoid.${name}`, next.filter(item => item.group === 'avoid').map(item => item.value), { shouldDirty: true })
  }, [form, prefix, name])

  return (
    <Component
      {...props}
      value={value}
      onChange={handleChange}
      requirable={true}
      rankable={true}
    />
  )
}

export default Policies
