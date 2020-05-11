import React, { useState } from 'react'
import { compose } from 'redux'
import Items from 'components/Layout/Items'
import withTMDBQuery from 'components/Layout/Items/withTMDBQuery'
import withDatabaseQuery from 'components/Layout/Items/withDatabaseQuery'
import withControls from 'components/Layout/Items/withControls'
import Persona from 'components/Entity/Persona'
import theme from 'theme'

const TrendingItems = compose(
  withTMDBQuery({
    uri: ['trending', 'person', 'day'],
    params: { sort_by: 'popularity.desc' },
  }, 1),
  withControls(),
)(Items)

const BirthdayItems = compose(
  withDatabaseQuery((db) => {
    const today = new Date()

    return db.stars
      .find({
        birthday: {
          $regex: `\\d{4}-${`${(today.getMonth() + 1)}`.padStart(2, '0')}-${`${(today.getDate())}`.padStart(2, '0')}`,
        },
      })
  }),
  withControls(),
)(Items)

const styles = {
  label: {
    fontWeight: 'bold',
    opacity: 0.6,
    margin: '0 2em 0 0',
  },
}

const StarsItems = ({ ...props }) => {
  const [row, setRow] = useState('trending')

  const label = (
    <span
      title={{
        trending: 'Trending stars',
        birthday: 'Birthday stars',
      }[row]}
    >
      <button
        css={[theme.resets.button, styles.label]}
        onClick={() => setRow('trending')}
        style={row === 'trending' ? { opacity: 1 } : {}}
      >
        👩‍🎤️&nbsp; Trending
      </button>
      <button
        css={[theme.resets.button, styles.label]}
        onClick={() => setRow('birthday')}
        style={row === 'birthday' ? { opacity: 1 } : {}}
      >
        🎂️&nbsp; Birthday
      </button>
    </span>
  )
  
  switch (row) {
    case 'trending':
      return (
        <TrendingItems
          child={Persona}
          props={{ display: 'portrait' }}
          limit={20}
          label={label}
        />
      )
    case 'birthday':
      return (
        <BirthdayItems
          child={Persona}
          props={{ display: 'portrait' }}
          limit={20}
          label={label}
        />
      )
    default:
      return null
  }
}

export default StarsItems
