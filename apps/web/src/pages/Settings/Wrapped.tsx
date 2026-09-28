import { Controller, useFieldArray, UseFormReturn } from 'react-hook-form'
import { Button, Option } from '@sensorr/ui'
import { editionOf, lookOf, WRAPPED_THEME_NAMES, WRAPPED_TIME_ZONE, WrappedTheme } from '@sensorr/sensorr'

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
export const LookSelect = ({ value, fallback, onChange, label }: { value: WrappedTheme | null, fallback: WrappedTheme, onChange: (theme: WrappedTheme | null) => void, label: string }) => (
  <select aria-label={label} value={value ?? ''} onChange={(event) => onChange((event.target.value || null) as WrappedTheme | null)} sx={{ variant: 'select.default' }} data-custom={value !== null || undefined}>
    <option value=''>{inherit(fallback)}</option>
    {THEMES.map((theme) => <option key={theme} value={theme}>{WRAPPED_THEME_NAMES[theme]}</option>)}
  </select>
)

export const ChoiceSelect = ({ value, fallback, onChange, label }: { value: boolean | null, fallback: boolean, onChange: (choice: boolean | null) => void, label: string }) => (
  <select aria-label={label} value={value === null ? '' : String(value)} onChange={(event) => onChange(event.target.value === '' ? null : event.target.value === 'true')} sx={{ variant: 'select.default' }} data-custom={value !== null || undefined}>
    <option value=''>{inheritChoice(fallback)}</option>
    <option value='true'>Can switch</option>
    <option value='false'>Fixed</option>
  </select>
)

type Edition = { year: number, theme: WrappedTheme | null, choice: boolean | null }

// What a friend without a look of their own gets on the current edition, from the values being edited
export const useFallback = (form: UseFormReturn<any>) => {
  const global = { theme: form.watch('wrapped.theme') as WrappedTheme, choice: form.watch('wrapped.choice') as boolean }
  const rows = (form.watch('wrapped.editions') || []) as Edition[]
  return { global, rows, fallback: lookOf({ global, edition: rows.find(({ year }) => year === editionOf(Date.now() / 1000, WRAPPED_TIME_ZONE)) }) }
}

// The looks everyone gets and each year's own, saved with the config
export const WrappedLooks = ({ form, onSave }: { form: UseFormReturn<any>, onSave: (data: any) => void }) => {
  const editions = useFieldArray({ name: 'wrapped.editions', control: form.control })
  const { global, rows } = useFallback(form)
  const years = rows.map(({ year }) => year)
  const current = editionOf(Date.now() / 1000, WRAPPED_TIME_ZONE)
  const next = years.includes(current) ? Math.max(...years) + 1 : current

  return (
    <form onSubmit={form.handleSubmit(onSave)}>
      <Controller
        name='wrapped.theme'
        control={form.control}
        render={({ field: { value, onChange } }) => (
          <div role='radiogroup' aria-label='Look' sx={WrappedLooks.styles.looks}>
            {THEMES.map((theme) => (
              <label key={theme} sx={WrappedLooks.styles.look} data-checked={value === theme || undefined}>
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
      <h4 sx={WrappedLooks.styles.subtitle}>By year</h4>
      {!editions.fields.length && <p><small>Every year wears the look above.</small></p>}
      {editions.fields.map((edition, index) => (
        <div key={edition.id} sx={WrappedLooks.styles.row}>
          <strong>{rows[index]?.year}</strong>
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
          <button type='button' sx={WrappedLooks.styles.remove} onClick={() => editions.remove(index)} title={`Back to the default look for ${rows[index]?.year}`} aria-label={`Back to the default look for ${rows[index]?.year}`}>
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' style={{ transform: 'rotate(45deg)' }} aria-hidden='true'>
              <path fill='currentColor' d='M24 10h-10v-10h-4v10h-10v4h10v10h4v-10h10z' />
            </svg>
          </button>
        </div>
      ))}
      <Button type='button' color='primary' variant='contain' sx={{ width: '100%', marginTop: 6 }} onClick={() => editions.append({ year: next, theme: null, choice: null })}>
        Add a look for {next}
      </Button>
      <div sx={{ display: 'flex', marginTop: 2 }}>
        <Button type='submit' color='primary' sx={{ flex: 1 }}>Save</Button>
      </div>
    </form>
  )
}

WrappedLooks.styles = {
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
      fontSize: [6, 5],
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
  subtitle: {
    marginTop: 4,
    marginBottom: 8,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: ['1fr auto', '4rem 1fr 1fr auto'],
    alignItems: 'center',
    gap: 4,
    paddingY: 8,
    borderBottom: '1px solid',
    borderColor: 'grayDark',
    '>strong': {
      fontFamily: 'monospace',
    },
    '>select': {
      gridColumn: ['1 / -1', 'auto'],
      '&[data-custom]': {
        borderColor: 'primary',
      },
    },
  },
  // The remove button of Settings › Indexers
  remove: {
    variant: 'button.reset',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    minWidth: '2.5rem',
    minHeight: '2.5rem',
    gridRow: [1, 'auto'],
    gridColumn: [2, 'auto'],
    borderRadius: '0.25em',
    paddingX: 6,
    backgroundColor: 'error',
    color: 'whitePure',
    cursor: 'pointer',
    '>svg': {
      height: '0.75em',
      width: '0.75em',
    },
    '&:hover': {
      backgroundColor: 'errorDarker',
    },
    '&:active': {
      backgroundColor: 'errorDarkest',
    },
  },
}
