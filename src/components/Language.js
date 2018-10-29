import React, { PureComponent } from 'react'
import { flag, code } from 'country-emoji'

const styles = {
  element: {
    cursor: 'pointer',
  }
}

export default class Language extends PureComponent {
  constructor(props) {
    super(props)

    if (!localStorage.getItem('language')) {
      localStorage.setItem('language', window.navigator.languages.filter(language => language.match(/-/)).reverse().pop())
    }

    this.state = {
      language: localStorage.getItem('language')
    }

    this.handleChange = this.handleChange.bind(this)
  }

  handleChange() {
    const browser = window.navigator.languages.filter(language => language.match(/-/)).reverse().pop()
    const language = localStorage.getItem('language') === browser ? 'en-US' : browser

    localStorage.setItem('language', language)
    this.setState({ language })
    location.reload()
  }

  render() {
    return (
      <span style={styles.element} onClick={this.handleChange}>
        {flag(localStorage.getItem('language').split('-').pop())}
      </span>
    )
  }
}
