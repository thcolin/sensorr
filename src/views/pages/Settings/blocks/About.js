import React from 'react'
import { styles } from '../index.js'

const About = ({ values, handleChange, ...props }) => (
  <div css={styles.section}>
    <h1 css={styles.title}>About</h1>
    <p css={styles.paragraph} style={{ flex: 1 }}>
      <a href="https://github.com/thcolin/sensorr" css={styles.link}>Sensorr</a> is an <strong>open source</strong> movie release radar project (like <a href="https://couchpota.to/" css={styles.link}>CouchPotato</a>, <a href="https://radarr.video/" css={styles.link}>Radarr</a> or <a href="https://github.com/nosmokingbandit/Watcher3" css={styles.link}>Watcher3</a>),
      powered by <a href="https://www.themoviedb.org/" css={styles.link}>TheMovieDatabase</a> <strong>community built</strong> database and <strong>public API</strong>.
    </p>
  </div>
)

export default About
