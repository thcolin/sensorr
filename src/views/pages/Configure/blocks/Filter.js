import React from 'react'
import { styles } from '../index.js'

const placeholder = {
  filter: 'resolution=720p|1080p, source=BLURAY',
}

const Filter = ({ values, handleChange, ...props }) => (
  <div style={styles.section}>
    <h1 style={styles.title}>Filter</h1>
    <p style={{ ...styles.paragraph, flex: 1, }}>
      When using CLI with <code style={styles.code}>-a</code> or <code style={styles.code}>--auto</code> option, results will be filtered with defined <code style={styles.code}>filter</code>
      &nbsp;
      This is just a <a href="https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/RegExp" style={styles.link}>RegExp</a>, you can have multiple filters, just separate theme with <code style={styles.code}>,</code>
      &nbsp;
      You can filter by specific property and normalized value, see <a href="https://raw.githubusercontent.com/thcolin/oleoo/master/src/rules.json" style={styles.link}>full list</a>.
      <br/>
      <br/>
    </p>
    <p style={styles.paragraph}>
      Here you need to specify comma separated <a href="https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/RegExp" style={styles.link}>RegExp</a> :
    </p>
    <input
      type="text"
      placeholder={placeholder.filter}
      style={styles.input}
      defaultValue={values.filter}
      onChange={e => handleChange('filter', e.target.value)}
    />
  </div>
)

export default Filter
