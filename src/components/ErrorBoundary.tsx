import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  label: string;
  variant?: 'block' | 'inline';
}

interface ErrorBoundaryState {
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(`[HOME ERROR] Crash in "${this.props.label}":`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      if (this.props.variant === 'inline') {
        return (
          <p className="text-small-text text-text-secondary text-center py-3">
            {this.props.label} temporarily unavailable.
          </p>
        );
      }
      return (
        <div className="text-center py-10 px-4">
          <p className="text-card-heading mb-1">Something went wrong</p>
          <p className="text-secondary-text text-text-secondary mb-3">
            {this.props.label} couldn't load. The rest of the app should still work.
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="text-secondary-text font-semibold text-primary"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}