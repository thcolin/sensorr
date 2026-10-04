import convict from 'convict'
import oleoo from 'oleoo'

const validateSources = (sources, schema) => {
  if (!Array.isArray(sources)) {
    throw new Error('must be of type Array')
  }

  for (const source of sources) {
    convict(schema.children).load(source).validate({ output: () => {} })
  }
}

convict.addFormat({
  name: 'source-array',
  validate: validateSources,
})

// The looks of the wrapped page, `apps/wrapped/src/app/themes` draws each one
export const WRAPPED_THEMES = ['tele', 'labo', 'videoclub', 'scenario', 'affiche']

// A list of looks, each one known and listed once, never empty
convict.addFormat({
  name: 'wrapped-looks',
  validate: function (looks) {
    if (!Array.isArray(looks) || !looks.length) {
      throw new Error('must list at least one look')
    }

    if (looks.some((look) => !WRAPPED_THEMES.includes(look)) || new Set(looks).size !== looks.length) {
      throw new Error(`must list each of ${WRAPPED_THEMES.join(', ')} at most once`)
    }
  },
})

// A `source-array` where each list id shows once, the rows of `home` point to it
convict.addFormat({
  name: 'lists',
  validate: function (lists, schema) {
    validateSources(lists, schema)
    const ids = lists.map(({ id }) => id)

    if (ids.some((id) => !id) || new Set(ids).size !== ids.length) {
      throw new Error('each list must have its own id')
    }
  },
})

// A `source-array` where each year shows once, the API reads the first one it finds
convict.addFormat({
  name: 'wrapped-editions',
  validate: function (editions, schema) {
    validateSources(editions, schema)
    const years = editions.map(({ year }) => year)

    if (new Set(years).size !== years.length) {
      throw new Error('each year must show once')
    }
  },
})

// The rows of a Home, each one a built-in row or `list:<id>`
const rowsOf = (doc, ids) => ({
  doc,
  format: 'source-array',
  default: ids.map((id) => ({ id, hidden: false })),
  children: {
    id: {
      doc: 'A built-in row, or `list:<id>`',
      format: 'String',
      default: '',
    },
    hidden: {
      doc: 'Hide the row',
      format: 'Boolean',
      default: false,
    },
  },
})

