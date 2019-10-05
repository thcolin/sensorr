import React from 'react'
import { styles } from '../index.js'

const placeholder = {
  blackhole: '/tmp',
}

const Blackhole = ({ values, handleChange, ...props }) => (
  <div css={styles.section}>
    <h1 css={styles.title}>Blackhole</h1>
    <p css={styles.paragraph} style={{ flex: 1, }}>
      Sensorr works with <strong>XZNAB</strong> API servers and will download any <code css={styles.code}>.torrent</code> or <code css={styles.code}>.nzb</code> file into defined Server <code css={styles.code}>blackhole</code> path.
      <br/>
      If you run Sensorr from <a href="https://hub.docker.com/r/thcolin/sensorr/" css={styles.link}>Docker</a> image, keep it to <code css={styles.code}>/app/sensorr/blackhole</code>.
      <br/>
      <br/>
    </p>
    <p css={styles.paragraph}>
      Here you need to fill <strong>server</strong> blackhole <strong>path</strong> :
    </p>
    <input
      type="text"
      placeholder={placeholder.blackhole}
      css={styles.input}
      defaultValue={values.blackhole}
      onChange={e => handleChange('blackhole', e.target.value)}
    />
  </div>
)

export default Blackhole
