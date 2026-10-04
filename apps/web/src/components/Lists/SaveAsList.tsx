import { useState } from 'react'
import { nanoid } from 'nanoid'
import CreatableSelect from 'react-select/creatable'
import { Option, Select } from '@sensorr/ui'
import { emojize } from '@sensorr/utils'
import { useConfigContext } from '../../contexts/Config/Config'
import { useSaveConfig } from '../../pages/Settings/Settings'
import { HomeKey, List, Row, listRowId, listsOf } from '../../pages/Home/rows'

const HOMES: { [home in HomeKey]: string } = { all: 'Browser', movie: 'Movies', tv: 'TV' }

export const saveAsListOf = (kind: 'discover' | 'library', media: 'movie' | 'tv') => {
  // One field: a name typed makes a new list, offered first, a list picked gets the filters as one more source
  const SaveAsList = ({ values }: { values: { [key: string]: any } }) => {
    const { config } = useConfigContext()
    const onSave = useSaveConfig()
    const lists: List[] = listsOf(config).filter((list) => list.media === media)
    const [choice, setChoice] = useState<{ value: string, label: string, __isNew__?: boolean } | null>(null)
    const [pins, setPins] = useState<HomeKey[]>(['all', media])
    const [saving, setSaving] = useState(false)

    const options = lists.map((list) => ({ value: list.id, label: list.name }))
    const name = choice?.label?.trim()

    const save = async () => {
      const all = listsOf(config)
      const home: { [home in HomeKey]: Row[] } = config.get('home')
      const source = { kind, values }
      const id = nanoid(8)

      setSaving(true)

      try {
        await onSave(choice.__isNew__ ? {
          lists: [...all, { id, name, media, sources: [source] }],
          home: Object.fromEntries(pins.map((key) => [key, [...home[key], { id: listRowId({ id } as List), hidden: false }]])),
        } : {
          lists: all.map((list) => list.id === choice.value ? { ...list, sources: [...list.sources, source] } : list),
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
        <label htmlFor={`save-as-list-${kind}`} sx={SaveAsList.styles.label}>{emojize('🗂️', 'Save as list')}</label>
        <div sx={SaveAsList.styles.field}>
          <Select
            inputId={`save-as-list-${kind}`}
            classNamePrefix='save-as-list'
            components={{ root: CreatableSelect }}
            options={options}
            value={choice}
            onChange={(option: any) => setChoice(option?.label?.trim() ? option : null)}
            placeholder={options.length ? 'Name a new list, or pick one' : 'Name a new list'}
            formatCreateLabel={(input: string) => `New list "${input}"`}
            createOptionPosition='first'
            noOptionsMessage={() => 'Type a name to make a list'}
            menuPlacement='top'
          />
          <button type='button' disabled={!name || saving} aria-busy={saving} title={!name ? 'Name a new list, or pick one' : choice.__isNew__ ? `Create "${name}"` : `Add these filters to "${name}"`} onClick={save}>
            Save
          </button>
        </div>
        {choice?.__isNew__ && (
          <div sx={SaveAsList.styles.pins}>
            <span>Pin on</span>
            {(['all', media] as HomeKey[]).map((key) => (
              <Option
                key={key}
                id={`save-as-list-pin-${key}`}
                type='checkbox'
                checked={pins.includes(key)}
                onChange={() => setPins((pins) => pins.includes(key) ? pins.filter((pin) => pin !== key) : [...pins, key])}
              >
                {HOMES[key]}
              </Option>
            ))}
          </div>
        )}
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
    pins: {
      marginTop: 8,
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      columnGap: 4,
      rowGap: 8,
      fontSize: 5,
    },
  }

  return SaveAsList
}
