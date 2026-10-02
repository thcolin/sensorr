import { useResponsiveValue } from '@sensorr/utils'

export const useLayoutFields = (layout, fields, custom = {}) => {
  const gridTemplateAreas = useResponsiveValue(Array.isArray(layout?.gridTemplateAreas) ? layout.gridTemplateAreas : [layout?.gridTemplateAreas])

  if (!layout?.gridTemplateAreas) {
    return {}
  }

  return (gridTemplateAreas as any)
    .replaceAll('"', '')
    .replaceAll('\n', '')
    .split(' ')
    .filter((name) => !!name && !!fields[name])
    .reduce((acc, name) => ({ ...acc, [name]: fields[name] }), { ...custom })
}
