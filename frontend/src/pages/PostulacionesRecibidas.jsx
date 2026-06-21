import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApplicationService } from '../services/applicationService';
import { getErrorMessage } from '../utils/errors';
import { InlineLoader, LoadError } from '../components/LoadingStates';

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', className: 'bg-line/60 text-ink/60' },
  accepted: { label: 'Aceptado', className: 'bg-forest/15 text-forest-dark' },
  rejected: { label: 'Rechazado', className: 'bg-terracotta/10 text-terracotta-dark/70' },
};

export default function PostulacionesRecibidas() {
  const { logout } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    ApplicationService.listForOwner()
      .then(setApplications)
      .catch((err) => setLoadError(getErrorMessage(err, 'No pudimos cargar las postulaciones.')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <span className="font-display text-xl font-semibold text-ink">AlquiListo</span>
          <div className="flex items-center gap-4 font-sans text-sm">
            <Link to="/mis-propiedades" className="text-ink/60 hover:text-ink">Mis propiedades</Link>
            <button onClick={logout} className="text-ink/60 hover:text-ink">Cerrar sesión</button>
          </div>
        </div>

        <h1 className="mt-10 font-display text-2xl font-medium text-ink">Postulaciones recibidas</h1>
        <p className="mt-1 font-sans text-sm text-ink/60">
          Todas las postulaciones de tus propiedades.
        </p>

        <div className="mt-8">
          {loading && <InlineLoader label="Cargando postulaciones…" />}
          {loadError && <LoadError message={loadError} onRetry={fetch} />}

          {!loading && !loadError && applications.length === 0 && (
            <div className="rounded-lg border border-dashed border-line bg-white p-8 text-center">
              <p className="font-sans text-sm text-ink/60">Todavía no recibiste ninguna postulación.</p>
              <Link to="/mis-propiedades" className="mt-2 inline-block font-sans text-sm font-medium text-forest hover:underline">
                Ir a mis propiedades →
              </Link>
            </div>
          )}

          <div className="space-y-3">
            {applications.map((app) => {
              const s = STATUS_CONFIG[app.status];
              return (
                <div key={app.id} className="rounded-lg border border-line bg-white p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-sans text-sm font-medium text-ink">
                        {app.first_name} {app.last_name}
                      </p>
                      <p className="mt-0.5 font-sans text-xs text-ink/50">
                        {app.property_title} · ${Number(app.property_price).toLocaleString('es-AR')}
                      </p>
                      <p className="mt-0.5 font-sans text-xs text-ink/40">
                        Score: {app.trust_score_snapshot}/100
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 font-sans text-xs font-medium ${s.className}`}>
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
