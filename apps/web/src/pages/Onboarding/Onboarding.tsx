import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { keyframes } from '@emotion/react'
import { TMDB } from '@sensorr/tmdb'
import { Badge, Button, Icon, Option, Steps, Warning } from '@sensorr/ui'
import { JOBS } from '@sensorr/sensorr'
import { useTitle } from '@sensorr/utils'
import { useAPI } from '../../store/api'
import { useConfigContext } from '../../contexts/Config/Config'
import { LoadingBar } from '../../layout/LoadingBar'
import { Emblem, Splash } from '../KeepInTouch/KeepInTouch'
import { useSaveConfig } from '../Settings/Settings'
import { TMDBFields, TMDBIntro } from '../Settings/TMDB'
import { ZnabsFields, ZnabsIntro, znabsOf } from '../Settings/Znabs'
import { BlackholeFields, BlackholeIntro } from '../Settings/Blackhole'
import { PoliciesFields, PoliciesIntro, policiesOf } from '../Settings/Policies'
import { PLEX_STEPS, usePlexLink } from '../Settings/Plex'
import JobsSettings, { JobsFields, JobsIntro } from '../Settings/Jobs'
import { errorOf, MailFields, MailIntro } from '../Settings/Mail'
import { FriendsIntro } from '../Settings/Friends'
import Update from '../Settings/Update'
import { hasTMDBKey, TMDB_PLACEHOLDER } from './needsOnboarding'
import { policyExamplesOf } from './policyExamples'

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
    return /Invalid TMDB API key/.test(err.message) ? err.message : null
  }
}

const Welcome = ({ config, legacy, setLegacy, archive, setArchive }) => (
  <>
    {config.get('onboarding.defaultPassword') && (
      <p sx={{ ...Update.styles.warning, marginBottom: 6 }}>
        <strong>Warning</strong>, the password is still <code sx={{ variant: 'code.reset' }}>sensorr</code>: change <code sx={{ variant: 'code.reset' }}>SENSORR_PASSWORD</code> in the <code sx={{ variant: 'code.reset' }}>.env</code> of your install folder, then run <code sx={{ variant: 'code.reset' }}>docker compose up -d</code> there
      </p>
    )}
    <div sx={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Option type='radio' id='onboarding-fresh' name='onboarding-origin' checked={!legacy} onChange={() => setLegacy(false)}>
        <div sx={{ lineHeight: 'normal', paddingY: 10 }}>
          <strong>New instance</strong>
          <br />
          <small>Start from an empty library</small>
        </div>
      </Option>
      <Option type='radio' id='onboarding-legacy' name='onboarding-origin' checked={legacy} onChange={() => setLegacy(true)}>
        <div sx={{ lineHeight: 'normal', paddingY: 10 }}>
          <strong>From a 0.x</strong>
          <br />
          <small>Bring the movies and stars of a Sensorr 0.x over</small>
        </div>
      </Option>
    </div>
    {legacy && (
      <div sx={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 6 }}>
        {config.get('onboarding.legacy') && (
          <small>
            Its <code>config.json</code> was converted at boot: {(config.get('znabs') || []).length} indexers and its policy are already set, Plex has to be linked again
          </small>
        )}
        <input
          type='file'
          accept='.zip,application/zip'
          aria-label='0.x dump'
          onChange={(e) => setArchive(e.target.files?.[0] || null)}
          sx={Onboarding.styles.file}
        />
        <small>
          The <code>.zip</code> the <strong>Dump</strong> button of a 0.x gives, in <code>Settings &#x3E; Database</code>. {archive ? `It is imported once TMDB answers, follow it in Jobs.` : ''}
        </small>
      </div>
    )}
  </>
)

