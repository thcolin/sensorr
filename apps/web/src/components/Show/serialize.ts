// A range left where it starts sends nothing: its lower bound would drop every show TMDB gives no value for
export const untouched = (field) => ({
  ...field,
  serialize: (key, raw) => JSON.stringify(raw) === JSON.stringify(field.initial) ? {} : field.serialize(key, raw),
})

// A checkbox gives its values, a select its options
export const multi = (key, raw) => raw?.values?.length ? { [key]: raw.values.map(value => value?.value ?? value).join({ or: '|', and: ',' }[raw.behavior]) } : {}

export const statuses = (key, raw) => raw?.values?.length ? { status: raw.values.join('|') } : {}
