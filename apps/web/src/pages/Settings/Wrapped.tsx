import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Button, Option } from '@sensorr/ui'
import { editionOf, lookOf, WRAPPED_THEME_NAMES, WRAPPED_TIME_ZONE, WrappedTheme } from '@sensorr/sensorr'
import { useTitle } from '@sensorr/utils'
import { useConfigContext } from '../../contexts/Config/Config'
import { useGuestsContext } from '../../contexts/Guests/Guests'
import { useAPI } from '../../store/api'
import Body from '../../layout/Body/Body'

const THEMES = Object.keys(WRAPPED_THEME_NAMES) as WrappedTheme[]

// A glimpse of each look, drawn here so no friend's poster or name ever ships in the repo
const Glimpse = ({ theme }: { theme: WrappedTheme }) => {
  switch (theme) {
    case 'affiche':
      return (
        <svg viewBox='0 0 120 80' aria-hidden='true'>
          <rect width='120' height='80' fill='#b8955a' />
          <path d='M14 8 L52 6 L54 46 L12 48 Z' fill='#241a2e' />
          <path d='M60 12 L100 10 L104 52 L62 54 Z' fill='#5c4668' />
          <path d='M34 30 L70 28 L72 66 L32 68 Z' fill='#b3221a' />
          <path d='M16 70 Q60 58 104 70' stroke='#241a2e' strokeWidth='6' fill='none' strokeLinecap='round' />
        </svg>
      )
    case 'labo':
      return (
        <svg viewBox='0 0 120 80' aria-hidden='true'>
          <rect width='120' height='80' fill='#120c08' />
          {Array.from({ length: 8 }, (_, index) => <rect key={`l${index}`} x='4' y={4 + index * 10} width='6' height='5' fill='#3b2b1e' />)}
          {Array.from({ length: 8 }, (_, index) => <rect key={`r${index}`} x='110' y={4 + index * 10} width='6' height='5' fill='#3b2b1e' />)}
          <rect x='18' y='6' width='84' height='32' fill='#ff4b1f' />
          <circle cx='60' cy='22' r='12' fill='none' stroke='#120c08' strokeWidth='2' />
          <rect x='18' y='44' width='26' height='30' fill='#6b5540' />
          <rect x='47' y='44' width='26' height='30' fill='#8a6d4f' />
          <rect x='76' y='44' width='26' height='30' fill='#6b5540' />
          <ellipse cx='60' cy='59' rx='16' ry='13' fill='none' stroke='#e8321c' strokeWidth='2' />
        </svg>
      )
    case 'tele':
      return (
        <svg viewBox='0 0 120 80' aria-hidden='true'>
          <rect width='120' height='80' fill='#f4efe4' />
          <rect x='10' y='8' width='70' height='16' fill='#e2081c' />
          <rect x='80' y='8' width='30' height='16' fill='#ffd200' />
          {['#f4efe4', '#ffd200', '#5fb7cf', '#3aa35b', '#b0489c', '#e2081c', '#1537a8'].map((color, index) => <rect key={color} x={10 + index * 14.3} y='32' width='14.3' height='30' fill={color} />)}
          <rect x='10' y='32' width='100' height='30' fill='none' stroke='#16140f' strokeWidth='2' />
          <rect x='10' y='66' width='60' height='5' fill='#16140f' />
        </svg>
      )
    case 'videoclub':
      return (
        <svg viewBox='0 0 120 80' aria-hidden='true'>
          <rect width='120' height='80' fill='#17122b' />
          <rect x='22' y='8' width='76' height='14' rx='2' fill='#f7f1de' />
          <path d='M26 38 Q34 28 42 38 T58 38 T74 38 T90 38' stroke='#3ef2ff' strokeWidth='3' fill='none' strokeLinecap='round' />
          {['#c3242b', '#1c4fb8', '#1e8a4a', '#e3a21a', '#6c2bb3', '#d9531e', '#c3242b', '#1c4fb8'].map((color, index) => <rect key={index} x={20 + index * 10} y='50' width='8' height='22' fill={color} />)}
          <rect x='14' y='72' width='92' height='4' fill='#5b3a22' />
        </svg>
      )
    case 'scenario':
      return (
        <svg viewBox='0 0 120 80' aria-hidden='true'>
          <rect width='120' height='80' fill='#2b2622' />
          <rect x='30' y='4' width='60' height='76' fill='#fbfaf5' />
          <circle cx='35' cy='20' r='1.8' fill='#2b2622' />
          <circle cx='35' cy='60' r='1.8' fill='#2b2622' />
          <rect x='44' y='14' width='32' height='4' fill='#1b1a17' />
          <rect x='50' y='24' width='20' height='3' fill='#fff06a' />
          {[36, 42, 48, 54].map((y) => <rect key={y} x='42' y={y} width={y === 48 ? 24 : 36} height='2' fill='#9a968c' />)}
          <rect x='62' y='64' width='18' height='2' fill='#1b1a17' />
        </svg>
      )
  }
}

