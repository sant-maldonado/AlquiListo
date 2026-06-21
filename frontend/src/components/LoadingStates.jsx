import Spinner from './Spinner';

export function PageLoader({ label = 'Cargando…' }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cream">
      <Spinner size="lg" />
      <p className="font-sans text-sm text-ink/50">{label}</p>
    </div>
  );
}

export function InlineLoader({ label = 'Cargando…' }) {
  return (
    <div className="flex items-center gap-2 py-6">
      <Spinner size="sm" />
      <p className="font-sans text-sm text-ink/50">{label}</p>
    </div>
  );
}

export function LoadError({ message = 'No pudimos cargar esta sección.', onRetry }) {
  return (
    <div className="rounded-lg border border-terracotta/30 bg-terracotta/5 p-4 text-center">
      <p className="font-sans text-sm text-terracotta-dark">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 font-sans text-sm font-medium text-terracotta-dark underline hover:no-underline"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
