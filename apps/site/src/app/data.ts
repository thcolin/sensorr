import { useEffect, useState } from 'react'

// Written by `tools/site/films.ts`, see there for what each field holds
export type Meta = { resolution?: string, source?: string, encoding?: string, dub?: string, language?: string, group?: string }
export type Release = { title: string, size: number, seeders: number, valid: boolean, score: number, reason: string | null, meta: Meta }
export type Row = { axis: string, from?: string, to?: string, state: 'held' | 'broken' | 'moved' | 'quiet' | 'same' }
export type Diff = { rows: Row[], size: number }
export type Film = {
  id: number
  title: string
  year: number
  poster: string
  backdrop: string | null
  runtime: number
  genres: string[]
  director: { name: string, profile: string | null } | null
  candidates: Release[]
  owned: Release
  winner: Release
  shrink: Release
  replacement: Release
  refine: Diff
  shrinked: Diff
  reported: Diff
}
export type Show = { id: number, title: string, poster: string, year: number, seasons: { number: number, episodes: number }[], episodes: number }
export type Upcoming = { id: number, title: string, poster: string, date: string }
export type Axes = { [axis: string]: string[] }
export type Policy = { name: string, require: Axes, prefer: Axes, avoid: Axes }
export type Films = { policy: Policy, wall: string[], films: Film[], shows: Show[], upcoming: Upcoming[] }

export const DEMO = 'demo/'
export const WRAPPED = 'demo/wrapped/demo'
export const GITHUB = 'https://github.com/thcolin/sensorr'

// Next to the page, under its <base href>
let films: Promise<Films> | null = null
const filmsOf = () => (films ??= fetch(new URL('data/films.json', document.baseURI)).then((res) => res.ok
  ? res.json()
  : Promise.reject(new Error(`[Site] films.json answered ${res.status}`))))

// The films, and one of them drawn for this visit
export const useFilms = () => {
  const [state, setState] = useState<{ data: Films | null, film: Film | null, error: Error | null }>({ data: null, film: null, error: null })

  useEffect(() => {
    let live = true

    filmsOf()
      .then((data) => live && setState({ data, film: data.films[Math.floor(Math.random() * data.films.length)] || null, error: null }))
      .catch((error) => live && setState({ data: null, film: null, error }))

    return () => {
      live = false
    }
  }, [])

  return state
}
