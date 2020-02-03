import React, { PureComponent } from 'react'
import Details, { Tabs, withCount } from 'views/layout/Details'
import * as Film from 'components/Entity/Film'
import Documents from 'shared/Documents'
import { GENRES } from 'shared/services/TMDB'
import theme from 'theme'

export default class Collection extends PureComponent {
  static placeholder = {
    id: 10,
    name: 'Star Wars - La Saga Skywalker',
    overview: 'Luke Skywalker, la Princesse Leia, Dark Vador, C3PO, R2D2 et de nombreux autres personnages du film sont désormais des noms familiers de l\'un des projets cinématographiques les plus réussis de tous les temps.',
    poster_path: '/dXYuoRx7o7OxssIhznx3AJbgKHe.jpg',
    backdrop_path: '/d8duYyyC9J5T825Hg7grmaabfxQ.jpg',
    parts: [
      {
        adult: false,
        backdrop_path: '/4iJfYYoQzZcONB9hNzg0J0wWyPH.jpg',
        genre_ids: [12, 28, 878],
        id: 11,
        original_language: 'en',
        original_title: 'Star Wars',
        overview: 'Il y a bien longtemps, dans une galaxie très lointaine... La guerre civile fait rage entre l\'Empire galactique et l\'Alliance rebelle. Capturée par les troupes de choc de l\'Empereur menées par le sombre et impitoyable Dark Vador, la princesse Leia Organa dissimule les plans de l’Étoile Noire, une station spatiale invulnérable, à son droïde R2-D2 avec pour mission de les remettre au Jedi Obi-Wan Kenobi. Accompagné de son fidèle compagnon, le droïde de protocole C-3PO, R2-D2 s\'échoue sur la planète Tatooine et termine sa quête chez le jeune Luke Skywalker. Rêvant de devenir pilote mais confiné aux travaux de la ferme, ce dernier se lance à la recherche de ce mystérieux Obi-Wan Kenobi, devenu ermite au cœur des montagnes désertiques de Tatooine...',
        poster_path: '/yVaQ34IvVDAZAWxScNdeIkaepDq.jpg',
        release_date: '1977-05-25',
        title: 'La Guerre des étoiles',
        video: false,
        vote_average: 8.2,
        vote_count: 12786,
        popularity: 52.565
      },
      {
        adult: false,
        backdrop_path: '/amYkOxCwHiVTFKendcIW0rSrRlU.jpg',
        genre_ids: [12, 28, 878],
        id: 1891,
        original_language: 'en',
        original_title: 'The Empire Strikes Back',
        overview: 'Malgré la destruction de l’Étoile Noire, l\'Empire maintient son emprise sur la galaxie, et poursuit sans relâche sa lutte contre l\'Alliance rebelle. Basés sur la planète glacée de Hoth, les rebelles essuient un assaut des troupes impériales. Parvenus à s\'échapper, la princesse Leia, Han Solo, Chewbacca et C-3P0 se dirigent vers Bespin, la cité des nuages gouvernée par Lando Calrissian, ancien compagnon de Han. Suivant les instructions d\'Obi-Wan Kenobi, Luke Skywalker se rend quant à lui vers le système de Dagobah, planète marécageuse où il doit recevoir l\'enseignement du dernier maître Jedi, Yoda. Apprenant l\'arrestation de ses compagnons par les stormtroopers de Dark Vador après la trahison de Lando, Luke décide d\'interrompre son entraînement pour porter secours à ses amis et affronter le sombre seigneur Sith...',
        poster_path: '/nqY9dJeRaSEJlmljOpPA5Tc9moQ.jpg',
        release_date: '1980-05-20',
        title: 'L\'Empire contre-attaque',
        video: false,
        vote_average: 8.4,
        vote_count: 10815,
        popularity: 23.448
      },
      {
        id: 1892,
        video: false,
        vote_count: 8992,
        vote_average: 8,
        title: 'Le Retour du Jedi',
        release_date: '1983-05-23',
        original_language: 'en',
        original_title: 'Return of the Jedi',
        genre_ids: [28, 12, 878],
        backdrop_path: '/koE7aMeR2ATivI18mCbscLsI0Nm.jpg',
        adult: false,
        overview: 'L\'Empire galactique est plus puissant que jamais : la construction de la nouvelle arme, l’Étoile de la Mort, menace l\'univers tout entier... Arrêté après la trahison de Lando Calrissian, Han Solo est remis à l\'ignoble contrebandier Jabba Le Hutt par le chasseur de primes Boba Fett. Après l\'échec d\'une première tentative d\'évasion menée par la princesse Leia, également arrêtée par Jabba, Luke Skywalker et Lando parviennent à libérer leurs amis. Han, Leia, Chewbacca, C-3PO et Luke, devenu un Jedi, s\'envolent dès lors pour une mission d\'extrême importance sur la lune forestière d\'Endor, afin de détruire le générateur du bouclier de l’Étoile de la Mort et permettre une attaque des pilotes de l\'Alliance rebelle. Conscient d\'être un danger pour ses compagnons, Luke préfère se rendre aux mains de Dark Vador, son père et ancien Jedi passé du côté obscur de la Force.',
        poster_path: '/kBjuLfGqNRsby9TzWQaTlAUe3LB.jpg',
        popularity: 23.276
      },
      {
        id: 1893,
        video: false,
        vote_count: 8991,
        vote_average: 6.4,
        title: 'Star Wars, épisode I - La Menace fantôme',
        release_date: '1999-05-19',
        original_language: 'en',
        original_title: 'Star Wars: Episode I - The Phantom Menace',
        genre_ids: [28, 12, 878],
        backdrop_path: '/oFmzoKDMedABPpRBDVwr0aynSK1.jpg',
        adult: false,
        overview: 'Il y a bien longtemps, dans une galaxie très lointaine... La République connaît de nombreux tourments : la corruption fait vaciller ses bases, le Sénat s\'embourbe dans des discussions politiques sans fin et de nombreux pouvoirs dissidents commencent à émerger, annonçant la chute d\'un système autrefois paisible. Puissante et intouchable, la Fédération du Commerce impose par la force la taxation des routes commerciales. Refusant de céder, la pacifique planète Naboo, dirigée par la jeune Reine Amidala, subit un blocus militaire de la Fédération. Dépêchés par le Sénat pour régler cette affaire, les chevaliers Jedi Qui-Gon Jinn et Obi-Wan Kenobi découvrent qu\'une véritable offensive de la Fédération est imminente. Libérant la Reine et ses proches, ils quittent la planète mais doivent se poser sur Tatooine pour réparer leur vaisseau...',
        poster_path: '/etnrgeks0Al3wSo44Ji6xgaLBAW.jpg',
        popularity: 24.908
      },
      {
        id: 1894,
        video: false,
        vote_count: 8143,
        vote_average: 6.5,
        title: 'Star Wars, épisode II - L\'Attaque des clones',
        release_date: '2002-05-15',
        original_language: 'en',
        original_title: 'Star Wars: Episode II - Attack of the Clones',
        genre_ids: [28, 12, 878],
        backdrop_path: '/vovhXw10DSsRS9yoVbZqb60pXyX.jpg',
        adult: false,
        overview: 'Depuis le blocus de la planète Naboo par la Fédération du commerce, la République, gouvernée par le Chancelier Palpatine, connaît une véritable crise. Un groupe de dissidents, mené par le sombre Jedi comte Dooku, manifeste son mécontentement envers le fonctionnement du régime. Le Sénat et la population intergalactique se montrent pour leur part inquiets face à l\'émergence d\'une telle menace.Certains sénateurs demandent à ce que la République soit dotée d\'une solide armée pour empêcher que la situation ne se détériore davantage. Parallèlement, Padmé Amidala, devenue sénatrice, est menacée par les séparatistes et échappe de justesse à un attentat. Le Padawan Anakin Skywalker est chargé de sa protection. Son maître, Obi-Wan Kenobi, part enquêter sur cette tentative de meurtre et découvre la constitution d\'une mystérieuse armée de clones...',
        poster_path: '/rVYDjCnsqr0DD3pqziqEczEXv4R.jpg',
        popularity: 19.756
      },
      {
        id: 1895,
        video: false,
        vote_count: 8415,
        vote_average: 7.3,
        title: 'Star Wars, épisode III - La Revanche des Sith',
        release_date: '2005-05-17',
        original_language: 'en',
        original_title: 'Star Wars: Episode III - Revenge of the Sith',
        genre_ids: [28, 12, 878],
        backdrop_path: '/wUYTfFbfPiZC6Lcyt1nonr69ZmK.jpg',
        adult: false,
        overview: 'La Guerre des Clones fait rage. Une franche hostilité oppose désormais le Chancelier Palpatine au Conseil Jedi. Anakin Skywalker, jeune Chevalier Jedi pris entre deux feux, hésite sur la conduite à tenir. Séduit par la promesse d\'un pouvoir sans précédent, tenté par le côté obscur de la Force, il prête allégeance au maléfique Darth Sidious et devient Dark Vador. Les Seigneurs Sith s\'unissent alors pour préparer leur revanche, qui commence par l\'extermination des Jedi. Seuls rescapés du massacre, Yoda et Obi-Wan se lancent à la poursuite des Sith. La traque se conclut par un spectaculaire combat au sabre entre Anakin et Obi-Wan, qui décidera du sort de la galaxie...',
        poster_path: '/rxNnK6AfnqxGRJ8ehCqLKcUCtAG.jpg',
        popularity: 19.15
      },
      {
        id: 140607,
        video: false,
        vote_count: 13705,
        vote_average: 7.4,
        title: 'Star Wars : Le Réveil de la Force',
        release_date: '2015-12-15',
        original_language: 'en',
        original_title: 'Star Wars: The Force Awakens',
        genre_ids: [28, 12, 14, 878],
        backdrop_path: '/c2Ax8Rox5g6CneChwy1gmu4UbSb.jpg',
        adult: false,
        overview: 'Il y a bien longtemps, dans une galaxie lointaine… Luke Skywalker est porté disparu. Le pilote Poe est en mission secrète sur une planète pour le retrouver. Au moment où la diabolique armée "Premier Ordre" apparaît en détruisant tout sur son passage, il arrive à cacher la position géographique de l\'ancien maître Jedi dans son droïde BB-8. Capturé par les larbins du machiavélique Kylo Ren, Poe est libéré par le soldat ennemi Finn qui est en pleine crise existentielle. Pendant ce temps, BB-8 est recueillie par Rey, une pilleuse d\'épaves qui sera bientôt plongée dans une quête qui la dépasse.',
        poster_path: '/sHOYrricE1K0JriQ74FeN794UEl.jpg',
        popularity: 42.908
      },
      {
        adult: false,
        backdrop_path: '/jOzrELAzFxtMx2I4uDGHOotdfsS.jpg',
        genre_ids: [28, 12, 878],
        id: 181812,
        original_language: 'en',
        original_title: 'Star Wars: The Rise of Skywalker',
        overview: 'La conclusion de la saga Skywalker. De nouvelles légendes vont naître dans cette bataille épique pour la liberté.',
        poster_path: '/w1fqnG3W2xqCPTvjdPJTcfPMYH1.jpg',
        release_date: '2019-12-18',
        title: 'Star Wars : L\'Ascension de Skywalker',
        video: false,
        vote_average: 6.5,
        vote_count: 2683,
        popularity: 111.43
      },
      {
        id: 181808,
        video: false,
        vote_count: 9758,
        vote_average: 7,
        title: 'Star Wars : Les Derniers Jedi',
        release_date: '2017-12-13',
        original_language: 'en',
        original_title: 'Star Wars: The Last Jedi',
        genre_ids: [28, 12, 14, 878],
        backdrop_path: '/5Iw7zQTHVRBOYpA0V6z0yypOPZh.jpg',
        adult: false,
        overview: 'Nouvel épisode de la saga.  Les héros du Réveil de la force rejoignent les figures légendaires de la galaxie dans une aventure épique qui révèle des secrets ancestraux sur la Force et entraîne de choquantes révélations sur le passé…',
        poster_path: '/8cr9tyuj2RCqDVdz8C44TGknGTW.jpg',
        popularity: 40.77
      }
    ],
    images: {
      backdrops: [],
    },
  }

