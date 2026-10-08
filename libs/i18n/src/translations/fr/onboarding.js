export default {
  onboarding: {
    title: 'Prise en main',
    welcome: {
      password: '<0>Attention</0>, le mot de passe est toujours <1>sensorr</1> : changez <2>SENSORR_PASSWORD</2> dans le <3>.env</3> de votre dossier d’installation, puis lancez-y <4>docker compose up -d</4>',
      fresh: {
        title: 'Nouvelle instance',
        description: 'Partir d’une bibliothèque vide',
      },
      dump: {
        title: 'Depuis un dump',
        description: 'Reprendre la bibliothèque et les paramètres d’un autre Sensorr',
        file: 'Dump à importer',
        help: 'Le <0>.zip</0> de <1>{settings} › {page}</1>, sur l’autre Sensorr. Importé quand vous continuez, ses paramètres remplissent ensuite les étapes suivantes, sauf les clés et les mots de passe.',
      },
      legacy: {
        title: 'Depuis une 0.x',
        description: 'Reprendre les films et les stars d’un Sensorr 0.x',
        converted: 'Son <0>config.json</0> a été converti au démarrage : {count, plural, one {# indexeur} other {# indexeurs}} et sa Policy sont déjà en place, Plex est à lier de nouveau',
        file: 'Dump 0.x',
        help: 'Le <0>.zip</0> que donne le bouton <1>Dump</1> d’une 0.x, dans <2>Settings > Database</2>.{archive, select, true { Il est importé dès que TMDB répond, suivez-le dans Jobs.} other {}}',
      },
    },
    steps: {
      welcome: {
        title: 'Bienvenue',
        subtitle: 'Quelques étapes et ce Sensorr se met à chercher : TMDB, vos indexeurs, où vont les releases. Seul TMDB est requis, et tout reste ensuite dans les Paramètres',
      },
      tmdb: {
        required: 'Une clé d’API TMDB est requise',
        invalid: 'Clé d’API TMDB invalide, vérifiez votre configuration.',
      },
      plex: {
        required: 'Liez votre serveur Plex, ou passez cette étape',
      },
      friends: {
        share: 'Partagez-leur <0>{url}</0>, ou configurez le Mail ci-dessous pour les inviter depuis <1>{settings} › {page}</1>.',
      },
      jobs: {
        subtitle: 'Sensorr lance ces jobs tout seul. Mettez en pause ceux dont vous ne voulez pas encore',
        stay: 'Planifications, Proposals et lancements manuels restent dans <0>{settings} › {page}</0>.',
      },
      end: {
        title: 'Prêt',
        subtitle: 'Sensorr est programmé. Les Paramètres gardent tout pour plus tard',
      },
    },
    end: {
      next: 'À venir',
      paused: 'Tous les jobs sont en pause, rien ne se lance tout seul',
      todo: 'Reste à configurer',
      setup: 'Configurer ›',
      set: 'Configuré',
    },
    recap: {
      indexers: '{count, plural, one {# indexeur} other {# indexeurs}}',
      policies: '{count, plural, one {# Policy} other {# Policies}}',
      missing: {
        tmdb: 'pas de clé, rien ne charge',
        indexers: 'rien à chercher pour l’instant',
        policies: 'les seeders choisissent la release',
        blackhole: 'aucun dossier où déposer les releases',
        plex: 'non lié',
        friends: 'pas de mail',
      },
      today: 'aujourd’hui à {time}',
      tomorrow: 'demain à {time}',
      day: '{day} à {time}',
    },
    footer: {
      back: 'Retour',
      skip: 'Passer',
      continue: 'Continuer',
      open: 'Ouvrir Sensorr',
    },
    status: 'Étape {step} sur {count}, {label}',
    restore: {
      choose: 'Choisissez le .zip du dump, ou partez d’une nouvelle instance',
      failed: 'La restauration {job} a échoué',
      progress: '{done, select, true {Le dump est importé} other {Le dump est en cours d’import}}, suivez-le dans <0>Jobs</0>',
      legacy: 'Le dump 0.x est en cours d’import, suivez-le dans <0>Jobs</0>',
    },
  },
  login: {
    title: 'Connexion',
    username: 'Nom d’utilisateur',
    password: 'Mot de passe',
    submit: 'Se connecter',
    pending: 'Connexion...',
    unknown: 'Erreur inconnue, vérifiez les logs des conteneurs Docker',
    tmdb: 'Sensorr utilise l’API de <0>The Movie Database</0>, sans être approuvé ni certifié par TMDB',
  },
  keepInTouch: {
    title: 'Keep in touch',
    heading: 'Keep In Touch',
    subtitle: 'Quelqu’un de formidable veut suivre votre Watchlist Plex et tenir compte de vos envies de films !',
    tagline: 'Un magnétoscope numérique sympathique. Le magnétoscope, version moderne.',
    pin: 'Erreur lors de la récupération du code PIN Plex, contactez l’administrateur',
    refused: {
      title: 'Ce compte Plex ne fait pas partie de ceux avec qui le serveur Plex de ce Sensorr est partagé.',
      help: 'Demandez à la personne qui vous a envoyé ce lien de partager son serveur Plex avec vous, puis rouvrez-le. Ou connectez-vous à Plex avec le compte avec lequel elle le partage.',
    },
    done: {
      title: 'Merci, votre compte Plex est lié au serveur Sensorr !',
      watchlist: 'L’administrateur peut maintenant suivre les films de votre <0>« Watchlist » Plex</0> et envisager de les ajouter à sa bibliothèque.',
      wrapped: {
        open: 'Ouvrir mon wrapped',
        copy: 'Copier le lien',
        copied: 'Lien de votre wrapped copié dans le presse-papiers',
        uncopied: 'Le lien n’a pas pu être copié, ouvrez votre wrapped et gardez son adresse',
        keep: 'Ce lien n’existe que pour vous : gardez-le pour revenir sur votre wrapped. Vous le retrouverez aussi ici, en liant à nouveau votre compte Plex.',
      },
    },
    link: {
      go: 'Aller sur <0>plex.tv/link</0>',
      code: 'Puis saisissez le code ci-dessous pour lier votre compte Plex au serveur Sensorr :',
      watchlist: 'Lier votre compte Plex au serveur Sensorr permettra à l’administrateur de suivre les films de votre <0>« Watchlist » Plex</0> et d’envisager de les ajouter à sa bibliothèque.',
    },
    device: 'Le serveur Sensorr apparaîtra comme <0>appareil autorisé</0> sur votre <1>compte Plex</1>, où vous pourrez le gérer.',
  },
}
