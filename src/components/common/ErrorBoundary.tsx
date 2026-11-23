import React from 'react';
import { APP_CONFIG } from '../../config/appConfig';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected rendering error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#10141E] p-6 text-center text-[#E7E2D8]">
          <div className="max-w-md rounded-2xl border border-[#E6A93C]/35 bg-[#1A2130] p-8 shadow-2xl">
            <h1 className="font-display text-2xl font-bold text-[#E6A93C]">
              KingdomLudo Interrupted
            </h1>
            <p className="mt-2 font-mono-num text-xs text-[#E7E2D8]/60">
              {APP_CONFIG.releaseTag} · {APP_CONFIG.releaseChannel}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#E7E2D8]/80">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 min-h-[44px] w-full rounded-lg bg-[#E6A93C] px-5 py-2.5 text-sm font-bold text-[#10141E] transition hover:bg-[#D97706]"
            >
              Reload KingdomLudo
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
