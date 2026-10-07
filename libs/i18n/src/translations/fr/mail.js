export default {
  mail: {
    greeting: 'Bonjour {name},',
    or: 'ou ouvrez {href}',
    sent: 'Envoyé par {sender} avec Sensorr.',
    watchlist: 'Ouvrir ma Watchlist',
    arrivals: {
      movie: 'Film',
      episodes: '{count, plural, one {# épisode} other {# épisodes}}',
      season: 'Saison {season} · {count, plural, one {# épisode} other {# épisodes}}',
    },
    test: {
      subject: 'Les mails fonctionnent',
      word: 'Test',
      paragraph: 'Vos amis recevront depuis cette adresse leur invitation, le mail de bienvenue, les rappels, les films prêts à regarder et leur wrapped.',
      action: 'Ouvrir les paramètres Mail',
      foot: 'Envoyé par votre Sensorr depuis ses paramètres Mail.',
    },
    invitation: {
      subject: '{sender} vous invite à partager vos envies de films',
      word: 'Invitation',
      paragraph: 'Ajoutez des films à votre Watchlist Plex, et {service} les récupère pour vous sur le Plex de {sender}. Connectez votre compte Plex une fois pour commencer, c’est l’affaire d’une minute.',
      action: 'Connecter mon Plex',
      foot: 'Envoyé par {sender} avec Sensorr. Vous recevez ce mail parce que {sender} {named, select, yes {partage son Plex avec vous} other {a saisi votre adresse}}.',
    },
    welcome: {
      subject: 'Tout est prêt',
      word: 'Bienvenue',
      paragraph: 'Chaque film ajouté à votre Watchlist Plex arrive désormais jusqu’à {service}. Vous recevrez un mail quand vos films seront prêts à regarder.',
      wrapped: 'Votre année sur le Plex de {sender} a aussi sa page, elle se remplit au fil de vos séances : {href}',
    },
    reconnect: {
      subject: 'Vos envies de films n’arrivent plus jusqu’à {service}',
      word: 'Reconnexion',
      title: 'Reconnectez votre compte Plex',
      paragraph: 'Plex a déconnecté votre compte de {service} : les films ajoutés à votre Watchlist n’y arrivent plus. Reconnectez-vous une fois et tout refonctionne.',
      action: 'Reconnecter Plex',
      reminder: 'Rappel {reminder} sur 3.',
      stop: 'Ne plus recevoir ces rappels',
    },
    reconnected: {
      subject: 'Vos envies de films arrivent de nouveau jusqu’à {service}',
      word: 'Reconnecté',
      title: 'Vous êtes reconnecté',
      paragraph: 'Chaque film ajouté à votre Watchlist Plex arrive de nouveau jusqu’à {service}.',
    },
    requests: {
      subject: '{count, plural, one {{title} est prêt à regarder} other {# de vos demandes sont prêtes à regarder}}',
      word: 'Prêt à regarder',
      paragraph: '{count, plural, one {Il vient d’arriver} other {Ils viennent d’arriver}} sur le Plex de {sender}.',
      more: 'Et {count} de plus, tous sur Plex.',
      action: 'Ouvrir Plex',
      foot: 'Envoyé par {sender} avec Sensorr, une fois par semaine quand quelque chose de nouveau arrive.',
      stop: 'Ne plus recevoir ces mails',
    },
    wrapped: {
      band: 'Rétrospective',
      subject: '{open, select, yes {Votre {year} sur Plex, pour l’instant} other {Votre {year} sur Plex est prêt}}',
      title: '{open, select, yes {Votre année sur Plex, pour l’instant} other {Votre année sur Plex est prête}}',
      body: '{open, select, yes {Toutes les soirées passées sur le Plex de {sender} depuis le 1er décembre {previous}, sur une page faite pour vous. Elle se remplit jusqu’au 1er décembre {year}.} other {Toutes les soirées passées sur le Plex de {sender}, du 1er décembre {previous} au 1er décembre {year}, sur une page faite pour vous.}}',
      action: 'Ouvrir mon wrapped',
      foot: '{open, select, yes {Envoyé par {sender} avec Sensorr.} other {Envoyé par {sender} avec Sensorr, une fois par an.}}',
    },
    unsubscribe: {
      kinds: {
        reconnect: 'les rappels pour reconnecter votre compte Plex',
        requests: 'le mail hebdomadaire de vos demandes prêtes à regarder',
      },
      broken: {
        title: 'Ce lien ne fonctionne plus',
        body: 'Demandez à la personne qui vous a envoyé le mail de l’arrêter pour vous.',
      },
      done: {
        title: 'C’est fait, plus de mails de ce type',
        body: 'Vous ne recevrez plus {what}.',
      },
      ask: {
        title: 'Ne plus recevoir ces mails ?',
        body: 'Vous ne recevrez plus {what}. Les autres mails continuent d’arriver.',
      },
      action: 'Ne plus recevoir ces mails',
    },
  },
}
