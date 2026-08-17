import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SEWAA UI Error Boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          textAlign: 'center',
          background: '#f8fafc',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            background: '#ffffff',
            padding: '2.5rem 2rem',
            borderRadius: '1.25rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            maxWidth: '520px',
            width: '100%',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>🛡️</div>
            <h2 style={{ color: '#0f172a', fontSize: '1.4rem', margin: '0 0 0.5rem', fontWeight: '800' }}>
              SEWAA Application Recovery
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '0 0 1.5rem', lineHeight: '1.5' }}>
              Something unexpected happened while loading this screen. You can return to the Home screen or reload the app.
            </p>
            {this.state.error && (
              <div style={{
                background: '#fef2f2',
                color: '#991b1b',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.8rem',
                textAlign: 'left',
                marginBottom: '1.25rem',
                overflowX: 'auto',
                fontFamily: 'monospace'
              }}>
                {String(this.state.error?.message || this.state.error)}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
              >
                🏠 Back to Home
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '0.75rem',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
              >
                🔄 Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
