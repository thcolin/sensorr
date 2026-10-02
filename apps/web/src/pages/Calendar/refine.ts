import { utils } from '@sensorr/tmdb'

const { SELF } = utils

// TMDB discover can filter neither on the job of a person nor, with `primary_release_date`, on the release type,
// and drops a movie of unknown runtime from any `with_runtime.gte` above 0
export const refinementsOf = ({
  with_release_type,
  with_credits_departments,
  with_credits_order,
  'with_runtime.gte': runtime_gte,
  'with_runtime.lte': runtime_lte,
  ...params
}: Record<string, any>) => [params, { with_release_type, with_credits_departments, with_credits_order, runtime_gte, runtime_lte }]

// `order` is the best billing of a followed person in a real part, judged against the billing asked for without fetching again
export const summarize = (details, followed) => {
  const orders = (details.credits?.cast || [])
    .filter(credit => followed[credit.id] && !SELF.test(credit.character || ''))
    .map(credit => credit.order)

  return {
    runtime: details.runtime || 0,
    types: [...new Set<number>((details.release_dates?.results || []).flatMap(({ release_dates }) => release_dates.map(({ type }) => type)))],
    order: orders.length ? Math.min(...orders) : null,
    departments: [...new Set<string>((details.credits?.crew || [])
      .filter(credit => followed[credit.id])
      .map(credit => credit.department))],
  }
}

export const departmentsOf = (summary, with_credits_order?: string | number) => [
  ...(summary.order !== null && (!with_credits_order || summary.order < Number(with_credits_order)) ? ['Acting'] : []),
  ...summary.departments,
]

const split = (raw?: string) => (typeof raw === 'string' ? raw : '').split(/[|,]/).filter(Boolean)

export const judge = (summary, { with_release_type, with_credits_departments, with_credits_order, runtime_gte, runtime_lte }: {
  with_release_type?: string,
  with_credits_departments?: string,
  with_credits_order?: string | number,
  runtime_gte?: string | number,
  runtime_lte?: string | number,
}) => {
  if (!summary) {
    return true
  }

  if (summary.runtime > 0 && (summary.runtime < Number(runtime_gte || 0) || summary.runtime > Number(runtime_lte || Infinity))) {
    return false
  }

  const types = split(with_release_type).map(Number)
  const matches = (type) => summary.types.includes(type)

  if (types.length && !(String(with_release_type).includes(',') ? types.every(matches) : types.some(matches))) {
    return false
  }

  const departments = split(with_credits_departments)
  return !departments.length || departmentsOf(summary, with_credits_order).some(department => departments.includes(department))
}