const inherit = (theme: WrappedTheme) => `Default · ${WRAPPED_THEME_NAMES[theme]}`
const inheritChoice = (choice: boolean) => `Default · ${choice ? 'can switch' : 'fixed'}`

// '' stands for « keep the default » in a select, null in the config and the API
const LookSelect = ({ value, fallback, onChange, label }: { value: WrappedTheme | null, fallback: WrappedTheme, onChange: (theme: WrappedTheme | null) => void, label: string }) => (
  <select aria-label={label} value={value ?? ''} onChange={(event) => onChange((event.target.value || null) as WrappedTheme | null)} sx={{ variant: 'select.default' }} data-custom={value !== null || undefined}>
    <option value=''>{inherit(fallback)}</option>
    {THEMES.map((theme) => <option key={theme} value={theme}>{WRAPPED_THEME_NAMES[theme]}</option>)}
  </select>
)

const ChoiceSelect = ({ value, fallback, onChange, label }: { value: boolean | null, fallback: boolean, onChange: (choice: boolean | null) => void, label: string }) => (
  <select aria-label={label} value={value === null ? '' : String(value)} onChange={(event) => onChange(event.target.value === '' ? null : event.target.value === 'true')} sx={{ variant: 'select.default' }} data-custom={value !== null || undefined}>
    <option value=''>{inheritChoice(fallback)}</option>
    <option value='true'>Can switch</option>
    <option value='false'>Fixed</option>
  </select>
)

type Look = { wrapped_theme: WrappedTheme | null, wrapped_choice: boolean | null }
type Friend = Look & { viewer: number | null, username: string | null }

