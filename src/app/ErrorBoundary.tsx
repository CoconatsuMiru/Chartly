import { Component, type ErrorInfo, type ReactNode } from 'react'

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="card m-8 max-w-xl p-8">
        <p className="eyebrow">Something went wrong</p>
        <h2 className="display mt-2 text-3xl">That didn’t work</h2>
        <p className="mt-3 text-sm text-ink-soft">{this.state.error.message}</p>
        <button type="button" onClick={() => this.setState({ error: null })} className="btn btn-primary mt-5">
          Try again
        </button>
      </div>
    )
  }
}