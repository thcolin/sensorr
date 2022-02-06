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
  prefer: {
    znab?: string[],
    source?: string[],
    encoding?: string[],
    resolution?: string[],
    language?: string[],
    dub?: string[],
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
