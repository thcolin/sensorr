import { useCallback, useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Button, Icon, Option } from '@sensorr/ui'
import { WRAPPED_THEME_NAMES, WrappedTheme } from '@sensorr/sensorr'
import { useAPI } from '../../store/api'

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

type Edition = { year: number, theme?: WrappedTheme | null, enabled?: boolean }

// A year left out of the config is open and lets each friend pick their look, only the years changed are kept
const editionsWith = (editions: Edition[], year: number, change: Partial<Edition>) => {
  const edition = { ...editions.find((edition) => edition.year === year), ...change, year }
  const others = editions.filter((other) => other.year !== year)
  return (edition.enabled === false || edition.theme) ? [...others, { year, theme: edition.theme ?? null, enabled: edition.enabled !== false }].sort((a, b) => b.year - a.year) : others
}

// The looks a friend picks from, then each year Tautulli has plays for, open or not and with its look, saved with the config
export const WrappedLooks = ({ form, onSave }: { form: UseFormReturn<any>, onSave: (data: any) => void }) => {
  const api = useAPI()
  const [years, setYears] = useState<number[] | null>(null)
  const [failed, setFailed] = useState(false)
  const looks = (form.watch('wrapped.looks') || THEMES) as WrappedTheme[]
  const editions = (form.watch('wrapped.editions') || []) as Edition[]
  const offer = (theme: WrappedTheme, on: boolean) => form.setValue('wrapped.looks', THEMES.filter((other) => other === theme ? on : looks.includes(other)), { shouldDirty: true })
  const change = (year: number, change: Partial<Edition>) => form.setValue('wrapped.editions', editionsWith(editions, year, change), { shouldDirty: true })

  const fetchYears = useCallback(() => {
    setFailed(false)
    const { uri, params, init } = api.query.wrapped.getYears()
    api.fetch(uri, params, init)
      .then((years) => setYears([...years].sort((a, b) => b - a)))
      .catch((err) => {
        console.warn(err)
        setFailed(true)
      })
  }, [])

  useEffect(fetchYears, [])

  return (
    <form onSubmit={form.handleSubmit(onSave)}>
      <div sx={WrappedLooks.styles.looks}>
        {THEMES.map((theme) => (
          <div key={theme} sx={WrappedLooks.styles.cell} data-off={!looks.includes(theme) || undefined}>
            <div sx={WrappedLooks.styles.look}>
              <Glimpse theme={theme} />
              <span>{WRAPPED_THEME_NAMES[theme]}</span>
            </div>
            <div sx={WrappedLooks.styles.offer}>
              <Option
                type='checkbox'
                id={`wrapped.looks.${theme}`}
                checked={looks.includes(theme)}
                disabled={looks.length === 1 && looks.includes(theme)}
                title={looks.length === 1 && looks.includes(theme) ? 'At least one look stays offered' : undefined}
                onChange={(event: any) => offer(theme, event.target.checked)}
              >
                <small>{looks.includes(theme) ? 'Offered' : 'Off'}</small>
              </Option>
            </div>
          </div>
        ))}
      </div>
      <h4 sx={WrappedLooks.styles.subtitle}>Years <small>from Tautulli</small></h4>
      {failed ? (
        <p><small>Unable to load the years from Tautulli, <button type='button' sx={WrappedLooks.styles.retry} onClick={fetchYears}>retry</button></small></p>
      ) : !years ? (
        <p aria-busy={true}><small>Looking for them in Tautulli...</small></p>
      ) : !years.length ? (
        <p><small>No play imported from Tautulli yet, the 🎞️ wrapped job imports them.</small></p>
      ) : years.map((year) => {
        const edition = editions.find((edition) => edition.year === year)
        const enabled = edition?.enabled !== false
        const theme = edition?.theme ?? null

        return (
          <div key={year} sx={WrappedLooks.styles.row} data-off={!enabled || undefined}>
            <div sx={WrappedLooks.styles.tick} title={enabled ? `Friends can open their ${year}` : `Friends cannot open their ${year}`}>
              <Option type='checkbox' id={`wrapped.editions.${year}`} aria-label={`Open the ${year} wrapped`} checked={enabled} onChange={(event: any) => change(year, { enabled: event.target.checked })} />
            </div>
            <strong>{year}</strong>
            <label sx={WrappedLooks.styles.year}>
              <select aria-label={`Look of the ${year} wrapped`} value={theme ?? ''} disabled={!enabled} data-any={!theme || undefined} onChange={(event) => change(year, { theme: (event.target.value || null) as WrappedTheme | null })}>
                <option value=''>Any</option>
                {THEMES.filter((other) => looks.includes(other) || other === theme).map((other) => (
                  <option key={other} value={other}>{WRAPPED_THEME_NAMES[other]}{looks.includes(other) ? '' : ' · off, they pick'}</option>
                ))}
              </select>
              <Icon value='chevron' height='0.75em' width='0.75em' />
            </label>
          </div>
        )
      })}
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
  cell: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    '&[data-off] > div:first-of-type': {
      opacity: 0.45,
    },
  },
  offer: {
    display: 'flex',
    justifyContent: 'center',
    '>label:has(input:disabled)': {
      color: 'grayDarkest',
    },
  },
  look: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: 4,
    border: '2px solid',
    borderColor: 'grayDark',
    borderRadius: '0.25rem',
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
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 8,
    '>small': {
      marginLeft: 8,
      fontFamily: 'body',
      fontWeight: 'body',
      color: 'grayDarkest',
    },
  },
  // A year as a row of Settings › Indexers: on or off, the year, its look
  row: {
    display: 'flex',
    alignItems: 'stretch',
    minHeight: '2.75rem',
    marginBottom: 8,
    border: '1px solid',
    borderColor: 'grayDark',
    borderRadius: '0.25rem',
    overflow: 'hidden',
    '>*+*': {
      borderLeft: '1px solid',
      borderColor: 'grayDark',
    },
    '>strong': {
      display: 'flex',
      alignItems: 'center',
      paddingX: 6,
      backgroundColor: 'grayLight',
      fontFamily: 'monospace',
    },
    '&[data-off] >strong, &[data-off] select, &[data-off] svg': {
      color: 'grayDarker',
    },
  },
  // The look of a year, the select over the whole cell and the chevron of Icon at its end
  year: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: '0px',
    color: 'grayDarkest',
    '>select': {
      variant: 'select.reset',
      alignSelf: 'stretch',
      flex: 1,
      minWidth: '0px',
      paddingLeft: 6,
      paddingRight: 1,
      color: 'text',
      fontSize: 5,
      ':hover:not(:disabled)': {
        backgroundColor: 'grayLight',
      },
      '&[data-any]': {
        color: 'grayDarkest',
      },
    },
    '>svg': {
      position: 'absolute',
      right: 6,
      pointerEvents: 'none',
    },
  },
  tick: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.75rem',
    '>label': {
      marginY: 12,
    },
  },
  retry: {
    background: 'none',
    border: 'none',
    padding: 12,
    font: 'inherit',
    color: 'primary',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
}
