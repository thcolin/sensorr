import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { TMDB, certifications } from '@sensorr/tmdb'
import clanguages from 'country-language'
import cemoji from 'country-emoji'
import { Select, SelectProps } from '../../../../inputs/Select/Select'

export interface FilterTMDBResourceCommonsProps extends Omit<SelectProps, 'value' | 'onChange' | 'options' | 'loadOptions'> {
  value: { values: [], behavior: 'or' | 'and' }
  onChange: (value: any | ((value: any) => void)) => void
  tmdb: TMDB
}

export interface FilterTMDBResourceProps extends FilterTMDBResourceCommonsProps {
  uri: string,
}

const UIFilterTMDBResource = ({ uri, tmdb, value, onChange, ...props }: FilterTMDBResourceProps) => {
  const loadOptions = useCallback(
    async (query) => (await tmdb.fetch(uri, {
      query,
      sort_by: 'popularity.desc'
    })).results.map(result => ({ value: result.id, label: result.name })
  ), [uri])

  return (
    <Select
      {...props as any}
      loadOptions={loadOptions}
      value={value.values}
      onChange={values => onChange({ ...value, values })}
      behavior={value.behavior}
      onBehavior={behavior => onChange({ ...value, behavior })}
      multi={true}
      closeMenuOnSelect={true}
      isSearchable={true}
      isClearable={false}
      defaultOptions={true}
      cacheOptions={true}
      menuPlacement='auto'
    />
  )
}

export const FilterTMDBResource = memo(UIFilterTMDBResource)

export const FilterPeople = memo((props: FilterTMDBResourceCommonsProps) => {
  const { t } = useTranslation()

  return (
    <FilterTMDBResource
      uri='search/person'
      label={t('ui.filters.people')}
      noOptionsMessage={({ inputValue }) => !inputValue ? t('ui.select.custom.people') : t('ui.select.empty')}
      {...props}
    />
  )
})

export const FilterCrew = memo((props: FilterTMDBResourceCommonsProps) => {
  const { t } = useTranslation()

  return (
    <FilterTMDBResource
      uri='search/person'
      label={t('ui.filters.crew')}
      noOptionsMessage={({ inputValue }) => !inputValue ? t('ui.select.custom.crew') : t('ui.select.empty')}
      {...props}
    />
  )
})

export const FilterCast = memo((props: FilterTMDBResourceCommonsProps) => {
  const { t } = useTranslation()

  return (
    <FilterTMDBResource
      uri='search/person'
      label={t('ui.filters.cast')}
      noOptionsMessage={({ inputValue }) => !inputValue ? t('ui.select.custom.cast') : t('ui.select.empty')}
      {...props}
    />
  )
})

export const FilterCompanies = memo((props: FilterTMDBResourceCommonsProps) => {
  const { t } = useTranslation()

  return (
    <FilterTMDBResource
      uri='search/company'
      label={t('ui.filters.companies')}
      noOptionsMessage={({ inputValue }) => !inputValue ? t('ui.select.custom.companies') : t('ui.select.empty')}
      {...props}
    />
  )
})

export const FilterKeywords = memo((props: FilterTMDBResourceCommonsProps) => {
  const { t } = useTranslation()

  return (
    <FilterTMDBResource
      uri='search/keyword'
      label={t('ui.filters.keywords')}
      noOptionsMessage={({ inputValue }) => !inputValue ? t('ui.select.custom.keywords') : t('ui.select.empty')}
      {...props}
    />
  )
})

export const FilterLanguages = memo(({ value, onChange, ...props }: any) => {
  const { t } = useTranslation()

  return (
    <Select
      label={t('ui.filters.languages')}
      menuPlacement='auto'
      {...props as any}
      options={clanguages.getLanguages()
        .filter(language => language.iso639_1 && language.name?.length)
        .map(language => ({ value: language.iso639_1, label: language.name[0] }))
      }
      value={value.values}
      onChange={values => onChange({ ...value, values })}
      behavior={value.behavior}
      onBehavior={behavior => onChange({ ...value, behavior })}
      multi={true}
      closeMenuOnSelect={true}
      isSearchable={true}
      isClearable={false}
      defaultOptions={true}
    />
  )
})

export const FilterReleaseType = memo(({ value, onChange, ...props }: any) => {
  const { t } = useTranslation()

  return (
    <Select
      label={t('ui.filters.release_type')}
      menuPlacement='auto'
      {...props as any}
      options={[
        { value: 1, label: t('tmdb.release_type.premiere') },
        // { value: 2, label: t('tmdb.release_type.limited') },
        { value: 3, label: t('tmdb.release_type.theatrical') },
        { value: 4, label: t('tmdb.release_type.digital') },
        { value: 5, label: t('tmdb.release_type.physical') },
        { value: 6, label: t('tmdb.release_type.tv') },
      ]}
      value={value.values}
      onChange={values => onChange({ ...value, values })}
      behavior={value.behavior}
      onBehavior={behavior => onChange({ ...value, behavior })}
      multi={true}
      closeMenuOnSelect={true}
      isSearchable={true}
      isClearable={false}
      defaultOptions={true}
    />
  )
})

export const FilterCertification = memo(({ ...props }: any) => {
  const { t } = useTranslation()

  return (
    <Select
      label={t('ui.filters.certification')}
      menuPlacement='auto'
      {...props as any}
      options={Object.keys(certifications)
        .filter(country => cemoji.flag(country) && cemoji.name(country))
        .map(country => ({
          label: `${cemoji.flag(country)}  ${cemoji.name(country)}`,
          options: certifications[country]
            .sort((a, b) => a.order - b.order)
            .map(certification => ({
              value: { certification: certification.certification, certification_country: country },
              label: certification.certification,
            })),
        }))
      }
      closeMenuOnSelect={true}
      isSearchable={true}
      isClearable={false}
      defaultOptions={true}
    />
  )
})
