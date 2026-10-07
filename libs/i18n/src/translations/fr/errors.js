export default {
  errors: {
    auth: {
      refused: 'Nom d’utilisateur ou mot de passe incorrect',
    },
    dump: {
      archive: 'Aucune archive, envoyez le dump dans le champ « archive »',
      format: 'Dump au format {format}, ce Sensorr lit le format {expected}',
      legacy: 'Ce n’est pas un dump 0.x, l’archive ne contient ni movies.txt ni stars.txt',
      legacyArchive: 'Aucune archive, envoyez le dump 0.x dans le champ « archive »',
      manifestJson: 'Ce n’est pas un dump Sensorr, son manifest.json n’est pas du JSON',
      manifestSize: 'Ce n’est pas un dump Sensorr, son manifest.json est trop lourd',
      noManifest: 'Ce n’est pas un dump Sensorr, l’archive ne contient pas de manifest.json',
      notManifest: 'Ce n’est pas un dump Sensorr, son manifest.json n’en est pas un',
      unknown: 'Aucun dump « {name} »',
    },
    jobs: {
      exited: 'Le job Sensorr « {job} » s’est arrêté ({code}) avant de démarrer',
      migrating: 'Le job Sensorr « migrate » tourne déjà',
      notRunning: 'Job {job} introuvable ou arrêté',
      restoreBusy: 'Le job Sensorr « {job} » tourne, restaurez une fois qu’il est fini',
      unknown: 'Job Sensorr inconnu « {job} »',
    },
    mail: {
      address: '« {to} » n’est pas une adresse mail',
      friends: 'Entre 1 et 200 amis à inviter',
      refused: 'Le serveur SMTP a refusé le mail : {reason}',
      unset: 'Les mails ne sont pas configurés, renseignez {missing} dans les réglages Mail',
      fields: {
        host: 'le serveur SMTP',
        from: 'l’expéditeur',
        url: 'l’adresse de Sensorr',
      },
    },
    mediux: {
      answered: 'MediUX a répondu : {reason}',
      kind: 'Ni un film ni une série',
    },
    operator: {
      refused: 'Opérateur « {operator} » refusé',
    },
    plex: {
      answered: 'Plex a répondu : {reason}',
      artwork: 'Ce n’est pas un chemin d’image Plex',
      item: 'Ce n’est pas un élément Plex',
      nothing: 'Rien à écrire sur l’élément Plex',
    },
    release: {
      magnetOff: 'Lien magnet, désactivé dans Réglages > Blackhole',
      magnetShow: 'Lien magnet, une série a besoin d’un .torrent',
    },
    shows: {
      unknown: 'Série {id} introuvable',
    },
    torrent: {
      invalid: '.torrent invalide : {reason}',
      video: '.torrent invalide, aucun fichier vidéo',
    },
    update: {
      channel: 'Canal inconnu « {channel} »',
      jobRunning: 'Le job Sensorr « {job} » tourne, recréer sensorr-api l’interromprait',
      off: 'Aucun sensorr-updater, activez le profil updater',
      unset: 'Aucun sensorr-updater, NX_UPDATER_URL n’est pas défini',
      updater: 'sensorr-updater a répondu {status}, {reason}',
    },
    wrapped: {
      closed: 'Aucune année de leur wrapped n’est ouverte, activez-en une dans les réglages',
      email: 'Une adresse mail est requise',
      prune: 'Aucune lecture vue par l’exécution « {seen} », rien n’a été supprimé',
    },
  },
}
