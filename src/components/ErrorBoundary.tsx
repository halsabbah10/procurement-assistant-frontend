import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Class component: React error boundaries have no hook equivalent — this
// is the only way to catch a render/effect throw anywhere below it in the
// tree. Without this, any uncaught error (a malformed chart payload from
// the backend, a bad SSE chunk, anything) unmounts the entire app to a
// blank page with zero recovery path.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console -- last-resort visibility; no error
    // reporting service is wired up in this project.
    console.error("Unhandled UI error", error, info.componentStack);
  }

  private clearLocalDataAndReload = () => {
    // Blunt but reliable: whatever crashed the render was persisted to
    // localStorage on the last successful render (useChat.ts writes on
    // every message change), so a plain reload reproduces the same crash
    // immediately. Clearing every procurement.* key (not just the active
    // conversation, since we don't know which one is poisoned from here)
    // guarantees the next load starts clean.
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith("procurement.")) localStorage.removeItem(key);
    }
    window.location.href = "/";
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex h-full min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-oxide">
          Something went wrong
        </p>
        <h1 className="font-display text-xl font-semibold text-ink">
          This page hit an unexpected error.
        </h1>
        <p className="max-w-sm text-sm text-ink-soft">
          Reloading usually fixes it. If it keeps happening on the same conversation, clearing
          locally saved data will reset it.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-ledger px-4 py-2 text-sm font-medium text-white hover:bg-ledger-dark"
          >
            Reload
          </button>
          <button
            type="button"
            onClick={this.clearLocalDataAndReload}
            className="rounded-md border border-line px-4 py-2 text-sm text-ink-soft hover:border-oxide hover:text-oxide"
          >
            Clear local data &amp; reload
          </button>
        </div>
      </div>
    );
  }
}
