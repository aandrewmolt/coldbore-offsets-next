'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    try {
      const backup = localStorage.getItem('shearfrac_current_project');
      if (backup) {
        localStorage.setItem('shearfrac_emergency_backup', backup);
      }
    } catch {
      // Storage might be unavailable
    }
    console.error('ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-foreground">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground">
            Your data has been backed up. Please reload the page.
          </p>
          <p className="max-w-md text-center text-sm text-muted-foreground">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
