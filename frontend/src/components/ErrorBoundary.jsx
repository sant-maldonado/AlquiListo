import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Error capturado por ErrorBoundary:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-cream px-6">
          <div className="max-w-sm text-center">
            <p className="font-display text-2xl font-medium text-ink">
              Algo se trabó en el trámite
            </p>
            <p className="mt-2 font-sans text-sm text-ink/60">
              Tuvimos un problema inesperado de nuestro lado. Probá volver al
              inicio — tus datos guardados siguen ahí.
            </p>
            <button
              onClick={this.handleReload}
              className="mt-6 rounded-lg bg-forest px-5 py-2.5 font-sans text-sm font-medium text-cream hover:bg-forest-dark"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
