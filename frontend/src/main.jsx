import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('BuildMaster ERP Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          padding: '24px',
          fontFamily: 'sans-serif'
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            background: '#ffffff',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1rem', color: '#dc2626', fontWeight: 'bold', marginBottom: '12px' }}>Error</div>
            <h2 style={{ color: '#0f172a', marginBottom: '8px' }}>Application Encountered an Error</h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '16px' }}>
              {this.state.error?.message || 'A temporary rendering error occurred.'}
            </p>
            <button 
              onClick={this.handleReset}
              style={{
                padding: '10px 20px',
                background: '#d97706',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Reset Session & Reload Portal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
