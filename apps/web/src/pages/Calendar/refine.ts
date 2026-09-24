// TMDB discover can filter neither on the job of a person nor, with `primary_release_date`, on the release type
export const SELF = /^(self|himself|herself|themselves)\b|\(archive/i

export const summarize = (details, followed) => ({
  runtime: details.runtime || 0,
  types: [...new Set<number>((details.release_dates?.results || []).flatMap(({ release_dates }) => release_dates.map(({ type }) => type)))],
  departments: [...new Set<string>([
    ...(details.credits?.cast || [])
      .filter(credit => followed[credit.id] && credit.order < 10 && !SELF.test(credit.character || ''))
      .map(() => 'Acting'),
    ...(details.credits?.crew || [])
      .filter(credit => followed[credit.id])
      .map(credit => credit.department),
  ])],
})

const split = (raw?: string) => (typeof raw === 'string' ? raw : '').split(/[|,]/).filter(Boolean)

export const judge = (summary, { with_release_type, with_credits_departments }: { with_release_type?: string, with_credits_departments?: string }) => {
  if (!summary) {
    return true
  }

  if (summary.runtime > 0 && summary.runtime < 40) {
    return false
  }

  const types = split(with_release_type).map(Number)
  const matches = (type) => summary.types.includes(type)

  if (types.length && !(String(with_release_type).includes(',') ? types.every(matches) : types.some(matches))) {
    return false
  }

  const departments = split(with_credits_departments)
  return !departments.length || summary.departments.some(department => departments.includes(department))
}