const Wrapped = () => {
  useTitle('Settings - Wrapped')
  const api = useAPI()
  const { onSave } = useOutletContext() as any
  const { config } = useConfigContext()
  const { guests } = useGuestsContext() as any
  const form = useForm({ defaultValues: config.getProperties() })
  const editions = useFieldArray({ name: 'wrapped.editions', control: form.control })
  const [looks, setLooks] = useState<Record<string, Friend> | null>(null)
  const [changed, setChanged] = useState<Record<string, Look>>({})
  const [failed, setFailed] = useState(false)

  const global = { theme: form.watch('wrapped.theme') as WrappedTheme, choice: form.watch('wrapped.choice') as boolean }
  const rows = form.watch('wrapped.editions') as { year: number, theme: WrappedTheme | null, choice: boolean | null }[]
  const years = rows.map(({ year }) => year)
  const current = editionOf(Date.now() / 1000, WRAPPED_TIME_ZONE)
  const next = years.includes(current) ? Math.max(...years) + 1 : current
  // What a friend without a look of their own gets this year
  const fallback = lookOf({ global, edition: rows.find(({ year }) => year === current) })

  const fetchLooks = useCallback(() => {
    setFailed(false)
    const { uri, params, init } = api.query.wrapped.getGuests()
    api.fetch(uri, params, init)
      .then((results) => setLooks(results.reduce((acc, guest) => ({ ...acc, [guest.email]: guest }), {})))
      .catch((err) => {
        console.warn(err)
        setFailed(true)
      })
  }, [])

  useEffect(fetchLooks, [guests])

  const setLook = (email: string, look: Partial<Look>) => setChanged((changed) => ({
    ...changed,
    [email]: { wrapped_theme: looks![email].wrapped_theme, wrapped_choice: looks![email].wrapped_choice, ...changed[email], ...look },
  }))

  const save = form.handleSubmit(async (data) => {
    await onSave(data)
    const entries = Object.entries(changed)

    try {
      await Promise.all(entries.map(([email, { wrapped_theme, wrapped_choice }]) => {
        const { uri, params, init } = api.query.wrapped.postLook({ body: { email, theme: wrapped_theme, choice: wrapped_choice } })
        return api.fetch(uri, params, init)
      }))
      setLooks((looks) => ({ ...looks, ...Object.fromEntries(entries.map(([email, look]) => [email, { ...looks![email], ...look }])) }))
      setChanged({})
    } catch (err) {
      console.warn(err)
      toast.error('Error while saving the looks of the friends, try again')
    }
  })

  const friends = Object.values(guests || {}).filter((guest: any) => looks?.[guest.email]?.viewer) as any[]

  return (
    <Body>
      <section>
        <article>
          <h2>Wrapped</h2>
          <p>The look of each friend's wrapped, the yearly page of what they watched on Plex. Pick the look everyone gets, change it for a year, then for a friend.</p>
          <form onSubmit={save}>
            <h3>Look</h3>
            <Controller
              name='wrapped.theme'
              control={form.control}
              render={({ field: { value, onChange } }) => (
                <div role='radiogroup' aria-label='Look' sx={Wrapped.styles.looks}>
                  {THEMES.map((theme) => (
                    <label key={theme} sx={Wrapped.styles.look} data-checked={value === theme || undefined}>
                      <input type='radio' name='wrapped.theme' value={theme} checked={value === theme} onChange={() => onChange(theme)} />
                      <Glimpse theme={theme} />
                      <span>{WRAPPED_THEME_NAMES[theme]}</span>
                    </label>
                  ))}
                </div>
              )}
            />
            <Controller
              name='wrapped.choice'
              control={form.control}
              render={({ field: { value: checked, onChange } }) => (
                <Option type='checkbox' id='wrapped.choice' checked={checked} onChange={(e: any) => onChange(e.target.checked)}>
                  <div sx={{ lineHeight: 'normal', paddingY: 10 }}>
                    <strong>Friends can switch to another look</strong>
                    <br />
                    <small>On their page, and their device remembers it</small>
                  </div>
                </Option>
              )}
            />

            <h3>By year</h3>
            {!editions.fields.length && <p><small>Every year wears the look above.</small></p>}
            {editions.fields.map((edition, index) => (
              <div key={edition.id} sx={Wrapped.styles.row}>
                <strong>{rows[index]?.year} edition</strong>
                <Controller
                  name={`wrapped.editions.${index}.theme`}
                  control={form.control}
                  render={({ field: { value, onChange } }) => <LookSelect label={`Look of the ${rows[index]?.year} edition`} value={value ?? null} fallback={global.theme} onChange={onChange} />}
                />
                <Controller
                  name={`wrapped.editions.${index}.choice`}
                  control={form.control}
                  render={({ field: { value, onChange } }) => <ChoiceSelect label={`Whether friends switch on the ${rows[index]?.year} edition`} value={value ?? null} fallback={global.choice} onChange={onChange} />}
                />
                <button type='button' sx={Wrapped.styles.remove} onClick={() => editions.remove(index)} aria-label={`Back to the default look for ${rows[index]?.year}`}>
                  Remove
                </button>
              </div>
            ))}
            <button type='button' sx={Wrapped.styles.add} onClick={() => editions.append({ year: next, theme: null, choice: null })}>
              + A look of its own for {next}
            </button>

            <h3>By friend</h3>
            {failed ? (
              <p>Unable to load the friends, <button type='button' sx={Wrapped.styles.link} onClick={fetchLooks}>retry</button></p>
            ) : !looks ? (
              <p aria-busy={true}>Looking for them in Tautulli...</p>
            ) : !friends.length ? (
              <p><small>No friend matches a Tautulli user yet, see Friends</small></p>
            ) : (
              friends.map((guest) => {
                const look = { ...looks[guest.email], ...changed[guest.email] }
                return (
                  <div key={guest.email} sx={Wrapped.styles.row}>
                    <div sx={Wrapped.styles.friend} title={guest.email}>
                      <strong>{looks[guest.email].username || guest.name}</strong>
                      {looks[guest.email].username && <small>{guest.name}</small>}
                    </div>
                    <LookSelect label={`Look of ${guest.name}`} value={look.wrapped_theme ?? null} fallback={fallback.theme} onChange={(wrapped_theme) => setLook(guest.email, { wrapped_theme })} />
                    <ChoiceSelect label={`Whether ${guest.name} can switch`} value={look.wrapped_choice ?? null} fallback={fallback.choice} onChange={(wrapped_choice) => setLook(guest.email, { wrapped_choice })} />
                    <span />
                  </div>
                )
              })
            )}

            <div sx={{ display: 'flex', marginTop: 8 }}>
              <Button type='submit' color='primary' sx={{ flex: 1 }}>Save</Button>
            </div>
          </form>
        </article>
      </section>
    </Body>
  )
}

