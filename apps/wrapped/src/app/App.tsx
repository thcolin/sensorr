import { useCallback, useEffect, useState } from 'react'
import type { Wrapped, WrappedTheme } from '@sensorr/sensorr'
import i18n, { LANGUAGES, languageOf } from '@sensorr/i18n/wrapped'
import { useTranslation } from 'react-i18next'
import { WrappedPage } from './Wrapped'
import { known, read } from './look'
import { DEFAULT_THEME, STATES } from './themes'
import type { NoticeProps, StatesModule } from './themes/types'

export interface Share {
  name: string
  // The Plex server's name, null when Tautulli did not give it
  server: string | null
  // Tautulli's name of each viewer the wrapped matches with
  names: Record<number, string>
  year: number
  editions: number[]
  frozen: boolean
  // The look the page opens with, and whether the friend may switch it
  // `looks`: the ones Thomas offers, the switch lists no other
  look: { theme: WrappedTheme, choice: boolean, looks?: WrappedTheme[] }
  // The language and the TMDB region set in Sensorr, the page speaks the friend's browser language before the region
  language?: string
  region?: string
  wrapped: Wrapped
}

type State = { status: 'loading' } | { status: 'gone' } | { status: 'error' } | { status: 'done', share: Share }

// The page's <base href>: `/wrapped/`, or `/sensorr/wrapped/` in the demo
const BASE = new URL(document.baseURI).pathname

const tokenOf = (path: string) => {
  try {
    return decodeURIComponent(path.slice(BASE.length).split('/')[0] || '')
  } catch (error) {
    // A mangled link is a link that leads nowhere, the page says so
    return ''
  }
}

const token = tokenOf(window.location.pathname)
// `/wrapped/<token>/<year>` opens that edition, a bare link the one shown now
const asked = window.location.pathname.slice(BASE.length).split('/')[1] || ''
const year = /^\d{4}$/.test(asked) ? Number(asked) : null
// The look this link last showed on this device, so the wait and the notices already wear it
const shown = read('shown', token)
// The API's browser asks for a card in the language the friend's page speaks: `?lang=`, over everything else
const lang = new URLSearchParams(window.location.search).get('lang')
const forced = lang && LANGUAGES.includes(lang) ? lang : null
forced && i18n.changeLanguage(forced)

// Before any look is known, the wait belongs to none of them
const Waiting = () => {
  const { t } = useTranslation()
  return (
    <main className="waiting" aria-busy="true">
      <p className="visually-hidden">{t('wrapped.loading')}</p>
    </main>
  )
}

const States = ({ notice }: { notice?: NoticeProps }) => {
  // A notice on a device that never showed a look asks the server for the one Thomas set
  const [theme, setTheme] = useState<WrappedTheme | null>(shown)
  const [states, setStates] = useState<StatesModule | null>(null)

  useEffect(() => {
    if (notice && !theme) {
      fetch('/api/wrapped/look')
        .then((res) => res.ok ? res.json() : Promise.reject(new Error(`${res.status}`)))
        .then(({ theme }) => setTheme(known(theme) ? theme : DEFAULT_THEME))
        .catch((error) => {
          console.error('Unable to load the default look', error)
          setTheme(DEFAULT_THEME)
        })
    }
  }, [notice, theme])

  useEffect(() => {
    if (theme) {
      document.documentElement.dataset.theme = theme
      STATES[theme]().then(setStates, (error) => console.error(`Unable to load the "${theme}" look`, error))
    }
  }, [theme])

  if (!states) {
    return <Waiting />
  }

  return notice ? <states.Notice {...notice} /> : <states.Loading />
}

export const App = () => {
  const { t } = useTranslation()
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = useCallback(async () => {
    setState({ status: 'loading' })

    try {
      const res = token ? await fetch(`/api/wrapped/share/${encodeURIComponent(token)}${year ? `?year=${year}` : ''}`) : null

      if (!res || res.status === 404) {
        return setState({ status: 'gone' })
      }

      if (!res.ok) {
        throw new Error(`${res.status}`)
      }

      const share: Share = await res.json()

      // A year turned off, or one this friend has nothing in, opened another: the address stops naming it
      if (asked && share.year !== year) {
        window.history.replaceState(null, '', `${BASE}${encodeURIComponent(token)}${window.location.search}${window.location.hash}`)
      }

      await i18n.changeLanguage(forced || languageOf({ language: share.language, region: share.region }))
      document.title = i18n.t('wrapped.title', { name: share.name, year: share.year })
      setState({ status: 'done', share })
    } catch (error) {
      console.error('Unable to load the wrapped', error)
      setState({ status: 'error' })
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  switch (state.status) {
    case 'loading':
      return <States />
    case 'gone':
      return <States notice={{ lines: t('wrapped.notices.gone.lines').split('\n'), text: t('wrapped.notices.gone.text') }} />
    case 'error':
      return <States notice={{ lines: t('wrapped.notices.error.lines').split('\n'), text: t('wrapped.notices.error.text'), action: { label: t('wrapped.notices.error.retry'), onClick: load } }} />
    case 'done':
      return <WrappedPage share={state.share} token={token} />
  }
}

export default App
