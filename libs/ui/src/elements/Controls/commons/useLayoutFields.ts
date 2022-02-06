import { useResponsiveValue } from '@theme-ui/match-media'

export const useLayoutFields = (layout, fields, custom = {}) => {
  if (!layout?.gridTemplateAreas) {
    return {}
  }

  const gridTemplateAreas = useResponsiveValue(Array.isArray(layout.gridTemplateAreas) ? layout.gridTemplateAreas : [layout.gridTemplateAreas])

  return (gridTemplateAreas as any)
    .replaceAll('"', '')
    .replaceAll('\n', '')
    .split(' ')
    .filter((name) => !!name && !!fields[name])
    .reduce((acc, name) => ({ ...acc, [name]: fields[name] }), { ...custom })
}
