import React, { useCallback, useEffect, useState } from 'react'
import { Label, Button } from '@sensorr/ui'
import { useOutletContext } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { countries, flag, name } from 'country-emoji'
import cl from 'country-language'
import { useConfigContext } from '../../contexts/Config/Config'

const TMDB = ({ ...props }) => {
  const { onSave } = useOutletContext() as any
  const { config } = useConfigContext()
  const form = useForm({ defaultValues: config.getProperties() })
  const [regions, setRegions] = useState([])

  useEffect(() => {
    (async () => {
      const regions = (await Promise.all(
        Object.keys(countries).map(country => new Promise(resolve => cl.getCountryLanguages(country, (err, languages) => {
          if (!err && languages && languages.length && languages[0].iso639_1) {
            resolve({ country, language: languages[0].iso639_1, emoji: flag(country), name: name(country) })
          } else {
            resolve(null)
          }
        })))
      )).filter(region => region)

      setRegions(regions)
    })()
  }, [])

  return (
    <section>
      <article>
        <h2>TMDB</h2>
        <p>Sensorr is powered by <a href='https://www.themoviedb.org/' target='_blank' rel='noopener noreferrer'>The Movie Database</a> API, to works properly, you will need to configure a few settings,</p>
        <form onSubmit={form.handleSubmit(onSave)}>
          <div sx={{ display: 'flex', flexDirection: 'column', paddingY: 8 }}>
            <Controller
              name='tmdb'
              control={form.control}
              rules={{ required: true }}
              render={({ field: { ref, ...field } }) => (
                <Label label='API Key'>
                  <input type='text' {...field} sx={{ variant: 'input.default', fontFamily: 'monospace', width: '100%' }} required={true} />
                </Label>
              )}
            />
            <small sx={{ disply: 'block', marginTop: 6 }}><a href='https://www.themoviedb.org/signup' target='_blank' rel='noopener noreferrer'>Sign up</a> and fill <a href='https://www.themoviedb.org/settings/api' target='_blank' rel='noopener noreferrer'>your own <code>API Key</code> (v3 auth)</a></small>
          </div>
          <div sx={{ display: 'flex', flexDirection: 'column', paddingY: 8 }}>
            <Controller
              name='region'
              rules={{ required: true }}
              control={form.control}
              render={({ field: { ref, ...field } }) => (
                <Label label='Region'>
                  <select {...field} sx={{ variant: 'select.default' }}>
                    {regions.sort((a, b) => a.name.localeCompare(b.name)).map(region => (
                      <option key={region.country} value={`${region.language}-${region.country}`}>
                        {region.name} {region.emoji}
                      </option>
                    ))}
                  </select>
                </Label>
              )}
            />
            <small sx={{ disply: 'block', marginTop: 6 }}>Region will be used to show <a href='https://developer.themoviedb.org/docs/languages' target='_blank' rel='noopener noreferrer'>localized data and metadata</a> from TMDB</small>
          </div>
          <div sx={{ display: 'flex', marginTop: 4 }}>
            <Button type='submit' color='primary' sx={{ flex: 1 }}>Save</Button>
          </div>
        </form>
      </article>
    </section>
  )
}

export default TMDB
