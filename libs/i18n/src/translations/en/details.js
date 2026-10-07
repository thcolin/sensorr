import { emojize } from '@sensorr/utils'

export default {
  collection: {
    saga: 'Saga',
    error: 'Sorry, unable to display collection...',
  },
  movie: {
    error: 'Sorry, unable to display movie...',
  },
  person: {
    error: 'Sorry, unable to display person...',
    genres: {
      documentary: 'Documentary',
      tvMovie: 'TV Movie',
    },
  },
  details: {
    contribute: 'Contribute to TheMovieDB',
    overview: {
      more: 'Show more',
      less: 'Show less',
    },
    poster: {
      state: 'State',
    },
    externals: {
      rottenTomatoes: 'Rotten Tomatoes Critic Rating from {count} reviews',
      metacritic: 'Metascore based on {count} critic reviews',
      plex: 'Available on your own Plex server',
      streaming: 'Available for streaming on {providers} (source JustWatch)',
      quoted: '"{name}"',
    },
    ticket: {
      searchMovie: 'Search releases for this movie from your indexers',
      searchShow: 'Search releases for this show from your indexers',
      searchFor: 'Search for',
      releases: 'Releases',
    },
    preferences: {
      policy: 'Sensorr will apply selected policy to sort and select the best release',
      defaultPolicy: 'default',
      refine: {
        label: 'Refine for better release',
        help: 'Sensorr will regularly search for better release than the current archived one',
      },
      shrink: {
        label: 'Shrink for smaller release',
        help: 'Sensorr will regularly search for smaller release than the current archived one',
      },
    },
    lists: {
      placeholder: 'Add to a list',
      help: 'Type a new name to create a list',
    },
  },
  proposals: {
    title: 'Swaps',
    selected: '{count} Selected',
    threshold: {
      title: 'A proposal that frees less disk space than this is ignored',
      label: 'Min. freed',
    },
    balance: {
      title: 'The Plex files of these movies weigh {now}, and {after} once every swap is accepted',
      now: 'now <0>{size}</0>',
      after: 'after <0>{size}</0>',
    },
    sides: {
      current: 'Current size',
      proposed: 'Proposed size',
    },
    sorting: {
      time: 'Processed',
      gain: 'Space freed',
    },
    filters: {
      title: 'Release filters',
      subtitle: 'Click a tag to cycle it: 📀 Current, an owned release carries it; 💿 Proposed, the proposed release carries it; 🔕 it does not count',
    },
    groups: {
      rest: 'ignored',
      overdue: 'overdue',
      noChange: '{label} (no change)',
    },
    group: {
      selectAll: 'Select All',
      unselectAll: 'Unselect All',
    },
    verdicts: {
      accept: 'Accepted',
      refuse: 'Refused',
      ban: 'Banned',
      retry: 'Retried',
      drop: 'Dropped',
      replace: 'Replaced',
    },
    session: {
      accept: '{count} accepted',
      refuse: '{count} refused',
      ban: '{count} banned',
      retry: '{count} retried',
      drop: '{count} dropped',
      replace: '{count} replaced',
    },
    errors: {
      overdue: 'Error while loading the overdue swaps',
    },
    elsewhere: '{title} was treated elsewhere',
    retryFailed: 'Retry failed for <0>{title}</0>, the swap is kept',
    toast: {
      error: 'Error while sending **{verdict}** for **{target}**',
      errorMany: 'Error while sending **{verdict}** for **{count}** proposals',
      many: '**{count}** proposals',
      undo: 'Undo',
      ban: 'Ban',
    },
    reload: 'Retry',
    replace: 'Replace',
    empty: {
      match: {
        title: 'No match',
        subtitle: 'No swap matches the release filters',
      },
      decided: 'All decided',
      nothing: {
        title: 'Nothing to decide',
        subtitle: 'Jobs with <0>proposalOnly</0> set wait here for a choice, see <1>job settings</1>',
      },
    },
    end: {
      title: 'You\'ve reached the end of the tape',
      subtitle: 'Be kind, <0>rewind</0>, and let the next <1>refine</1> or <2>shrink</2> job record some more swaps.',
    },
    card: {
      close: 'Close',
      closeTitle: 'Close (Esc)',
      size: {
        against: 'Size against the lightest owned release: {delta}',
        proposed: 'Size of the proposed release',
      },
      reported: 'Reported',
      banned: '{count, plural, one {owned release banned} other {# owned releases banned}}',
      open: 'Open {title}',
      openTitle: 'Open',
      select: 'Select {title}',
      proposal: 'proposal',
    },
    overdue: {
      accepted: 'accepted {distance}',
      notOnPlex: 'not on Plex',
      retry: {
        button: 'Retry',
        title: 'Send the same .torrent to the blackhole again',
        label: 'Retry {title}',
      },
      search: {
        button: 'Search',
        title: 'Pick another release in its place',
        label: 'Search another release of {title}',
      },
      drop: {
        button: 'Drop',
        title: 'Remove the accepted release and keep what Plex has',
        label: 'Drop the swap of {title}, Plex keeps its version',
      },
    },
  },
  shows: {
    follow: {
      partial: 'Partly followed',
    },
    search: {
      series: 'the whole series',
      title: 'Releases for {label}',
    },
    proposals: {
      replaces: 'replaces {count, plural, one {# episode} other {# episodes}}',
      fills: 'fills {label}',
      fillsCount: 'fills {count, plural, one {# episode} other {# episodes}}',
      group: 'Pending proposal for {coverage}',
    },
    actions: {
      years: {
        help: 'Sensorr will filter releases with a year outside this range',
        from: 'From',
        to: 'To',
        placeholder: 'YYYY',
      },
      monitored: {
        label: 'Follow episodes',
        on: 'Sensorr searches the followed episodes',
        off: 'Sensorr searches none of its episodes',
      },
      newSeasons: {
        label: 'Follow new seasons',
        first: 'Follow episodes first',
        on: 'Seasons to come are followed as they appear',
        off: 'Seasons to come wait for you to follow them',
      },
    },
    seasons: {
      all: 'All seasons',
      specials: 'Specials',
      season: 'Season {number}',
      seasons: '{count, plural, one {# season} other {# seasons}}',
      episodes: '{count, plural, one {# episode} other {# episodes}}',
      owned: '{count} owned',
      proposed: '{count, plural, one {# pending proposal} other {# pending proposals}}',
      wanted: '{count} wanted',
      search: 'Search releases for {label}',
      follow: {
        all: 'Every episode of {season} followed',
        partial: '{followed} of {count} episodes of {season} followed',
        label: 'Follow every episode of {season}',
      },
      noPoster: 'No poster',
      complete: 'Every aired episode owned',
      episode: {
        tba: 'TBA',
        followed: 'Episode {number} followed',
        follow: 'Follow episode {number}',
      },
      remote: {
        error: 'Unable to load the episodes: {message}',
        empty: 'No episode announced yet',
      },
      replaced: 'Replaced by a pending proposal',
    },
    show: {
      wanted: '{count, plural, one {# wanted episode} other {# wanted episodes}}',
      errors: {
        show: 'Error while following the show',
        episode: 'Error while following the episode',
        display: 'Sorry, unable to display show...',
        episodes: 'Sorry, unable to load the episodes...',
      },
    },
    library: {
      head: 'Explore shows from your library with various filters about shows like <0>state</0>, <1>genres</1>, <2>networks</2>, <3>first air date</3>, etc...',
      selectAll: 'Select All',
      selected: '{count} Selected',
      confirmPolicy: 'Do you want to change the policy of {selection} to {policy}?',
      errors: {
        statistics: 'Error while loading library statistics',
      },
      empty: 'No show of your library matches these filters, try with fewer of them',
    },
    discover: {
      statuses: {
        returning: 'Returning Series',
        production: 'In Production',
        planned: 'Planned',
        pilot: 'Pilot',
        ended: 'Ended',
        canceled: 'Canceled',
      },
      hideLibrary: 'Hide Library',
      head: 'Discover shows with various filters like <0>genres</0>, <1>networks</1>, <2>type</2>, <3>first air date</3>, etc...',
      hint: 'Combine filters to discover new shows !',
      empty: 'Try something like, what are the <0>highest rated</0> <1>crime</1> shows that first aired in the <2>2000s</2> ?',
    },
    calendar: {
      fallback: {
        title: 'Sorry, unable to display episodes...',
        subtitle: 'The API did not answer the episodes request, try again or log in again',
      },
      none: {
        title: 'Try to follow some shows first',
        subtitle: 'The calendar lists the episodes of the shows you follow, follow one from its page or from your library',
      },
      show: 'Show {id}',
      noun: 'episodes',
      head: 'Narrow the episodes of the shows you follow by their <0>status</0>, or by the <1>network</1>, <2>genres</2>, <3>policy</3> and <4>requesters</4> of their show',
      errors: {
        statistics: 'Error while loading calendar statistics',
      },
      label: 'Episodes by day',
      month: {
        empty: {
          title: 'No episode this month',
          subtitle: 'None of the shows you follow has an episode airing this month and matching these filters, try another month or fewer filters',
        },
      },
      list: {
        empty: {
          title: 'No episode to list',
          subtitle: 'None of the shows you follow has an episode with an air date and matching these filters yet',
        },
      },
    },
  },
  artworks: {
    change: 'Change artworks',
    title: 'Artworks',
    dialog: 'Artworks of {title}',
    seasonOf: '{season} of {show}',
    subtitle: {
      season: 'Choose the <0>poster</0> Plex shows for <1>{title}</1>, from Plex, TMDB or a pasted link',
      entity: 'Choose the <0>poster</0>, <1>backdrop</1> and <2>logo</2> Plex shows for <3>{title}</3>, from Plex, TMDB, MediUX sets or a pasted link',
    },
    kinds: {
      poster: 'Poster',
      backdrop: 'Backdrop',
      logo: 'Logo',
    },
    errors: {
      mediux: 'MediUX did not answer: its sets are missing',
      plex: 'Plex did not answer: its artworks are missing, and nothing can be written',
      tmdb: 'TMDB did not answer: its artworks are missing',
    },
    sets: {
      title: 'Sets',
      empty: 'No MediUX set for this title',
      set: 'Set {title}',
      setBy: 'Set {title} by {author}',
    },
    empty: '{kind, select, poster {No poster} backdrop {No backdrop} other {No logo}} on Plex nor on TMDB, add one from a link',
    groups: {
      current: 'current',
      others: 'others',
      links: 'links',
    },
    add: '{kind, select, poster {Add a poster} backdrop {Add a backdrop} other {Add a logo}} from a link',
    paste: 'Paste a link: ThePosterDB, MediUX, any image',
    candidate: '{label}, {lang}, from {source}{current, select, true {, current} other {}}',
    noLanguage: 'no language',
    current: 'current',
    writing: 'Writing…',
    toasts: {
      failed: 'Plex could not write the artworks, nothing changed',
      later: 'Written on Plex, Sensorr shows it after the next sync',
      refused: 'Plex refused the {kinds}: {reasons}',
      success: 'Artworks written on Plex',
    },
    fetchOnApply: 'Plex fetches it on Apply',
    noLogo: 'No logo',
    reset: 'Reset all',
    link: {
      label: '{label} link',
      invalid: 'Not an image link',
      add: 'Add',
      fallback: 'link',
    },
  },
  calendar: {
    views: {
      grid: emojize('🖼️', 'Grid'),
      calendar: emojize('🗓️', 'Calendar'),
      list: emojize('📋', 'List'),
    },
    today: 'Today',
    loading: 'Loading {noun}',
    error: 'Error while fetching {noun}',
    retry: 'Unable to load the {stream, select, past {previous} other {next}} {noun}, retry',
    more: 'Load {stream, select, past {older} other {later}} {noun}',
  },
  enhancers: {
    bulk: {
      movies: '{count, plural, one {# movie} other {# movies}}',
      shows: '{count, plural, one {# show} other {# shows}}',
      state: 'State',
      confirm: 'Do you want to change the state of {selection} to "{state}"?',
    },
    fetchQuery: {
      error: 'Error while fetching entities',
    },
    loadableCredits: {
      error: 'Error while fetching credits',
    },
  },
  entities: {
    empty: {
      title: 'Oh no, your request didn\'t return results',
    },
    movies: {
      empty: {
        subtitle: 'Try something like, what are the <0>highest rated</0> <1>science fiction</1> movies that <2>Tom Cruise</2> has been in ?',
      },
    },
  },
  lists: {
    action: {
      label: 'Lists',
      new: 'New list…',
      prompt: 'Name of the list to add {selection} to',
      confirm: 'Do you want to add {selection} to "{name}"?',
      policy: 'Their policy becomes {policy}{media, select, movie {, and the archived ones are refined again} other {}}.',
    },
    saveAsList: {
      label: emojize('🗂️', 'Save as list'),
      placeholder: 'Name a new list, or pick one',
      placeholderNew: 'Name a new list',
      create: 'New list "{name}"',
      noOptions: 'Type a name to make a list',
      createTitle: 'Create "{name}"',
      addTitle: 'Add these filters to "{name}"',
      save: 'Save',
    },
  },
  showFields: {
    status: {
      airing: 'Airing',
      upcoming: 'Upcoming',
      ended: 'Ended',
    },
    types: {
      scripted: 'Scripted',
      miniseries: 'Miniseries',
      documentary: 'Documentary',
      reality: 'Reality',
      talkShow: 'Talk Show',
      news: 'News',
      video: 'Video',
    },
    unknown: 'Unknown ({id})',
  },
}
