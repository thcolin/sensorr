const convict = require('convict')
const standards = require('oleoo/src/rules.json')

convict.addFormat({
  name: 'source-array',
  validate: function (sources, schema) {
    if (!Array.isArray(sources)) {
      throw new Error('must be of type Array')
    }

    for (let source of sources) {
      convict(schema.children).load(source).validate({ output: () => {} })
    }
  },
})

const config = convict({
  disabled: {
    doc: 'Disable daily records',
    format: 'Boolean',
    default: false,
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
  auth: {
    username: {
      doc: 'Authentication username for Sensorr',
      format: 'String',
      default: 'sensorr',
    },
    password: {
      doc: 'Authentication password for Sensorr',
      format: 'String',
      default: 'sensorr',
    },
  },
  logs: {
    ttl: {
      doc: 'Jobs logs TTL in seconds',
      format: 'Number',
      default: 604800,
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
    doctor: {
      code: 'Enable Sensorr Plex doctor (will try to find better releases for archived movies and replace previous)',
      format: 'Boolean',
      default: false,
    },
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
            doc: `Any from ${Object.keys(standards.source).join(', ')}`,
            format: Object.keys(standards.source),
            default: null,
          },
        },
        encoding: {
          doc: 'Preferred encodings',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(standards.encoding).join(', ')}`,
            format: Object.keys(standards.encoding),
            default: null,
          },
        },
        resolution: {
          doc: 'Preferred resolutions',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(standards.resolution).join(', ')}`,
            format: Object.keys(standards.resolution),
            default: null,
          },
        },
        language: {
          doc: 'Preferred languages',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(standards.language).join(', ')}`,
            format: Object.keys(standards.language),
            default: null,
          },
        },
        dub: {
          doc: 'Preferred dubs',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(standards.dub).join(', ')}`,
            format: Object.keys(standards.dub),
            default: null,
          },
        },
        flags: {
          doc: 'Preferred flags',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(standards.flags).join(', ')}`,
            format: Object.keys(standards.flags),
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
            doc: `Any from ${Object.keys(standards.source).join(', ')}`,
            format: Object.keys(standards.source),
            default: null,
          },
        },
        encoding: {
          doc: 'Avoided encodings',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(standards.encoding).join(', ')}`,
            format: Object.keys(standards.encoding),
            default: null,
          },
        },
        resolution: {
          doc: 'Avoided resolutions',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(standards.resolution).join(', ')}`,
            format: Object.keys(standards.resolution),
            default: null,
          },
        },
        language: {
          doc: 'Avoided languages',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(standards.language).join(', ')}`,
            format: Object.keys(standards.language),
            default: null,
          },
        },
        dub: {
          doc: 'Avoided dubs',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(standards.dub).join(', ')}`,
            format: Object.keys(standards.dub),
            default: null,
          },
        },
        flags: {
          doc: 'Avoided flags',
          format: 'source-array',
          default: [],
          children: {
            doc: `Any from ${Object.keys(standards.flags).join(', ')}`,
            format: Object.keys(standards.flags),
            default: null,
          },
        },
      },
    },
  },
})

export default config
