export default {
  layout: {
    config: {
      error: 'Sorry, unable to load the configuration...',
      retry: 'Retry',
    },
    suspense: {
      subtitle: 'Please wait a few moments...',
    },
  },
  header: {
    back: 'Back',
    sections: {
      home: 'Home',
      movies: 'Movies',
      tv: 'TV',
      collections: 'Collections',
      stars: 'Stars',
      navigation: 'Navigation',
    },
    pages: {
      lists: 'Lists',
      swaps: 'Swaps',
    },
    search: {
      recent: 'Recent searches',
      empty: {
        title: 'Sorry, no results',
        subtitle: 'Try something more familiar, like <0>Pulp Fiction</0> ?',
      },
      movies: 'Movies',
      shows: 'Shows',
      collections: 'Collections',
      stars: 'Stars',
      companies: 'Companies',
      keywords: 'Keywords',
      more: 'More results for {query}',
    },
    notifications: {
      title: 'Notifications',
      push: {
        unavailable: 'Push Notifications unavailable',
        enable: 'Enable Push Notifications',
        disable: 'Disable Push Notifications',
      },
      read: {
        title: 'Mark all as read',
        confirm: 'Mark all {count, plural, one {# notification} other {# notifications}} as read ?',
      },
      commands: {
        missing: 'missing',
        request: 'request',
      },
      empty: {
        match: {
          title: 'No match',
          subtitle: 'No {command} notification',
          all: 'Show all',
        },
        none: {
          title: 'Up to date',
          subtitle: 'No notifications yet',
        },
      },
      movie: {
        record: '{proposal, select, true {Movie record proposal} other {Movie recorded}}',
        refine: '{proposal, select, true {Movie refine proposal} other {Movie refined}}',
        shrink: '{proposal, select, true {Movie shrink proposal} other {Movie shrinked}}',
        report: '{proposal, select, true {Report proposal} other {Reported movie, replacement downloaded}}',
        sync: 'Movie missing from your Plex Server',
        request: 'Movie request',
        size: 'Size against the lightest owned release: {delta}',
        fix: 'Do you want to fix it ?',
      },
      show: {
        record: '{swap, select, true {Season swap proposal} other {{proposal, select, true {Show record proposal} other {Show recorded}}}}',
        airing: '{proposal, select, true {Airing episode proposal} other {Airing episode recorded}}',
        sync: 'Episodes missing from your Plex Server',
        request: 'Show request',
        episodes: '{count, plural, one {# episode} other {# episodes}}',
        gone: '{count, plural, one {# episode} other {# episodes}} no longer on Plex',
      },
      release: '{proposal, select, true {Release proposal} other {Release}}',
      requested: 'Requested by',
      actions: {
        accepted: 'Accepted',
        refused: 'Refused',
        ban: 'Ban',
        banned: 'Banned',
        downloaded: 'Downloaded',
        wish: '"Wish" it',
        wishBack: '"Wish" it back',
        fixed: 'Fixed',
        ignore: 'Ignore',
        follow: 'Follow',
        following: 'Following...',
      },
    },
  },
  contexts: {
    toasts: {
      types: {
        blank: 'Info',
        success: 'Success',
        error: 'Error',
        loading: 'Loading',
      },
      console: 'See browser console for more details',
    },
    movies: {
      loading: 'Updating movie metadata...',
      success: 'Movie metadata updated',
      error: 'Error while updating movie metadata',
      bulk: {
        loading: 'Updating **{count}** movies metadata...',
        success: 'Updated **{count}** movies metadata',
        failed: '**{failed}** of **{count}** movies not {key, select, proposal {downloaded} other {updated}}',
        error: 'Error while updating **{count}** movies metadata',
      },
    },
    shows: {
      loading: 'Updating show metadata...',
      success: 'Show metadata updated',
      failed: 'Release not downloaded',
      error: 'Error while updating show metadata',
      bulk: {
        loading: 'Updating **{count}** shows metadata...',
        success: 'Updated **{count}** shows metadata',
        failed: '**{failed}** of **{count}** shows not downloaded',
        error: 'Error while updating **{count}** shows metadata',
      },
      episodes: {
        loading: 'Updating **{count}** episodes...',
        success: 'Updated **{count}** episodes',
        error: 'Error while updating **{count}** episodes',
      },
      add: {
        loading: 'Adding show to the library...',
        success: 'Show added to the library',
        error: 'Error while adding show to the library',
      },
      lists: {
        loading: 'Updating the lists of the show...',
        success: 'Lists of the show updated',
        error: 'Error while updating the lists of the show',
      },
      remove: {
        loading: 'Removing show from the library...',
        success: 'Show removed from the library',
        error: 'Error while removing show from the library',
        confirm: 'Do you want to remove "{name}" from the library ? Their files stay on disk',
        confirmEpisodes: 'Do you want to remove "{name}" and its {count} episodes from the library ? Their files stay on disk',
      },
      errors: {
        answer: 'Error while answering the proposal',
        follow: 'Error while following the show',
      },
    },
    persons: {
      error: 'Error while updating person metadata',
    },
    search: {
      error: 'Error while fetching results',
    },
    guests: {
      delete: {
        loading: 'Deleting guest "{email}"...',
        success: 'Guest "{email}" successfully deleted !',
        error: 'Error while deleting guest "{email}"',
      },
    },
    notifications: {
      denied: 'Notifications disabled, allow permission from your navigator or system settings',
      loading: 'Handling Push Notifications...',
      success: 'Push Notifications {subscribed, select, true {enabled} other {disabled}}',
      error: 'Error during Push Notifications subscription',
    },
  },
  demo: {
    label: 'Demo',
    messages: {
      kept: 'Your changes stay in this browser',
      storage: 'This browser keeps nothing, your changes go away on reload',
      data: 'The demo data did not load, reload the page',
    },
    reset: {
      label: 'Reset',
      title: 'Reset the demo',
      confirm: 'Reset the demo? Everything you changed goes back to how it started',
    },
    github: {
      label: 'Sensorr on GitHub, in a new tab',
      title: 'Sensorr on GitHub',
    },
    unavailable: 'Not available in the demo, it needs Sensorr running on your own server',
    indexer: 'The demo only reaches its own indexer, not {host}',
  },
}
