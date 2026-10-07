import { emojize } from '@sensorr/utils'

export default {
  collection: {
    saga: 'Saga',
    error: 'Désolé, impossible d’afficher la collection...',
  },
  movie: {
    error: 'Désolé, impossible d’afficher le film...',
  },
  person: {
    error: 'Désolé, impossible d’afficher la personne...',
    genres: {
      documentary: 'Documentaire',
      tvMovie: 'Téléfilm',
    },
  },
  details: {
    contribute: 'Contribuer à TheMovieDB',
    overview: {
      more: 'Afficher plus',
      less: 'Afficher moins',
    },
    poster: {
      state: 'État',
    },
    externals: {
      rottenTomatoes: 'Note des critiques Rotten Tomatoes sur {count} critiques',
      metacritic: 'Metascore sur {count} critiques',
      plex: 'Disponible sur votre serveur Plex',
      streaming: 'Disponible en streaming sur {providers} (source JustWatch)',
      quoted: '« {name} »',
    },
    ticket: {
      searchMovie: 'Chercher des releases pour ce film sur vos indexeurs',
      searchShow: 'Chercher des releases pour cette série sur vos indexeurs',
      searchFor: 'Chercher des',
      releases: 'Releases',
    },
    preferences: {
      policy: 'Sensorr appliquera la Policy choisie pour trier les releases et choisir la meilleure',
      defaultPolicy: 'par défaut',
      refine: {
        label: 'Refine vers une meilleure release',
        help: 'Sensorr cherchera régulièrement une meilleure release que celle actuellement archivée',
      },
      shrink: {
        label: 'Shrink vers une release plus légère',
        help: 'Sensorr cherchera régulièrement une release plus légère que celle actuellement archivée',
      },
    },
    lists: {
      placeholder: 'Ajouter à une liste',
      help: 'Tapez un nouveau nom pour créer une liste',
    },
  },
  proposals: {
    title: 'Swaps',
    selected: '{count, plural, one {# sélectionné} other {# sélectionnés}}',
    threshold: {
      title: 'Une Proposal qui libère moins d’espace disque que ce seuil est ignorée',
      label: 'Min. libéré',
    },
    balance: {
      title: 'Les fichiers Plex de ces films pèsent {now}, et {after} une fois chaque Swap accepté',
      now: 'maintenant <0>{size}</0>',
      after: 'après <0>{size}</0>',
    },
    sides: {
      current: 'Taille actuelle',
      proposed: 'Taille proposée',
    },
    sorting: {
      time: 'Date de traitement',
      gain: 'Espace libéré',
    },
    filters: {
      title: 'Filtres de release',
      subtitle: 'Cliquez sur un tag pour changer son état : 📀 Actuel, une release possédée le porte ; 💿 Proposé, la release proposée le porte ; 🔕 il ne compte pas',
    },
    groups: {
      rest: 'ignored',
      overdue: 'en retard',
      noChange: '{label} (aucun changement)',
    },
    group: {
      selectAll: 'Tout sélectionner',
      unselectAll: 'Tout désélectionner',
    },
    verdicts: {
      accept: 'Acceptée',
      refuse: 'Refusée',
      ban: 'Bannie',
      retry: 'Relancée',
      drop: 'Abandonnée',
      replace: 'Remplacée',
    },
    session: {
      accept: '{count, plural, one {# acceptée} other {# acceptées}}',
      refuse: '{count, plural, one {# refusée} other {# refusées}}',
      ban: '{count, plural, one {# bannie} other {# bannies}}',
      retry: '{count, plural, one {# relancée} other {# relancées}}',
      drop: '{count, plural, one {# abandonnée} other {# abandonnées}}',
      replace: '{count, plural, one {# remplacée} other {# remplacées}}',
    },
    errors: {
      overdue: 'Erreur lors du chargement des Swaps en retard',
    },
    elsewhere: '{title} a été traité ailleurs',
    retryFailed: 'La relance a échoué pour <0>{title}</0>, le Swap est conservé',
    toast: {
      error: 'Erreur lors de l’envoi de **{verdict}** pour **{target}**',
      errorMany: 'Erreur lors de l’envoi de **{verdict}** pour **{count}** Proposals',
      many: '**{count}** Proposals',
      undo: 'Annuler',
      ban: 'Bannir',
    },
    reload: 'Réessayer',
    replace: 'Remplacer',
    empty: {
      match: {
        title: 'Aucun résultat',
        subtitle: 'Aucun Swap ne correspond aux filtres de release',
      },
      decided: 'Tout est décidé',
      nothing: {
        title: 'Rien à décider',
        subtitle: 'Les Jobs avec <0>proposalOnly</0> attendent ici votre choix, voir les <1>paramètres des Jobs</1>',
      },
    },
    end: {
      title: 'Vous êtes arrivé au bout de la bande',
      subtitle: 'Soyez sympa, <0>rembobinez</0>, et laissez le prochain job <1>refine</1> ou <2>shrink</2> enregistrer d’autres Swaps.',
    },
    card: {
      close: 'Fermer',
      closeTitle: 'Fermer (Échap)',
      size: {
        against: 'Taille face à la release possédée la plus légère : {delta}',
        proposed: 'Taille de la release proposée',
      },
      reported: 'Signalé',
      banned: '{count, plural, one {release possédée bannie} other {# releases possédées bannies}}',
      open: 'Ouvrir {title}',
      openTitle: 'Ouvrir',
      select: 'Sélectionner {title}',
      proposal: 'la Proposal',
    },
    overdue: {
      accepted: 'acceptée {distance}',
      notOnPlex: 'absente de Plex',
      retry: {
        button: 'Relancer',
        title: 'Renvoyer le même .torrent dans le Blackhole',
        label: 'Relancer {title}',
      },
      search: {
        button: 'Chercher',
        title: 'Choisir une autre release à sa place',
        label: 'Chercher une autre release de {title}',
      },
      drop: {
        button: 'Abandonner',
        title: 'Retirer la release acceptée et garder ce que Plex a',
        label: 'Abandonner le Swap de {title}, Plex garde sa version',
      },
    },
  },
  shows: {
    follow: {
      partial: 'Followed en partie',
    },
    search: {
      series: 'toute la série',
      title: 'Releases pour {label}',
    },
    proposals: {
      replaces: 'remplace {count, plural, one {# épisode} other {# épisodes}}',
      fills: 'complète {label}',
      fillsCount: 'complète {count, plural, one {# épisode} other {# épisodes}}',
      group: 'Proposal en attente pour {coverage}',
    },
    actions: {
      years: {
        help: 'Sensorr écartera les releases dont l’année sort de cette plage',
        from: 'De',
        to: 'À',
        placeholder: 'AAAA',
      },
      monitored: {
        label: 'Suivre les épisodes',
        on: 'Sensorr cherche les épisodes suivis',
        off: 'Sensorr ne cherche aucun de ses épisodes',
      },
      newSeasons: {
        label: 'Suivre les nouvelles saisons',
        first: 'Suivez d’abord les épisodes',
        on: 'Les saisons à venir sont suivies dès leur annonce',
        off: 'Les saisons à venir attendent que vous les suiviez',
      },
    },
    seasons: {
      all: 'Toutes les saisons',
      specials: 'Épisodes spéciaux',
      season: 'Saison {number}',
      seasons: '{count, plural, one {# saison} other {# saisons}}',
      episodes: '{count, plural, one {# épisode} other {# épisodes}}',
      owned: '{count, plural, one {# possédé} other {# possédés}}',
      proposed: '{count, plural, one {# Proposal en attente} other {# Proposals en attente}}',
      wanted: '{count, plural, one {# recherché} other {# recherchés}}',
      search: 'Chercher des releases pour {label}',
      follow: {
        all: 'Tous les épisodes de {season} sont suivis',
        partial: '{followed} épisodes sur {count} de {season} suivis',
        label: 'Suivre tous les épisodes de {season}',
      },
      noPoster: 'Aucune affiche',
      complete: 'Tous les épisodes diffusés sont possédés',
      episode: {
        tba: 'À annoncer',
        followed: 'Épisode {number} suivi',
        follow: 'Suivre l’épisode {number}',
      },
      remote: {
        error: 'Impossible de charger les épisodes : {message}',
        empty: 'Aucun épisode annoncé pour l’instant',
      },
      replaced: 'Remplacé par une Proposal en attente',
    },
    show: {
      wanted: '{count, plural, one {# épisode recherché} other {# épisodes recherchés}}',
      errors: {
        show: 'Erreur lors du suivi de la série',
        episode: 'Erreur lors du suivi de l’épisode',
        display: 'Désolé, impossible d’afficher la série...',
        episodes: 'Désolé, impossible de charger les épisodes...',
      },
    },
    library: {
      head: 'Explorez les séries de votre bibliothèque avec différents filtres comme l’<0>état</0>, les <1>genres</1>, les <2>chaînes</2>, la <3>première diffusion</3>, etc...',
      selectAll: 'Tout sélectionner',
      selected: '{count, plural, one {# sélectionnée} other {# sélectionnées}}',
      confirmPolicy: 'Voulez-vous passer la Policy de {selection} à {policy} ?',
      errors: {
        statistics: 'Erreur lors du chargement des statistiques de la bibliothèque',
      },
      empty: 'Aucune série de votre bibliothèque ne correspond à ces filtres, essayez-en moins',
    },
    discover: {
      statuses: {
        returning: 'Renouvelée',
        production: 'En production',
        planned: 'Prévue',
        pilot: 'Pilote',
        ended: 'Terminée',
        canceled: 'Annulée',
      },
      hideLibrary: 'Masquer la bibliothèque',
      head: 'Découvrez des séries avec différents filtres comme les <0>genres</0>, les <1>chaînes</1>, le <2>type</2>, la <3>première diffusion</3>, etc...',
      hint: 'Combinez les filtres pour découvrir de nouvelles séries !',
      empty: 'Essayez par exemple : quelles sont les séries <1>policières</1> <0>les mieux notées</0> lancées dans les <2>années 2000</2> ?',
    },
    calendar: {
      fallback: {
        title: 'Désolé, impossible d’afficher les épisodes...',
        subtitle: 'L’API n’a pas répondu à la requête des épisodes, réessayez ou reconnectez-vous',
      },
      none: {
        title: 'Commencez par suivre quelques séries',
        subtitle: 'Le calendrier liste les épisodes des séries que vous suivez, suivez-en une depuis sa page ou depuis votre bibliothèque',
      },
      show: 'Série {id}',
      noun: 'épisodes',
      head: 'Affinez les épisodes des séries que vous suivez par leur <0>statut</0>, ou par la <1>chaîne</1>, les <2>genres</2>, la <3>Policy</3> et les <4>demandeurs</4> de leur série',
      errors: {
        statistics: 'Erreur lors du chargement des statistiques du calendrier',
      },
      label: 'Épisodes par jour',
      month: {
        empty: {
          title: 'Aucun épisode ce mois-ci',
          subtitle: 'Aucune des séries que vous suivez n’a d’épisode diffusé ce mois-ci qui corresponde à ces filtres, essayez un autre mois ou moins de filtres',
        },
      },
      list: {
        empty: {
          title: 'Aucun épisode à lister',
          subtitle: 'Aucune des séries que vous suivez n’a encore d’épisode daté qui corresponde à ces filtres',
        },
      },
    },
  },
  artworks: {
    change: 'Changer les visuels',
    title: 'Visuels',
    dialog: 'Visuels de {title}',
    seasonOf: '{season} de {show}',
    subtitle: {
      season: 'Choisissez l’<0>affiche</0> que Plex montre pour <1>{title}</1>, depuis Plex, TMDB ou un lien collé',
      entity: 'Choisissez l’<0>affiche</0>, l’<1>arrière-plan</1> et le <2>logo</2> que Plex montre pour <3>{title}</3>, depuis Plex, TMDB, les sets MediUX ou un lien collé',
    },
    kinds: {
      poster: 'Affiche',
      backdrop: 'Arrière-plan',
      logo: 'Logo',
    },
    errors: {
      mediux: 'MediUX n’a pas répondu : ses sets manquent',
      plex: 'Plex n’a pas répondu : ses visuels manquent, et rien ne peut être écrit',
      tmdb: 'TMDB n’a pas répondu : ses visuels manquent',
    },
    sets: {
      title: 'Sets',
      empty: 'Aucun set MediUX pour ce titre',
      set: 'Set {title}',
      setBy: 'Set {title} par {author}',
    },
    empty: '{kind, select, poster {Aucune affiche} backdrop {Aucun arrière-plan} other {Aucun logo}} sur Plex ni sur TMDB, ajoutez-en {kind, select, poster {une} other {un}} depuis un lien',
    groups: {
      current: 'actuel',
      others: 'autres',
      links: 'liens',
    },
    add: '{kind, select, poster {Ajouter une affiche} backdrop {Ajouter un arrière-plan} other {Ajouter un logo}} depuis un lien',
    paste: 'Collez un lien : ThePosterDB, MediUX, n’importe quelle image',
    candidate: '{label}, {lang}, depuis {source}{current, select, true {, actuel} other {}}',
    noLanguage: 'sans langue',
    current: 'actuel',
    writing: 'Écriture…',
    toasts: {
      failed: 'Plex n’a pas pu écrire les visuels, rien n’a changé',
      later: 'Écrit sur Plex, Sensorr l’affichera après la prochaine synchronisation',
      refused: 'Plex a refusé {kinds} : {reasons}',
      success: 'Visuels écrits sur Plex',
    },
    fetchOnApply: 'Plex la récupère en appliquant',
    noLogo: 'Aucun logo',
    reset: 'Tout réinitialiser',
    link: {
      label: 'Lien ({label})',
      invalid: 'Ce n’est pas un lien d’image',
      add: 'Ajouter',
      fallback: 'lien',
    },
  },
  calendar: {
    views: {
      grid: emojize('🖼️', 'Grille'),
      calendar: emojize('🗓️', 'Calendrier'),
      list: emojize('📋', 'Liste'),
    },
    today: 'Aujourd’hui',
    loading: 'Chargement des {noun}',
    error: 'Erreur lors du chargement des {noun}',
    retry: 'Impossible de charger les {noun} {stream, select, past {précédents} other {suivants}}, réessayer',
    more: 'Charger les {noun} {stream, select, past {précédents} other {suivants}}',
  },
  enhancers: {
    bulk: {
      movies: '{count, plural, one {# film} other {# films}}',
      shows: '{count, plural, one {# série} other {# séries}}',
      state: 'État',
      confirm: 'Voulez-vous passer {selection} à l’état « {state} » ?',
    },
    fetchQuery: {
      error: 'Erreur lors du chargement des résultats',
    },
    loadableCredits: {
      error: 'Erreur lors du chargement du casting',
    },
  },
  entities: {
    empty: {
      title: 'Oups, votre recherche n’a donné aucun résultat',
    },
    movies: {
      empty: {
        subtitle: 'Essayez par exemple : quels sont les films de <1>science-fiction</1> <0>les mieux notés</0> avec <2>Tom Cruise</2> ?',
      },
    },
  },
  lists: {
    action: {
      label: 'Listes',
      new: 'Nouvelle liste…',
      prompt: 'Nom de la liste où ajouter {selection}',
      confirm: 'Voulez-vous ajouter {selection} à « {name} » ?',
      policy: 'Leur Policy devient {policy}{media, select, movie {, et ceux déjà Archived repassent par Refine} other {}}.',
    },
    saveAsList: {
      label: emojize('🗂️', 'Enregistrer comme liste'),
      placeholder: 'Nommez une nouvelle liste, ou choisissez-en une',
      placeholderNew: 'Nommez une nouvelle liste',
      create: 'Nouvelle liste « {name} »',
      noOptions: 'Tapez un nom pour créer une liste',
      createTitle: 'Créer « {name} »',
      addTitle: 'Ajouter ces filtres à « {name} »',
      save: 'Enregistrer',
    },
  },
  showFields: {
    status: {
      airing: 'En cours',
      upcoming: 'À venir',
      ended: 'Terminée',
    },
    types: {
      scripted: 'Fiction',
      miniseries: 'Mini-série',
      documentary: 'Documentaire',
      reality: 'Téléréalité',
      talkShow: 'Talk-show',
      news: 'Actualités',
      video: 'Vidéo',
    },
    unknown: 'Inconnu ({id})',
  },
}
