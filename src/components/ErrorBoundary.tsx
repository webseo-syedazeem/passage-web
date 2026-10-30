import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Optional label so a per-route boundary can describe what failed. */
  title?: string;
  /** When this value changes, the boundary resets (e.g. the current route key). */
  resetKey?: string;
};

type State = { error: Error | null };

/**
 * Catches render-time exceptions so one bad API response shape can no longer
 * blank the entire admin (audit CQ-1). A top-level instance is the last resort;
 * a per-route instance inside the shell keeps navigation usable.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surfaced to the console (and any error monitor, once added — PR-2).
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="panel" role="alert" style={{ margin: 24, maxWidth: 560 }}>
        <h1 className="page-heading">{this.props.title ?? "Something went wrong"}</h1>
        <p className="muted mt-3">
          This screen hit an unexpected error and couldn’t be displayed. The rest of
          the admin is still available.
        </p>
        <button
          type="button"
          className="btn mt-5"
          onClick={() => this.setState({ error: null })}
        >
          Try again
        </button>
      </div>
    );
  }
}
