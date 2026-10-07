export default {
  mail: {
    greeting: 'Hi {name},',
    or: 'or open {href}',
    sent: 'Sent by {sender} with Sensorr.',
    watchlist: 'Open my Watchlist',
    arrivals: {
      movie: 'Movie',
      episodes: '{count, plural, one {# episode} other {# episodes}}',
      season: 'Season {season} · {count, plural, one {# episode} other {# episodes}}',
    },
    test: {
      subject: 'Mail works',
      word: 'Test',
      paragraph: 'Your friends will get their invitation, welcome, reminders, movies ready to watch and wrapped from this address.',
      action: 'Open the Mail settings',
      foot: 'Sent by your Sensorr from its Mail settings.',
    },
    invitation: {
      subject: '{sender} invites you to share your movie wishes',
      word: 'Invitation',
      paragraph: "Add movies to your Plex Watchlist, and {service} gets them for you on {sender}'s Plex. Connect your Plex account once to start, it takes a minute.",
      action: 'Connect my Plex',
      foot: 'Sent by {sender} with Sensorr. You got this mail because {sender} {named, select, yes {shares their Plex with you} other {typed your address}}.',
    },
    welcome: {
      subject: "You're all set",
      word: 'Welcome',
      paragraph: 'Every movie you add to your Plex Watchlist now reaches {service}. You will get a mail when your movies are ready to watch.',
      wrapped: "Your year on {sender}'s Plex has its own page too, it fills up as you watch: {href}",
    },
    reconnect: {
      subject: 'Your movie wishes no longer reach {service}',
      word: 'Reconnect',
      title: 'Reconnect your Plex account',
      paragraph: 'Plex disconnected your account from {service}, so the movies you add to your Watchlist no longer reach it. Reconnect once and it works again.',
      action: 'Reconnect Plex',
      reminder: 'Reminder {reminder} of 3.',
      stop: 'Stop these reminders',
    },
    reconnected: {
      subject: 'Your movie wishes reach {service} again',
      word: 'Reconnected',
      title: "You're reconnected",
      paragraph: 'Every movie you add to your Plex Watchlist reaches {service} again.',
    },
    requests: {
      subject: '{count, plural, one {{title} is ready to watch} other {# of your requests are ready to watch}}',
      word: 'Ready to watch',
      paragraph: "{count, plural, one {It just reached} other {They just reached}} {sender}'s Plex.",
      more: 'And {count} more, all on Plex.',
      action: 'Open Plex',
      foot: 'Sent by {sender} with Sensorr, once a week when something new arrives.',
      stop: 'Stop these mails',
    },
    wrapped: {
      band: 'Retrospective',
      subject: '{open, select, yes {Your {year} on Plex, so far} other {Your {year} on Plex is ready}}',
      title: '{open, select, yes {Your year on Plex, so far} other {Your year on Plex is ready}}',
      body: "{open, select, yes {Every evening you spent on {sender}'s Plex since 1 December {previous}, on one page made for you. It fills up until 1 December {year}.} other {Every evening you spent on {sender}'s Plex, from 1 December {previous} to 1 December {year}, on one page made for you.}}",
      action: 'Open my wrapped',
      foot: '{open, select, yes {Sent by {sender} with Sensorr.} other {Sent by {sender} with Sensorr, once a year.}}',
    },
    unsubscribe: {
      kinds: {
        reconnect: 'the reminders to reconnect your Plex account',
        requests: 'the weekly mail of your requests ready to watch',
      },
      broken: {
        title: 'This link no longer works',
        body: 'Ask the person who sent you the mail to stop it for you.',
      },
      done: {
        title: 'Done, no more of these mails',
        body: 'You will no longer get {what}.',
      },
      ask: {
        title: 'Stop these mails?',
        body: 'You will no longer get {what}. The other mails keep coming.',
      },
      action: 'Stop these mails',
    },
  },
}