// What a step left in the config, read again on the recap: a Continue on an empty step sets nothing
const statusOf = (key, config) => {
  const count = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`
  const jobs = Object.entries(JOBS).flatMap(([command, types]) => types.length ? types.map((type) => `jobs.${command}.${type}`) : [`jobs.${command}`])

  switch (key) {
    case 'tmdb':
      return hasTMDBKey(config) ? 'set' : null
    case 'indexers':
      return (config.get('znabs') || []).length ? count(config.get('znabs').length, 'indexer') : null
    case 'policies':
      return (config.get('policies') || []).length ? count(config.get('policies').length, 'policy').replace('policys', 'policies') : null
    case 'blackhole':
      return config.get('blackhole') ? 'set' : null
    case 'plex':
      return config.get('plex.token') ? 'linked' : null
    case 'friends':
      return (config.get('mail.host') && config.get('mail.from') && config.get('mail.url')) ? 'mail set' : null
    case 'jobs':
      return `${jobs.filter((job) => !config.get(`${job}.paused`)).length} / ${jobs.length} on`
  }
}

const End = ({ steps, config, go }) => (
  <ul sx={Onboarding.styles.recap}>
    {steps.map(({ key, emoji, label }, index) => ({ key, emoji: key === 'plex' ? PLEX_STEPS.url.emoji : emoji, label, index, status: statusOf(key, config) })).filter(({ key }) => !['welcome', 'end'].includes(key)).map(({ key, emoji, label, index, status }) => (
      <li key={key}>
        <span>{emoji} <strong>{label}</strong></span>
        <Badge
          emoji={null}
          label={status || 'skipped'}
          compact={true}
          size='small'
          palette={status ? { color: 'primaryDarkest', backgroundColor: 'whitePure' } : undefined}
        />
        {status ? <span /> : (
          <button type='button' onClick={() => go(index)} sx={Onboarding.styles.setup}>Set up ›</button>
        )}
      </li>
    ))}
  </ul>
)

const Onboarding = () => {
  useTitle('Onboarding')
  const api = useAPI()
  const navigate = useNavigate()
  const { config } = useConfigContext()
  const save = useSaveConfig()
  const form = useForm({ defaultValues: { ...config.getProperties(), tmdb: hasTMDBKey(config) ? config.get('tmdb') : '', znabs: znabsOf(config), policies: policiesOf(config) } })
  const [step, setStep] = useState(() => {
    try {
      return Number(sessionStorage.getItem(STEP_KEY)) || 0
    } catch (err) {
      return 0
    }
  })
  const [direction, setDirection] = useState('next')
  const [pending, setPending] = useState(false)
  const [legacy, setLegacy] = useState(!!config.get('onboarding.legacy'))
  const [archive, setArchive] = useState(null)
  const [migration, setMigration] = useState(null)
  const [tmdbError, setTMDBError] = useState(null)
  const plex = usePlexLink()
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

  const steps = [
    {
      key: 'welcome',
      label: 'Welcome',
      emblem: <Brand />,
      emoji: '👋',
      title: 'Welcome',
      subtitle: 'A few steps get this Sensorr searching: TMDB, your indexers, where releases go. Only TMDB is required, and everything stays in Settings afterwards',
      content: <Welcome config={config} legacy={legacy} setLegacy={setLegacy} archive={archive} setArchive={setArchive} />,
      submit: async () => {
        if (hasTMDBKey(config)) {
          await migrate()
        }
      },
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
        const error = (!values.tmdb || values.tmdb === TMDB_PLACEHOLDER) ? 'A TMDB API key is required' : await checkTMDB(values.tmdb)
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
      label: 'Indexers',
      emblem: <EmojiEmblem emoji='🔎' label='Indexers' />,
      emoji: '🔎',
      title: 'Indexers',
      settings: '/settings/indexers',
      subtitle: <ZnabsIntro />,
      skippable: true,
      form: (footer) => <div sx={{ width: '100%', textAlign: 'left' }}><ZnabsFields form={form} onSubmit={next}>{footer}</ZnabsFields></div>,
      submit: save,
    },
    {
      key: 'policies',
      label: 'Policies',
      emblem: <EmojiEmblem emoji='🚨' label='Policies' />,
      emoji: '🚨',
      title: 'Policies',
      settings: '/settings/policies',
      subtitle: <PoliciesIntro />,
      skippable: true,
      form: (footer) => <div sx={{ width: '100%', textAlign: 'left' }}><PoliciesFields form={form} onSubmit={next} examples={policyExamplesOf(form.watch('region'))}>{footer}</PoliciesFields></div>,
      submit: save,
    },
    {
      key: 'blackhole',
      label: 'Blackhole',
      emblem: <EmojiEmblem emoji='🕳️' label='Blackhole' />,
      emoji: '🕳️',
      title: 'Blackhole',
      settings: '/settings/blackhole',
      subtitle: <BlackholeIntro />,
      skippable: true,
      content: <BlackholeFields form={form} />,
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
          toast.error('Link your Plex server, or skip this step')
          throw new Error('Plex not linked')
        }
      },
    },
    {
      key: 'friends',
      label: 'Friends',
      emblem: <EmojiEmblem emoji='🍻' label='Friends' />,
      emoji: '🍻',
      title: 'Friends',
      settings: '/settings/friends',
      subtitle: <FriendsIntro />,
      skippable: true,
      content: (
        <>
          <p>
            Share <a href={`${document.location.origin}/keep-in-touch`} target='_blank' rel='noreferrer noopener'>{document.location.origin}/keep-in-touch</a> with them, or set up Mail below to invite them from <code>Settings &#x3E; Friends</code>.
          </p>
          <h3>Mail</h3>
          <p><MailIntro /></p>
          <MailFields form={form} />
        </>
      ),
      submit: save,
    },
    {
      key: 'jobs',
      label: 'Jobs',
      emblem: <EmojiEmblem emoji='⏰' label='Jobs' />,
      emoji: '⏰',
      title: 'Jobs',
      settings: '/settings/jobs',
      subtitle: <JobsIntro />,
      skippable: true,
      content: <div sx={JobsSettings.styles.element}><JobsFields form={form} /></div>,
      submit: save,
    },
    {
      key: 'end',
      label: 'Ready',
      emblem: <Brand />,
      emoji: '📼',
      title: 'Ready',
      subtitle: 'What Sensorr knows now. Set up › goes back to a step, and everything stays in Settings',
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
        <Button type='button' color='gray' variant='outline' onClick={() => go(step - 1)} disabled={pending}>Back</Button>
      )}
      <span sx={{ flex: 1 }} />
      {current.skippable && (
        <Button type='button' color='gray' variant='outline' onClick={skip} disabled={pending}>Skip</Button>
      )}
      <Button type='submit' color='primary' disabled={pending}>
        {last ? 'Open Sensorr' : 'Continue'}
      </Button>
    </div>
  )

  return (
    <div sx={Splash.styles.page}>
      <LoadingBar />
      <div sx={Onboarding.styles.wrapper}>
        <div sx={Onboarding.styles.panel}>
          <div sx={Onboarding.styles.content}>
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
            {migration?.error && (
              <div sx={{ ...Update.styles.failure, marginBottom: 6 }}>{migration.error}</div>
            )}
            {migration?.job && (
              <small sx={{ display: 'block', textAlign: 'center', marginBottom: 6 }}>
                🚚 The 0.x dump is being imported, follow it in <Link to={`/jobs/${migration.job}`} target='_blank'>Jobs</Link>
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
    listStyleType: 'none',
    padding: 12,
    margin: 12,
    marginBottom: 6,
    '>li': {
      display: 'grid',
      gridTemplateColumns: '1fr auto 6em',
      alignItems: 'center',
      gap: 6,
      paddingY: 8,
      borderBottom: '1px solid',
      borderColor: 'gray',
    },
  },
  setup: {
    variant: 'button.reset',
    justifySelf: 'end',
    color: 'primary',
    fontWeight: 'semibold',
    fontSize: 5,
    ':hover': {
      color: 'accent',
    },
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
