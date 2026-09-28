export interface Znab {
  name: string,
  url: string,
  key: string,
  disabled: boolean,
}

export interface Policy {
  name?: string,
  sorting: string,
  descending: boolean,
  match?: {
    original_languages?: string[],
  },
  prefer: {
    znab?: (string | string[])[],
    source?: (string | string[])[],
    encoding?: (string | string[])[],
    resolution?: (string | string[])[],
    language?: (string | string[])[],
    dub?: (string | string[])[],
    flags?: string[],
  },
  avoid?: {
    znab?: string[],
    source?: string[],
    encoding?: string[],
    resolution?: string[],
    language?: string[],
    dub?: string[],
    flag?: string[],
  },
}
