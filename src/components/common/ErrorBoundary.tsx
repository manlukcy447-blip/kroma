import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070A10] text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-lg w-full p-6 sm:p-8 rounded-2xl bg-[#0F1420] border border-rose-500/30 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">
                {this.props.fallbackTitle || 'Component Error Occurred'}
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                An unexpected interface error was intercepted. Your session and backend data remain completely intact.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-rose-300 text-left overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-400 text-slate-950 text-xs font-bold hover:bg-cyan-300 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry / Reload
              </button>

              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.removeItem('kroma_admin_session');
                    sessionStorage.removeItem('kroma_admin_token');
                  } catch {}
                  window.location.reload();
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold hover:bg-slate-700 transition-colors"
              >
                Reset Session & Sign In
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.href = '/';
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-slate-400 border border-slate-800 text-xs font-semibold hover:text-white transition-colors"
              >
                <Home className="w-4 h-4" />
                Exchange Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
