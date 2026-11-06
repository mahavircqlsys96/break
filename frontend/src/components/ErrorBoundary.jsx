import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-surface border border-line rounded-2xl p-6 shadow-sm text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger mb-4">
              <AlertTriangle className="size-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-ink">
              Something went wrong
            </h3>
            <p className="mt-1 text-xs text-ink-muted">
              {this.state.error?.message || "An unexpected error occurred while loading this view."}
            </p>
            {this.state.error?.stack && (
              <pre className="mt-4 max-h-36 overflow-auto text-left rounded-lg bg-bg p-3 text-[11px] font-mono text-ink-muted">
                {this.state.error.stack}
              </pre>
            )}
            <div className="mt-5 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  this.resetError();
                  window.location.reload();
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-primary-hover"
              >
                <RefreshCw className="size-3.5" /> Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

