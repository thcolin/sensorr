import React, { PureComponent } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import Items from 'components/Layout/Items'
import withSessionListener from 'components/Layout/Items/withSessionListener'
import withDatabaseQuery from 'components/Layout/Items/withDatabaseQuery'
import withControls from 'components/Layout/Items/withControls'
import { NavLink } from 'react-router-dom'
import { Indicator } from 'views/layout/Header/blocks/Recording'
import Film from 'components/Entity/Film'
import theme from 'theme'

const RecordingItems = compose(
  withSessionListener(),
  withControls(),
)(Items)

RecordingItems.components = {
  label: ({ fetched }) => (
    <span title="Current recording movies">
      <NavLink to="/movies/records" css={theme.resets.a}>
        <span style={{ position: 'relative', padding: '0.25em 0 0.25em 0.3125em', }}>
          <Indicator ongoing={true} />
          <span>📼</span>
        </span>
        <span>&nbsp;&nbsp;</span>
        <span>Recording</span>
        <span style={{ fontSize: 'smaller', fontWeight: 'normal' }}> ({fetched})</span>
      </NavLink>
    </span>
  ),
}

const RecordedItems = compose(
  withDatabaseQuery((db) => db.movies.find().where('state').eq('archived').sort({ time: -1 }).limit(20)),
  withControls(),
)(Items)

class Records extends PureComponent {
  render() {
    const { ongoing, ...props } = this.props

    return ongoing ? (
      <RecordingItems
        label={RecordingItems.components.label}
        child={Film}
        placeholders={20}
      />
    ) :(
      <RecordedItems
        label={(
          <span title="Last recorded movies">
            <NavLink to="/movies/library" css={theme.resets.a}>
              <span style={{ position: 'relative', padding: '0.25em 0 0.25em 0.3125em', }}>
                <Indicator ongoing={false} />
                <span>📼</span>
              </span>
              <span>&nbsp;&nbsp;</span>
              <span>Records</span>
            </NavLink>
          </span>
        )}
        child={Film}
        hide={true}
      />
    )
  }
}

export default connect(
  (state) => ({
    ongoing: state.jobs['sensorr:record'],
  }),
  () => ({}),
)(Records)
