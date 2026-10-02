import { useCallback, useEffect, useState } from 'react'
import type { Wrapped, WrappedTheme } from '@sensorr/sensorr'
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
  wrapped: Wrapped
}

type State = { status: 'loading' } | { status: 'gone' } | { status: 'error' } | { status: 'done', share: Share }

const tokenOf = (path: string) => {
  try {
    return decodeURIComponent(path.replace(/^\/wrapped\/?/, '').split('/')[0] || '')
  } catch (error) {
    // A mangled link is a link that leads nowhere, the page says so
    return ''
  }
}

const token = tokenOf(window.location.pathname)
// `/wrapped/<token>/<year>` opens that edition, a bare link the one shown now
const asked = window.location.pathname.replace(/^\/wrapped\/?/, '').split('/')[1] || ''
const year = /^\d{4}$/.test(asked) ? Number(asked) : null
// The look this link last showed on this device, so the wait and the notices already wear it
const shown = read('shown', token)

// Before any look is known, the wait belongs to none of them
const Waiting = () => (
  <main className="waiting" aria-busy="true">
    <p className="visually-hidden">Chargement de la rétrospective</p>
  </main>
)

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
        window.history.replaceState(null, '', `/wrapped/${encodeURIComponent(token)}${window.location.search}${window.location.hash}`)
      }

      document.title = `Rétrospective de ${share.name} ${share.year}`
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
      return <States notice={{ lines: ['Séance', 'annulée'], text: 'Ce lien n’est plus valable. Demande‑en un nouveau à Thomas.' }} />
    case 'error':
      return <States notice={{ lines: ['La projection', 'a sauté'], text: 'La rétrospective n’a pas pu se charger. Vérifie ta connexion, puis relance.', action: { label: 'Relancer', onClick: load } }} />
    case 'done':
      return <WrappedPage share={state.share} token={token} />
  }
}

export default App
