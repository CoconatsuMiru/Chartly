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
      <div role="alert" className="m-8 rounded-[var(--radius-card)] border border-line bg-surface p-8">
        <h2 className="font-serif text-2xl">Something went wrong</h2>
        <p className="mt-2 text-sm text-muted">{this.state.error.message}</p>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-white"
        >
          Try again
        </button>
      </div>
    )
  }
}