const schema = {
  docker: {
    doc: 'Is Sensorr App running in Docker env ?',
    format: 'Boolean',
    default: false,
  },
  vapidPublicKey: {
    doc: 'VAPID Public Key for web push notifications',
    format: 'String',
    default: null,
  },
  onboarding: {
    done: {
      doc: 'Whether the onboarding was finished or skipped, the app no longer opens it after login',
      format: 'Boolean',
      default: false,
    },
    legacy: {
      doc: 'Whether this config was converted from a 0.x one at boot, the app then opens the onboarding to bring the rest over',
      format: 'Boolean',
      default: false,
    },
    defaultPassword: {
      doc: 'Whether the password of .env is still sensorr, the default of the installer, set at boot',
      format: 'Boolean',
      default: false,
    },
  },
  tmdb: {
    doc: 'TMDB API Key',
    format: 'String',
    default: '',
  },
  blackhole: {
    doc: 'Blackhole absolute path to store downloaded .torrent or .nzb files',
    format: 'String',
    default: '/tmp',
    arg: 'blackhole',
  },
  magnet: {
    doc: 'Write the magnet link of a movie release to the blackhole as a .magnet file, for a download client that reads them from its watched folder',
    format: 'Boolean',
    default: false,
  },
  shows: {
    library: {
      doc: 'Shows library absolute path, where imported episodes are hard linked',
      format: 'String',
      default: '/tvshows',
    },
    blackhole: {
      doc: 'Blackhole absolute path to store downloaded shows .torrent files, on the same mount as the library',
      format: 'String',
      default: '/tvshows/.blackhole',
    },
    staging: {
      doc: 'Absolute path where the download client saves shows files, on the same mount as the library',
      format: 'String',
      default: '/tvshows/.staging',
    },
  },
  region: {
    doc: 'Sensorr region (usefull for TMDB requests)',
    format: 'String',
    default: 'fr-FR',
  },
  adult: {
    doc: 'Allow adult content from TMDB on Sensorr',
    format: 'Boolean',
    default: false,
  },
  jobs: {
    record: {
      movies: {
        cron: {
          doc: 'Record movies job cron',
          format: 'String',
          default: '0 17 * * *',
        },
        paused: {
          doc: 'Pause Record movies job',
          format: 'Boolean',
          default: false,
        },
        proposalOnly: {
          doc: "Record movies job will only submit proposal and don't download any release",
          format: 'Boolean',
          default: false,
        },
      },
      shows: {
        cron: {
          doc: 'Record shows job cron, wished shows are searched by whole series, season packs and episodes',
          format: 'String',
          default: '0 17 * * *',
        },
        paused: {
          doc: 'Pause Record shows job',
          format: 'Boolean',
          default: true,
        },
        proposalOnly: {
          doc: "Record shows job will only submit proposal and don't download any release",
          format: 'Boolean',
          default: true,
        },
      },
    },
    refresh: {
      movies: {
        cron: {
          doc: 'Refresh movies job cron',
          format: 'String',
          default: '0 4 * * *',
        },
        paused: {
          doc: 'Pause Refresh movies job',
          format: 'Boolean',
          default: false,
        },
      },
      shows: {
        cron: {
          doc: 'Refresh shows job cron, shows still airing are refreshed on every run, the others once a month',
          format: 'String',
          default: '0 4 * * *',
        },
        paused: {
          doc: 'Pause Refresh shows job',
          format: 'Boolean',
          default: true,
        },
      },
    },
    sync: {
      movies: {
        cron: {
          doc: 'Sync movies job cron',
          format: 'String',
          default: '0 3 * * 0',
        },
        paused: {
          doc: 'Pause Sync movies job',
          format: 'Boolean',
          default: false,
        },
        cleanup: {
          doc: 'Sync movies job deletes from Plex the versions an accepted swap replaces, once the swap has landed',
          format: 'Boolean',
          default: false,
        },
      },
      shows: {
        cron: {
          doc: 'Sync shows job cron',
          format: 'String',
          default: '0 2 * * *',
        },
        paused: {
          doc: 'Pause Sync shows job',
          format: 'Boolean',
          default: true,
        },
        cleanup: {
          doc: 'Sync shows job deletes from Plex the episode versions an accepted season swap replaces, once every episode of the swap has landed',
          format: 'Boolean',
          default: false,
        },
      },
    },
    'keep-in-touch': {
      cron: {
        doc: 'Keep-in-touch job cron',
        format: 'String',
        default: '0 3 * * 0',
      },
      paused: {
        doc: 'Pause Keep-in-touch job',
        format: 'Boolean',
        default: false,
      },
    },
    refine: {
      movies: {
        cron: {
          doc: 'Refine movies job cron',
          format: 'String',
          default: '0 5 * * 0',
        },
        paused: {
          doc: 'Pause Refine movies job',
          format: 'Boolean',
          default: false,
        },
        proposalOnly: {
          doc: "Refine movies job will only submit proposal and don't download any release",
          format: 'Boolean',
          default: true,
        },
      },
    },
    shrink: {
      movies: {
        cron: {
          doc: 'Shrink movies job cron',
          format: 'String',
          default: '0 5 * * 0',
        },
        paused: {
          doc: 'Pause Shrink movies job',
          format: 'Boolean',
          default: false,
        },
        proposalOnly: {
          doc: "Shrink movies job will only submit proposal and don't download any release",
          format: 'Boolean',
          default: true,
        },
        threshold: {
          doc: "Shrink movies job will only consider movies with releases above this threshold (Gb)",
          format: 'Number',
          default: 0,
        },
      },
    },
    report: {
      movies: {
        cron: {
          doc: 'Report movies job cron',
          format: 'String',
          default: '0 * * * *',
        },
        paused: {
          doc: 'Pause Report movies job',
          format: 'Boolean',
          default: true,
        },
        proposalOnly: {
          doc: "Report movies job will only submit proposal and don't download any release",
          format: 'Boolean',
          default: true,
        },
        since: {
          doc: 'Date of the newest Plex reported issue already handled by Report movies job, older ones are ignored (auto filled on first run)',
          format: 'Number',
          default: 0,
        },
      },
    },
    import: {
      shows: {
        cron: {
          doc: 'Import shows job cron, finished show releases are hard linked from the staging folder into the library',
          format: 'String',
          default: '*/10 * * * *',
        },
        paused: {
          doc: 'Pause Import shows job',
          format: 'Boolean',
          default: true,
        },
      },
    },
    airing: {
      shows: {
        cron: {
          doc: 'Airing shows job cron, wanted episodes aired in the last 7 days are searched one by one',
          format: 'String',
          default: '0 * * * *',
        },
        paused: {
          doc: 'Pause Airing shows job',
          format: 'Boolean',
          default: true,
        },
        proposalOnly: {
          doc: "Airing shows job will only submit proposal and don't download any release",
          format: 'Boolean',
          default: true,
        },
      },
    },
    wrapped: {
      cron: {
        doc: 'Wrapped job cron',
        format: 'String',
        default: '0 6 * * *',
      },
      paused: {
        doc: 'Pause Wrapped job',
        format: 'Boolean',
        default: true,
      },
    },
    mail: {
      cron: {
        doc: 'Mail job cron, it mails each friend their requests that reached Plex since their last mail',
        format: 'String',
        default: '0 9 * * 1',
      },
      paused: {
        doc: 'Pause Mail job',
        format: 'Boolean',
        default: false,
      },
    },
  },
  guests: {
    public: {
      doc: 'Let any Plex account link itself from /keep-in-touch; off, only the owner of the Plex server set up in Sensorr and the users it is shared with, the guests already linked and a Sensorr without Plex server excepted',
      format: 'Boolean',
      default: false,
    },
  },
  mail: {
    url: {
      doc: 'Address of this Sensorr your friends open, the links of every mail start with it',
      format: 'String',
      default: '',
    },
    host: {
      doc: 'SMTP server host',
      format: 'String',
      default: '',
    },
    port: {
      doc: 'SMTP server port',
      format: 'port',
      default: 587,
    },
    secure: {
      doc: 'Connect with TLS from the start, usually on port 465; off, STARTTLS upgrades the connection when the server offers it',
      format: 'Boolean',
      default: false,
    },
    user: {
      doc: 'SMTP username',
      format: 'String',
      default: '',
    },
    password: {
      doc: 'SMTP password',
      format: 'String',
      default: '',
    },
    from: {
      doc: 'Sender of every mail, its name is the one your friends read, like `Thomas <sensorr@example.com>`',
      format: 'String',
      default: '',
    },
    // The mails Sensorr sends on its own; an invitation, a test, or a mail sent from the Friends page always goes
    send: {
      welcome: {
        doc: 'Welcome a friend once their Plex account is linked',
        format: 'Boolean',
        default: true,
      },
      reconnect: {
        doc: 'Ask a friend to link their Plex account again when Plex disconnects it, then up to 3 weekly reminders',
        format: 'Boolean',
        default: true,
      },
      requests: {
        doc: 'Tell each friend once a week which of their requests reached Plex',
        format: 'Boolean',
        default: true,
      },
      wrapped: {
        doc: 'Send each friend their wrapped when its edition freezes',
        format: 'Boolean',
        default: true,
      },
    },
  },
  tautulli: {
    url: {
      doc: 'Tautulli URL, where the Plex watch history is read from',
      format: 'String',
      default: '',
    },
    key: {
      doc: 'Tautulli API key',
      format: 'String',
      default: '',
    },
  },
  wrapped: {
    looks: {
      doc: 'Looks offered, the ones a friend picks from and a year can set; one left out is never shown',
      format: 'wrapped-looks',
      default: WRAPPED_THEMES,
    },
    editions: {
      doc: 'The years of the wrapped Settings changed, a year left out is open and lets each friend pick their look',
      format: 'wrapped-editions',
      default: [],
      children: {
        year: {
          doc: 'Year of the edition',
          format: 'nat',
          default: null,
        },
        theme: {
          doc: `Look of this year, null lets each friend pick among the looks offered: ${WRAPPED_THEMES.join(', ')}`,
          format: [...WRAPPED_THEMES, null],
          default: null,
        },
        enabled: {
          doc: 'Whether the friends can open this year, off it is neither frozen nor mailed',
          format: 'Boolean',
          default: true,
        },
      },
    },
  },
  plex: {
    url: {
      doc: 'Plex server URL',
      format: 'String',
      default: '',
    },
    pin: {
      code: {
        doc: 'Plex code (auto filled with plex-bind cli command)',
        format: 'String',
        default: '',
      },
      id: {
        code: 'Plex id (auto filled with plex-bind cli command)',
        format: 'String',
        default: '',
      },
    },
    token: {
      code: 'Plex token (auto filled with plex-bind cli command)',
      format: 'String',
      default: '',
    },
    client_identifier: {
      doc: 'Unique Plex client identifier (X-Plex-Client-Identifier), generated once per installation and persisted',
      format: 'String',
      default: '',
    },
  },
  mediux: {
    token: {
      doc: 'MediUX API token, to list the artwork sets of a movie or a show',
      format: 'String',
      default: '',
    },
  },
  lists: {
    doc: 'Lists a Home shows as rows',
    format: 'lists',
    default: [],
    children: {
      id: {
        doc: 'Id of the list, `list:<id>` in the rows of a Home',
        format: 'String',
        default: '',
      },
      name: {
        doc: 'Name of the list',
        format: 'String',
        default: '',
      },
      media: {
        doc: 'Movies or shows, a list holds one of them',
        format: ['movie', 'tv'],
        default: 'movie',
      },
      sources: {
        doc: 'Where the entities of the list come from, shown one source after the other',
        format: 'source-array',
        default: [],
        children: {
          kind: {
            doc: 'TMDB discover filters, library filters, or the movies and shows added to this custom list',
            format: ['discover', 'library', 'custom'],
            default: 'discover',
          },
          values: {
            doc: 'Values of the filters panel, as Discover or Library hold them',
            format: Object,
            default: {},
          },
        },
      },
    },
  },
  home: {
    all: rowsOf('Rows of the browser Home, in order', ['trending_movies', 'trending_shows', 'library', 'library_shows', 'calendar', 'airing', 'requests', 'discover', 'discover_shows', 'theatres', 'upcoming', 'discover_selectable', 'trending_persons']),
    movie: rowsOf('Rows of the Movies Home of the PWA, in order', ['trending_movies', 'library', 'calendar', 'swaps', 'requested_movies', 'discover', 'theatres', 'upcoming', 'discover_selectable']),
    tv: rowsOf('Rows of the TV Home of the PWA, in order', ['trending_shows', 'library_shows', 'airing', 'requested_shows', 'discover_shows']),
  },
  znabs: {
    doc: 'ZNAB sources',
    format: 'source-array',
    default: [],
    children: {
      name: {
        doc: 'Name of ZNAB',
        format: 'String',
        default: '',
      },
      url: {
        doc: 'ZNAB URL (http://localhost:5060/torznab/aggregate/api)',
        format: 'String',
        default: '',
      },
      key: {
        doc: 'ZNAB API Key',
        format: 'String',
        default: '',
      },
      disabled: {
        doc: 'ZNAB API Key',
        format: 'Boolean',
        default: false,
      },
    },
  },
  policies: {
    doc: 'Policies',
    format: 'source-array',
    default: [],
    children: {
      name: {
        doc: 'Policy name',
        format: 'String',
        default: '',
      },
      sorting: {
        doc: 'Preferred final sorting option (after score)',
        format: ['seeders', 'peers', 'size'],
        default: 'seeders',
        arg: 'sort',
      },
      descending: {
        doc: 'Preferred sorting direction',
        format: 'Boolean',
        default: true,
        arg: 'descending',
      },
      match: {
        original_languages: {
          doc: 'Original languages of the movies given this policy by default',
          format: 'source-array',
          default: [],
          children: {
            doc: 'Any ISO 639-1 code',
            format: 'String',
            default: null,
          },
        },
      },
      require: {
        znab: {
          doc: 'Required ZNABs',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from your defined ZNABs`,
            format: 'source-array',
            default: null,
            children: 'String',
          },
        },
        source: {
          doc: 'Required sources',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(oleoo.rules.source).join(', ')}`,
            format: Object.keys(oleoo.rules.source),
            default: null,
          },
        },
        encoding: {
          doc: 'Required encodings',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(oleoo.rules.encoding).join(', ')}`,
            format: Object.keys(oleoo.rules.encoding),
            default: null,
          },
        },
        resolution: {
          doc: 'Required resolutions',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(oleoo.rules.resolution).join(', ')}`,
            format: Object.keys(oleoo.rules.resolution),
            default: null,
          },
        },
        language: {
          doc: 'Required languages',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(oleoo.rules.language).join(', ')}`,
            format: Object.keys(oleoo.rules.language),
            default: null,
          },
        },
        dub: {
          doc: 'Required dubs',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(oleoo.rules.dub).join(', ')}`,
            format: Object.keys(oleoo.rules.dub),
            default: null,
          },
        },
        flags: {
          doc: 'Required flags',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(oleoo.rules.flags).join(', ')}`,
            format: Object.keys(oleoo.rules.flags),
            default: null,
          },
        },
      },
      prefer: {
        znab: {
          doc: 'Preferred ZNABs',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from your defined ZNABs`,
            format: 'source-array',
            default: null,
            children: 'String',
          },
        },
        source: {
          doc: 'Preferred sources',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(oleoo.rules.source).join(', ')}`,
            format: Object.keys(oleoo.rules.source),
            default: null,
          },
        },
        encoding: {
          doc: 'Preferred encodings',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(oleoo.rules.encoding).join(', ')}`,
            format: Object.keys(oleoo.rules.encoding),
            default: null,
          },
        },
        resolution: {
          doc: 'Preferred resolutions',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(oleoo.rules.resolution).join(', ')}`,
            format: Object.keys(oleoo.rules.resolution),
            default: null,
          },
        },
        language: {
          doc: 'Preferred languages',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(oleoo.rules.language).join(', ')}`,
            format: Object.keys(oleoo.rules.language),
            default: null,
          },
        },
        dub: {
          doc: 'Preferred dubs',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(oleoo.rules.dub).join(', ')}`,
            format: Object.keys(oleoo.rules.dub),
            default: null,
          },
        },
        flags: {
          doc: 'Preferred flags',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(oleoo.rules.flags).join(', ')}`,
            format: Object.keys(oleoo.rules.flags),
            default: null,
          },
        },
      },
      avoid: {
        source: {
          doc: 'Avoided sources',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(oleoo.rules.source).join(', ')}`,
            format: Object.keys(oleoo.rules.source),
            default: null,
          },
        },
        encoding: {
          doc: 'Avoided encodings',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(oleoo.rules.encoding).join(', ')}`,
            format: Object.keys(oleoo.rules.encoding),
            default: null,
          },
        },
        resolution: {
          doc: 'Avoided resolutions',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(oleoo.rules.resolution).join(', ')}`,
            format: Object.keys(oleoo.rules.resolution),
            default: null,
          },
        },
        language: {
          doc: 'Avoided languages',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(oleoo.rules.language).join(', ')}`,
            format: Object.keys(oleoo.rules.language),
            default: null,
          },
        },
        dub: {
          doc: 'Avoided dubs',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(oleoo.rules.dub).join(', ')}`,
            format: Object.keys(oleoo.rules.dub),
            default: null,
          },
        },
        flags: {
          doc: 'Avoided flags',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(oleoo.rules.flags).join(', ')}`,
            format: Object.keys(oleoo.rules.flags),
            default: null,
          },
        },
      },
    },
  },
}

// A fresh instance on the same schema, to validate changes before they reach the shared one
export const create = () => convict(schema)

const config = create()

export default config
