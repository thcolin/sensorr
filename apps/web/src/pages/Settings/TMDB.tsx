import { useEffect, useState } from 'react'
import { Label, Button } from '@sensorr/ui'
import { useOutletContext } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { Controller, useForm } from 'react-hook-form'
import { countries, flag, name } from 'country-emoji'
import cl from 'country-language'
import { useConfigContext } from '../../contexts/Config/Config'
import Body from '../../layout/Body/Body'
import { useTitle } from '@sensorr/utils'

export const useRegions = () => {
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

  return regions
}

export const TMDBFields = ({ form, after = null }) => {
  const { t } = useTranslation()
  const regions = useRegions()

  return (
    <>
      <div sx={{ display: 'flex', flexDirection: 'column', paddingY: 8 }}>
        <Controller
          name='tmdb'
          control={form.control}
          rules={{ required: true }}
          render={({ field: { ref, ...field } }) => (
            <Label label={t('settings.tmdb.key.label')}>
              <input type='text' {...field} sx={{ variant: 'input.default', fontFamily: 'monospace', width: '100%' }} required={true} />
            </Label>
          )}
        />
        <small sx={{ disply: 'block', marginTop: 6 }}><Trans t={t} i18nKey='settings.tmdb.key.help' components={[<a href='https://www.themoviedb.org/signup' target='_blank' rel='noopener noreferrer' />, <a href='https://www.themoviedb.org/settings/api' target='_blank' rel='noopener noreferrer' />, <code />]} /></small>
        {after}
      </div>
      <div sx={{ display: 'flex', flexDirection: 'column', paddingY: 8 }}>
        <Controller
          name='region'
          rules={{ required: true }}
          control={form.control}
          render={({ field: { ref, ...field } }) => (
            <Label label={t('settings.tmdb.region.label')}>
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
        <small sx={{ disply: 'block', marginTop: 6 }}><Trans t={t} i18nKey='settings.tmdb.region.help' components={[<a href='https://developer.themoviedb.org/docs/languages' target='_blank' rel='noopener noreferrer' />]} /></small>
      </div>
    </>
  )
}

export const TMDBIntro = () => {
  const { t } = useTranslation()
  return <Trans t={t} i18nKey='settings.tmdb.intro' components={[<a href='https://www.themoviedb.org/' target='_blank' rel='noopener noreferrer' />]} />
}

const TMDB = ({ ...props }) => {
  const { t } = useTranslation()
  useTitle(t('settings.documentTitle', { page: t('settings.sections.tmdb') }))
  const { onSave } = useOutletContext() as any
  const { config } = useConfigContext()
  const form = useForm({ defaultValues: config.getProperties() })

  return (
    <Body>
      <section>
        <article>
          <h2>{t('settings.sections.tmdb')}</h2>
          <p><TMDBIntro /></p>
          <form onSubmit={form.handleSubmit(onSave)}>
            <TMDBFields form={form} />
            <div sx={{ display: 'flex', marginTop: 4 }}>
              <Button type='submit' color='primary' sx={{ flex: 1 }}>{t('settings.save.label')}</Button>
            </div>
          </form>
        </article>
      </section>
    </Body>
  )
}

export default TMDB
