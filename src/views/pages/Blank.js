import React from 'react'
import Empty from 'components/Empty'

const styles = {
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2em 0',
  },
}

const Blank = ({ ...props }) => (
  <div style={styles.wrapper}>
    <Empty
      emoji="🗺️"
      title="Are you lost ?"
      subtitle="Nothing to see here, sorry !"
    />
  </div>
)

export default Blank
