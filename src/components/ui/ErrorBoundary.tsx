import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level error boundary — catches render errors and shows
 * a terminal-themed fallback with a reload button.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[War Room] Uncaught error:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface border border-border rounded-lg p-6 text-center space-y-4">
          <div className="font-mono text-red text-4xl">!</div>
          <h1 className="font-display text-2xl text-white tracking-wide">
            SOMETHING WENT WRONG
          </h1>
          <p className="font-body text-sm text-muted leading-relaxed">
            The app hit an unexpected error. Your data is safe — just reload to get back in.
          </p>
          {this.state.error && (
            <pre className="text-left bg-bg border border-border rounded p-3 text-xs font-mono text-red/70 overflow-auto max-h-32">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="bg-green text-bg font-condensed font-bold uppercase text-sm px-6 py-2 rounded hover:brightness-110 transition-all"
          >
            RELOAD
          </button>
        </div>
      </div>
    );
  }
}
