import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { keyframes } from '@emotion/react'
import { TMDB } from '@sensorr/tmdb'
import i18n from '@sensorr/i18n'
import { Badge, Button, Icon, Option, Steps, Warning } from '@sensorr/ui'
import { useTitle } from '@sensorr/utils'
import { useAPI, errorOf } from '../../store/api'
import { useConfigContext } from '../../contexts/Config/Config'
import { useJobsContext } from '../../contexts/Jobs/Jobs'
import { LoadingBar } from '../../layout/LoadingBar'
import { Emblem, Splash } from '../KeepInTouch/KeepInTouch'
import { useSaveConfig } from '../Settings/Settings'
import { TMDBFields, TMDBIntro } from '../Settings/TMDB'
import { ZnabsFields, ZnabsIntro, znabsOf } from '../Settings/Znabs'
import { BlackholeFields, BlackholeIntro } from '../Settings/Blackhole'
import { PoliciesFields, PoliciesIntro, policiesOf } from '../Settings/Policies'
import { PLEX_STEPS, usePlexLink } from '../Settings/Plex'
import JobsSettings, { JobsFields } from '../Settings/Jobs'
import { MailFields } from '../Settings/Mail'
import { FriendsIntro } from '../Settings/Friends'
import Update from '../Settings/Update'
import { hasTMDBKey, TMDB_PLACEHOLDER } from './needsOnboarding'
import { policyExamplesOf } from './policyExamples'
import { MISSING, nextRunsOf, statusOf } from './recap'

const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

const STEP = {
  next: keyframes`from { opacity: 0; transform: translateX(2.5rem); } 50% { opacity: 1; }`,
  previous: keyframes`from { opacity: 0; transform: translateX(-2.5rem); } 50% { opacity: 1; }`,
  rise: keyframes`from { opacity: 0; transform: translateY(1.5rem); }`,
  fade: keyframes`from { opacity: 0; }`,
}

// A reload, or an installed PWA the phone evicted, comes back to the step it left
const STEP_KEY = 'sensorr_onboarding_step'

const Brand = () => (
  <div sx={{ flex: 1, display: 'flex', alignItems: 'center', fontSize: '4em' }}>🍿📼</div>
)

const EmojiEmblem = ({ emoji, label }) => (
  <Emblem icon={<span sx={{ fontSize: '4em', lineHeight: 1 }}>{emoji}</span>} label={label} />
)

// Only a 401 says the key is wrong: any other failure keeps it unchecked, as `install.sh` does
const checkTMDB = async (key) => {
  try {
    await new TMDB({ key }).fetch('configuration', {}, {}, true)
    return null
  } catch (err) {
    return /Invalid TMDB API key/.test(err.message) ? i18n.t('onboarding.steps.tmdb.invalid') : null
  }
}

