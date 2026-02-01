import React from 'react';
import Toast from './Toast';

type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends React.Component<{ children?: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, message: error?.message || String(error) };
  }

  componentDidCatch(error: any, info: any) {
    // send to server
    fetch('/api/logs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: String(error), info }) }).catch(() => {});
  }

  render() {
    if (this.state.hasError) {
      return <Toast message={`App error: ${this.state.message || 'unknown'}`} onClose={() => this.setState({ hasError: false, message: undefined })} />;
    }
  return this.props.children;
  }
}
