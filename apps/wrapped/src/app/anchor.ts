// The page sets <base href="/wrapped/">, so a bare "#id" would resolve to /wrapped/#id and drop the token
export const anchor = (id: string) => `${window.location.pathname}${window.location.search}#${id}`
