import React from 'react'
import { styles } from '../index.js'

const placeholder = {
  xznab: {
    name: 'Name',
    url: 'http://localhost:5060/torznab/aggregate/api',
    key: 'API Key',
  },
}

const XZNAB = ({ values, handleChange, ...props }) => (
  <div css={styles.section}>
    <h1 css={styles.title}>XZNAB</h1>
    <p css={styles.paragraph}>
      Sensorr works with <strong>XZNAB</strong> (<a href="https://github.com/Sonarr/Sonarr/wiki/Implementing-a-Torznab-indexer" css={styles.link}>Torznab</a> or <a href="http://www.newznab.com/" css={styles.link}>Newznab</a>) API servers, add as many as you wish, they will be used to perform looks query.
      <br/>
      <br/>
    </p>
    <p css={styles.paragraph}>Example:</p>
    <ul css={styles.list}>
      <li>Jackett: <code css={styles.code}>http://localhost:9117/api/v2.0/indexers/xxx/results/torznab/</code></li>
      <li>Cardigann: <code css={styles.code}>http://localhost:5060/torznab/xxx/api</code> (don't forget <code css={styles.code}>/api</code> after copied Cardigann Torznab link !)</li>
    </ul>
    {(values.xznabs.length ? values.xznabs : [{ name: '', url: '', key: '' }]).map((xznab, index, self) => (
      <div css={styles.column} style={{ alignItems: 'center' }} key={index}>
        <input
          type="checkbox"
          title={xznab.disabled ? 'Disabled' : 'Enabled'}
          css={styles.checkbox}
          checked={!xznab.disabled}
          onChange={e => handleChange('xznabs', self.map((foo, i) => i === index ? { ...xznab, disabled: !e.target.checked } : foo))}
        />
        <input
          type="text"
          placeholder={placeholder.xznab.name}
          css={styles.input}
          style={{ marginLeft: '1em', marginRight: '1em', }}
          value={xznab.name}
          onChange={e => handleChange('xznabs', self.map((foo, i) => i === index ? { ...xznab, name: e.target.value } : foo))}
        />
        <input
          type="text"
          placeholder={placeholder.xznab.url}
          css={styles.input}
          style={{ marginLeft: '1em', marginRight: '1em', }}
          value={xznab.url}
          onChange={e => handleChange('xznabs', self.map((foo, i) => i === index ? { ...xznab, url: e.target.value } : foo))}
        />
        <input
          type="text"
          placeholder={placeholder.xznab.key}
          css={styles.input}
          style={{ marginLeft: '1em', }}
          value={xznab.key}
          onChange={e => handleChange('xznabs', self.map((foo, i) => i === index ? { ...xznab, key: e.target.value } : foo))}
        />
        <div css={styles.remove} onClick={() => handleChange('xznabs', self.filter((foo, i) => i !== index))}>🗑️</div>
      </div>
    ))}
    <div css={styles.add} onClick={() => handleChange('xznabs', [...values.xznabs, { name: '', url: '', key: '' }])}>🌱</div>
  </div>
)

export default XZNAB
