import React, { Fragment, useMemo } from 'react'
import { compose } from 'redux'
import { Helmet } from 'react-helmet'
import Items from 'components/Layout/Items'
import withTMDBQuery from 'components/Layout/Items/withTMDBQuery'
import Movie from 'components/Entity/Movie'
import { setHistoryState } from 'utils/history'

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
}

const Medias = ({ title, uri, child, history, match, location, ...props }) => {
  const MediaItems = useMemo(() => compose(
    withTMDBQuery({
      uri: uri.split('/'),
      params: { region: global.config.region || localStorage.getItem('region') },
    }),
  )(Items), [uri])

  return (
    <Fragment>
      <Helmet>
        <title>Sensorr - {title}
        </title>
      </Helmet>
      <div css={styles.wrapper}>
        <MediaItems
          {...props}
          display="virtual-grid"
          child={child || Movie}
          placeholders={history.location.state?.items?.total || null}
          onFetched={({ total }) => setHistoryState({ items: { total } })}
          empty={{
            emoji: '🍿',
            title: "Oh no, the request didn't return results",
            subtitle: (
              <span>
                Try another request, some movies doesn't have enought informations to get related medias
              </span>
            ),
          }}
        />
      </div>
    </Fragment>
  )
}

export default Medias
