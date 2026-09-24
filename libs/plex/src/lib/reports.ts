// Undocumented: the GraphQL endpoint Plex Web itself calls for the admin's "Report an Issue..." feed
// (https://support.plex.tv/articles/share-and-report/). Plex can change it without notice.
const COMMUNITY_API_URL = 'https://community.plex.tv/api'

const QUERY = `query getReportedIssues($first: PaginationInt!, $after: String) {
  reports(first: $first, after: $after) {
    nodes { id message url date user { username } }
    pageInfo { hasNextPage endCursor }
  }
}`

export type Report = { id: string, message: string, date: number, username: string, server: string, key: string }

// `url` reads `server://<machineIdentifier>/com.plexapp.plugins.library/library/metadata/<ratingKey>`
export const parseReport = ({ id, message, url, date, user }): Report => {
  const [, server, key] = (url || '').match(/^server:\/\/([^/]+)\/[^/]+(\/library\/metadata\/\d+)$/) || []
  return { id, message, date: Date.parse(date), username: user?.username || null, server: server || null, key: key || null }
}

// Newest first. Stops paging at the first report not newer than `since`.
export const getReports = async (token: string, since = 0): Promise<Report[]> => {
  const reports = []
  let after = null

  do {
    const res = await fetch(COMMUNITY_API_URL, {
      method: 'POST',
      headers: { 'x-plex-token': token, 'content-type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { first: 50, after } }),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      throw new Error(`Unable to fetch Plex reported issues (HTTP ${res.status})`)
    }

    const { data, errors } = (await res.json()) as { data?: any, errors?: { message: string }[] }

    if (errors?.length) {
      throw new Error(`Unable to fetch Plex reported issues (${errors.map(({ message }) => message).join(', ')})`)
    }

    if (!data?.reports?.nodes) {
      throw new Error('Unable to read Plex reported issues, the response has no reports')
    }

    const page = data.reports.nodes.map(parseReport)
    reports.push(...page.filter(({ date }) => date > since))
    after = data.reports.pageInfo.hasNextPage && data.reports.pageInfo.endCursor !== after && page.every(({ date }) => date > since) ? data.reports.pageInfo.endCursor : null
  } while (after)

  return reports
}