Wrapped.styles = {
  looks: {
    display: 'grid',
    gridTemplateColumns: ['repeat(3, 1fr)', 'repeat(5, 1fr)'],
    gap: 6,
    marginY: 8,
  },
  look: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: 4,
    border: '2px solid',
    borderColor: 'grayDark',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    '>input': {
      position: 'absolute',
      opacity: 0,
      pointerEvents: 'none',
    },
    '>svg': {
      display: 'block',
      width: '100%',
      height: 'auto',
      borderRadius: '0.125rem',
    },
    '>span': {
      fontWeight: 'semibold',
      textAlign: 'center',
    },
    ':hover': {
      borderColor: 'gray',
    },
    '&[data-checked]': {
      borderColor: 'primary',
    },
    ':has(input:focus-visible)': {
      outline: '2px solid',
      outlineColor: 'primary',
      outlineOffset: 2,
    },
  },
  row: {
    display: 'grid',
    gridTemplateColumns: ['1fr auto', 'minmax(8rem, 1fr) 2fr 2fr 5rem'],
    alignItems: 'center',
    gap: 4,
    paddingY: 8,
    borderBottom: '1px solid',
    borderColor: 'grayDark',
    '>strong': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '>select': {
      gridColumn: ['1 / -1', 'auto'],
      '&[data-custom]': {
        borderColor: 'primary',
      },
    },
  },
  friend: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    '>*': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '>small': {
      color: 'grayDarkest',
    },
  },
  remove: {
    variant: 'button.reset',
    minHeight: '2.5rem',
    paddingX: 6,
    color: 'grayDarkest',
    ':hover, :focus-visible': {
      color: 'error',
    },
    gridRow: [1, 'auto'],
    gridColumn: [2, 'auto'],
    cursor: 'pointer',
  },
  add: {
    variant: 'button.reset',
    marginY: 8,
    paddingY: 8,
    color: 'primary',
    fontWeight: 'semibold',
    cursor: 'pointer',
  },
  link: {
    variant: 'button.reset',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
}

export default Wrapped
