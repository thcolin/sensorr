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

export const PoliciesIntro = () => (
  <>Sensorr policies allow you to define and prioritize rules to automatically choose the best movie release.</>
)

export const PoliciesFields = ({ form, onSubmit, children, examples = [], guard = false }) => {
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
          <small>Or start from</small>
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
      <PoliciesSandbox form={form} fields={policies.fields} />
      <hr sx={{ variant: 'hr.default', marginY: 6, marginX: '25%' }}></hr>
      <form sx={{ display: 'flex', flexDirection: 'column' }} onSubmit={form.handleSubmit((values) => (guard && policy.getValues('name')) ? toast.error('Add the policy with +, or clear its name') : onSubmit(values))}>
        <SortablePolicies
          policies={policies}
          form={form}
          onSortEnd={({ from, to }) => {
            if (from === 0 || to === 0) {
              toast.success(`New default policy   ${(policies.fields[to === 0 ? from : to] as any).name}`)
            }

            policies.swap(from, to)
          }}
        />
        {children}
      </form>
    </>
  )
}

const PoliciesSandbox = ({ form, fields }) => {
  const { device } = useDeviceContext()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const values = form.watch('policies') || []
  const policies = fields.map((field, index) => ({ id: field.id, policy: values[index] })).filter(({ policy }) => policy && !policy.removed)
  const znabs = (form.watch('znabs') || []).filter((znab) => !znab.disabled).map((znab) => znab.name)
  const { id, policy } = policies.find(({ id }) => id === selected) || policies[0] || {}
  const key = open && policy ? JSON.stringify([policy, znabs]) : null
  const releases = useMemo(() => key ? sandboxOf(policy, znabs) : [], [key])
  const statistics = useMemo(() => statisticsOf(releases), [releases])
  const summary = summaryOf(releases)

  return (
    <details open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)} sx={PoliciesSandbox.styles.element}>
      <summary>
        <span>Sandbox</span>
        <small>Fake <em>Big Buck Bunny</em> (2008) releases, nothing is saved</small>
      </summary>
      {open && (
        <div>
          {!policy ? (
            <p>Add a policy to try it.</p>
          ) : (
            <>
              <div sx={PoliciesSandbox.styles.toolbar}>
                <label>
                  <strong>Policy</strong>
                  <select value={id} onChange={(e) => setSelected(e.target.value)}>
                    {policies.map(({ id, policy }) => (
                      <option key={id} value={id}>{policy.name || '(no name)'}</option>
                    ))}
                  </select>
                </label>
                <div>
                  <ReleaseTag title='Valid releases'><code>⭐ {summary.valid}</code></ReleaseTag>
                  <ReleaseTag title='Withdrawn by the policy'><code>🚨 {summary.withdrawn}</code></ReleaseTag>
                  <ReleaseTag title='Rejected by the movie search'><code>🗑️ {summary.rejected}</code></ReleaseTag>
                  {!!summary.tied && <ReleaseTag title='In case of a tie, sort setting acts as the tie-breaker'><code>{summary.tied} tied at 💯 {summary.pick.score} · Sort by {policy.sorting === 'size' || !policy.sorting ? '📦' : '🌍'} {policy.sorting || 'size'}</code></ReleaseTag>}
                </div>
              </div>
              <div sx={PoliciesSandbox.styles.releases}>
                {releases.map((release) => (
                  <Release
                    key={release.id}
                    entity={release}
                    statistics={statistics}
                    bars={true}
                    display={device === 'mobile' ? 'column' : 'row'}
                    actions={false}
                    note={[release === summary.pick && '🏆 Picked', release.goal && '✨ End-goal of the refine job'].filter(Boolean).join(' · ') || null}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </details>
  )
}

PoliciesSandbox.styles = {
  element: {
    marginX: 8,
    marginY: 6,
    fontSize: 5,
    backgroundColor: 'grayLighter',
    border: '1px solid',
    borderColor: 'grayDark',
    borderRadius: '0.25rem',
    overflow: 'hidden',
    // The bands of the release search: `primary` title, `accent` controls
    '>summary': {
      ...SUMMARY,
      lineHeight: 'body',
      position: 'relative',
      backgroundColor: 'primary',
      color: 'whitePure',
      '>small': {
        display: 'block',
        position: ['static', 'absolute'],
        top: '50%',
        right: 3,
        transform: ['none', 'translateY(-50%)'],
        color: 'whitePure',
        opacity: 0.8,
        lineHeight: 'inherit',
      },
    },
    // Settings boxes every `section code`, the release search leaves its titles and reasons bare
    '&& code:not(span[title] > code)': {
      backgroundColor: 'transparent',
      padding: '0px',
      fontSize: 'inherit',
    },
    '>div': {
      '>p': {
        paddingX: 3,
      },
    },
  },
  releases: {
    maxHeight: '50vh',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
  },
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingX: 3,
    paddingY: 6,
    backgroundColor: 'accent',
    color: 'whitePure',
    '>label': {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      '>strong': {
        fontWeight: 'strong',
      },
      '>select': {
        variant: 'select.reset',
        color: 'whitePure',
        fontWeight: 'semibold',
        fontSize: 5,
        paddingY: '3px',
        paddingX: '6px',
        backgroundColor: 'accentDarkest',
        borderRadius: '2px',
        cursor: 'pointer',
        ':focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary',
          outlineOffset: '2px',
        },
      },
    },
    '>div': {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      fontVariantNumeric: 'tabular-nums',
    },
    '&& >div code': {
      backgroundColor: 'accentDark',
      color: 'whitePure',
    },
  },
}

const Policies = ({ ...props }) => {
  useTitle('Settings - Policies')
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
          <h2>Policies</h2>
          <p>
            <PoliciesIntro />
          </p>
          <ul>
            <li><code>⛔ avoid</code> tags acts as a universal blacklist, immediately rejecting any release with a forbidden tag.</li>
            <li><code>⭐ prefer</code> tags creates a score to rank and choose the best release accordingly to policy criteria. You can drag and drop tags to set their importance, and drop a tag onto another to give both the same rank.</li>
            <li sx={{ listStyleType: 'none' }}>
              <ul>
                <li><code>* (require)</code> option define the <strong>end-goal</strong> release for the <code>✨ refine</code> job. Once these criteria matched, <code>✂️ shrink</code> job will take over.</li>
              </ul>
            </li>
            <li><code>🌐 original language</code> gives the policy to a movie of that language entering your library without a policy. The first matching policy wins, otherwise the default one. Movies already in your library are left as they are.</li>
          </ul>
          <h4>Score</h4>
          <p>
            Sensorr ranks releases using a clear point system. A release first earns a base score of <strong>1000 points</strong> for matching the movie's title (original or localized).
            <br/>
            It then accumulates additional points from your <code>⭐ prefer</code> tags. The top-ranked tag is worth <strong>100 points</strong>, while subsequent tags in the same list are worth progressively less. Tags sharing a rank are worth the same points.
            <br/>
            The release with the highest total score is always chosen. In case of a tie, <code>sort</code> setting acts as the tie-breaker.
          </p>
          <PoliciesFields form={form} onSubmit={onSave}>
            <div sx={{ display: 'flex', marginTop: 4 }}>
              <Button type='submit' color='primary' sx={{ flex: 1 }}>Save</Button>
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
    container: {
      display: 'flex',
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
        borderBottomLeftRadius: '0.25rem !important',
      },
      '>*:last-child': {
        borderTopRightRadius: '0.25rem !important',
        borderBottomRightRadius: '0.25rem !important',},
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
              placeholder='Name'
              required={true}
            />
          )}
        />
        {isDefault && (
          <div
            title='Default policy will be applied to releases without policy specified'
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
            <span sx={{ display: ['none', 'inline'], marginRight: 6 }}>default</span>
            <span>✓</span>
          </div>
        )}
        {!!originalLanguages.length && (
          <div
            title={originalLanguages.map(language => winners[language] === name ? `New movies in ${languages[language]?.name || language} get this policy` : `New movies in ${languages[language]?.name || language} go to ${winners[language]}`).join('\n')}
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
                <span role='img' aria-label={`New movies in ${languages[language]?.name || language} go to ${winners[language]}`}>{languages[language]?.emoji || '🏳️'}</span>
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
                Sort by
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
              sx={{ variant: 'select.default', width: 'auto', borderRadius: '0px', paddingX: 4, fontSize: 6, fontFamily: 'monospace' }}
            >
              <option value='size'>{emojize('📦', 'size')}</option>
              <option value='seeders'>{emojize('📡', 'seeders')}</option>
              <option value='peers'>{emojize('🌍', 'peers')}</option>
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
                sx={{ ...styles.button, ...styles.remove }}
                title={value ? '' : 'Remove policy'}
                onClick={() => {
                  if (window.confirm('Do you really want to remove this policy ? Movies with deleted policy defined will fallback to "default" policy')) {
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
          <button type='submit' sx={{ ...styles.button, ...styles.add }} title='Add policy'>
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
              <path fill='currentColor' d='M24 10h-10v-10h-4v10h-10v4h10v10h4v-10h10z' />
            </svg>
          </button>
        )}
      </div>
      <div sx={styles.options}>
        <details open={open} onToggle={() => setOpen((open) => !open)}>
          <summary>
            <span>Rules</span>
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
                        {emojize('🌐', 'Original language')}
                        <br />
                        <small sx={{ fontWeight: 'normal' }}>New movies in these languages get this policy when they enter your library without one</small>
                      </>
                    )}
                    placeholder='No language'
                    options={LANGUAGES}
                    value={(value || []).map(language => LANGUAGES.find(option => option.value === language) || { value: language, label: `🏳️  Unknown (${language})` })}
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
