import { Component, ErrorInfo, ReactNode } from 'react'

export interface BoundaryProps {
  name: string
  children: ReactNode
}

export class Boundary extends Component<BoundaryProps, { error: Error }> {
  static styles = {
    element: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      padding: 4,
      color: 'error',
      textAlign: 'center',
    },
    name: {
      fontFamily: 'heading',
      fontSize: 5,
    },
    message: {
      variant: 'code.tag',
      whiteSpace: 'normal',
      color: 'text',
    },
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  state = { error: null }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn(`Story "${this.props.name}" crashed`, error, info)
  }

  render() {
    if (!this.state.error) {
      return this.props.children
    }

    return (
      <div sx={Boundary.styles.element}>
        <span sx={Boundary.styles.name}>💥 {this.props.name}</span>
        <code sx={Boundary.styles.message}>{this.state.error.message}</code>
      </div>
    )
  }
}

export default Boundary