  static tabs = {
    subtitles: {
      parts: withCount(({ details, source, state, setState, count }) => (
        <>
          <span style={{ flex: 1, opacity: count ? 1 : 0, transition: '400ms opacity ease-in-out' }}>
            🎉&nbsp; Nice ! <strong>{count}/{source.length}</strong> movies from this collection in your library
          </span>
        </>
      ), 'movies'),
    }
  }

  static components = {
    Title: ({ details }) => details.name || '',
    Caption: ({ details }) => {
      const release_dates = details.parts.map(part => part.release_date).sort((a, b) => new Date(a || null) - new Date(b || null))
        .reduce((acc, release_date, index, releases_dates) => [releases_dates[0], releases_dates[releases_dates.length - 1]])

      return `(${new Date(release_dates[0]).getFullYear()} - ${new Date(release_dates[1]).getFullYear()})`
    },
    Poster: ({ details, ...props }) => (
      <Film.Poster
        entity={details}
        title={null}
        withState={false}
        link={null}
        {...(Collection.generators.poster(details) ? {
          img: Collection.generators.poster(details),
        } : {})}
        {...props}
      />
    ),
    Metadata: ({ details }) => {
      const vote_average = details.parts.reduce((vote_average, part) => vote_average + part.vote_average, 0) / details.parts.filter(part => part.vote_average).length

      return (
        <>
          <span>
            🎟️ &nbsp;{[
              ...new Set(details.parts.map(part => part.genre_ids).reduce((acc, genres) => [...acc, ...genres], []))
            ].map(id => GENRES[id]).join(', ')}
          </span>
          <span>
            {new Documents.Movie({ vote_average }).judge()} &nbsp;<strong>{vote_average.toFixed(1)}</strong>
          </span>
        </>
      )
    },
    Description: ({ details }) => details.overview || '',
    Tabs: ({ details, ready, palette, ...props }) => (
      <Tabs
        {...props}
        details={details}
        ready={ready}
        palette={palette}
        initial="parts"
        items={[
          [
            ...(!details.parts.length && ready ? [] : [
              {
                label: `📀  Parts`,
                key: 'parts',
                state: {
                  sort: (a, b) => new Date(a.release_date || 1e15) - new Date(b.release_date || 1e15),
                },
                props: {
                  source: details.parts,
                  child: Film.default,
                  props: { display: 'pretty', palette },
                  subtitle: Collection.tabs.subtitles.parts,
                },
              }
            ]),
          ],
        ]}
      />
    ),
  }

