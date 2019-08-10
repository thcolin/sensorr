import { PureComponent } from 'react'
import Spinner from 'components/Spinner'
import nanobounce from 'nanobounce'

const DEBOUNCE_TIME = 100

const debounce = nanobounce(DEBOUNCE_TIME)

export const triggerScrollTop = (options = {}) => {
  console.log('triggerScrollTop', options)
  debounce(() => {
    if (options.target) {
      document.querySelector(options.target).scrollIntoView()
    } else {
      window.scrollTo(0, 0)
    }
  })
}

export default class ScrollTop extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      ready: false,
    }
  }

  componentDidMount() {
    triggerScrollTop(this.props)
    setTimeout(() => this.setState({ ready: true }), DEBOUNCE_TIME)
  }

  render() {
    const { ready } = this.state

    return ready ? this.props.children || null : (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        }}
      >
        <Spinner />
      </div>
    )
  }
}

export const withScrollTop = (Component, options = {}) => (props = {}) => (
  <ScrollTop {...options}>
    <Component {...props} />
  </ScrollTop>
)
