export default {
  errors: {
    auth: {
      refused: 'Incorrect username or password',
    },
    dump: {
      archive: 'No archive, send the dump as the "archive" field',
      format: 'Dump format {format}, this Sensorr reads format {expected}',
      legacy: 'Not a 0.x dump, the archive has neither movies.txt nor stars.txt',
      legacyArchive: 'No archive, send the 0.x dump as the "archive" field',
      manifestJson: 'Not a Sensorr dump, its manifest.json is not JSON',
      manifestSize: 'Not a Sensorr dump, its manifest.json is too large',
      noManifest: 'Not a Sensorr dump, the archive has no manifest.json',
      notManifest: 'Not a Sensorr dump, its manifest.json is not one',
      unknown: 'No dump "{name}"',
    },
    jobs: {
      exited: 'Sensorr job "{job}" exited ({code}) before it started',
      migrating: 'Sensorr job "migrate" is already running',
      notRunning: 'Job {job} not found or not running',
      restoreBusy: 'Sensorr job "{job}" is running, restore once it ends',
      unknown: 'Unknown Sensorr job "{job}"',
    },
    mail: {
      address: '"{to}" is not an email address',
      friends: 'Between 1 and 200 friends to invite',
      refused: 'The SMTP server refused the mail: {reason}',
      unset: 'Mail is not set up, fill the {missing} on the Mail settings page',
      fields: {
        host: 'SMTP host',
        from: 'sender',
        url: 'address of Sensorr',
      },
    },
    mediux: {
      answered: 'MediUX answered: {reason}',
      kind: 'Not a movie nor a show',
    },
    operator: {
      refused: 'Operator "{operator}" refused',
    },
    plex: {
      answered: 'Plex answered: {reason}',
      artwork: 'Not a Plex artwork path',
      item: 'Not a Plex item',
      nothing: 'Nothing to write on a Plex item',
    },
    release: {
      magnetOff: 'Magnet link, turned off in Settings > Blackhole',
      magnetShow: 'Magnet link, a show needs a .torrent',
    },
    shows: {
      unknown: 'Show {id} not found',
    },
    torrent: {
      invalid: 'Invalid .torrent: {reason}',
      video: 'Invalid .torrent, no video file',
    },
    update: {
      channel: 'Unknown channel "{channel}"',
      jobRunning: 'Sensorr job "{job}" is running, recreating sensorr-api would kill it',
      off: 'No sensorr-updater, turn on the updater profile',
      unset: 'No sensorr-updater, NX_UPDATER_URL is not set',
      updater: 'sensorr-updater answered {status}, {reason}',
    },
    wrapped: {
      closed: 'No year of their wrapped is open, turn one on in Settings',
      email: 'An email is required',
      prune: 'No play seen by run "{seen}", nothing pruned',
    },
  },
}