  static generators = {
    title: (details, state) => `Sensorr - ${[
      details.name,
      !!details.release_date && `(${new Date(details.release_date).getFullYear()})`,
    ].filter(string => string).join(' ')}`,
    poster: (details, context = 'default') => {
      if (!details.poster_path) {
        return null
      }

      return `https://image.tmdb.org/t/p/${{
        palette: 'w92',
      }[context] || 'w500'}${details.poster_path}`
    },
    background: (details, context = 'default') => {
      if (!details.backdrop_path) {
        return null
      }

      return `https://image.tmdb.org/t/p/${{
      }[context] || 'original'}${{
        background: (details.images.backdrops
          .filter(backdrop => backdrop.file_path !== details.backdrop_path)
          .sort((a, b) => a.vote_average - b.vote_average)
          .pop() || { file_path: details.backdrop_path }).file_path,
      }[context] || details.backdrop_path}`
    },
  }

  static palette = {
    backgroundColor: theme.colors.rangoon,
    color: '#ffffff',
    alternativeColor: '#ffffff',
    negativeColor: '#ffffff',
  }

  render() {
    const { match } = this.props

    return (
      <>
        <Details
          uri={['collection', match.params.id]}
          params={{
            append_to_response: 'images',
            include_image_language: 'en,null',
          }}
          placeholder={Collection.placeholder}
          components={Collection.components}
          generators={Collection.generators}
          palette={Collection.palette}
          usePalette={true}
        />
      </>
    )
  }
}
