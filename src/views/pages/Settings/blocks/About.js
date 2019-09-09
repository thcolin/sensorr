import React from 'react'
import { styles } from '../index.js'

const About = ({ values, handleChange, ...props }) => (
  <div style={styles.section}>
    <h1 style={styles.title}>About</h1>
    <p style={{ ...styles.paragraph, flex: 1, }}>
      <a href="https://github.com/thcolin/sensorr" style={styles.link}>Sensorr</a> is an <strong>open source</strong> movie release radar project (like <a href="https://couchpota.to/" style={styles.link}>CouchPotato</a>, <a href="https://radarr.video/" style={styles.link}>Radarr</a> or <a href="https://github.com/nosmokingbandit/Watcher3" style={styles.link}>Watcher3</a>),
      powered by <a href="https://www.themoviedb.org/" style={styles.link}>TheMovieDatabase</a> <strong>community built</strong> database and <strong>public API</strong>.
    </p>
  </div>
)

export default About
