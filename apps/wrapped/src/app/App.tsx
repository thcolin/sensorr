import { useCallback, useEffect, useState } from 'react'
import type { Wrapped } from '@sensorr/sensorr'
import { Programme } from './Programme'
import { Sheet, Lettering } from './Sheet'

export interface Share {
  name: string
  year: number
  editions: number[]
  frozen: boolean
  wrapped: Wrapped
}

type State = { status: 'loading' } | { status: 'gone' } | { status: 'error' } | { status: 'done', share: Share }

const token = decodeURIComponent(window.location.pathname.replace(/^\/wrapped\/?/, '').split('/')[0] || '')

export const App = () => {
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = useCallback(async () => {
    setState({ status: 'loading' })

    try {
      const res = token ? await fetch(`/api/wrapped/share/${encodeURIComponent(token)}`) : null

      if (!res || res.status === 404) {
        return setState({ status: 'gone' })
      }

      if (!res.ok) {
        throw new Error(`${res.status}`)
      }

      const share: Share = await res.json()
      document.title = `Programme de ${share.name} ${share.year}`
      setState({ status: 'done', share })
    } catch (error) {
      setState({ status: 'error' })
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  switch (state.status) {
    case 'loading':
      return (
        <main className="wall" aria-busy="true">
          <Sheet className="sheet-loading">
            <svg className="loading-stroke" viewBox="0 0 200 40" aria-hidden="true">
              <path d="M6 28 C 40 6, 70 34, 104 18 S 170 8, 194 22" />
            </svg>
            <p className="visually-hidden">Chargement du programme</p>
          </Sheet>
        </main>
      )
    case 'gone':
      return (
        <main className="wall">
          <Sheet className="sheet-notice">
            <Lettering as="h1" text="Séance annulée" />
            <p className="notice">Ce lien n'est plus valable. Demande-en un nouveau à Thomas.</p>
          </Sheet>
        </main>
      )
    case 'error':
      return (
        <main className="wall">
          <Sheet className="sheet-notice">
            <Lettering as="h1" text="La projection a sauté" />
            <p className="notice">Le programme n'a pas pu se charger. Vérifie ta connexion, puis relance.</p>
            <button className="retry" type="button" onClick={load}>Relancer</button>
          </Sheet>
        </main>
      )
    case 'done':
      return <Programme share={state.share} token={token} />
  }
}

export default App
