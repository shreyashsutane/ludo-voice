import React, {Component, ErrorInfo, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';
import App from './App';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: string; }

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: '' };
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message || 'Interface error' };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Unhandled Render Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="scr center" style={{textAlign:'center',padding:'24px',gap:'16px'}}>
          <div style={{fontSize:'3rem'}}>⚠️</div>
          <h2 style={{color:'#f87171'}}>Something went wrong</h2>
          <p className="sub" style={{maxWidth:'360px'}}>A temporary UI error occurred. Your game session is safely preserved on the server.</p>
          <button className="cta" onClick={() => { location.reload(); }} style={{minWidth:'200px'}}>
            ↻ Reload & Reconnect
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
