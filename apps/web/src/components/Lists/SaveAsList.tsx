import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { Button, Option, Select } from '@sensorr/ui'
import { emojize } from '@sensorr/utils'
import { useConfigContext } from '../../contexts/Config/Config'
import { useSaveConfig } from '../../pages/Settings/Settings'
import { HomeKey, List, Row, listRowId, listsOf } from '../../pages/Home/rows'

const HOMES: { [home in HomeKey]: string } = { all: 'Browser', movie: 'Movies', tv: 'TV' }

export const saveAsListOf = (kind: 'discover' | 'library', media: 'movie' | 'tv') => {
  const SaveAsList = ({ values }: { values: { [key: string]: any } }) => {
    const { config } = useConfigContext()
    const location = useLocation()
    const onSave = useSaveConfig()
    const lists: List[] = listsOf(config).filter((list) => list.media === media)
    const editing = (location.state as any)?.editing
    const edited = lists.find((list) => list.id === editing?.list && list.sources[editing?.source]?.kind === kind)
    const [mode, setMode] = useState<'new' | 'add' | 'replace'>(edited ? 'replace' : 'new')
    const [name, setName] = useState('')
    const [target, setTarget] = useState(lists[0]?.id || '')
    const [pins, setPins] = useState<HomeKey[]>(['all', media])
    const [saving, setSaving] = useState(false)

    const options = lists.map((list) => ({ value: list.id, label: list.name }))
    const source = { kind, values }
    const disabled = saving || (mode === 'new' && !name.trim()) || (mode === 'add' && !target)

    const save = async () => {
      const all = listsOf(config)
      const home: { [home in HomeKey]: Row[] } = config.get('home')
      const id = nanoid(8)

      const next = {
        new: () => [...all, { id, name: name.trim(), media, sources: [source] }],
        add: () => all.map((list) => list.id === target ? { ...list, sources: [...list.sources, source] } : list),
        replace: () => all.map((list) => list.id === edited.id ? { ...list, sources: list.sources.map((other, index) => index === editing.source ? source : other) } : list),
      }[mode]()

      setSaving(true)

      try {
        await onSave({
          lists: next,
          ...(mode === 'new' ? {
            home: Object.fromEntries(pins.map((key) => [key, [...home[key], { id: listRowId({ id } as List), hidden: false }]])),
          } : {}),
        })

        setName('')
      } catch (e) {
        // The toast of `useSaveConfig` tells the failure, the panel keeps what was typed
      } finally {
        setSaving(false)
      }
    }

    return (
      <section sx={SaveAsList.styles.element} aria-labelledby={`save-as-list-${kind}`}>
        <h3 id={`save-as-list-${kind}`}>{emojize('🗂️', 'Save as list')}</h3>
        {edited && (
          <Option id='save-as-list-replace' type='radio' name='save-as-list' checked={mode === 'replace'} onChange={() => setMode('replace')}>
            Replace source {editing.source + 1} of <strong>{edited.name}</strong>
          </Option>
        )}
        <Option id='save-as-list-new' type='radio' name='save-as-list' checked={mode === 'new'} onChange={() => setMode('new')}>
          New list
        </Option>
        {mode === 'new' && (
          <div sx={SaveAsList.styles.nested}>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                // Enter submits the panel, which applies: here it saves
                if (e.key === 'Enter') {
                  e.preventDefault()
                  !disabled && save()
                }
              }}
              placeholder='Name'
              aria-label='Name of the list'
              sx={SaveAsList.styles.input}
            />
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
          </div>
        )}
        <Option id='save-as-list-add' type='radio' name='save-as-list' checked={mode === 'add'} disabled={!lists.length} onChange={() => setMode('add')}>
          {lists.length ? 'Add to a list' : `Add to a list, none of ${media === 'movie' ? 'movies' : 'shows'} yet`}
        </Option>
        {mode === 'add' && (
          <div sx={SaveAsList.styles.nested}>
            <Select
              options={options}
              value={options.find((option) => option.value === target)}
              onChange={(option: any) => setTarget(option?.value)}
              isSearchable={false}
              menuPlacement='top'
            />
          </div>
        )}
        <Button type='button' variant='outline' disabled={disabled} aria-busy={saving} title={mode === 'new' && !name.trim() ? 'Name the list' : undefined} onClick={save} sx={SaveAsList.styles.button}>
          {emojize('💾', 'Save')}
        </Button>
      </section>
    )
  }

  SaveAsList.styles = {
    element: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginTop: 2,
      paddingY: 4,
      borderTop: '1px solid',
      borderColor: 'primaryDarker',
      whiteSpace: 'normal',
      '>h3': {
        margin: 12,
        marginBottom: 8,
        fontSize: 4,
        color: 'whitePure',
      },
    },
    nested: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      paddingLeft: 4,
    },
    input: {
      variant: 'input.reset',
      paddingX: 6,
      paddingY: 8,
      border: '1px solid',
      borderColor: 'inherit',
      borderRadius: '0.25rem',
      color: 'inherit',
      '::placeholder': {
        color: 'inherit',
        opacity: 0.7,
      },
      ':focus-visible': {
        outline: '2px solid',
        outlineColor: 'whitePure',
        outlineOffset: '-2px',
      },
    },
    pins: {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 4,
      fontSize: 5,
    },
    button: {
      alignSelf: 'flex-end',
      marginTop: 8,
    },
  }

  return SaveAsList
}
