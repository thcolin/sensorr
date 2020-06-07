import React from 'react'
import { styles } from '../index.js'

const About = ({ values, handleChange, ...props }) => (
  <div css={styles.section}>
    <h1 css={styles.title}>About</h1>
    <p css={styles.paragraph} style={{ flex: 1 }}>
      <a href="https://github.com/thcolin/sensorr" css={styles.link}>Sensorr</a> is an <strong>open source</strong> friendly <em>digital video recorder</em> project (like <a href="https://couchpota.to/" css={styles.link}>CouchPotato</a>, <a href="https://radarr.video/" css={styles.link}>Radarr</a> or <a href="https://github.com/nosmokingbandit/Watcher3" css={styles.link}>Watcher3</a>),
      powered by <a href="https://www.themoviedb.org/" css={styles.link}>TheMovieDatabase</a> <strong>community built</strong> database and <strong>public API</strong>.
    </p>
    <label htmlFor="disabled" css={styles.input} style={{ borderColor: 'transparent', fontSize: '1rem' }}>
      <input
        id="disabled"
        type="checkbox"
        defaultChecked={!values.disabled}
        onChange={e => handleChange('disabled', !e.target.checked)}
        style={{ marginRight: '1em' }}
      />
      <strong>
        {{
          [false]: 'Enabled',
          [true]: 'Disabled',
        }[!!values.disabled]}
      </strong>
      {!values.disabled && (
        <small> - will record every 🍿 <em>wished</em> and 💊 <em>missing</em> movies at <strong>17:00</strong></small>
      )}
    </label>
  </div>
)

export default About
