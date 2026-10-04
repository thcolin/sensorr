import { useCallback } from 'react'
import { nanoid } from 'nanoid'
import { useConfigContext } from '../../contexts/Config/Config'
import { useSaveConfig } from '../../pages/Settings/Settings'
import { listsOf } from '../../pages/Home/rows'

export const useManualLists = (media: 'movie' | 'tv') => {
  const { config } = useConfigContext()
  const onSave = useSaveConfig()
  const lists = listsOf(config).filter((list) => list.media === media && list.sources.some(({ kind }) => kind === 'manual'))

  const create = useCallback(async (name: string) => {
    const id = nanoid(8)
    await onSave({ lists: [...listsOf(config), { id, name, media, sources: [{ kind: 'manual' }] }] })
    return id
  }, [config, media])

  const idsOf = useCallback(async (values: { value: string, label: string, __isNew__?: boolean }[]) => {
    const ids = []

    for (const value of values || []) {
      ids.push(value.__isNew__ ? await create(value.value) : value.value)
    }

    return ids
  }, [create])

  return { lists, idsOf }
}

export const useListsAction = (media: 'movie' | 'tv', apply: (key: string, value: any, question: string) => Promise<any>, selection: string) => {
  const { lists, idsOf } = useManualLists(media)

  return {
    key: 'lists',
    icon: '🗂️',
    label: 'Lists',
    options: [
      ...lists.map((list) => ({ value: list.id, label: list.name })),
      { value: '', label: 'New list…' },
    ],
    onChange: async ({ value, label }) => {
      const name = value ? label : window.prompt(`Name of the list to add ${selection} to`)?.trim()

      if (!name) {
        return
      }

      const [id] = value ? [value] : await idsOf([{ value: name, label: name, __isNew__: true }])
      await apply('lists', (current) => [...new Set([...(current?.lists || []), id])], `Do you want to add ${selection} to "${name}"?`)
    },
  }
}
