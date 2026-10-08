export default {
  onboarding: {
    title: 'Onboarding',
    welcome: {
      password: '<0>Warning</0>, the password is still <1>sensorr</1>: change <2>SENSORR_PASSWORD</2> in the <3>.env</3> of your install folder, then run <4>docker compose up -d</4> there',
      fresh: {
        title: 'New instance',
        description: 'Start from an empty library',
      },
      dump: {
        title: 'From a dump',
        description: 'Bring the library and the settings of another Sensorr over',
        file: 'Dump to import',
        help: 'The <0>.zip</0> of <1>{settings} › {page}</1>, on the other Sensorr. Imported as you continue, its settings then fill the next steps, all but the keys and passwords.',
      },
      legacy: {
        title: 'From a 0.x',
        description: 'Bring the movies and stars of a Sensorr 0.x over',
        converted: 'Its <0>config.json</0> was converted at boot: {count, plural, one {# indexer} other {# indexers}} and its policy are already set, Plex has to be linked again',
        file: '0.x dump',
        help: 'The <0>.zip</0> the <1>Dump</1> button of a 0.x gives, in <2>Settings > Database</2>.{archive, select, true { It is imported once TMDB answers, follow it in Jobs.} other {}}',
      },
    },
    steps: {
      welcome: {
        title: 'Welcome',
        subtitle: 'A few steps get this Sensorr searching: TMDB, your indexers, where releases go. Only TMDB is required, and everything stays in Settings afterwards',
      },
      tmdb: {
        required: 'A TMDB API key is required',
        invalid: 'Invalid TMDB API key, check your configuration.',
      },
      plex: {
        required: 'Link your Plex server, or skip this step',
      },
      friends: {
        share: 'Share <0>{url}</0> with them, or set up Mail below to invite them from <1>{settings} › {page}</1>.',
      },
      jobs: {
        subtitle: 'Sensorr runs these jobs on its own. Pause the ones you do not want yet',
        stay: 'Schedules, proposals and manual runs stay in <0>{settings} › {page}</0>.',
      },
      end: {
        title: 'Ready',
        subtitle: 'Sensorr is programmed. Settings keeps everything for later',
      },
    },
    end: {
      next: 'Next',
      paused: 'Every job is paused, nothing runs on its own',
      todo: 'Still to set up',
      setup: 'Set up ›',
      set: 'Set',
    },
    recap: {
      indexers: '{count, plural, one {# indexer} other {# indexers}}',
      policies: '{count, plural, one {# policy} other {# policies}}',
      missing: {
        tmdb: 'no key, nothing loads',
        indexers: 'nothing to search yet',
        policies: 'seeders pick the release',
        blackhole: 'no folder to drop releases',
        plex: 'not linked',
        friends: 'no mail',
      },
      today: 'today at {time}',
      tomorrow: 'tomorrow at {time}',
      day: '{day} at {time}',
    },
    footer: {
      back: 'Back',
      skip: 'Skip',
      continue: 'Continue',
      open: 'Open Sensorr',
    },
    status: 'Step {step} of {count}, {label}',
    restore: {
      choose: 'Choose the dump\'s .zip, or start from a new instance',
      failed: 'The restore {job} failed',
      progress: '{done, select, true {The dump is imported} other {The dump is being imported}}, follow it in <0>Jobs</0>',
      legacy: 'The 0.x dump is being imported, follow it in <0>Jobs</0>',
    },
  },
  login: {
    title: 'Login',
    username: 'Username',
    password: 'Password',
    submit: 'Login',
    pending: 'Login...',
    unknown: 'Unknown error, check Docker containers logs',
    tmdb: 'Sensorr is powered by <0>The Movie Database</0> API, but is not endorsed or certified by TMDB',
  },
  keepInTouch: {
    title: 'Keep in touch',
    heading: 'Keep In Touch',
    subtitle: 'Someone wonderful want to follow your Plex watchlist and consider your movie wishes !',
    tagline: 'A Friendly Digital Video Recorder. Think VCR but in modern times.',
    pin: 'Error while fetching Plex PIN, contact administrator',
    refused: {
      title: 'This Plex account is not one the Plex server of this Sensorr is shared with.',
      help: 'Ask the person who sent you this link to share their Plex server with you, then open it again. Or sign in to Plex with the account they share it with.',
    },
    done: {
      title: 'Thanks, you\'ve linked your Plex account with Sensorr server !',
      watchlist: 'Administrator is now allowed to follow movies from your <0>Plex "Watchlist"</0> and consider adding them to his library.',
      wrapped: {
        open: 'Open my wrapped',
        explore: 'Explore my year',
        copy: 'Copy the link',
        copied: 'Link to your wrapped copied to the clipboard',
        uncopied: 'The link could not be copied, open your wrapped and keep its address',
        keep: 'This link exists only for you: keep it to come back to your wrapped. You will also find it here, by linking your Plex account again.',
      },
    },
    link: {
      go: 'Go to <0>plex.tv/link</0>',
      code: 'And enter below code to link your Plex account with Sensorr server :',
      watchlist: 'Linking your Plex account with Sensorr server will allow administrator to follow movies from your <0>Plex "Watchlist"</0> and consider adding them to his library.',
    },
    device: 'Sensorr server will be listed as an <0>authorized device</0> on your <1>Plex account</1> where you can manage it.',
  },
}
