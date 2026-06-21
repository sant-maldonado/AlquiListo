import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApplicationService } from '../services/applicationService';
import { getErrorMessage } from '../utils/errors';
import { PageLoader, LoadError } from '../components/LoadingStates';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api$/, '');

const STATUS_LABELS = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
};

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-forest/10 text-forest-dark',
  rejected: 'bg-terracotta/10 text-terracotta-dark',
};

export default function MisPostulaciones() {
  const { user, logout } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    ApplicationService.listMine()
      .then(setApplications)
      .catch((err) => setLoadError(getErrorMessage(err, 'No pudimos cargar tus postulaciones.')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-semibold text-ink hover:text-forest">AlquiListo</Link>
          <div className="flex items-center gap-4 font-sans text-sm">
            <Link to="/buscar" className="text-ink/60 hover:text-ink">Buscar</Link>
            <Link to="/perfil" className="text-ink/60 hover:text-ink">Mi perfil</Link>
            <button onClick={logout} className="text-ink/60 hover:text-ink">Cerrar sesión</button>
          </div>
        </div>

        <div className="mt-10">
          <h1 className="font-display text-2xl font-medium text-ink">Mis postulaciones</h1>
          <p className="mt-1 font-sans text-sm text-ink/60">
            Seguí el estado de tus postulaciones a propiedades.
          </p>
        </div>

        {loading && <PageLoader label="Cargando postulaciones…" />}

        {loadError && (
          <div className="mt-8">
            <LoadError message={loadError} onRetry={fetch} />
          </div>
        )}

        {!loading && !loadError && applications.length === 0 && (
          <div className="mt-8 rounded-lg border border-dashed border-line bg-white p-8 text-center">
            <p className="font-sans text-sm text-ink/60">
              Todavía no te postulaste a ninguna propiedad.
            </p>
            <Link
              to="/buscar"
              className="mt-3 inline-block rounded-lg bg-forest px-4 py-2 font-sans text-sm font-medium text-cream hover:bg-forest-dark"
            >
              Buscar propiedades
            </Link>
          </div>
        )}

        {!loading && !loadError && applications.length > 0 && (
          <div className="mt-8 space-y-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="rounded-lg border border-line bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-sans text-sm font-medium text-ink">{app.property_title}</p>
                    <p className="mt-0.5 font-sans text-xs text-ink/50">{app.property_address}</p>
                    <p className="mt-1 font-sans text-xs text-ink/50">
                      ${Number(app.property_price).toLocaleString('es-AR')}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-sans text-xs font-medium ${STATUS_COLORS[app.status] || 'bg-ink/10 text-ink/60'}`}
                  >
                    {STATUS_LABELS[app.status] || app.status}
                  </span>
                </div>
                <p className="mt-3 font-sans text-xs text-ink/40">
                  Postulada el {new Date(app.created_at).toLocaleDateString('es-AR')}
                  {app.decided_at && ` · Resuelta el ${new Date(app.decided_at).toLocaleDateString('es-AR')}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
