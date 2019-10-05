import React, { PureComponent } from 'react'
import { countries, flag, name } from 'country-emoji'
import cl from 'country-language'
import { styles } from '../index.js'

export default class Region extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      regions: [],
    }
  }

  componentDidMount() {
    Promise.all(
      Object.keys(countries).map(country => new Promise(resolve => cl.getCountryLanguages(country, (err, languages) => {
        if (!err && languages && languages.length && languages[0].iso639_1) {
          resolve({ country, language: languages[0].iso639_1, emoji: flag(country), name: name(country) })
        } else {
          resolve(null)
        }
      })))
    )
    .then(regions => this.setState({
      regions: regions.filter(region => region)
    }))
  }

  render() {
    const { regions, ...state } = this.state
    const { values, handleChange, ...props } = this.props

    return (
      <div css={styles.section}>
        <h1 css={styles.title}>Region</h1>
        <p css={styles.paragraph}>
          When you <code css={styles.code}>wish</code> a movie, all data about movie (like title, year and stuff) are saved from <a href="https://www.themoviedb.org/" css={styles.link}>The Movie Database</a> in configured region language.
          <br/>
          <br/>
          You can overide it here, just select your <code css={styles.code}>region</code> :
        </p>
        <select css={styles.select} value={values.region} onChange={(e) => handleChange('region', e.target.value)}>
          {regions.sort((a, b) => a.name.localeCompare(b.name)).map(region => (
            <option key={region.country} value={`${region.language}-${region.country}`}>
              {region.name} {region.emoji}
            </option>
          ))}
        </select>
      </div>
    )
  }
}
