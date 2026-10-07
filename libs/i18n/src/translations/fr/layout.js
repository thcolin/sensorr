export default {
  layout: {
    config: {
      error: 'Désolé, impossible de charger la configuration...',
      retry: 'Réessayer',
    },
    suspense: {
      subtitle: 'Merci de patienter quelques instants...',
    },
  },
  header: {
    back: 'Retour',
    sections: {
      home: 'Accueil',
      movies: 'Films',
      tv: 'Séries',
      collections: 'Collections',
      stars: 'Stars',
      navigation: 'Navigation',
    },
    pages: {
      lists: 'Listes',
      swaps: 'Swaps',
    },
    search: {
      recent: 'Recherches récentes',
      empty: {
        title: 'Désolé, aucun résultat',
        subtitle: 'Essayez quelque chose de plus connu, comme <0>Pulp Fiction</0> ?',
      },
      movies: 'Films',
      shows: 'Séries',
      collections: 'Collections',
      stars: 'Stars',
      companies: 'Studios',
      keywords: 'Mots-clés',
      more: 'Plus de résultats pour « {query} »',
    },
    notifications: {
      title: 'Notifications',
      push: {
        unavailable: 'Notifications push indisponibles',
        enable: 'Activer les notifications push',
        disable: 'Désactiver les notifications push',
      },
      read: {
        title: 'Tout marquer comme lu',
        confirm: '{count, plural, one {Marquer # notification comme lue} other {Marquer les # notifications comme lues}} ?',
      },
      commands: {
        missing: 'manquant',
        request: 'demande',
      },
      empty: {
        match: {
          title: 'Aucun résultat',
          subtitle: 'Aucune notification {command}',
          all: 'Tout afficher',
        },
        none: {
          title: 'À jour',
          subtitle: 'Aucune notification pour l’instant',
        },
      },
      movie: {
        record: '{proposal, select, true {Proposal d’enregistrement d’un film} other {Film enregistré}}',
        refine: '{proposal, select, true {Proposal pour affiner un film} other {Film Refined}}',
        shrink: '{proposal, select, true {Proposal pour alléger un film} other {Film Shrinked}}',
        report: '{proposal, select, true {Proposal après un signalement} other {Film signalé, remplaçant téléchargé}}',
        sync: 'Film absent de votre serveur Plex',
        request: 'Demande de film',
        size: 'Taille face à la plus légère des releases possédées : {delta}',
        fix: 'Voulez-vous le corriger ?',
      },
      show: {
        record: '{swap, select, true {Proposal de Swap de saison} other {{proposal, select, true {Proposal d’enregistrement d’une série} other {Série enregistrée}}}}',
        airing: '{proposal, select, true {Proposal d’un épisode en diffusion} other {Épisode en diffusion enregistré}}',
        sync: 'Épisodes absents de votre serveur Plex',
        request: 'Demande de série',
        episodes: '{count, plural, one {# épisode} other {# épisodes}}',
        gone: '{count, plural, one {# épisode n’est plus} other {# épisodes ne sont plus}} sur Plex',
      },
      release: '{proposal, select, true {Proposal de release} other {Release}}',
      requested: 'Demandé par',
      actions: {
        accepted: 'Acceptée',
        refused: 'Refusée',
        ban: 'Bannir',
        banned: 'Bannie',
        downloaded: 'Téléchargée',
        wish: 'Passer en Wished',
        wishBack: 'Repasser en Wished',
        fixed: 'Corrigé',
        ignore: 'Ignorer',
        follow: 'Suivre',
        following: 'Suivi en cours...',
      },
    },
  },
  contexts: {
    toasts: {
      types: {
        blank: 'Info',
        success: 'Succès',
        error: 'Erreur',
        loading: 'Chargement',
      },
      console: 'Plus de détails dans la console du navigateur',
    },
    movies: {
      loading: 'Mise à jour des métadonnées du film...',
      success: 'Métadonnées du film mises à jour',
      error: 'Erreur lors de la mise à jour des métadonnées du film',
      bulk: {
        loading: 'Mise à jour des métadonnées de **{count}** films...',
        success: 'Métadonnées de **{count}** films mises à jour',
        failed: '**{failed}** films sur **{count}** non {key, select, proposal {téléchargés} other {mis à jour}}',
        error: 'Erreur lors de la mise à jour des métadonnées de **{count}** films',
      },
    },
    shows: {
      loading: 'Mise à jour des métadonnées de la série...',
      success: 'Métadonnées de la série mises à jour',
      failed: 'Release non téléchargée',
      error: 'Erreur lors de la mise à jour des métadonnées de la série',
      bulk: {
        loading: 'Mise à jour des métadonnées de **{count}** séries...',
        success: 'Métadonnées de **{count}** séries mises à jour',
        failed: '**{failed}** séries sur **{count}** non téléchargées',
        error: 'Erreur lors de la mise à jour des métadonnées de **{count}** séries',
      },
      episodes: {
        loading: 'Mise à jour de **{count}** épisodes...',
        success: '**{count}** épisodes mis à jour',
        error: 'Erreur lors de la mise à jour de **{count}** épisodes',
      },
      add: {
        loading: 'Ajout de la série à la bibliothèque...',
        success: 'Série ajoutée à la bibliothèque',
        error: 'Erreur lors de l’ajout de la série à la bibliothèque',
      },
      lists: {
        loading: 'Mise à jour des listes de la série...',
        success: 'Listes de la série mises à jour',
        error: 'Erreur lors de la mise à jour des listes de la série',
      },
      remove: {
        loading: 'Retrait de la série de la bibliothèque...',
        success: 'Série retirée de la bibliothèque',
        error: 'Erreur lors du retrait de la série de la bibliothèque',
        confirm: 'Voulez-vous retirer « {name} » de la bibliothèque ? Ses fichiers restent sur le disque',
        confirmEpisodes: 'Voulez-vous retirer « {name} » et ses {count} épisodes de la bibliothèque ? Leurs fichiers restent sur le disque',
      },
      errors: {
        answer: 'Erreur lors de la réponse à la Proposal',
        follow: 'Erreur lors du suivi de la série',
      },
    },
    persons: {
      error: 'Erreur lors de la mise à jour des métadonnées de la personne',
    },
    search: {
      error: 'Erreur lors de la récupération des résultats',
    },
    guests: {
      delete: {
        loading: 'Suppression de l’invité « {email} »...',
        success: 'Invité « {email} » supprimé !',
        error: 'Erreur lors de la suppression de l’invité « {email} »',
      },
    },
    notifications: {
      denied: 'Notifications désactivées, autorisez-les dans les réglages de votre navigateur ou de votre système',
      loading: 'Gestion des notifications push...',
      success: 'Notifications push {subscribed, select, true {activées} other {désactivées}}',
      error: 'Erreur lors de l’abonnement aux notifications push',
    },
  },
  demo: {
    label: 'Démo',
    messages: {
      kept: 'Vos modifications restent dans ce navigateur',
      storage: 'Ce navigateur ne garde rien, vos modifications disparaissent au rechargement',
      data: 'Les données de la démo n’ont pas chargé, rechargez la page',
    },
    reset: {
      label: 'Réinitialiser',
      title: 'Réinitialiser la démo',
      confirm: 'Réinitialiser la démo ? Tout ce que vous avez modifié revient à son état de départ',
    },
    github: {
      label: 'Sensorr sur GitHub, dans un nouvel onglet',
      title: 'Sensorr sur GitHub',
    },
    unavailable: 'Indisponible dans la démo, il faut Sensorr sur votre propre serveur',
    indexer: 'La démo n’atteint que son propre indexeur, pas {host}',
  },
}
