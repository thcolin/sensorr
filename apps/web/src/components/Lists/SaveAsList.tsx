import { useState } from 'react'
import { nanoid } from 'nanoid'
import { useTranslation } from 'react-i18next'
import CreatableSelect from 'react-select/creatable'
import { Select } from '@sensorr/ui'
import { useConfigContext } from '../../contexts/Config/Config'
import { useSaveConfig } from '../../pages/Settings/Settings'
import { List, listsOf } from '../../pages/Home/rows'

export const saveAsListOf = (kind: 'discover' | 'library', media: 'movie' | 'tv') => {
  // One field: a name typed makes a new list, offered first, a list picked gets the filters as one more source
  const SaveAsList = ({ values }: { values: { [key: string]: any } }) => {
    const { t } = useTranslation()
    const { config } = useConfigContext()
    const onSave = useSaveConfig()
    const lists: List[] = listsOf(config).filter((list) => list.media === media)
    const [choice, setChoice] = useState<{ value: string, label: string, __isNew__?: boolean } | null>(null)
    const [saving, setSaving] = useState(false)

    const options = lists.map((list) => ({ value: list.id, label: list.name }))
    const name = choice?.label?.trim()

    const save = async () => {
      const all = listsOf(config)
      const source = { kind, values }

      setSaving(true)

      try {
        // A new list shows on no Home: Settings › Home places it
        await onSave({
          lists: choice.__isNew__
            ? [...all, { id: nanoid(8), name, media, sources: [source] }]
            : all.map((list) => list.id === choice.value ? { ...list, sources: [...list.sources, source] } : list),
        })

        setChoice(null)
      } catch (e) {
        // The toast of `useSaveConfig` tells the failure, the panel keeps the choice
      } finally {
        setSaving(false)
      }
    }

    return (
      <section sx={SaveAsList.styles.element}>
        <label htmlFor={`save-as-list-${kind}`} sx={SaveAsList.styles.label}>{t('lists.saveAsList.label')}</label>
        <div sx={SaveAsList.styles.field}>
          <Select
            inputId={`save-as-list-${kind}`}
            classNamePrefix='save-as-list'
            components={{ root: CreatableSelect }}
            options={options}
            value={choice}
            onChange={(option: any) => setChoice(option?.label?.trim() ? option : null)}
            placeholder={options.length ? t('lists.saveAsList.placeholder') : t('lists.saveAsList.placeholderNew')}
            formatCreateLabel={(input: string) => t('lists.saveAsList.create', { name: input })}
            createOptionPosition='first'
            noOptionsMessage={() => t('lists.saveAsList.noOptions')}
            menuPlacement='top'
          />
          <button type='button' disabled={!name || saving} aria-busy={saving} title={!name ? t('lists.saveAsList.placeholder') : choice.__isNew__ ? t('lists.saveAsList.createTitle', { name }) : t('lists.saveAsList.addTitle', { name })} onClick={save}>
            {t('lists.saveAsList.save')}
          </button>
        </div>
      </section>
    )
  }

  SaveAsList.styles = {
    element: {
      display: 'flex',
      flexDirection: 'column',
      // The space between two fields of the panel
      marginTop: '2em',
      paddingBottom: 4,
      whiteSpace: 'normal',
    },
    // The label of the Select of the other fields
    label: {
      display: 'inline-flex',
      alignItems: 'center',
      paddingBottom: '1em',
      fontWeight: 'semibold',
    },
    // The field and its button as one, as the + of the metadata fields
    field: {
      display: 'flex',
      '.save-as-list__control': {
        borderTopRightRadius: '0px',
        borderBottomRightRadius: '0px',
      },
      '>button': {
        variant: 'button.reset',
        paddingX: 6,
        // The green of the footer of the panel
        backgroundColor: 'primaryDarker',
        color: 'whitePure',
        fontWeight: 'semibold',
        whiteSpace: 'nowrap',
        borderTopRightRadius: '0.25rem',
        borderBottomRightRadius: '0.25rem',
        '&:hover:not(:disabled)': {
          backgroundColor: 'primaryDarkest',
        },
        '&:disabled': {
          opacity: 0.6,
          cursor: 'default',
        },
      },
    },
  }

  return SaveAsList
}