const Welcome = ({ config, origin, setOrigin, archive, setArchive }) => {
  const { t } = useTranslation()
  const defaultPassword = config.get('onboarding.defaultPassword')
  const legacy = config.get('onboarding.legacy')
  const indexers = (config.get('znabs') || []).length

  return (
    <>
      {defaultPassword && (
        <p sx={{ ...Update.styles.warning, marginBottom: 6 }}>
          <Trans t={t} i18nKey='onboarding.welcome.password' components={[<strong />, <code sx={{ variant: 'code.reset' }} />, <code sx={{ variant: 'code.reset' }} />, <code sx={{ variant: 'code.reset' }} />, <code sx={{ variant: 'code.reset' }} />]} />
        </p>
      )}
      <div sx={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Option type='radio' id='onboarding-fresh' name='onboarding-origin' checked={origin === 'fresh'} onChange={() => setOrigin('fresh')}>
          <div sx={{ lineHeight: 'normal', paddingY: 10 }}>
            <strong>{t('onboarding.welcome.fresh.title')}</strong>
            <br />
            <small>{t('onboarding.welcome.fresh.description')}</small>
          </div>
        </Option>
        <Option type='radio' id='onboarding-dump' name='onboarding-origin' checked={origin === 'dump'} onChange={() => setOrigin('dump')}>
          <div sx={{ lineHeight: 'normal', paddingY: 10 }}>
            <strong>{t('onboarding.welcome.dump.title')}</strong>
            <br />
            <small>{t('onboarding.welcome.dump.description')}</small>
          </div>
        </Option>
        <Option type='radio' id='onboarding-legacy' name='onboarding-origin' checked={origin === 'legacy'} onChange={() => setOrigin('legacy')}>
          <div sx={{ lineHeight: 'normal', paddingY: 10 }}>
            <strong>{t('onboarding.welcome.legacy.title')}</strong>
            <br />
            <small>{t('onboarding.welcome.legacy.description')}</small>
          </div>
        </Option>
      </div>
      {origin === 'dump' && (
        <div sx={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 6 }}>
          <input
            type='file'
            accept='.zip,application/zip'
            aria-label={t('onboarding.welcome.dump.file')}
            onChange={(e) => setArchive(e.target.files?.[0] || null)}
            sx={Onboarding.styles.file}
          />
          <small>
            <Trans t={t} i18nKey='onboarding.welcome.dump.help' values={{ settings: t('settings.title'), page: t('settings.sections.backup') }} components={[<code />, <code />]} />
          </small>
        </div>
      )}
      {origin === 'legacy' && (
        <div sx={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 6 }}>
          {legacy && (
            <small>
              <Trans t={t} i18nKey='onboarding.welcome.legacy.converted' values={{ count: indexers }} components={[<code />]} />
            </small>
          )}
          <input
            type='file'
            accept='.zip,application/zip'
            aria-label={t('onboarding.welcome.legacy.file')}
            onChange={(e) => setArchive(e.target.files?.[0] || null)}
            sx={Onboarding.styles.file}
          />
          <small>
            <Trans t={t} i18nKey='onboarding.welcome.legacy.help' values={{ archive: String(!!archive) }} components={[<code />, <strong />, <code />]} />
          </small>
        </div>
      )}
    </>
  )
}

