import { emojize } from '@sensorr/utils'

export default {
  loading: 'Chargement...',
  noOverview: 'Aucune information supplémentaire',
  yearsOld: 'ans',
  without: 'sans',
  show: 'Afficher',
  tabs: {
    loading: emojize('⌛', 'Chargement'),
  },
  state: {
    loading: 'Chargement',
    ignored: 'Ignored',
    followed: 'Followed',
    missing: 'Manquant',
    pinned: 'Pinned',
    requested: 'Demandé',
    proposal: 'Proposal',
    wished: 'Wished',
    archived: 'Archived',
  },
  tmdb: {
    release_type: {
      premiere: emojize('🥂', 'Avant-première'),
      limited: emojize('🔒', 'Limitée'),
      theatrical: emojize('📽️', 'Cinéma'),
      digital: emojize('☁️', 'Numérique'),
      physical: emojize('📀', 'Physique'),
      tv: emojize('📺', 'TV'),
    },
  },
  ui: {
    select: {
      placeholder_search: 'Rechercher...',
      placeholder_select: 'Choisir...',
      option: emojize('🎉', 'Cherchez ce que vous voulez !'),
      loading: emojize('⌛', 'Recherche de « {query} »...'),
      empty: emojize('💢', 'Aucun résultat'),
      custom: {
        people: emojize('⭐️', 'Cherchez une personne, comme « Bill Murray »'),
        crew: emojize('🎬', 'Cherchez dans l’équipe, comme « Christopher Nolan »'),
        cast: emojize('🤵', 'Cherchez un acteur, comme « James Stewart »'),
        companies: emojize('🏛️', 'Cherchez un studio, comme « Walt Disney Pictures »'),
        keywords: emojize('🔗️', 'Cherchez un mot-clé, comme « Zombie »'),
      },
    },
    controls: {
      apply: 'Appliquer',
      cancel: 'Annuler',
      results: 'Résultats',
      toggle: '<0>Afficher </0>{active, plural, =0 {les filtres} one {<1># filtre</1>} other {<1># filtres</1>}}',
      more: '<0>Plus de </0>{active, plural, =0 {filtres} one {<1># filtre</1>} other {<1># filtres</1>}}',
    },
    filters: {
      state: '📚 État',
      proposal: emojize('🛎️', 'Proposal'),
      genres: emojize('🎞️', 'Genres'),
      release_date: emojize('📅', 'Année'),
      birthday: emojize('🎂', 'Anniversaire'),
      popularity: emojize('📣', 'Popularité'),
      vote_average: emojize('💯', 'Note moyenne'),
      vote_count: emojize('🗳', 'Nombre de votes'),
      unknown: emojize('🙈', 'Masquer les inconnus'),
      unknownRule: '> 2 ans, < 50 votes',
      budget: emojize('💸', 'Budget'),
      runtime: emojize('🕒', 'Durée'),
      episode_runtime: emojize('🕒', 'Durée d’un épisode'),
      first_air_date: emojize('📅', 'Année de diffusion'),
      number_of_seasons: emojize('🔢', 'Saisons'),
      networks: emojize('🗼', 'Chaînes'),
      type: emojize('🗂️', 'Type'),
      status: emojize('🚦', 'Statut'),
      origin_country: emojize('🗺️', 'Pays d’origine'),
      episode_status: emojize('🎟️', 'Statut des épisodes'),
      people: emojize('⭐️', 'Personnes'),
      crew: emojize('🎬', 'Équipe'),
      cast: emojize('🤵', 'Distribution'),
      companies: emojize('🏛️', 'Studios'),
      keywords: emojize('🔗️', 'Mots-clés'),
      languages: emojize('🌐', 'Langue originale'),
      spoken_languages: emojize('🗣️', 'Langues parlées'),
      release_type: emojize('📼', 'Sortie'),
      certification: emojize('🔞', 'Classification'),
      known_for_department: emojize('💼', 'Métier principal'),
      credits: emojize('💼', 'Crédits'),
      gender: emojize('⚧️', 'Genre'),
      requested_by: emojize('🤖', 'Demandé par'),
      lists: emojize('🗂️', 'Listes'),
      policy: emojize('🚨', 'Policies'),
      size: emojize('📦', 'Taille'),
      job: emojize('🏗️', 'Job d’origine'),
    },
    sorting: 'Trier par',
    sortings: {
      updated_at: emojize('📚️', 'Dernière mise à jour'),
      popularity: emojize('📣', 'Popularité'),
      birthday: emojize('🎂', 'Anniversaire'),
      primary_release_date: emojize('📅', 'Date de sortie'),
      revenue: emojize('💰', 'Recettes'),
      vote_average: emojize('💯', 'Note moyenne'),
      vote_count: emojize('🗳', 'Nombre de votes'),
      budget: emojize('💸', 'Budget'),
      name: emojize('🔤', 'Nom'),
      first_air_date: emojize('📅', 'Première diffusion'),
      last_air_date: emojize('📺', 'Dernier épisode'),
      refreshed_at: emojize('🔄', 'Dernière actualisation'),
      requested_at: emojize('🍻', 'Date de la demande'),
    },
  },
  items: {
    movies: {
      trending: {
        emoji: '📣',
        label: emojize('📣', 'Tendances'),
        title: 'Films en tendance sur themoviedb.org',
        more: 'Plus de films en tendance sur themoviedb.org',
      },
      theatres: {
        emoji: '🎟️',
        label: emojize('🎟️', 'À l’affiche'),
        title: 'Films à l’affiche dans votre région',
        more: 'Plus de films à l’affiche dans votre région',
      },
      upcoming: {
        emoji: '⏭️',
        label: emojize('⏭️', 'Bientôt au cinéma'),
        title: 'Films bientôt au cinéma',
        more: 'Plus de films bientôt au cinéma',
      },
      discover: {
        emoji: '👀',
        label: emojize('👀', 'Découvrir'),
        title: 'Découvrez des films sur themoviedb.org',
        more: 'Découvrez plus de films sur themoviedb.org',
      },
      discoverSelectable: {
        emoji: '🎲',
        label: emojize('🎲', 'Découvrir par année, genre ou studio'),
        title: 'Films d’une année, d’un genre et d’un studio au hasard',
        year: {
          emoji: '📅',
          title: 'Découvrez des films d’une année au hasard',
          more: 'Découvrez plus de films d’une année au hasard',
          label: emojize('📅', 'Découvrir <small>{value}</small>'),
        },
        genre: {
          emoji: '🎞️',
          title: 'Découvrez des films par genre',
          more: 'Découvrez plus de films par genre',
          label: emojize('🎞️', 'Découvrir <small>{value}</small>'),
        },
        studio: {
          emoji: '🏛️',
          title: 'Découvrez des films par grand studio',
          more: 'Découvrez plus de films par grand studio',
          label: emojize('🏛️', 'Découvrir <small>{value}</small>'),
        },
      },
      calendar: {
        emoji: '📅',
        label: emojize('📅', 'Votre calendrier'),
        title: 'Films à venir des stars que vous suivez',
        more: 'Plus de films à venir des stars que vous suivez',
      },
      requests: {
        emoji: '🍻',
        label: emojize('🍻', 'Demandes'),
        title: 'Films et séries demandés par vos amis',
        more: 'Plus de films et séries demandés par vos amis',
      },
      swaps: {
        emoji: '🔁',
        label: emojize('🔁', 'Swaps'),
        title: 'Films qui ont une meilleure release contre laquelle les échanger',
        more: 'Plus de films qui ont une meilleure release contre laquelle les échanger',
      },
      requested: {
        emoji: '🍻',
        label: emojize('🍻', 'Demandes'),
        title: 'Films demandés par vos amis',
        more: 'Plus de films demandés par vos amis',
      },
      library: {
        emoji: '📚',
        label: emojize('📚', 'Votre bibliothèque'),
        title: 'Tous les films que vous avez Pinned, Wished ou Archived',
        more: 'Plus de films que vous avez Pinned, Wished ou Archived',
      },
      archived: {
        emoji: '📼',
        label: emojize('📼', 'Vos enregistrements'),
        title: 'Tous vos films Archived',
        more: 'Plus de vos films Archived',
      },
      belongs_to_collection: {
        emoji: '📀',
        label: emojize('📀', '{collection}'),
      },
      recommendations: {
        emoji: '💬',
        label: emojize('💬', 'Recommandations'),
      },
      similar: {
        emoji: '👯‍♀️',
        label: emojize('👯‍♀️', 'Similaires'),
      },
    },
    shows: {
      airing: {
        emoji: '📅',
        label: emojize('📅', 'À l’antenne'),
        title: 'Épisodes des séries que vous suivez diffusés cette semaine',
        more: 'Plus d’épisodes des séries que vous suivez',
      },
      trending: {
        emoji: '📣',
        label: emojize('📣', 'Séries en tendance'),
        title: 'Séries en tendance sur themoviedb.org',
        more: 'Plus de séries en tendance sur themoviedb.org',
      },
      library: {
        emoji: '📚',
        label: emojize('📚', 'Séries de la bibliothèque'),
        title: 'Toutes les séries de votre bibliothèque',
        more: 'Plus de séries de votre bibliothèque',
      },
      requested: {
        emoji: '🍻',
        label: emojize('🍻', 'Demandes'),
        title: 'Séries demandées par vos amis',
        more: 'Plus de séries demandées par vos amis',
      },
      discover: {
        emoji: '👀',
        label: emojize('👀', 'Découvrir des séries'),
        title: 'Découvrez des séries sur themoviedb.org',
        more: 'Découvrez plus de séries sur themoviedb.org',
      },
    },
    persons: {
      followed: {
        emoji: '🔔',
        label: emojize('🔔', 'Followed'),
        title: 'Les stars que vous suivez',
        more: 'Plus de stars que vous suivez',
      },
      birthdays: {
        emoji: '🎂',
        label: emojize('🎂', 'Anniversaires'),
        title: 'Les stars que vous suivez nées cette semaine',
      },
      trending: {
        emoji: '⭐️',
        label: emojize('⭐️', 'Tendances'),
        title: 'Personnes en tendance sur themoviedb.org',
        more: 'Plus de personnes en tendance sur themoviedb.org',
      },
      known_for: {
        emoji: '⭐',
        label: emojize('⭐', 'Connu pour'),
      },
      crew: {
        emoji: '🎬',
        label: emojize('🎬', 'Équipe'),
      },
      fullcrew: {
        emoji: '📇',
        label: emojize('📇', 'Tout'),
      },
      cast: {
        emoji: '🤵',
        label: emojize('🤵', 'Rôles'),
      },
      fullcast: {
        emoji: '📇',
        label: emojize('📇', 'Tout'),
      },
      shows: {
        emoji: '📺',
        label: emojize('📺', 'Séries'),
      },
    },
  },
  pages: {
    library: {
      title: 'Bibliothèque',
    },
    requests: {
      title: 'Demandes',
    },
    followed: {
      title: 'Followed',
    },
    discover: {
      title: 'Découvrir',
    },
    calendar: {
      title: 'Calendrier',
    },
    recommendations: {
      title: 'Recommandations',
    },
    similar: {
      title: 'Similaires',
    },
    trending: {
      movies: {
        title: 'Tendances',
      },
      persons: {
        title: 'Tendances',
      },
      shows: {
        title: 'Tendances',
      },
    },
    theatres: {
      title: 'Cinémas',
      controls: {
        uri: {
          label: '',
          options: {
            now_playing: emojize('📽️', 'À l’écran'),
            upcoming: emojize('📅', 'Prochainement'),
          },
        },
        region: {
          label: 'en',
        },
      },
    },
    search: {
      title: 'Recherche',
    },
    shows: {
      library: {
        title: 'Séries · Bibliothèque',
      },
      calendar: {
        title: 'Séries · Calendrier',
      },
      discover: {
        title: 'Séries · Découvrir',
      },
      trending: {
        title: 'Séries · Tendances',
      },
      search: {
        title: 'Séries · Recherche',
      },
      requests: {
        title: 'Séries · Demandes',
      },
    },
  },
}
