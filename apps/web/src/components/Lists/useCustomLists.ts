import { useCallback } from 'react'
import { nanoid } from 'nanoid'
import { useTranslation } from 'react-i18next'
import { useConfigContext } from '../../contexts/Config/Config'
import { useSaveConfig } from '../../pages/Settings/Settings'
import { listsOf } from '../../pages/Home/rows'

export const useCustomLists = (media: 'movie' | 'tv') => {
  const { config } = useConfigContext()
  const onSave = useSaveConfig()
  const lists = listsOf(config).filter((list) => list.media === media && list.sources.some(({ kind }) => kind === 'custom'))

  // The ids picked in a creatable select: the names typed become custom lists, all in one write of the config
  const idsOf = useCallback(async (values: { value: string, label: string, __isNew__?: boolean }[]) => {
    const made = (values || []).filter(({ __isNew__ }) => __isNew__).map(({ value }) => ({ id: nanoid(8), name: value, media, sources: [{ kind: 'custom' as const }] }))

    if (made.length) {
      await onSave({ lists: [...listsOf(config), ...made] })
    }

    return (values || []).map((value) => value.__isNew__ ? made.find(({ name }) => name === value.value).id : value.value)
  }, [config, media])

  return { lists, idsOf }
}

export const useListsAction = (media: 'movie' | 'tv', apply: (key: string, value: any, question: string | null) => Promise<any>, selection: string) => {
  const { t } = useTranslation()
  const { lists, idsOf } = useCustomLists(media)

  return {
    key: 'lists',
    icon: '🗂️',
    label: t('lists.action.label'),
    options: [
      ...lists.map((list) => ({ value: list.id, label: list.name })),
      { value: '', label: t('lists.action.new') },
    ],
    onChange: async ({ value, label }) => {
      const name = value ? label : window.prompt(t('lists.action.prompt', { selection }))?.trim()

      if (!name) {
        return
      }

      // A list with a policy hands it to them, and an archived movie is refined again with it
      const policy = lists.find((list) => list.id === value)?.policy
      const handed = policy ? t('lists.action.policy', { policy, media }) : ''

      // Asked before a new list is made, so a refusal leaves no empty list behind
      if (!window.confirm([t('lists.action.confirm', { selection, name }), handed].filter(Boolean).join(' '))) {
        return
      }

      const [id] = value ? [value] : await idsOf([{ value: name, label: name, __isNew__: true }])
      await apply('lists', (current) => [...new Set([...(current?.lists || []), id])], null)
    },
  }
}