const End = ({ steps, config, go }) => {
  const { t } = useTranslation()
  const runs = nextRunsOf(config)
  const listed = steps
    .map(({ key, emoji, label }, index) => ({ key, emoji: key === 'plex' ? PLEX_STEPS.url.emoji : emoji, label, index, status: statusOf(key, config) }))
    .filter(({ key }) => !['welcome', 'jobs', 'end'].includes(key))
  const missing = listed.filter(({ status }) => !status)
  const set = listed.filter(({ status }) => status)

  return (
    <div sx={Onboarding.styles.recap}>
      <section>
        <h4>{t('onboarding.end.next')}</h4>
        {runs.length ? (
          <ul sx={Onboarding.styles.next}>
            {runs.map(({ name, emoji, when }) => (
              <li key={name}>
                <span>{emoji} <code>{name}</code></span>
                <span>{when}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p sx={Onboarding.styles.missing}>{t('onboarding.end.paused')}</p>
        )}
      </section>
      {!!missing.length && (
        <section>
          <h4>{t('onboarding.end.todo')}</h4>
          <ul sx={Onboarding.styles.todo}>
            {missing.map(({ key, emoji, label, index }) => (
              <li key={key}>
                <span>{emoji} <strong>{label}</strong></span>
                <span sx={Onboarding.styles.missing}>{MISSING[key]}</span>
                <button type='button' onClick={() => go(index)} sx={Onboarding.styles.setup}>{t('onboarding.end.setup')}</button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {!!set.length && (
        <section sx={Onboarding.styles.set}>
          <h4>{t('onboarding.end.set')}</h4>
          {set.map(({ key, emoji, status }) => (
            <Badge key={key} emoji={emoji} label={status} compact={true} size='small' palette={{ color: 'primaryDarkest', backgroundColor: 'whitePure' }} />
          ))}
        </section>
      )}
    </div>
  )
}

const Onboarding = () => {
  const { t } = useTranslation()
  useTitle(t('onboarding.title'))
  const api = useAPI()
  const navigate = useNavigate()
  const { config, load } = useConfigContext() as any
  const saveConfig = useSaveConfig()
  const valuesOf = () => ({ ...config.getProperties(), tmdb: hasTMDBKey(config) ? config.get('tmdb') : '', znabs: znabsOf(config), policies: policiesOf(config) })
  const form = useForm({ defaultValues: valuesOf() })
  const [step, setStep] = useState(() => {
    try {
      return Number(sessionStorage.getItem(STEP_KEY)) || 0
    } catch (err) {
      return 0
    }
  })
  const [direction, setDirection] = useState('next')
  const [pending, setPending] = useState(false)
  const [origin, setOrigin] = useState(config.get('onboarding.legacy') ? 'legacy' : 'fresh')
  const legacy = origin === 'legacy'
  const [archive, setArchive] = useState(null)
  const [migration, setMigration] = useState(null)
  const [restoration, setRestoration] = useState(null)
  const { jobs } = useJobsContext() as any
  const latest = useRef(jobs)
  latest.current = jobs
  const mounted = useRef(true)

  useEffect(() => () => {
    mounted.current = false
  }, [])
  const [tmdbError, setTMDBError] = useState(null)
  const plex = usePlexLink()

  // Plex and MediUX are written by their own endpoints: a step posting its loaded values would empty them.
  // The form starts again from the config the API sent back, so a policy saved once is no longer new.
  const save = async ({ plex, mediux, ...values }: any) => {
    await saveConfig(values)
    form.reset(valuesOf())
  }
  const panel = useRef(null)
  const moved = useRef(false)

  // A keyboard or a screen reader follows the step that slid in, not the button that left with the last one
  useEffect(() => {
    if (!moved.current) {
      moved.current = true
      return
    }

    // The panel scrolls on a desktop, the whole page under it on a phone: a new step starts at the top of both
    panel.current?.scrollTo({ top: 0 })
    panel.current?.parentElement?.scrollTo({ top: 0 })

    const title = panel.current?.querySelector('h2')
    title?.setAttribute('tabindex', '-1')
    title?.focus({ preventScroll: true })
  }, [step])
  const PlexInputs = PLEX_STEPS[plex.step].Inputs

  // `migrate` asks TMDB for every movie of the dump, so the archive waits for a working key
  const migrate = useCallback(async () => {
    if (!legacy || !archive || migration?.job) {
      return
    }

    try {
      const { uri, params, init } = api.query.jobs.runMigrate({ body: { archive } })
      const { job } = await api.fetch(uri, params, init, { rawError: true })
      setMigration({ job })
    } catch (err) {
      setMigration({ error: (await errorOf(err)) || err.message })
    }
  }, [legacy, archive, migration])

  // The next steps show the settings of the dump, so they wait for the restore
  const restore = async () => {
    if (origin !== 'dump' || restoration?.done) {
      return
    }

    if (!archive) {
      setRestoration({ error: t('onboarding.restore.choose') })
      throw new Error('No dump')
    }

    try {
      const { uri, params, init } = api.query.jobs.runRestore({ body: { archive } })
      const { job } = await api.fetch(uri, params, init, { rawError: true })
      setRestoration({ job })

      let ended
      while (!(ended = latest.current?.find((entry) => entry.job === job && entry.meta?.done))) {
        if (!mounted.current) {
          return
        }

        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      if (ended.meta.error) {
        throw new Error(ended.messages?.[ended.messages.length - 1] || t('onboarding.restore.failed', { job }))
      }

      const query = api.query.config.getConfig({})
      await load(await api.fetch(query.uri, query.params, query.init))
      form.reset(valuesOf())
      setRestoration({ job, done: true })
    } catch (err) {
      setRestoration({ error: (await errorOf(err)) || err.message })
      throw err
    }
  }

  const steps = [
    {
      key: 'welcome',
      label: t('onboarding.steps.welcome.title'),
      emblem: <Brand />,
      emoji: '👋',
      title: t('onboarding.steps.welcome.title'),
      subtitle: t('onboarding.steps.welcome.subtitle'),
      content: <Welcome config={config} origin={origin} setOrigin={setOrigin} archive={archive} setArchive={setArchive} />,
      submit: restore,
    },
    {
      key: 'tmdb',
      label: 'TMDB',
      emblem: <Emblem icon={<Icon value='tmdb' sx={{ height: '4em', width: '4em' }} />} label='TMDB' />,
      emoji: '🎬',
      title: 'TMDB',
      settings: '/settings/tmdb',
      subtitle: <TMDBIntro />,
      content: (
        <TMDBFields
          form={form}
          after={tmdbError && <div sx={{ ...Update.styles.failure, marginTop: 6 }}>{tmdbError}</div>}
        />
      ),
      submit: async (values) => {
        const error = (!values.tmdb || values.tmdb === TMDB_PLACEHOLDER) ? t('onboarding.steps.tmdb.required') : await checkTMDB(values.tmdb)
        setTMDBError(error)

        if (error) {
          throw new Error(error)
        }

        await save(values)
        await migrate()
      },
    },
    {
      key: 'indexers',
      label: t('settings.sections.indexers'),
      emblem: <EmojiEmblem emoji='🔎' label={t('settings.sections.indexers')} />,
      emoji: '🔎',
      title: t('settings.sections.indexers'),
      settings: '/settings/indexers',
      subtitle: <ZnabsIntro />,
      skippable: true,
      form: (footer) => <div sx={{ width: '100%', textAlign: 'left' }}><ZnabsFields form={form} onSubmit={next} guard={true}>{footer}</ZnabsFields></div>,
      submit: save,
    },
    {
      key: 'policies',
      label: t('settings.sections.policies'),
      emblem: <EmojiEmblem emoji='🚨' label={t('settings.sections.policies')} />,
      emoji: '🚨',
      title: t('settings.sections.policies'),
      settings: '/settings/policies',
      subtitle: <PoliciesIntro />,
      skippable: true,
      form: (footer) => <div sx={{ width: '100%', textAlign: 'left' }}><PoliciesFields form={form} onSubmit={next} examples={policyExamplesOf(form.watch('region'))} guard={true}>{footer}</PoliciesFields></div>,
      submit: save,
    },
    {
      key: 'blackhole',
      label: t('settings.sections.blackhole'),
      emblem: <EmojiEmblem emoji='🕳️' label={t('settings.sections.blackhole')} />,
      emoji: '🕳️',
      title: t('settings.sections.blackhole'),
      settings: '/settings/blackhole',
      subtitle: <BlackholeIntro />,
      skippable: true,
      content: <BlackholeFields form={form} compact={true} />,
      submit: save,
    },
    {
      key: 'plex',
      label: 'Plex',
      emblem: <Emblem icon={<Icon value='plex' sx={{ height: '4em' }} />} label='Plex' />,
      emoji: PLEX_STEPS[plex.step].emoji,
      title: PLEX_STEPS[plex.step].title,
      settings: '/settings/plex',
      subtitle: PLEX_STEPS[plex.step].subtitle(plex.step),
      skippable: true,
      // The server persists every step of the link itself, Continue only checks it is done
      form: (footer) => (
        <div sx={{ width: '100%' }}>
          <PlexInputs link={plex} />
          <form onSubmit={form.handleSubmit(next)}>{footer}</form>
        </div>
      ),
      submit: async () => {
        if (plex.step !== 'token') {
          toast.error(t('onboarding.steps.plex.required'))
          throw new Error('Plex not linked')
        }
      },
    },
    {
      key: 'friends',
      label: t('settings.sections.friends'),
      emblem: <EmojiEmblem emoji='🍻' label={t('settings.sections.friends')} />,
      emoji: '🍻',
      title: t('settings.sections.friends'),
      settings: '/settings/friends',
      subtitle: <FriendsIntro />,
      skippable: true,
      content: (
        <>
          <p>
            <Trans t={t} i18nKey='onboarding.steps.friends.share' values={{ url: `${document.location.origin}/keep-in-touch`, settings: t('settings.title'), page: t('settings.sections.friends') }} components={[<a href={`${document.location.origin}/keep-in-touch`} target='_blank' rel='noreferrer noopener' />, <code />]} />
          </p>
          <h3>{t('settings.sections.mail')}</h3>
          <MailFields form={form} compact={true} />
        </>
      ),
      submit: save,
    },
    {
      key: 'jobs',
      label: t('jobs.title'),
      emblem: <EmojiEmblem emoji='⏰' label={t('jobs.title')} />,
      emoji: '⏰',
      title: t('jobs.title'),
      settings: '/settings/schedule',
      subtitle: t('onboarding.steps.jobs.subtitle'),
      skippable: true,
      content: (
        <div sx={JobsSettings.styles.element}>
          <JobsFields form={form} compact={true} />
          <p><small><Trans t={t} i18nKey='onboarding.steps.jobs.stay' values={{ settings: t('settings.title'), page: t('settings.sections.schedule') }} components={[<code />]} /></small></p>
        </div>
      ),
      submit: save,
    },
    {
      key: 'end',
      label: t('onboarding.steps.end.title'),
      emblem: <Brand />,
      emoji: '📼',
      title: t('onboarding.steps.end.title'),
      subtitle: t('onboarding.steps.end.subtitle'),
      submit: (values) => save({ ...values, onboarding: { ...values.onboarding, done: true } }),
    },
  ]

  const current = steps[Math.min(step, steps.length - 1)]
  const last = current.key === 'end'

  async function next(values) {
    setPending(true)

    try {
      await current.submit?.(values)

      if (last) {
        try {
          sessionStorage.removeItem(STEP_KEY)
        } catch (err) {}

        navigate('/', { replace: true })
      } else {
        go(step + 1)
      }
    } catch (err) {
      console.warn(err)
    } finally {
      setPending(false)
    }
  }

  const go = (to) => {
    setDirection(to > step ? 'next' : 'previous')
    setStep(to)

    try {
      sessionStorage.setItem(STEP_KEY, `${to}`)
    } catch (err) {}
  }

  const skip = () => go(step + 1)

  const footer = (
    <div sx={Onboarding.styles.footer}>
      {step > 0 && (
        <Button type='button' color='gray' variant='outline' onClick={() => go(step - 1)} disabled={pending}>{t('onboarding.footer.back')}</Button>
      )}
      <span sx={{ flex: 1 }} />
      {current.skippable && (
        <Button type='button' color='gray' variant='outline' onClick={skip} disabled={pending}>{t('onboarding.footer.skip')}</Button>
      )}
      <Button type='submit' color='primary' disabled={pending}>
        {t(last ? 'onboarding.footer.open' : 'onboarding.footer.continue')}
      </Button>
    </div>
  )

  return (
    <div sx={Splash.styles.page}>
      <LoadingBar />
      <div sx={Onboarding.styles.wrapper}>
        <div ref={panel} sx={Onboarding.styles.panel}>
          <div sx={Onboarding.styles.content}>
            <p role='status' sx={Onboarding.styles.hidden}>{t('onboarding.status', { step: steps.indexOf(current) + 1, count: steps.length, label: current.label })}</p>
            <Steps value={steps.indexOf(current)}>
              {steps.map(({ key }) => (
                <div key={key} />
              ))}
            </Steps>
            <Warning key={current.key} data-direction={direction} emoji={current.emoji} title={current.title} subtitle={current.subtitle} sx={Onboarding.styles.step}>
              {current.form ? current.form(footer) : (
                <form onSubmit={form.handleSubmit(next)} sx={{ width: '100%', textAlign: 'left' }}>
                  {current.key === 'end' ? <End steps={steps} config={config} go={go} /> : current.content}
                  {footer}
                </form>
              )}
            </Warning>
            {restoration?.error && (
              <div sx={{ ...Update.styles.failure, marginBottom: 6 }}>{restoration.error}</div>
            )}
            {restoration?.job && !restoration.error && (
              <small sx={{ display: 'block', textAlign: 'center', marginBottom: 6 }}>
                📦 <Trans t={t} i18nKey='onboarding.restore.progress' values={{ done: String(!!restoration.done) }} components={[<Link to={`/jobs/${restoration.job}`} target='_blank' />]} />
              </small>
            )}
            {migration?.error && (
              <div sx={{ ...Update.styles.failure, marginBottom: 6 }}>{migration.error}</div>
            )}
            {migration?.job && (
              <small sx={{ display: 'block', textAlign: 'center', marginBottom: 6 }}>
                🚚 <Trans t={t} i18nKey='onboarding.restore.legacy' components={[<Link to={`/jobs/${migration.job}`} target='_blank' />]} />
              </small>
            )}
          </div>
        </div>
        <Splash step={steps.indexOf(current)} emblem={<div key={current.key} data-direction={direction} sx={Onboarding.styles.emblem}>{current.emblem}</div>} />
      </div>
    </div>
  )
}

Onboarding.styles = {
  // The panel comes first, so a phone opens on it, at the top of the page
  wrapper: {
    ...Splash.styles.wrapper,
    flexDirection: ['column', 'row-reverse'],
  },
  panel: {
    flex: 1,
    display: 'flex',
    overflowY: ['visible', 'auto'],
  },
  content: {
    width: '100%',
    maxWidth: '40em',
    margin: 'auto',
    paddingX: 4,
    paddingY: 4,
  },
  step: {
    padding: '1em 0 2em 0',
    "h2[tabindex='-1']:focus": {
      outline: 'none',
    },
    '&[data-direction="next"]': {
      animation: `${STEP.next} 400ms ${EASING} both`,
    },
    '&[data-direction="previous"]': {
      animation: `${STEP.previous} 400ms ${EASING} both`,
    },
    '@media (prefers-reduced-motion: reduce)': {
      '&[data-direction]': {
        animationName: `${STEP.fade}`,
      },
    },
  },
  emblem: {
    flex: 1,
    display: 'flex',
    animation: `${STEP.rise} 400ms ${EASING} both`,
    '@media (prefers-reduced-motion: reduce)': {
      animationName: `${STEP.fade}`,
    },
  },
  file: {
    variant: 'input.default',
    fontFamily: 'monospace',
    '::file-selector-button': {
      marginRight: 6,
      paddingY: 8,
      paddingX: 4,
      fontFamily: 'body',
      fontWeight: 'semibold',
      fontSize: 5,
      color: 'text',
      background: 'none',
      border: '0.125em solid',
      borderColor: 'grayDark',
      borderRadius: '0.25em',
      cursor: 'pointer',
      transition: 'border-color 200ms ease-in-out',
    },
    ':hover::file-selector-button': {
      borderColor: 'grayDarker',
    },
    ':active::file-selector-button': {
      borderColor: 'grayDarkest',
    },
  },
  recap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginTop: 4,
    marginBottom: 6,
    'h4': {
      margin: 12,
      marginBottom: 8,
    },
    'ul': {
      listStyleType: 'none',
      padding: 12,
      margin: 12,
    },
  },
  next: {
    backgroundColor: 'grayLighter',
    border: '1px solid',
    borderColor: 'grayDark',
    borderRadius: '0.25em',
    '>li': {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 6,
      paddingX: 4,
      paddingY: 8,
      '&:not(:last-of-type)': {
        borderBottom: '1px solid',
        borderColor: 'gray',
      },
      code: {
        fontFamily: 'monospace',
        fontWeight: 'semibold',
      },
    },
  },
  todo: {
    '>li': {
      display: 'grid',
      gridTemplateColumns: ['1fr auto', 'auto 1fr auto'],
      alignItems: 'center',
      columnGap: 6,
      paddingY: 10,
      '&:not(:last-of-type)': {
        borderBottom: '1px solid',
        borderColor: 'gray',
      },
      '>:nth-child(2)': {
        gridRow: [2, 'auto'],
      },
      '>button': {
        gridRow: ['1 / span 2', 'auto'],
        gridColumn: [2, 'auto'],
      },
    },
  },
  missing: {
    margin: 12,
    color: 'grayDarkest',
    fontSize: 6,
  },
  set: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    'h4': {
      marginBottom: 12,
      marginRight: 6,
    },
  },
  setup: {
    variant: 'button.reset',
    paddingY: 8,
    paddingX: 6,
    marginRight: -6,
    justifySelf: 'end',
    color: 'primary',
    fontWeight: 'semibold',
    fontSize: 5,
    ':hover': {
      color: 'accent',
    },
  },
  // Read by a screen reader, the dots say nothing to it
  hidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    marginTop: 4,
  },
}

export default Onboarding
