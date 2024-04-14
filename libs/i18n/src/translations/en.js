import { emojize } from '@sensorr/utils'

export default {
  loading: 'Loading...',
  noOverview: 'No additional information',
  yearsOld: 'y/o',
  without: 'without',
  show: 'Show',
  tabs: {
    loading: emojize('⌛', 'Loading'),
  },
  state: {
    loading: 'Loading',
    ignored: 'Ignored',
    followed: 'Followed',
    missing: 'Missing',
    pinned: 'Pinned',
    requested: 'Requested',
    proposal: 'Proposal',
    wished: 'Wished',
    archived: 'Archived',
  },
  tmdb: {
    release_type: {
      premiere: 'Premiere',
      limited: 'Limited',
      theatrical: 'Theatrical',
      digital: 'Digital',
      physical: 'Physical',
      tv: 'TV',
    },
  },
  ui: {
    select: {
      placeholder_search: 'Search...',
      placeholder_select: 'Select...',
      option: emojize('🎉', 'Search for anything !'),
      loading: emojize('⌛', 'Searching for "{query}"...'),
      empty: emojize('💢', 'No results'),
      custom: {
        people: emojize('⭐️', 'Search for people, like "Bill Murray"'),
        crew: emojize('🎬', 'Search for crew, like "Christopher Nolan"'),
        cast: emojize('🤵', 'Search for cast, like "James Stewart"'),
        companies: emojize('🏛️', 'Search for companies, like "Walt Disney Pictures"'),
        keywords: emojize('🔗️', 'Search for keywords, like "Zombie"'),
      },
    },
    controls: {
      apply: 'Apply',
      cancel: 'Cancel',
      results: 'Results',
      toggle: '<0>Show </0>{active, plural, =0 {Filters} other {<1># Filters</1>}}',
      more: '<0>More </0>{active, plural, =0 {Filters} other {<1># Filters</1>}}',
    },
    filters: {
      state: '📚 State',
      genres: emojize('🎞️', 'Genres'),
      release_date: emojize('📅', 'Year'),
      birthday: emojize('🎂', 'Birthday'),
      popularity: emojize('📣', 'Popularity'),
      vote_average: emojize('💯', 'Vote Average'),
      vote_count: emojize('🗳', 'Vote Count'),
      runtime: emojize('🕒', 'Duration'),
      people: emojize('⭐️', 'People'),
      crew: emojize('🎬', 'Crew'),
      cast: emojize('🤵', 'Cast'),
      companies: emojize('🏛️', 'Companies'),
      keywords: emojize('🔗️', 'Keywords'),
      languages: emojize('🌐', 'Languages'),
      release_type: emojize('📼', 'Released'),
      certification: emojize('🔞', 'Certification'),
      known_for_department: emojize('💼', 'Known For Department'),
      gender: emojize('⚧️', 'Gender'),
      requested_by: emojize('🤖', 'Requested by'),
    },
    sorting: 'Sort by',
    sortings: {
      updated_at: emojize('📚️', 'Last Update'),
      popularity: emojize('📣', 'Popularity'),
      birthday: emojize('🎂', 'Birthday'),
      primary_release_date: emojize('📅', 'Release Date'),
      revenue: emojize('💰', 'Revenue'),
      vote_average: emojize('💯', 'Vote Average'),
      vote_count: emojize('🗳', 'Vote Count'),
    },
  },
  items: {
    movies: {
      trending: {
        emoji: '📣',
        label: emojize('📣', 'Trending'),
        title: 'Trending movies from themoviedb.org',
        more: 'More trending movies from themoviedb.org',
      },
      theatres: {
        emoji: '🎟️',
        label: emojize('🎟️', 'Now in Theatres'),
        title: 'Availble movies in theatres in your region',
        more: 'More movies availble in theatres in your region',
      },
      upcoming: {
        emoji: '⏭️',
        label: emojize('⏭️', 'Upcoming in Theatres'),
        title: 'Upcoming movies in theatres',
        more: 'More upcoming movies in theatres',
      },
      discover: {
        emoji: '👀',
        label: emojize('👀', 'Discover'),
        title: 'Discover movies from themoviedb.org',
        more: 'Discover more movies from themoviedb.org',
      },
      discoverSelectable: {
        year: {
          emoji: '📅',
          title: 'Discover movies by random year',
          more: 'Discover more movies by random year',
          label: emojize('📅', 'Discover <small>{value}</small>'),
        },
        genre: {
          emoji: '🎞️',
          title: 'Discover movies by genre',
          more: 'Discover more movies by genre',
          label: emojize('🎞️', 'Discover <small>{value}</small>'),
        },
        studio: {
          emoji: '🏛️',
          title: 'Discover movies by famous studio',
          more: 'Discover more movies by famous studio',
          label: emojize('🏛️', 'Discover <small>{value}</small>'),
        },
      },
      calendar: {
        emoji: '📅',
        label: emojize('📅', 'Your Calendar'),
        title: 'Upcoming movies from your followed stars',
        more: 'More upcoming movies from your followed stars',
      },
      library: {
        emoji: '📚',
        label: emojize('📚', 'Your Library'),
        title: 'All movies you pinned, wished or archived',
        more: 'More movies you pinned, wished or archived',
      },
      archived: {
        emoji: '📼',
        label: emojize('📼', 'Your Records'),
        title: 'All your archived movies',
        more: 'More of your archived movies',
      },
      belongs_to_collection: {
        emoji: '📀',
        label: emojize('📀', '{collection}'),
        // title: 'All your archived movies',
        // more: 'More of your archived movies',
      },
      recommendations: {
        emoji: '💬',
        label: emojize('💬', 'Recommendations'),
        // title: 'All your archived movies',
        // more: 'More of your archived movies',
      },
      similar: {
        emoji: '👯‍♀️',
        label: emojize('👯‍♀️', 'Similar'),
        // title: 'All your archived movies',
        // more: 'More of your archived movies',
      },
    },
    persons: {
      trending: {
        emoji: '⭐️',
        label: emojize('⭐️', 'Trending'),
        title: 'Trending persons from themoviedb.org',
        more: 'More trending persons from themoviedb.org',
      },
      known_for: {
        emoji: '⭐',
        label: emojize('⭐', 'Known for'),
        // title: 'All your archived movies',
        // more: 'More of your archived movies',
      },
      crew: {
        emoji: '🎬',
        label: emojize('🎬', 'Crew'),
        // title: 'All your archived movies',
        // more: 'More of your archived movies',
      },
      fullcrew: {
        emoji: '📇',
        label: emojize('📇', 'All'),
        // title: 'All your archived movies',
        // more: 'More of your archived movies',
      },
      cast: {
        emoji: '🤵',
        label: emojize('🤵', 'Casting'),
        // title: 'All your archived movies',
        // more: 'More of your archived movies',
      },
      fullcast: {
        emoji: '📇',
        label: emojize('📇', 'All'),
        // title: 'All your archived movies',
        // more: 'More of your archived movies',
      },
    },
  },
  pages: {
    library: {
      title: 'Library',
    },
    requests: {
      title: 'Requests',
    },
    followed: {
      title: 'Followed',
    },
    discover: {
      title: 'Discover',
    },
    calendar: {
      title: 'Calendar',
    },
    recommendations: {
      title: 'Recommendations',
    },
    similar: {
      title: 'Similar',
    },
    trending: {
      movies: {
        title: 'Trending',
      },
      persons: {
        title: 'Trending',
      },
    },
    theatres: {
      title: 'Theatres',
      controls: {
        uri: {
          label: '',
          options: {
            now_playing: emojize('📽️', 'On Screen'),
            upcoming: emojize('📅', 'Upcoming'),
          },
        },
        region: {
          label: 'in',
        },
      },
    },
    search: {
      title: 'Search',
    },
  },
}
