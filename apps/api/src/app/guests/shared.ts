// The Plex account ids in the XML of `plex.tv/api/users`, the users a Plex server is shared with
export const sharedIdsOf = (xml: string) => new Set([...xml.matchAll(/<User [^>]*\bid="(\d+)"/g)].map(([, id]) => Number(id)))
